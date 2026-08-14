import { DurableObject } from "cloudflare:workers";
//#region src/features/remote/protocol.ts
var THERAPIST_TYPES = /* @__PURE__ */ new Set([
	"SET_SETTINGS",
	"START",
	"PAUSE",
	"RESUME",
	"STOP",
	"END_SESSION"
]);
function encodeMessage(msg) {
	return JSON.stringify(msg);
}
function decodeMessage(raw) {
	try {
		const data = JSON.parse(raw);
		if (!data || typeof data !== "object" || !("type" in data)) return null;
		return data;
	} catch {
		return null;
	}
}
function validateTherapistCommand(msg) {
	if (!msg || typeof msg !== "object") return null;
	const m = msg;
	if (typeof m.type !== "string" || typeof m.sequence !== "number" || !Number.isFinite(m.sequence)) return null;
	if (!THERAPIST_TYPES.has(m.type)) return null;
	if (m.type === "SET_SETTINGS") {
		if (!m.payload || typeof m.payload !== "object") return null;
		return {
			type: "SET_SETTINGS",
			sequence: m.sequence,
			payload: sanitizePartialRoomState(m.payload)
		};
	}
	if (m.type === "START" || m.type === "RESUME") {
		if (typeof m.startAt !== "number" || !Number.isFinite(m.startAt)) return null;
		return {
			type: m.type,
			sequence: m.sequence,
			startAt: m.startAt
		};
	}
	return {
		type: m.type,
		sequence: m.sequence
	};
}
var VISUAL_MODES = /* @__PURE__ */ new Set([
	"horizontal",
	"vertical",
	"diagonal-down",
	"diagonal-up",
	"blink",
	"infinity"
]);
var SET_MODES = /* @__PURE__ */ new Set([
	"manual",
	"passes",
	"timed",
	"continuous"
]);
var SOUNDS = /* @__PURE__ */ new Set([
	"soft-click",
	"soft-tone",
	"pulse"
]);
function sanitizePartialRoomState(input) {
	const out = {};
	if (typeof input.visualEnabled === "boolean") out.visualEnabled = input.visualEnabled;
	if (typeof input.audioEnabled === "boolean") out.audioEnabled = input.audioEnabled;
	if (typeof input.visualMode === "string" && VISUAL_MODES.has(input.visualMode)) out.visualMode = input.visualMode;
	if (typeof input.speedHz === "number" && Number.isFinite(input.speedHz)) out.speedHz = input.speedHz;
	if (typeof input.cycleDurationMs === "number" && Number.isFinite(input.cycleDurationMs)) out.cycleDurationMs = Math.min(5e3, Math.max(550, Math.round(input.cycleDurationMs)));
	if (typeof input.speed01 === "number" && Number.isFinite(input.speed01)) out.speed01 = Math.min(1, Math.max(0, input.speed01));
	if (input.midlineDirection === "up" || input.midlineDirection === "down") out.midlineDirection = input.midlineDirection;
	if (typeof input.continuous === "boolean") out.continuous = input.continuous;
	if (typeof input.stimulusColour === "string" && /^#[0-9A-Fa-f]{6}$/.test(input.stimulusColour)) out.stimulusColour = input.stimulusColour;
	if (typeof input.backgroundColour === "string" && /^#[0-9A-Fa-f]{6}$/.test(input.backgroundColour)) out.backgroundColour = input.backgroundColour;
	if (typeof input.stimulusSize === "number" && Number.isFinite(input.stimulusSize)) out.stimulusSize = input.stimulusSize;
	if (typeof input.travelWidth === "number" && Number.isFinite(input.travelWidth)) out.travelWidth = input.travelWidth;
	if (typeof input.verticalPosition === "number" && Number.isFinite(input.verticalPosition)) out.verticalPosition = Math.min(1, Math.max(0, input.verticalPosition));
	if (typeof input.running === "boolean") out.running = input.running;
	if (typeof input.paused === "boolean") out.paused = input.paused;
	if (typeof input.setMode === "string" && SET_MODES.has(input.setMode)) out.setMode = input.setMode;
	if (typeof input.targetPasses === "number" && Number.isFinite(input.targetPasses)) out.targetPasses = Math.max(1, Math.min(200, Math.round(input.targetPasses)));
	if (typeof input.targetSeconds === "number" && Number.isFinite(input.targetSeconds)) out.targetSeconds = Math.max(1, Math.min(600, Math.round(input.targetSeconds)));
	if (typeof input.audioSound === "string" && SOUNDS.has(input.audioSound)) out.audioSound = input.audioSound;
	if (typeof input.audioVolume === "number" && Number.isFinite(input.audioVolume)) out.audioVolume = Math.min(1, Math.max(0, input.audioVolume));
	if (typeof input.audioOnly === "boolean") out.audioOnly = input.audioOnly;
	if (typeof input.syncAudioWithVisual === "boolean") out.syncAudioWithVisual = input.syncAudioWithVisual;
	if (typeof input.muteTherapistAudio === "boolean") out.muteTherapistAudio = input.muteTherapistAudio;
	return out;
}
/** ~2 hours max lifespan */
var ROOM_TTL_MS = 72e5;
/** Inactivity expiry */
var ROOM_IDLE_MS = 27e5;
//#endregion
//#region src/emdr/types/emdr.ts
var SPEED_PRESETS = [
	{
		id: "very-slow",
		label: "Very slow",
		cycleDurationMs: 4e3
	},
	{
		id: "slow",
		label: "Slow",
		cycleDurationMs: 2200
	},
	{
		id: "moderate",
		label: "Moderate",
		cycleDurationMs: 1400
	},
	{
		id: "fast",
		label: "Faster",
		cycleDurationMs: 900
	}
];
//#endregion
//#region src/types/room.ts
var SPEED_MIN_HZ = .15;
var SPEED_MAX_HZ = 1.8;
var SPEED_STEP_HZ = .05;
var CYCLE_MAX_MS = 5e3;
var TRAVEL_MIN = .3;
var DEFAULT_TRAVEL = .85;
function cycleMsToSpeed01(ms) {
	return (CYCLE_MAX_MS - Math.min(CYCLE_MAX_MS, Math.max(550, ms))) / 4450;
}
function cycleMsToHz(ms) {
	return Number((1e3 / Math.max(50, ms)).toFixed(2));
}
function presetCycleMs(id) {
	return SPEED_PRESETS.find((x) => x.id === id)?.cycleDurationMs ?? 1400;
}
function createDefaultRoomState() {
	const cycleDurationMs = presetCycleMs("moderate");
	return {
		visualEnabled: true,
		audioEnabled: false,
		visualMode: "horizontal",
		speedHz: cycleMsToHz(cycleDurationMs),
		cycleDurationMs,
		speed01: cycleMsToSpeed01(cycleDurationMs),
		stimulusColour: "#14B8A6",
		backgroundColour: "#242628",
		stimulusSize: 14,
		travelWidth: DEFAULT_TRAVEL,
		verticalPosition: .5,
		midlineDirection: "up",
		running: false,
		paused: false,
		setMode: "passes",
		targetPasses: 30,
		targetSeconds: 15,
		continuous: false,
		audioSound: "soft-click",
		audioVolume: .45,
		audioOnly: false,
		syncAudioWithVisual: true,
		muteTherapistAudio: true,
		sequence: 0
	};
}
function clampSpeed(hz) {
	const stepped = Math.round(hz / SPEED_STEP_HZ) * SPEED_STEP_HZ;
	return Math.min(SPEED_MAX_HZ, Math.max(SPEED_MIN_HZ, Number(stepped.toFixed(2))));
}
function clampSize(px) {
	return Math.min(40, Math.max(8, Math.round(px)));
}
function clampTravel(t) {
	return Math.min(1, Math.max(TRAVEL_MIN, Number(t.toFixed(2))));
}
//#endregion
//#region worker/room.ts
/**
* One Durable Object per remote room.
* Stores operational RoomState only — no clinical content.
*/
var EmdrRoom = class extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          secret TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          last_active INTEGER NOT NULL,
          state_json TEXT NOT NULL
        );
      `);
		});
	}
	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname.endsWith("/create") && request.method === "POST") return this.createRoom(request);
		if (url.pathname.endsWith("/ws")) return this.acceptWs();
		if (url.pathname.endsWith("/status")) return this.status();
		return new Response("Not found", { status: 404 });
	}
	async createRoom(request) {
		const body = await request.json().catch(() => ({}));
		if (!body.secret || body.secret.length < 24) return Response.json({ error: "Invalid secret" }, { status: 400 });
		const now = Date.now();
		const state = normalizeState(body.state ?? createDefaultRoomState());
		this.ctx.storage.sql.exec(`DELETE FROM room`);
		this.ctx.storage.sql.exec(`INSERT INTO room (id, secret, created_at, expires_at, last_active, state_json)
       VALUES (1, ?, ?, ?, ?, ?)`, body.secret, now, now + ROOM_TTL_MS, now, JSON.stringify(state));
		await this.ctx.storage.setAlarm(now + Math.min(ROOM_TTL_MS, ROOM_IDLE_MS));
		return Response.json({
			ok: true,
			expiresAt: now + ROOM_TTL_MS
		});
	}
	async acceptWs() {
		const row = this.getRow();
		if (!row) return new Response("Room not found", { status: 404 });
		if (this.isExpired(row)) {
			await this.destroy("expired");
			return new Response("Room expired", { status: 410 });
		}
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);
		this.ctx.acceptWebSocket(server);
		return new Response(null, {
			status: 101,
			webSocket: client
		});
	}
	async status() {
		const row = this.getRow();
		if (!row) return Response.json({ ok: false }, { status: 404 });
		if (this.isExpired(row)) {
			await this.destroy("expired");
			return Response.json({
				ok: false,
				expired: true
			}, { status: 410 });
		}
		return Response.json({
			ok: true,
			expiresAt: row.expires_at,
			peers: this.ctx.getWebSockets().length
		});
	}
	async webSocketMessage(ws, message) {
		if (typeof message !== "string") return;
		const msg = decodeMessage(message);
		if (!msg) return;
		const row = this.getRow();
		if (!row || this.isExpired(row)) {
			this.send(ws, { type: "SESSION_ENDED" });
			ws.close(4e3, "expired");
			await this.destroy("expired");
			return;
		}
		if (msg.type === "PING") {
			this.send(ws, { type: "PONG" });
			return;
		}
		if (msg.type === "HELLO") {
			await this.handleHello(ws, msg.role, msg.secret, row);
			return;
		}
		if (ws.deserializeAttachment()?.role !== "therapist") {
			this.send(ws, {
				type: "ERROR",
				message: "Clients cannot control the session"
			});
			return;
		}
		const cmd = validateTherapistCommand(msg);
		if (!cmd) {
			this.send(ws, {
				type: "ERROR",
				message: "Invalid command"
			});
			return;
		}
		await this.handleTherapistCommand(ws, cmd, row);
	}
	async webSocketClose(ws) {
		const meta = ws.deserializeAttachment();
		if (meta?.role === "client") this.broadcast({ type: "CLIENT_DISCONNECTED" }, ws);
		if (meta?.role === "therapist") {}
	}
	async webSocketError(ws) {}
	async alarm() {
		const row = this.getRow();
		if (!row) {
			await this.ctx.storage.deleteAll();
			return;
		}
		const now = Date.now();
		if (now >= row.expires_at || now - row.last_active >= 27e5) {
			await this.destroy("expired");
			return;
		}
		const next = Math.min(row.expires_at, row.last_active + ROOM_IDLE_MS);
		await this.ctx.storage.setAlarm(next);
	}
	async handleHello(ws, role, secret, row) {
		if (role === "therapist" && secret !== row.secret) {
			this.send(ws, {
				type: "ERROR",
				message: "Unauthorized"
			});
			ws.close(4001, "unauthorized");
			return;
		}
		ws.serializeAttachment({ role });
		for (const other of this.ctx.getWebSockets()) {
			if (other === ws) continue;
			if (other.deserializeAttachment()?.role === role) other.close(4002, "replaced");
		}
		const state = this.readState(row);
		this.send(ws, {
			type: "WELCOME",
			role,
			roomId: "room",
			payload: state
		});
		this.touch();
		if (role === "client") this.broadcast({ type: "CLIENT_CONNECTED" }, ws);
		else if (this.ctx.getWebSockets().some((s) => {
			return s.deserializeAttachment()?.role === "client";
		})) this.send(ws, { type: "CLIENT_CONNECTED" });
	}
	async handleTherapistCommand(ws, cmd, row) {
		let state = this.readState(row);
		if (cmd.sequence < state.sequence) {
			this.send(ws, {
				type: "ERROR",
				message: "Stale sequence"
			});
			return;
		}
		if (cmd.type === "END_SESSION") {
			await this.destroy("ended");
			return;
		}
		let startAt;
		if (cmd.type === "SET_SETTINGS") {
			const { running: _r, paused: _p, sequence: _s, ...safe } = cmd.payload;
			state = normalizeState({
				...state,
				...safe,
				sequence: cmd.sequence
			});
		} else if (cmd.type === "START") {
			state = {
				...state,
				running: true,
				paused: false,
				sequence: cmd.sequence
			};
			startAt = cmd.startAt;
		} else if (cmd.type === "PAUSE") state = {
			...state,
			paused: true,
			running: true,
			sequence: cmd.sequence
		};
		else if (cmd.type === "RESUME") {
			state = {
				...state,
				paused: false,
				running: true,
				sequence: cmd.sequence
			};
			startAt = cmd.startAt;
		} else if (cmd.type === "STOP") state = {
			...state,
			running: false,
			paused: false,
			sequence: cmd.sequence
		};
		this.persistState(state);
		this.touch();
		const event = {
			type: "ROOM_STATE",
			payload: state,
			startAt
		};
		this.broadcast(event);
	}
	persistState(state) {
		this.ctx.storage.sql.exec(`UPDATE room SET state_json = ? WHERE id = 1`, JSON.stringify(state));
	}
	touch() {
		const now = Date.now();
		this.ctx.storage.sql.exec(`UPDATE room SET last_active = ? WHERE id = 1`, now);
		this.ctx.storage.setAlarm(now + ROOM_IDLE_MS);
	}
	async destroy(reason) {
		for (const ws of this.ctx.getWebSockets()) {
			this.send(ws, { type: "SESSION_ENDED" });
			ws.close(4e3, reason);
		}
		await this.ctx.storage.deleteAll();
	}
	isExpired(row) {
		const now = Date.now();
		return now > row.expires_at || now - row.last_active > 27e5;
	}
	getRow() {
		const one = this.ctx.storage.sql.exec(`SELECT secret, created_at, expires_at, last_active, state_json FROM room WHERE id = 1`).toArray()[0];
		if (!one) return null;
		return {
			secret: one.secret,
			created_at: one.created_at,
			expires_at: one.expires_at,
			last_active: one.last_active,
			state_json: one.state_json
		};
	}
	readState(row) {
		try {
			return normalizeState(JSON.parse(row.state_json));
		} catch {
			return createDefaultRoomState();
		}
	}
	send(ws, msg) {
		try {
			ws.send(encodeMessage(msg));
		} catch {}
	}
	broadcast(msg, except) {
		for (const ws of this.ctx.getWebSockets()) {
			if (except && ws === except) continue;
			this.send(ws, msg);
		}
	}
};
function normalizeState(s) {
	const base = createDefaultRoomState();
	const merged = {
		...base,
		...s
	};
	return {
		...merged,
		speedHz: clampSpeed(merged.speedHz ?? base.speedHz),
		cycleDurationMs: merged.cycleDurationMs ?? base.cycleDurationMs,
		speed01: typeof merged.speed01 === "number" ? merged.speed01 : base.speed01,
		midlineDirection: merged.midlineDirection === "down" ? "down" : "up",
		continuous: !!merged.continuous,
		stimulusSize: clampSize(merged.stimulusSize ?? base.stimulusSize),
		travelWidth: clampTravel(merged.travelWidth ?? base.travelWidth),
		verticalPosition: Math.min(1, Math.max(0, merged.verticalPosition ?? .5)),
		audioVolume: Math.min(1, Math.max(0, merged.audioVolume ?? .45)),
		sequence: typeof merged.sequence === "number" ? merged.sequence : 0
	};
}
//#endregion
//#region worker/accountDirectory.ts
/**
* Global account directory (SQLite DO).
* Architected for later Practice OS hierarchy without requiring D1 today.
*/
var AccountDirectory = class extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS therapists (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          country TEXT,
          profession TEXT,
          emdr_training_status TEXT,
          account_tier TEXT NOT NULL DEFAULT 'therapist-free',
          privacy_consent INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auth_sessions (
          token TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clinical_sessions (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          reference_label TEXT NOT NULL,
          phase TEXT,
          target_json TEXT,
          sets_json TEXT,
          total_processing_ms INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
		});
	}
	async fetch(request) {
		const path = new URL(request.url).pathname;
		try {
			if (path.endsWith("/register") && request.method === "POST") return this.register(request);
			if (path.endsWith("/login") && request.method === "POST") return this.login(request);
			if (path.endsWith("/me") && request.method === "GET") return this.me(request);
			if (path.endsWith("/logout") && request.method === "POST") return this.logout(request);
			if (path.endsWith("/onboarding") && request.method === "POST") return this.onboarding(request);
			if (path.endsWith("/sessions") && request.method === "GET") return this.listSessions(request);
			if (path.endsWith("/sessions") && request.method === "POST") return this.saveSession(request);
			if (path.endsWith("/delete-account") && request.method === "POST") return this.deleteAccount(request);
			return Response.json({ error: "Not found" }, { status: 404 });
		} catch (e) {
			return Response.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
		}
	}
	async register(request) {
		const body = await request.json();
		const email = String(body.email ?? "").trim().toLowerCase();
		const password = String(body.password ?? "");
		const firstName = String(body.firstName ?? "").trim();
		const lastName = String(body.lastName ?? "").trim();
		const consent = Boolean(body.privacyConsent);
		if (!email || !email.includes("@") || password.length < 8) return Response.json({ error: "Valid email and password (8+ chars) required" }, { status: 400 });
		if (!firstName || !lastName) return Response.json({ error: "Name required" }, { status: 400 });
		if (!consent) return Response.json({ error: "Privacy consent required" }, { status: 400 });
		if (this.ctx.storage.sql.exec(`SELECT id FROM therapists WHERE email = ?`, email).toArray().length) return Response.json({ error: "Email already registered" }, { status: 409 });
		const salt = randomHex(16);
		const password_hash = await hashPassword(password, salt);
		const id = `t_${randomHex(12)}`;
		const now = Date.now();
		this.ctx.storage.sql.exec(`INSERT INTO therapists
        (id, email, password_hash, salt, first_name, last_name, account_tier, privacy_consent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'therapist-free', 1, ?, ?)`, id, email, password_hash, salt, firstName, lastName, now, now);
		const token = await this.createSession(id);
		return Response.json({
			ok: true,
			token,
			therapist: publicTherapist(this.getTherapist(id))
		});
	}
	async login(request) {
		const body = await request.json();
		const email = String(body.email ?? "").trim().toLowerCase();
		const password = String(body.password ?? "");
		const user = this.ctx.storage.sql.exec(`SELECT * FROM therapists WHERE email = ?`, email).toArray()[0];
		if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });
		if (await hashPassword(password, user.salt) !== user.password_hash) return Response.json({ error: "Invalid credentials" }, { status: 401 });
		const token = await this.createSession(user.id);
		return Response.json({
			ok: true,
			token,
			therapist: publicTherapist(user)
		});
	}
	async me(request) {
		const user = await this.userFromAuth(request);
		if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
		return Response.json({ therapist: publicTherapist(user) });
	}
	async logout(request) {
		const token = bearer(request);
		if (token) this.ctx.storage.sql.exec(`DELETE FROM auth_sessions WHERE token = ?`, token);
		return Response.json({ ok: true });
	}
	async onboarding(request) {
		const user = await this.userFromAuth(request);
		if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
		const body = await request.json();
		this.ctx.storage.sql.exec(`UPDATE therapists SET country = ?, profession = ?, emdr_training_status = ?, updated_at = ? WHERE id = ?`, String(body.country ?? ""), String(body.profession ?? ""), String(body.emdrTrainingStatus ?? ""), Date.now(), user.id);
		return Response.json({
			ok: true,
			therapist: publicTherapist(this.getTherapist(user.id))
		});
	}
	async listSessions(request) {
		const user = await this.userFromAuth(request);
		if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
		const rows = this.ctx.storage.sql.exec(`SELECT id, reference_label, phase, created_at, updated_at, total_processing_ms
         FROM clinical_sessions WHERE therapist_id = ? ORDER BY updated_at DESC LIMIT 50`, user.id).toArray();
		return Response.json({ sessions: rows });
	}
	async saveSession(request) {
		const user = await this.userFromAuth(request);
		if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
		const body = await request.json();
		const id = String(body.id ?? `cs_${randomHex(10)}`);
		const now = Date.now();
		this.ctx.storage.sql.exec(`INSERT INTO clinical_sessions
        (id, therapist_id, reference_label, phase, target_json, sets_json, total_processing_ms, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         reference_label = excluded.reference_label,
         phase = excluded.phase,
         target_json = excluded.target_json,
         sets_json = excluded.sets_json,
         total_processing_ms = excluded.total_processing_ms,
         updated_at = excluded.updated_at`, id, user.id, String(body.referenceLabel ?? "Anonymous session"), String(body.phase ?? ""), JSON.stringify(body.target ?? {}), JSON.stringify(body.sets ?? []), Number(body.totalProcessingMs ?? 0), now, now);
		return Response.json({
			ok: true,
			id
		});
	}
	async deleteAccount(request) {
		const user = await this.userFromAuth(request);
		if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
		this.ctx.storage.sql.exec(`DELETE FROM auth_sessions WHERE therapist_id = ?`, user.id);
		this.ctx.storage.sql.exec(`DELETE FROM clinical_sessions WHERE therapist_id = ?`, user.id);
		this.ctx.storage.sql.exec(`DELETE FROM therapists WHERE id = ?`, user.id);
		return Response.json({ ok: true });
	}
	async createSession(therapistId) {
		const token = randomHex(24);
		const now = Date.now();
		this.ctx.storage.sql.exec(`INSERT INTO auth_sessions (token, therapist_id, expires_at, created_at) VALUES (?, ?, ?, ?)`, token, therapistId, now + 2592e6, now);
		return token;
	}
	async userFromAuth(request) {
		const token = bearer(request);
		if (!token) return null;
		const row = this.ctx.storage.sql.exec(`SELECT therapist_id, expires_at FROM auth_sessions WHERE token = ?`, token).toArray()[0];
		if (!row || row.expires_at < Date.now()) return null;
		return this.getTherapist(row.therapist_id);
	}
	getTherapist(id) {
		return this.ctx.storage.sql.exec(`SELECT * FROM therapists WHERE id = ?`, id).toArray()[0] ?? null;
	}
};
function bearer(request) {
	const h = request.headers.get("Authorization") ?? "";
	if (h.startsWith("Bearer ")) return h.slice(7);
	return null;
}
function publicTherapist(u) {
	return {
		id: u.id,
		email: u.email,
		firstName: u.first_name,
		lastName: u.last_name,
		country: u.country,
		profession: u.profession,
		emdrTrainingStatus: u.emdr_training_status,
		accountTier: u.account_tier
	};
}
function randomHex(bytes) {
	const arr = new Uint8Array(bytes);
	crypto.getRandomValues(arr);
	return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(password, salt) {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits({
		name: "PBKDF2",
		salt: enc.encode(salt),
		iterations: 1e5,
		hash: "SHA-256"
	}, key, 256);
	return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}
//#endregion
//#region worker/index.ts
var worker_default = { async fetch(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	if (path.startsWith("/api/auth") || path.startsWith("/api/sessions")) return handleAuthRoutes(request, env, url);
	if (path.startsWith("/api/rooms") || path.startsWith("/ws/")) return handleRoomRoutes(request, env, url);
	return withSecurityHeaders(await env.ASSETS.fetch(request));
} };
function accountsStub(env) {
	return env.ACCOUNTS.get(env.ACCOUNTS.idFromName("global"));
}
async function handleAuthRoutes(request, env, url) {
	const stub = accountsStub(env);
	const target = {
		"/api/auth/register": "/register",
		"/api/auth/login": "/login",
		"/api/auth/me": "/me",
		"/api/auth/logout": "/logout",
		"/api/auth/onboarding": "/onboarding",
		"/api/auth/delete-account": "/delete-account",
		"/api/sessions": "/sessions"
	}[url.pathname];
	if (!target) return Response.json({ error: "Not found" }, { status: 404 });
	return stub.fetch(new Request(`https://accounts${target}`, {
		method: request.method,
		headers: request.headers,
		body: request.method === "GET" || request.method === "HEAD" ? void 0 : await request.text()
	}));
}
async function handleRoomRoutes(request, env, url) {
	if (request.method === "POST" && url.pathname === "/api/rooms") {
		const body = await request.json().catch(() => ({}));
		if (!body.roomId || !body.secret) return Response.json({ error: "roomId and secret required" }, { status: 400 });
		const id = env.ROOM.idFromName(body.roomId);
		const res = await env.ROOM.get(id).fetch(new Request("https://room/create", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				secret: body.secret,
				state: body.state ?? createDefaultRoomState()
			})
		}));
		const data = await res.json();
		return Response.json({
			...data,
			roomId: body.roomId,
			joinPath: `/join/${body.roomId}`
		}, { status: res.status });
	}
	const statusMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
	if (request.method === "GET" && statusMatch) {
		const roomId = decodeURIComponent(statusMatch[1]);
		return env.ROOM.get(env.ROOM.idFromName(roomId)).fetch(new Request("https://room/status"));
	}
	const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);
	if (wsMatch) {
		if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected WebSocket", { status: 426 });
		const roomId = decodeURIComponent(wsMatch[1]);
		return env.ROOM.get(env.ROOM.idFromName(roomId)).fetch(new Request("https://room/ws", request));
	}
	return new Response("Not found", { status: 404 });
}
function withSecurityHeaders(res) {
	const headers = new Headers(res.headers);
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("X-Frame-Options", "DENY");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
	headers.set("Content-Security-Policy", [
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
		"form-action 'self'"
	].join("; "));
	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers
	});
}
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = worker_default ?? {};
//#endregion
export { AccountDirectory, EmdrRoom, worker_entry_default as default };