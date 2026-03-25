'use strict';

const { sendError } = require('./error-handler');

async function resolveMongoClient(connectionManager, connectionId, reply) {
  if (!connectionId) {
    sendError(reply, 400, 'connectionId is required');
    return null;
  }
  const client = await connectionManager.getMongoClientById(connectionId);
  if (!client) {
    sendError(reply, 400, 'Connection not found');
    return null;
  }
  return client;
}

module.exports = { resolveMongoClient };
