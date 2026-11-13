import { EmdrRoom } from './room';
import { AccountDirectory } from './accountDirectory';
import { createDefaultRoomState, type RoomState } from '../src/types/room';

export { EmdrRoom, AccountDirectory };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/auth') || path.startsWith('/api/sessions')) {
      return handleAuthRoutes(request, env, url);
    }

    if (path.startsWith('/api/rooms') || path.startsWith('/ws/')) {
      return handleRoomRoutes(request, env, url);
    }

    const res = await env.ASSETS.fetch(request);
    return withSecurityHeaders(res);
  },
};

function accountsStub(env: Env) {
  return env.ACCOUNTS.get(env.ACCOUNTS.idFromName('global'));
}

async function handleAuthRoutes(request: Request, env: Env, url: URL): Promise<Response> {
  const stub = accountsStub(env);
  const map: Record<string, string> = {
    '/api/auth/register': '/register',
    '/api/auth/login': '/login',
    '/api/auth/me': '/me',
    '/api/auth/logout': '/logout',
    '/api/auth/onboarding': '/onboarding',
    '/api/auth/delete-account': '/delete-account',
    '/api/sessions': '/sessions',
  };
  const target = map[url.pathname];
  if (!target) return Response.json({ error: 'Not found' }, { status: 404 });
  return stub.fetch(
    new Request(`https://accounts${target}`, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    }),
  );
}

async function handleRoomRoutes(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'POST' && url.pathname === '/api/rooms') {
    const body = (await request.json().catch(() => ({}))) as {
      roomId?: string;
      secret?: string;
      state?: RoomState;
    };
    if (!body.roomId || !body.secret) {
      return Response.json({ error: 'roomId and secret required' }, { status: 400 });
    }
    const id = env.ROOM.idFromName(body.roomId);
    const stub = env.ROOM.get(id);
    const res = await stub.fetch(
      new Request('https://room/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          secret: body.secret,
          state: body.state ?? createDefaultRoomState(),
        }),
      }),
    );
    const data = (await res.json()) as object;
    return Response.json(
      { ...data, roomId: body.roomId, joinPath: `/client/session/${body.roomId}` },
      { status: res.status },
    );
  }

  const statusMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
  if (request.method === 'GET' && statusMatch) {
    const roomId = decodeURIComponent(statusMatch[1]);
    const stub = env.ROOM.get(env.ROOM.idFromName(roomId));
    return stub.fetch(new Request('https://room/status'));
  }

  const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);
  if (wsMatch) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const roomId = decodeURIComponent(wsMatch[1]);
    const stub = env.ROOM.get(env.ROOM.idFromName(roomId));
    return stub.fetch(new Request('https://room/ws', request));
  }

  return new Response('Not found', { status: 404 });
}

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "media-src 'self'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
