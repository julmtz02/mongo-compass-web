'use strict';

module.exports = function routes(fastify, opts, done) {
  fastify.register(require('./settings'));
  fastify.register(require('./connections'));
  fastify.register(require('./export'));
  fastify.register(require('./import'));
  fastify.register(require('./ai'));

  fastify.setNotFoundHandler((request, reply) => {
    const csrfToken = reply.generateCsrf();
    reply.view('index.eta', { csrfToken, appName: fastify.args.appName });
  });

  done();
};
