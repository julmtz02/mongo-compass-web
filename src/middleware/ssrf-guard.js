'use strict';

const { ConnectionString } = require('mongodb-connection-string-url');

// Block private/internal IPs to prevent SSRF to internal services
const BLOCKED_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
  /^localhost$/i, /^metadata\.google\.internal$/i,
];

function isBlockedHost(host) {
  return BLOCKED_PATTERNS.some(p => p.test(host));
}

function extractHostname(hostString) {
  return hostString.split(':')[0];
}

async function buildAllowedHosts(mongoURIs, connectionManager) {
  const hosts = new Set();

  // Add preset hosts from CLI/env
  for (const { uri } of mongoURIs) {
    try {
      for (const host of (uri.hosts || [])) {
        hosts.add(extractHostname(host));
      }
    } catch (_) {}
  }

  // Add hosts from user-saved connections
  if (connectionManager) {
    try {
      const connections = await connectionManager.getAllConnections(false);
      for (const conn of connections) {
        try {
          const cs = new ConnectionString(conn.connectionOptions.connectionString);
          for (const host of (cs.hosts || [])) {
            const hostname = extractHostname(host);
            if (!isBlockedHost(hostname)) {
              hosts.add(hostname);
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  return hosts;
}

function validateHost(host, allowedHosts) {
  if (isBlockedHost(host)) return false;
  return allowedHosts.has(host);
}

module.exports = { buildAllowedHosts, validateHost };
