'use strict';

const crypto = require('crypto');
const { Writable } = require('stream');
const DataService = require('../data-service');
const { sanitizeFilename } = require('../utils/sanitize');
const { sendError, wrapHandler } = require('../middleware/error-handler');
const { resolveMongoClient } = require('../middleware/validate-connection');
const {
  exportJSONFromQuery,
  exportJSONFromAggregation,
} = require('../../compass-import-export/export/export-json');
const {
  exportCSVFromQuery,
  exportCSVFromAggregation,
} = require('../../compass-import-export/export/export-csv');
const {
  gatherFieldsFromQuery,
} = require('../../compass-import-export/export/gather-fields');

module.exports = function exportRoutes(fastify, opts, done) {
  const connectionManager = fastify.connectionManager;
  const exportIds = fastify.exportIds;

  function createExportId(body, type) {
    const exportId = crypto.randomBytes(8).toString('hex');
    exportIds.set(exportId, { ...body, type });
    return exportId;
  }

  fastify.post(
    '/export-csv',
    { preHandler: fastify.csrfProtection },
    (request, reply) => {
      reply.send(createExportId(request.body, 'csv'));
    }
  );

  fastify.post(
    '/export-json',
    { preHandler: fastify.csrfProtection },
    (request, reply) => {
      reply.send(createExportId(request.body, 'json'));
    }
  );

  fastify.get('/export/:exportId', async (request, reply) => {
    const exportOptions = exportIds.get(request.params.exportId);
    if (!exportOptions) {
      return sendError(reply, 404, 'Export not found');
    }

    const mongoClient = await resolveMongoClient(
      connectionManager, exportOptions.connectionId, reply
    );
    if (!mongoClient) return;

    const outputStream = new Writable({
      objectMode: true,
      write: (chunk, encoding, callback) => {
        reply.raw.write(chunk);
        callback();
      },
    });

    const ext = exportOptions.type === 'json' ? 'json' : 'csv';
    const filename = sanitizeFilename(exportOptions.ns);
    reply.raw.setHeader('Content-Type', 'application/octet-stream');
    reply.raw.setHeader('Content-Disposition', `attachment; filename="${filename}.${ext}"`);

    try {
      const dataService = new DataService(mongoClient);
      const exportFns = {
        json: { query: exportJSONFromQuery, aggregation: exportJSONFromAggregation },
        csv: { query: exportCSVFromQuery, aggregation: exportCSVFromAggregation },
      };
      const fnSet = exportFns[exportOptions.type];
      const fn = exportOptions.query ? fnSet.query : fnSet.aggregation;

      const params = {
        ...exportOptions,
        dataService,
        output: outputStream,
      };
      if (!exportOptions.query) {
        params.preferences = { getPreferences: () => exportOptions.preferences };
      }

      const res = await fn(params);
      request.log.info({ exportId: request.params.exportId, result: res }, 'Export completed');
    } catch (err) {
      request.log.error(err, 'Export failed');
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500);
      }
    } finally {
      reply.raw.end();
    }
  });

  fastify.post('/gather-fields', {
    preHandler: fastify.csrfProtection,
  }, wrapHandler(async (request, reply) => {
    const mongoClient = await resolveMongoClient(
      connectionManager, request.body.connectionId, reply
    );
    if (!mongoClient) return;

    const res = await gatherFieldsFromQuery({
      ns: request.body.ns,
      dataService: new DataService(mongoClient),
      query: request.body.query,
      sampleSize: request.body.sampleSize,
    });

    reply.send({ docsProcessed: res.docsProcessed, paths: res.paths });
  }));

  done();
};
