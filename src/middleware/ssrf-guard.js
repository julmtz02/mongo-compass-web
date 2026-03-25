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

// Extract base domain: "cluster.wfcmz9q.mongodb.net" -> "wfcmz9q.mongodb.net"
function getBaseDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-3).join('.'); // last 3 parts: xxx.mongodb.net
}

async function buildAllowedHosts(mongoURIs, connectionManager) {
  const hosts = new Set();
  const domains = new Set();

  // Add preset hosts from CLI/env
  for (const { uri } of mongoURIs) {
    try {
      for (const host of (uri.hosts || [])) {
        const hostname = extractHostname(host);
        hosts.add(hostname);
        domains.add(getBaseDomain(hostname));
      }
    } catch (_) {}
  }

  // Add hosts and domains from user-saved connections
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
              domains.add(getBaseDomain(hostname));
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  return { hosts, domains };
}

function validateHost(host, allowedData) {
  if (isBlockedHost(host)) return false;
  // Exact match
  if (allowedData.hosts.has(host)) return true;
  // Domain match (for SRV resolved hosts like shard-00-01.wfcmz9q.mongodb.net)
  const baseDomain = getBaseDomain(host);
  if (allowedData.domains.has(baseDomain)) return true;
  return false;
}

module.exports = { buildAllowedHosts, validateHost };
