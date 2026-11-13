import { describe, expect, it } from 'vitest';
import { decodeMessage, encodeMessage, ROOM_TTL_MS } from '../src/features/remote/protocol';

describe('remote client protocol', () => {
  it('encodes CLIENT_STOP for client emergency stop', () => {
    const raw = encodeMessage({ type: 'CLIENT_STOP' });
    const msg = decodeMessage(raw);
    expect(msg?.type).toBe('CLIENT_STOP');
  });

  it('uses a 4-hour default session TTL', () => {
    expect(ROOM_TTL_MS).toBe(1000 * 60 * 60 * 4);
  });
});
