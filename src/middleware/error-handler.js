'use strict';

function sendError(reply, status, message) {
  return reply.status(status).send({ error: message });
}

function wrapHandler(handler, errorStatus = 502) {
  return async (request, reply) => {
    try {
      return await handler(request, reply);
    } catch (err) {
      request.log.error(err);
      return sendError(reply, errorStatus, err.message ?? 'Unknown error');
    }
  };
}

module.exports = { sendError, wrapHandler };
