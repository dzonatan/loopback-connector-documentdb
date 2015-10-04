var DataSource = require('loopback-datasource-juggler').DataSource;

var defaultConfig = {test: {documentdb: {
  host: 'MyHost',
  masterKey: 'MyKey',
  databaseId: 'MyDbId',
  collectionId: 'MyCollId',
}}};
var config = require('rc')('loopback', defaultConfig).test.documentdb;

global.getDataSource = global.getSchema = function () {
  var db = new DataSource(require('../'), config);
  return db;
};
