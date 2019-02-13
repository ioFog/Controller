/*
 *  *******************************************************************************
 *  * Copyright (c) 2018 Edgeworx, Inc.
 *  *
 *  * This program and the accompanying materials are made available under the
 *  * terms of the Eclipse Public License v. 2.0 which is available at
 *  * http://www.eclipse.org/legal/epl-2.0
 *  *
 *  * SPDX-License-Identifier: EPL-2.0
 *  *******************************************************************************
 *
 */

const winston = require('winston');
const config = require('../config');

const MESSAGE = Symbol.for('message');

const levels = {
  error: 0,
  warn: 1,
  cliReq: 2,
  cliRes: 3,
  apiReq: 4,
  apiRes: 5,
  info: 6,
  verbose: 7,
  debug: 8,
  silly: 9
};

const formattedJson = winston.format((log) => {
  let sortedFields = ['level', 'timestamp', 'message'];
  if (log.args) {
    sortedFields = sortedFields.concat(['args']).concat(getAllObjKeys(log.args));
  }
  log[MESSAGE] = JSON.stringify(log, sortedFields);
  return log;
});

const logger = winston.createLogger({
  levels: levels,
  level: 'silly',
  transports: [
    new winston.transports.File({
      format: winston.format.combine(
        winston.format.timestamp(),
        formattedJson()
      ),
      filename: 'iofog-controller.log',
      dirname: config.get('Service:LogsDirectory'),
      maxsize:  config.get('Service:LogsFileSize'),
    }),
  ],
});

logger.add(new winston.transports.Console({
  level: 'info',
  format: winston.format((log) => {
    if (log.level === 'cliReq') {
      return
    }
    let message = log.level === 'cliRes' ? `${log.message}` : `[${log.level}] ${log.message}`;

    if (log.args) {
      message += ` / args: ${JSON.stringify(log.args)}`
    }
    log[MESSAGE] = message;
    return log;
  })(),
}));

function getAllObjKeys(obj) {
  let keys = [];
  for (const key in obj) {
    keys.push(key);
    if (obj[key] instanceof Object) {
      const innerKeys = getAllObjKeys(obj[key]);
      keys = keys.concat(innerKeys);
    }
  }
  return keys;
}

module.exports = logger;
