'use strict';

function extractHostname(hostString) {
  return hostString.split(':')[0];
}

function buildAllowedHosts(mongoURIs) {
  const hosts = new Set();

  for (const { uri } of mongoURIs) {
    try {
      for (const host of (uri.hosts || [])) {
        hosts.add(extractHostname(host));
      }
    } catch (_) {}
  }

  return hosts;
}

function validateHost(host, allowedHosts) {
  return allowedHosts.has(host);
}

module.exports = { buildAllowedHosts, validateHost };
