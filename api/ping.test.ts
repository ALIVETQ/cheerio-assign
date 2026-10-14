import { describe, it, expect, vi } from 'vitest';
import handler from './ping';

function createMockReq(overrides = {}) {
  return {
    method: 'GET',
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('/api/ping', () => {
  it('returns 200 and { ok: true }', () => {
    const req = createMockReq();
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
