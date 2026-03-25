'use strict';

const net = require('net');
const tls = require('tls');
const { SOCKET_KEEPALIVE_MS, SOCKET_TIMEOUT_MS } = require('../constants');

function isTrue(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}


function shouldDisableTLSVerification(connectOptions, mongoURIs) {
  const fromServerConfig = mongoURIs.some(({ uri }) => {
    try {
      const hostMatches = (uri.hosts || []).some(
        (h) => h.split(':')[0] === connectOptions.host
      );
      if (!hostMatches) return false;
      const params = uri.searchParams;
      return (
        params.get('tlsInsecure') === 'true' ||
        params.get('tlsAllowInvalidCertificates') === 'true'
      );
    } catch (_) {
      return false;
    }
  });

  const globalInsecure = mongoURIs.some(({ uri }) => {
    try {
      const params = uri.searchParams;
      return (
        params.get('tlsInsecure') === 'true' ||
        params.get('tlsAllowInvalidCertificates') === 'true'
      );
    } catch (_) {
      return false;
    }
  });

  return fromServerConfig || globalInsecure;
}

function createMongoSocket(connectOptions, useSecureConnection, mongoURIs) {
  let socket;

  if (useSecureConnection) {
    const tlsOptions = {
      servername: connectOptions.host,
      minVersion: 'TLSv1.2',
      ...connectOptions,
    };

    const wantInsecure = shouldDisableTLSVerification(connectOptions, mongoURIs);

    if (wantInsecure) {
      tlsOptions.rejectUnauthorized = false;
    }

    if (wantInsecure || isTrue(connectOptions.tlsAllowInvalidHostnames)) {
      tlsOptions.checkServerIdentity = () => undefined;
    }

    if (!tlsOptions.servername) {
      tlsOptions.servername = connectOptions.host;
    }

    socket = tls.connect(tlsOptions);
  } else {
    socket = net.createConnection(connectOptions);
  }

  socket.setKeepAlive(true, SOCKET_KEEPALIVE_MS);
  socket.setTimeout(SOCKET_TIMEOUT_MS);
  socket.setNoDelay(true);

  return socket;
}

module.exports = { createMongoSocket };
