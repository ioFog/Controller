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

const BaseCLIHandler = require('./base-cli-handler');
const constants = require('../helpers/constants');
const logger = require('../logger');
const MicroserviceService = require('../services/microservices-service');
const fs = require('fs');
const AppHelper = require('../helpers/app-helper');
const AuthDecorator = require('../decorators/cli-decorator');

const JSON_SCHEMA =
  `  name: string
  catalogItemId: string
  flowId: string
  ioFogNodeId: string
  config: string
  volumeMappings: string
  logLimit: number
  rootHostAccess: true
  ports: object
    internal: number
    external: number
    tunnel: boolean
  routes: array of strings`

class Microservice extends BaseCLIHandler {
  constructor() {
    super()

    this.name = constants.CMD_MICROSERVICE
    this.commandDefinitions = [
      { name: 'command', defaultOption: true, group: [constants.CMD] },
      {
        name: 'file', alias: 'f', type: String, description: 'Microservice settings JSON file',
        group: [constants.CMD_ADD, constants.CMD_UPDATE]
      },
      {
        name: 'microservice-id', alias: 'i', type: String, description: 'Microservice ID',
        group: [constants.CMD_UPDATE, constants.CMD_REMOVE, constants.CMD_INFO, constants.CMD_ROUTE, constants.CMD_STRACE]
      },
      {
        name: 'name', alias: 'n', type: String, description: 'Microservice name',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'catalog-id', alias: 'c', type: String, description: 'Catalog item ID',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'flow-id', alias: 'F', type: String, description: 'Application flow ID',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'iofog-id', alias: 'I', type: String, description: 'ioFog node ID',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'config', alias: 'g', type: String, description: 'Microservice config',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'volumes', alias: 'v', type: String, description: 'Microservice volume mapping(s)', multiple: true,
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'log-limit', alias: 'l', type: Number, description: 'Log file size limit (MB)',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'root-enable', alias: 'r', type: Boolean, description: 'Enable root access',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'root-disable', alias: 'R', type: Boolean, description: 'Disable root access',
        group: [constants.CMD_UPDATE, constants.CMD_ADD]
      },
      {
        name: 'ports', alias: 'p', type: String, description: 'Container ports', multiple: true,
        group: [constants.CMD_ADD]
      },
      {
        name: 'routes', alias: 't', type: String, description: 'Microservice route(s) (receiving microservices)', multiple: true,
        group: [constants.CMD_ADD]
      },
      {
        name: 'add', alias: 'a', type: String, description: 'Add new route(s)', multiple: true,
        group: [constants.CMD_ROUTE]
      },
      {
        name: 'remove', alias: 'm', type: String, description: 'Delete existing route(s)', multiple: true,
        group: [constants.CMD_ROUTE]
      },
      {
        name: 'enable', alias: 'e', type: Boolean, description: 'Enable strace option',
        group: [constants.CMD_STRACE]
      },
      {
        name: 'disable', alias: 'd', type: Boolean, description: 'Disable strace option',
        group: [constants.CMD_STRACE]
      },
      {
        name: 'get', alias: 'G', type: String, description: 'Get strace data, formats: string,file',
        group: [constants.CMD_STRACE]
      },
      {
        name: 'user-id', alias: 'u', type: Number, description: 'User\'s id',
        group: [constants.CMD_ADD]
      }
    ]
    this.commands = {
      [constants.CMD_ADD]: 'Add a new microservice.',
      [constants.CMD_UPDATE]: 'Update existing microservice.',
      [constants.CMD_REMOVE]: 'Delete a microservice.',
      [constants.CMD_LIST]: 'List all microservices.',
      [constants.CMD_INFO]: 'Get microservice settings.',
      [constants.CMD_ROUTE]: 'Add/Remove microservice route.',
      [constants.CMD_STRACE]: 'strace option operations.',
    }
  }

