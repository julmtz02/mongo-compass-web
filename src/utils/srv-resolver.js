'use strict';

const { resolveSRVRecord, parseOptions } = require('mongodb/lib/connection_string');
const { ConnectionString } = require('mongodb-connection-string-url');

async function createClientSafeConnectionString(cs) {
  try {
    if (!cs.isSRV) return cs.href;

    const res = await resolveSRVRecord(parseOptions(cs.href));
    const csCopy = cs.clone();
    csCopy.protocol = 'mongodb';
    csCopy.hosts = res.map((address) => address.toString());
    return csCopy.toString();
  } catch (err) {
    console.error(
      `Failed to create client safe connection string: ${cs.redact().href}`,
      err
    );
    return cs.href;
  }
}

module.exports = { createClientSafeConnectionString };
