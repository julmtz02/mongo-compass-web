'use strict';

const { requireRole } = require('../middleware/require-role');
const { getSetting, setSetting, getAllSettings } = require('../db');
const pkgJson = require('../../package.json');

module.exports = function settingsRoutes(fastify, opts, done) {
  const args = fastify.args;

  // Compass-recognized preference keys only
  function getCompassPreferences() {
    const persisted = getAllSettings();
    return {
      enableGenAIFeatures: persisted.enableGenAIFeatures ?? args.enableGenAiFeatures,
      enableGenAISampleDocumentPassing: persisted.enableGenAISampleDocumentPassing ?? args.enableGenAiSampleDocuments,
      enableCreatingNewConnections: args.enableEditConnections || false,
      optInDataExplorerGenAIFeatures: persisted.optInDataExplorerGenAIFeatures ?? false,
    };
  }

  // All settings including user preferences (theme, sort, etc.)
  function getAllUserSettings() {
    const persisted = getAllSettings();
    return {
      ...getCompassPreferences(),
      theme: persisted.theme ?? 'DARK',
      defaultSort: persisted.defaultSort ?? null,
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

    const prefs = getCompassPreferences();
    reply.send({
      orgId: args.orgId,
      projectId: args.projectId,
      appName: args.appName,
      preferences: {
        ...prefs,
        enableGenAIFeaturesAtlasOrg: prefs.enableGenAIFeatures,
        enableGenAIFeaturesAtlasProject: prefs.enableGenAIFeatures,
        enableGenAISampleDocumentPassingOnAtlasProject: prefs.enableGenAISampleDocumentPassing,
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: prefs.enableGenAIFeatures,
        },
      },
    });
  });

  fastify.get('/settings', (request, reply) => {
    reply.send(getAllUserSettings());
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
