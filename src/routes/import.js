'use strict';

const DataService = require('../data-service');
const { sendError, wrapHandler } = require('../middleware/error-handler');
const { resolveMongoClient } = require('../middleware/validate-connection');
const { importJSON } = require('../../compass-import-export/import/import-json');
const { guessFileType } = require('../../compass-import-export/import/guess-filetype');
const { importCSV } = require('../../compass-import-export/import/import-csv');
const { listCSVFields } = require('../../compass-import-export/import/list-csv-fields');
const { analyzeCSVFields } = require('../../compass-import-export/import/analyze-csv-fields');

async function parseFileUpload(request, reply) {
  const file = await request.file();
  if (!file) {
    sendError(reply, 400, 'No file');
    return null;
  }
  const rawJson = file.fields.json?.value;
  if (!rawJson) {
    return { file: file.file, body: null };
  }
  try {
    return { file: file.file, body: JSON.parse(rawJson) };
  } catch (err) {
    sendError(reply, 400, 'Invalid JSON body');
    return null;
  }
}

module.exports = function importRoutes(fastify, opts, done) {
  const connectionManager = fastify.connectionManager;

  fastify.post(
    '/guess-filetype',
    { preHandler: fastify.csrfProtection },
    async (request, reply) => {
      const file = await request.file();
      if (!file) return sendError(reply, 400, 'No file');
      const res = await guessFileType({ input: file.file });
      reply.send(res);
    }
  );

  fastify.post(
    '/upload-json',
    { preHandler: fastify.csrfProtection },
    wrapHandler(async (request, reply) => {
      const upload = await parseFileUpload(request, reply);
      if (!upload) return;
      const { file, body } = upload;
      if (!body) return sendError(reply, 400, 'No json body');

      const mongoClient = await resolveMongoClient(connectionManager, body.connectionId, reply);
      if (!mongoClient) return;

      const res = await importJSON({
        ...body,
        dataService: new DataService(mongoClient),
        input: file,
      });
      reply.send(res);
    })
  );

  fastify.post(
    '/upload-csv',
    { preHandler: fastify.csrfProtection },
    wrapHandler(async (request, reply) => {
      const upload = await parseFileUpload(request, reply);
      if (!upload) return;
      const { file, body } = upload;
      if (!body) return sendError(reply, 400, 'No json body');

      const mongoClient = await resolveMongoClient(connectionManager, body.connectionId, reply);
      if (!mongoClient) return;

      const res = await importCSV({
        ...body,
        dataService: new DataService(mongoClient),
        input: file,
      });
      reply.send(res);
    })
  );

  fastify.post(
    '/list-csv-fields',
    { preHandler: fastify.csrfProtection },
    wrapHandler(async (request, reply) => {
      const upload = await parseFileUpload(request, reply);
      if (!upload) return;
      const { file, body } = upload;
      if (!body) return sendError(reply, 400, 'No json body');

      const res = await listCSVFields({ ...body, input: file });
      reply.send(res);
    })
  );

  fastify.post(
    '/analyze-csv-fields',
    { preHandler: fastify.csrfProtection },
    wrapHandler(async (request, reply) => {
      const upload = await parseFileUpload(request, reply);
      if (!upload) return;
      const { file, body } = upload;
      if (!body) return sendError(reply, 400, 'No json body');

      const res = await analyzeCSVFields({ ...body, input: file });
      reply.send(res);
    })
  );

  done();
};
