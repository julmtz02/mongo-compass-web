'use strict';

function sanitizeFilename(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

module.exports = { sanitizeFilename };
