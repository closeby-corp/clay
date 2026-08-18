import { describe, expect, test, beforeEach } from 'bun:test';
import { hashPassword, verifyPassword } from './password';
import { createLoginLimiter } from './limiter';
import { createAuthGuards } from './guards';
import { auditRecord, clearAuditRecords, listAuditRecords } from './audit';
import { storage, ClientSession, clearPages, setCurrentSession } from '@close-by/clay-core';

describe('hashPassword / verifyPassword', () => {
  test('round-trips', () => {
    const hash = hashPassword('secret');
    expect(hash.startsWith('pbkdf2$')).toBe(true);
    expect(verifyPassword('secret', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  test('rejects malformed stored hash', () => {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});

describe('createLoginLimiter', () => {
  test('locks out after max attempts', () => {
    const limiter = createLoginLimiter({
      maxAttempts: 3,
      windowMs: 60_000,
      lockoutMs: 30_000,
    });
    expect(limiter.check('alice').ok).toBe(true);
    limiter.fail('alice');
    limiter.fail('alice');
    const locked = limiter.fail('alice');
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.retryAfterMs).toBeGreaterThan(0);
    expect(limiter.check('alice').ok).toBe(false);
    limiter.success('alice');
    expect(limiter.check('alice').ok).toBe(true);
  });
});

describe('createAuthGuards', () => {
  test('requireAuth redirects when missing', () => {
    let navigated = false;
    const { requireAuth } = createAuthGuards<{ role: string }>({
      getUser: () => null,
      onUnauthenticated: () => {
        navigated = true;
      },
    });
    expect(requireAuth()).toBeNull();
    expect(navigated).toBe(true);
  });

  test('requireRole checks role', () => {
    const { requireRole } = createAuthGuards<{ role: string }>({
      getUser: () => ({ role: 'user' }),
      onUnauthenticated: () => {},
    });
    expect(requireRole('admin')).toBeNull();
    expect(requireRole('user')?.role).toBe('user');
  });

  test('mustChangePassword redirects', () => {
    const paths: string[] = [];
    const { requireAuth } = createAuthGuards<{
      role: string;
      mustChangePassword?: boolean;
    }>({
      getUser: () => ({ role: 'admin', mustChangePassword: true }),
      onUnauthenticated: () => {},
      mustChangePassword: {
        check: (u) => !!u.mustChangePassword,
        changePasswordPath: '/change',
        getPath: () => '/account',
        navigate: (p) => paths.push(p),
      },
    });
    expect(requireAuth()).toBeNull();
    expect(paths).toEqual(['/change']);
  });
});

describe('auditRecord', () => {
  beforeEach(() => {
    clearPages();
    storage.clearAll();
  });

  test('appends entries with actor from session', async () => {
    await clearAuditRecords();
    const session = new ClientSession('/a', () => {});
    session.userId = 'alice';
    const { setCurrentSession } = await import('@close-by/clay-core');
    setCurrentSession(session);
    try {
      await auditRecord('login');
      await auditRecord('revoke', { target: 'bob' });
    } finally {
      setCurrentSession(null);
    }
    const list = await listAuditRecords();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ action: 'revoke', actor: 'alice', target: 'bob' });
    expect(list[1]).toMatchObject({ action: 'login', actor: 'alice' });
  });
});
