'use strict';

const path = require('path');
const { Eta } = require('eta');
const NodeCache = require('node-cache');
const { EXPORT_CACHE_TTL } = require('./constants');
const { ConnectionManager } = require('./connection-manager');
const { InMemoryStorage } = require('./connection-storage/in-memory');
const { readCliArgs } = require('./cli');
const { registerAuth } = require('./auth');

const args = readCliArgs();

// ─── Connection Manager ───
const storage = new InMemoryStorage();
const connectionManager = new ConnectionManager(storage, args);

const exportIds = new NodeCache({ stdTTL: EXPORT_CACHE_TTL });

const fastify = require('fastify')({ logger: true });

fastify.decorate('args', args);
fastify.decorate('exportIds', exportIds);
fastify.decorate('connectionManager', connectionManager);

// ─── Core Plugins ───
fastify.register(require('@fastify/view'), {
  engine: { eta: new Eta() },
  root: path.join(__dirname),
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'static'),
  prefix: '/static/',
  decorateReply: false,
});

// Serve favicon from src root
fastify.register(require('@fastify/static'), {
  root: __dirname,
  prefix: '/',
  decorateReply: false,
  serve: false,
});

// Manual favicon route
fastify.get('/favicon.svg', (request, reply) => {
  return reply.sendFile('favicon.svg', __dirname);
});

fastify.register(require('@fastify/websocket'));
fastify.register(require('@fastify/cookie'));
fastify.register(require('@fastify/formbody'));

// ─── Security ───
fastify.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://fonts.cdnfonts.com"],
    },
  },
});

fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});

fastify.register(require('@fastify/csrf-protection'), {
  getToken: (req) => req.headers['csrf-token'],
  sessionPlugin: '@fastify/cookie',
});

fastify.register(require('@fastify/multipart'));

// ─── Authentication ───
registerAuth(fastify);

// ─── Routes ───
fastify.after(() => {
  // Auth routes (login, setup, admin API)
  fastify.register(require('./routes/auth'));

  // Page routes
  fastify.get('/login', (request, reply) => {
    reply.view('login.eta', { appName: args.appName });
  });

  fastify.get('/setup', (request, reply) => {
    reply.view('setup.eta', { appName: args.appName });
  });

  fastify.get('/admin', (request, reply) => {
    if (!request.user || request.user.role !== 'admin') {
      return reply.redirect('/');
    }
    reply.view('admin.eta', { appName: args.appName });
  });

  // WebSocket proxy
  fastify.register(require('./ws'));

  // API routes
  fastify.register(require('./routes'));
});

module.exports = fastify;
