#!/usr/bin/env node
'use strict';

const fastify = require('./app');

const args = fastify.args;

/** * @type {import('node-cache')}*/
const exportIds = fastify.exportIds;

/** * @type {import('./connection-manager').ConnectionManager} */
const connectionManager = fastify.connectionManager;
const { closeDb, cleanExpiredSessions } = require('./db');
const { SHUTDOWN_TIMEOUT_MS } = require('./constants');

let shuttingDown = false;

fastify.listen({ port: args.port, host: args.host }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server is running at ${address}`);

  // Clean up connections on shutdown
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}. Shutting down the server...`);

    // 10 seconds timeout to shutdown
    const timeout = setTimeout(() => {
      console.error('Forcefully shutting down after 10 seconds.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      await connectionManager.close();
      await fastify.close();
      exportIds.close();
      closeDb();
      console.log('Server closed successfully.');
    } catch (shutdownError) {
      console.error('Error during server shutdown:', shutdownError);
    } finally {
      clearTimeout(timeout);
      process.exit();
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => shutdown(signal));
  }
});
