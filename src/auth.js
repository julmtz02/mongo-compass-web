'use strict';

const { COOKIE_NAME } = require('./constants');
const { isFirstRun, validateSession, cleanExpiredSessions } = require('./db');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/setup',
  '/api/auth/status',
  '/setup',
  '/version',
  '/favicon.svg',
];

function isApiOrWsRequest(urlPath) {
  return urlPath.startsWith('/api/') || urlPath.startsWith('/ws') || urlPath.startsWith('/clusterConnection');
}

function registerAuth(instance) {
  const cleanupInterval = setInterval(() => {
    try { cleanExpiredSessions(); } catch (_) {}
  }, 3600 * 1000);

  instance.addHook('onClose', () => clearInterval(cleanupInterval));

  instance.addHook('onRequest', async (request, reply) => {
    const urlPath = request.url.split('?')[0];

    if (PUBLIC_PATHS.some(p => urlPath === p || urlPath.startsWith(p + '/'))) return;
    if (urlPath.match(/\.(js|css|svg|png|ico|woff2?)$/)) return;

    if (isFirstRun()) {
      if (isApiOrWsRequest(urlPath)) {
        return reply.code(401).send({ error: 'Setup required', setupRequired: true });
      }
      return reply.redirect('/setup');
    }

    const sessionId = request.cookies?.[COOKIE_NAME];
    if (!sessionId) {
      if (isApiOrWsRequest(urlPath)) {
        return reply.code(401).send({ error: 'Authentication required' });
      }
      return reply.redirect('/login');
    }

    const user = validateSession(sessionId);
    if (!user) {
      reply.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      if (isApiOrWsRequest(urlPath)) {
        return reply.code(401).send({ error: 'Session expired' });
      }
      return reply.redirect('/login');
    }

    request.user = user;
  });
}

module.exports = { registerAuth, COOKIE_OPTIONS };
