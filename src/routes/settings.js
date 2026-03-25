'use strict';

const { requireRole } = require('../middleware/require-role');
const { getSetting, setSetting, getAllSettings } = require('../db');
const pkgJson = require('../../package.json');

module.exports = function settingsRoutes(fastify, opts, done) {
  const args = fastify.args;

  // Load persisted settings, merge with defaults from CLI args
  function getSettings() {
    const persisted = getAllSettings();
    return {
      enableGenAIFeatures: persisted.enableGenAIFeatures ?? args.enableGenAiFeatures,
      enableGenAISampleDocumentPassing: persisted.enableGenAISampleDocumentPassing ?? args.enableGenAiSampleDocuments,
      enableCreatingNewConnections: args.enableEditConnections || false,
      optInDataExplorerGenAIFeatures: persisted.optInDataExplorerGenAIFeatures ?? false,
      theme: persisted.theme ?? 'DARK',
      defaultSort: persisted.defaultSort ?? null,
      ...persisted,
    };
  }

  fastify.get('/version', (request, reply) => {
    reply.send({
      version: pkgJson.version,
      source: `https://github.com/julmtz02/mongo-compass-web/tree/v${pkgJson.version}`,
    });
  });

  fastify.get('/projectId', (request, reply) => {
    reply.type('text/plain').send(args.projectId);
  });

  fastify.get('/cloud-mongodb-com/v2/:projectId/params', (request, reply) => {
    if (request.params.projectId !== args.projectId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    const settings = getSettings();
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
        optInDataExplorerGenAIFeatures: settings.optInDataExplorerGenAIFeatures,
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: settings.enableGenAIFeatures,
        },
      },
    });
  });

  fastify.get('/settings', (request, reply) => {
    reply.send(getSettings());
  });

  // Generic settings update — persists any key/value pair
  fastify.post('/settings/:key', (request, reply) => {
    const { key } = request.params;
    const { value } = request.body || {};
    if (value === undefined) {
      return reply.status(400).send({ error: 'value is required' });
    }
    setSetting(key, value);
    reply.send({ ok: true });
  });

  done();
};
