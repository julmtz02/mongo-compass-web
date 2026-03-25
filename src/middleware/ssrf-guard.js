'use strict';

// Block private/internal IPs to prevent SSRF to internal services
const BLOCKED_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
  /^localhost$/i, /^metadata\.google\.internal$/i,
];

function isBlockedHost(host) {
  return BLOCKED_PATTERNS.some(p => p.test(host));
}

async function buildAllowedHosts() {
  return {};
}

function validateHost(host) {
  // Block only private/internal IPs — allow all external hosts
  if (isBlockedHost(host)) return false;
  return true;
}

module.exports = { buildAllowedHosts, validateHost };
