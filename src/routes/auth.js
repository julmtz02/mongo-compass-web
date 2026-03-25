'use strict';

const { COOKIE_NAME, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES } = require('../constants');
const { COOKIE_OPTIONS } = require('../auth');
const { requireRole } = require('../middleware/require-role');
const { sendError } = require('../middleware/error-handler');
const {
  isFirstRun,
  authenticateUser,
  createUser,
  createSession,
  deleteSession,
  deleteUserSessions,
  markSetupComplete,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserPermissions,
  setConnectionPermission,
} = require('../db');

module.exports = function authRoutes(fastify, opts, done) {

  const loginAttempts = new Map();

  // Clean up expired lockouts every 15 minutes
  const lockoutCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, val] of loginAttempts) {
      if (val.lockedUntil && val.lockedUntil <= now) {
        loginAttempts.delete(key);
      }
    }
  }, 15 * 60 * 1000);
  fastify.addHook('onClose', () => clearInterval(lockoutCleanupInterval));

  fastify.get('/api/auth/status', async () => {
    return { setupRequired: isFirstRun() };
  });

  fastify.post('/api/auth/setup', async (request, reply) => {
    if (!isFirstRun()) {
      return sendError(reply, 400, 'Setup already completed');
    }
    const { username, password } = request.body || {};
    if (!username || !password) {
      return sendError(reply, 400, 'Username and password required');
    }
    if (password.length < 8) {
      return sendError(reply, 400, 'Password must be at least 8 characters');
    }
    if (username.length < 3) {
      return sendError(reply, 400, 'Username must be at least 3 characters');
    }
    try {
      const user = createUser(username, password, 'admin');
      markSetupComplete();
      const session = createSession(user.id);
      reply.setCookie(COOKIE_NAME, session.id, {
        ...COOKIE_OPTIONS,
        expires: new Date(session.expires),
      });
      return { ok: true, user: { username: user.username, role: user.role } };
    } catch (err) {
      return sendError(reply, 400, err.message);
    }
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password) {
      return sendError(reply, 400, 'Username and password required');
    }

    const key = username?.toLowerCase();
    const attempts = loginAttempts.get(key);
    if (attempts && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      return sendError(reply, 429, 'Account temporarily locked. Try again later.');
    }

    const user = authenticateUser(username, password);
    if (!user) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      const current = loginAttempts.get(key) || { count: 0 };
      current.count++;
      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      }
      loginAttempts.set(key, current);
      return sendError(reply, 401, 'Invalid credentials');
    }

    loginAttempts.delete(key);
    // Session rotation: delete previous sessions
    deleteUserSessions(user.id);
    const session = createSession(user.id);
    reply.setCookie(COOKIE_NAME, session.id, {
      ...COOKIE_OPTIONS,
      expires: new Date(session.expires),
    });
    return { ok: true, user: { username: user.username, role: user.role } };
  });

  fastify.post('/api/auth/logout', {
    preHandler: [fastify.csrfProtection],
  }, async (request, reply) => {
    const sessionId = request.cookies?.[COOKIE_NAME];
    if (sessionId) {
      deleteSession(sessionId);
      reply.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    }
    return { ok: true };
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    const permissions = getUserPermissions(request.user.id);
    return { user: request.user, permissions };
  });

  // ── Admin routes ──
  fastify.get('/api/admin/users', {
    preHandler: requireRole('admin'),
  }, async () => {
    return { users: getAllUsers() };
  });

  fastify.post('/api/admin/users', {
    preHandler: [fastify.csrfProtection, requireRole('admin')],
  }, async (request, reply) => {
    const { username, password, role } = request.body || {};
    if (!username || !password) {
      return sendError(reply, 400, 'Username and password required');
    }
    if (password.length < 8) {
      return sendError(reply, 400, 'Password must be at least 8 characters');
    }
    try {
      const user = createUser(username, password, role || 'viewer');
      return { ok: true, user };
    } catch (err) {
      return sendError(reply, 400, err.message);
    }
  });

  fastify.put('/api/admin/users/:userId', {
    preHandler: [fastify.csrfProtection, requireRole('admin')],
  }, async (request, reply) => {
    const { userId } = request.params;
    const body = request.body || {};
    const updates = {};
    if (typeof body.username === 'string' && body.username.length >= 3) updates.username = body.username;
    if (['admin', 'editor', 'viewer'].includes(body.role)) updates.role = body.role;
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if (typeof body.password === 'string' && body.password.length >= 8) updates.password = body.password;
    try {
      updateUser(userId, updates);
      if (updates.is_active === false || updates.password) {
        deleteUserSessions(userId);
      }
      return { ok: true };
    } catch (err) {
      return sendError(reply, 400, err.message);
    }
  });

  fastify.delete('/api/admin/users/:userId', {
    preHandler: [fastify.csrfProtection, requireRole('admin')],
  }, async (request, reply) => {
    if (request.params.userId === request.user.id) {
      return sendError(reply, 400, 'Cannot delete yourself');
    }
    deleteUserSessions(request.params.userId);
    deleteUser(request.params.userId);
    return { ok: true };
  });

  fastify.post('/api/admin/permissions', {
    preHandler: [fastify.csrfProtection, requireRole('admin')],
  }, async (request, reply) => {
    const { userId, connectionId, permission } = request.body || {};
    if (!userId || !connectionId || !permission) {
      return sendError(reply, 400, 'userId, connectionId, and permission required');
    }
    try {
      setConnectionPermission(userId, connectionId, permission);
      return { ok: true };
    } catch (err) {
      return sendError(reply, 400, err.message);
    }
  });

  fastify.get('/api/admin/permissions/:userId', {
    preHandler: requireRole('admin'),
  }, async (request) => {
    return { permissions: getUserPermissions(request.params.userId) };
  });

  done();
};
