'use strict';

const { requireRole } = require('../middleware/require-role');
const { sendError } = require('../middleware/error-handler');

module.exports = function connectionRoutes(fastify, opts, done) {
  const connectionManager = fastify.connectionManager;

  fastify.get(
    '/explorer/v1/groups/:projectId/clusters/connectionInfo',
    async (request, reply) => {
      const connections = await connectionManager.getAllConnections(false);
      reply.send(connections);
    }
  );

  fastify.post(
    '/explorer/v1/groups/:projectId/clusters/connectionInfo',
    { preHandler: requireRole('admin', 'editor') },
    async (request, reply) => {
      const connectionInfo = request.body;
      if (!connectionInfo) {
        return sendError(reply, 400, 'connectionInfo is required');
      }
      try {
        await connectionManager.saveConnectionInfo(connectionInfo);
        reply.send({ ok: true });
      } catch (err) {
        return sendError(reply, 400, err.message);
      }
    }
  );

  fastify.delete(
    '/explorer/v1/groups/:projectId/clusters/connectionInfo/:connectionId',
    { preHandler: requireRole('admin') },
    async (request, reply) => {
      const { connectionId } = request.params;
      if (!connectionId) {
        return sendError(reply, 400, 'connectionId is required');
      }
      try {
        await connectionManager.deleteConnectionInfo(connectionId);
        reply.send({ ok: true });
      } catch (err) {
        return sendError(reply, 400, err.message);
      }
    }
  );

  done();
};
