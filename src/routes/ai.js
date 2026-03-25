'use strict';

const { sendError } = require('../middleware/error-handler');
const { generateQuery, generateAggregation } = require('../gen-ai');

function requireGenAI(args) {
  return async (request, reply) => {
    if (request.params.projectId !== args.projectId) {
      return sendError(reply, 400, 'Project ID mismatch');
    }
    if (!args.enableGenAiFeatures) {
      return sendError(reply, 400, 'Gen AI is not enabled');
    }
    if (!args.openaiApiKey) {
      return sendError(reply, 400, 'Missing OpenAI API key');
    }
  };
}

module.exports = function aiRoutes(fastify, opts, done) {
  const args = fastify.args;
  const preHandler = [fastify.csrfProtection, requireGenAI(args)];

  fastify.post(
    '/ai/v1/groups/:projectId/mql-query',
    { preHandler },
    async (request, reply) => {
      try {
        const query = await generateQuery(args.openaiApiKey, request.body, args);
        reply.send({ content: { query } });
      } catch (err) {
        return sendError(reply, 400, err.message);
      }
    }
  );

  fastify.post(
    '/ai/v1/groups/:projectId/mql-aggregation',
    { preHandler },
    async (request, reply) => {
      try {
        const aggregation = await generateAggregation(args.openaiApiKey, request.body, args);
        reply.send({ content: { aggregation } });
      } catch (err) {
        return sendError(reply, 400, err.message);
      }
    }
  );

  done();
};
