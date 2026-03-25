'use strict';

const { COOKIE_NAME, SOCKET_ERROR_EVENTS } = require('./constants');
const { validateSession } = require('./db');
const { buildAllowedHosts, validateHost } = require('./middleware/ssrf-guard');
const { createMongoSocket } = require('./utils/create-mongo-socket');

// ─── WebSocket message encoding ───

function encodeMessage(data, type) {
  const encoded = new Uint8Array(data.length + 1);
  encoded[0] = type;
  encoded.set(data, 1);
  return encoded;
}

function encodeString(message) {
  return encodeMessage(new TextEncoder().encode(message), 0x01);
}

function encodeBinary(message) {
  return encodeMessage(message, 0x02);
}

function decodeMessage(message) {
  const type = message[0];
  const payload = message.subarray(1);
  if (type === 0x01) {
    return JSON.parse(new TextDecoder('utf-8').decode(payload));
  }
  return payload;
}

// ─── WebSocket connection handler ───

async function handleConnection(fastify, socket, req) {
  const mongoURIs = fastify.args.mongoURIs;

  req.log.info('New WebSocket connection (total %d)', fastify.websocketServer.clients.size);

  let mongoSocket;

  socket.on('message', (message) => {
    if (mongoSocket) {
      mongoSocket.write(decodeMessage(message), 'binary');
      return;
    }

    // First message contains connection options
    const { tls: useSecureConnection, ...connectOptions } = decodeMessage(message);

    // SSRF protection
    const allowedHosts = buildAllowedHosts(mongoURIs);
    if (!validateHost(connectOptions.host, allowedHosts)) {
      req.log.error('SSRF blocked: %s', connectOptions.host);
      socket.close(1008, 'Host not allowed');
      return;
    }

    req.log.info('Connecting to %s:%s (tls=%s)', connectOptions.host, connectOptions.port, !!useSecureConnection);

    mongoSocket = createMongoSocket(connectOptions, useSecureConnection, mongoURIs);

    const connectEvent = useSecureConnection ? 'secureConnect' : 'connect';

    SOCKET_ERROR_EVENTS.forEach((evt) => {
      mongoSocket.on(evt, (err) => {
        req.log.error('Socket event (%s): %s', evt, err);
        socket.close(evt === 'close' ? 1001 : 1011);
      });
    });

    mongoSocket.on(connectEvent, () => {
      req.log.info('Connected to %s:%s', connectOptions.host, connectOptions.port);
      mongoSocket.setTimeout(0);
      socket.send(encodeString(JSON.stringify({ preMessageOk: 1 })));
    });

    mongoSocket.on('data', (data) => {
      socket.send(encodeBinary(data));
    });
  });

  socket.on('close', () => {
    mongoSocket?.removeAllListeners();
    mongoSocket?.end();
  });
}

// ─── Authentication helper for WebSocket upgrade ───

function authenticateWs(req, socket) {
  const sessionId = req.cookies?.[COOKIE_NAME];
  const user = sessionId ? validateSession(sessionId) : null;
  if (!user) {
    socket.close(1008, 'Authentication required');
    return false;
  }
  req.user = user;
  return true;
}

// ─── Plugin registration ───

module.exports = function wsPlugin(fastify, opts, done) {
  const args = fastify.args;

  fastify.get('/clusterConnection/:projectId', { websocket: true }, (socket, req) => {
    if (!authenticateWs(req, socket)) return;
    if (req.params.projectId !== args.projectId) {
      socket.close(1008, 'Invalid project');
      return;
    }
    handleConnection(fastify, socket, req);
  });

  fastify.get('/ws-proxy', { websocket: true }, (socket, req) => {
    if (!authenticateWs(req, socket)) return;
    handleConnection(fastify, socket, req);
  });

  done();
};
