'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Routings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'id'
      },
      isNetworkConnection: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_network_connection'
      },
      sourceMicroserviceUuid: {
        type: Sequelize.STRING(32),
        field: 'source_microservice_uuid',
        references: { model: 'Microservices', key: 'uuid' },
        onDelete: 'cascade'
      },
      destMicroserviceUuid: {
        type: Sequelize.STRING(32),
        field: 'dest_microservice_uuid',
        references: { model: 'Microservices', key: 'uuid' },
        onDelete: 'cascade'
      },
      sourceNetworkMicroserviceUuid: {
        type: Sequelize.STRING(32),
        field: 'source_network_microservice_uuid',
        references: { model: 'Microservices', key: 'uuid' },
        onDelete: 'set null'
      },
      destNetworkMicroserviceUuid: {
        type: Sequelize.STRING(32),
        field: 'dest_network_microservice_uuid',
        references: { model: 'Microservices', key: 'uuid' },
        onDelete: 'set null'
      },
      sourceIofogUuid: {
        type: Sequelize.STRING(32),
        field: 'source_iofog_uuid',
        references: { model: 'Fogs', key: 'uuid' },
        onDelete: 'set null'
      },
      destIofogUuid: {
        type: Sequelize.STRING(32),
        field: 'dest_iofog_uuid',
        references: { model: 'Fogs', key: 'uuid' },
        onDelete: 'set null'
      },
      connectorPortId: {
        type: Sequelize.INTEGER,
        field: 'connector_port_id',
        references: { model: 'ConnectorPorts', key: 'id' },
        onDelete: 'set null'
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Routings')
  }
}