  async run(args) {
    const microserviceCommand = this.parseCommandLineArgs(this.commandDefinitions, { argv: args.argv })

    switch (microserviceCommand.command.command) {
      case constants.CMD_ADD:
        await _executeCase(microserviceCommand, constants.CMD_ADD, _createMicroservice, false);
        break;
      case constants.CMD_UPDATE:
        await _executeCase(microserviceCommand, constants.CMD_UPDATE, _updateMicroservice, false);
        break;
      case constants.CMD_REMOVE:
        return
      case constants.CMD_LIST:
        return
      case constants.CMD_INFO:
        return
      case constants.CMD_ROUTE:
        return
      case constants.CMD_HELP:
      default:
        return this.help()
    }
  }

  help() {
    super.help([constants.CMD_LIST], true, true, [
      {
        header: 'JSON File Schema',
        content: [
          JSON_SCHEMA,
        ],
        raw: true,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: '1. Single mapping',
            example: '$ fog-controller microservice add [other required options] --volumes /host_src:/container_src',
          },
          {
            desc: '2. Multiple mappings',
            example: '$ fog-controller microservice add [other required options] --volumes /host_src:/container_src /host_bin:/container_bin',
          },
          {
            desc: '3. Ports (internal:external:tunnel)',
            example: '$ fog-controller microservice add [other required options] --ports 80:8080:false 443:5443:true',
          },
          {
            desc: '4. Add routes',
            example: '$ fog-controller microservice route -i ABCD --add DEF GHI',
          },
          {
            desc: '5. Delete route',
            example: '$ fog-controller microservice route -i ABC --remove DEF',
          },
          {
            desc: '6. Get strace data',
            example: '$ fog-controller microservice strace -i ABC --get file',
          },
        ],
      },
    ])
  }
}

const _executeCase  = async function (microserviceCommand, commandName, f, isUserRequired) {
  try {
    const item = microserviceCommand[commandName];

    if (isUserRequired) {
      const decoratedFunction = AuthDecorator.prepareUserById(f);
      decoratedFunction(item);
    } else {
      f(item);
    }
  } catch (error) {
    logger.error(error.message);
  }
};

const _createMicroservice = async function (obj) {
  const microservice = obj.file
    ? JSON.parse(fs.readFileSync(obj.file, 'utf8'))
    : _createMicroserviceObject(obj);

  logger.info(JSON.stringify(microservice));

  const result = await MicroserviceService.createMicroserviceOnFogWithTransaction(microservice, {}, true);
  logger.info(JSON.stringify(result));
  logger.info('Microservice has been created successfully.');
};

const _updateMicroservice = async function (obj) {

}

const _updateMicroserviceObject = async function (obj) {
  const microserviceObj = {
    name: obj.name,
    config: obj.config,
    catalogItemId: parseInt(obj.catalogId),
    flowId: parseInt(obj.flowId),
    ioFogNodeId: obj.iofogId,
    rootHostAccess: AppHelper.validateBooleanCliOptions(obj.rootEnable, obj.rootDisable),
    logLimit: obj.logLimit,
  };

  if (obj.volumes) {
    microserviceObj.volumeMappings = parseObjectArray(obj.volumes, 'Error during parsing of volume mapping option.');
  }

  return AppHelper.deleteUndefinedFields(microserviceObj);
}

const _createMicroserviceObject = function (obj) {
  const microserviceObj = {
    name: obj.name,
    config: obj.config,
    catalogItemId: parseInt(obj.catalogId),
    flowId: parseInt(obj.flowId),
    ioFogNodeId: obj.iofogId,
    rootHostAccess: AppHelper.validateBooleanCliOptions(obj.rootEnable, obj.rootDisable),
    logLimit: obj.logLimit,
    routes: obj.routes
  };

  if (obj.volumes) {
    microserviceObj.volumeMappings = parseObjectArray(obj.volumes, 'Error during parsing of volume mapping option.');
  }
  if (obj.ports) {
    microserviceObj.ports = parseObjectArray(obj.ports, 'Error during parsing of port mapping option.');
  }

  return AppHelper.deleteUndefinedFields(microserviceObj);
};



const parseObjectArray = function (arr, errMsg) {
  return arr.map(item => {
    item = item.replace(/'/g, '"');
    let result = {};
    try {
      result = JSON.parse(item);
    } catch(e) {
      logger.warn(errMsg);
      logger.warn(e.message);
    }
    return result;
  })
}

module.exports = new Microservice();