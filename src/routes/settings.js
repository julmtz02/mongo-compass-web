'use strict';

const { requireRole } = require('../middleware/require-role');
const pkgJson = require('../../package.json');

module.exports = function settingsRoutes(fastify, opts, done) {
  const args = fastify.args;

  const settings = {
    enableGenAIFeatures: args.enableGenAiFeatures,
    enableGenAISampleDocumentPassing: args.enableGenAiSampleDocuments,
  };

  if (args.enableEditConnections) {
    settings.enableCreatingNewConnections = true;
  }

  fastify.get('/version', (request, reply) => {
    reply.send({
      version: pkgJson.version,
      source: `https://github.com/haohanyang/compass-web/tree/v${pkgJson.version}`,
    });
  });

  fastify.get('/projectId', (request, reply) => {
    reply.type('text/plain').send(args.projectId);
  });

  fastify.get('/cloud-mongodb-com/v2/:projectId/params', (request, reply) => {
    if (request.params.projectId !== args.projectId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    reply.send({
      orgId: args.orgId,
      projectId: args.projectId,
      appName: args.appName,
      preferences: {
        ...settings,
        enableGenAIFeaturesAtlasOrg: settings.enableGenAIFeatures,
        enableGenAIFeaturesAtlasProject: settings.enableGenAIFeatures,
        enableGenAISampleDocumentPassing: settings.enableGenAISampleDocumentPassing,
        enableGenAISampleDocumentPassingOnAtlasProject: settings.enableGenAISampleDocumentPassing,
        optInDataExplorerGenAIFeatures: settings.optInDataExplorerGenAIFeatures ?? false,
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: settings.enableGenAIFeatures,
        },
      },
    });
  });

  fastify.get('/settings', (request, reply) => {
    reply.send(settings);
  });

  fastify.post(
    '/settings/optInDataExplorerGenAIFeatures',
    { preHandler: requireRole('admin') },
    (request, reply) => {
      const { value } = request.body || {};
      if (typeof value !== 'boolean') {
        return reply.status(400).send({ error: 'value must be a boolean' });
      }
      settings.optInDataExplorerGenAIFeatures = value;
      reply.send({ ok: true });
    }
  );

  done();
};
