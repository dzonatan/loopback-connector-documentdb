// Require the Azure documentdb driver
var DocumentDBClient = require('documentdb').DocumentClient;

// Require the loopback related drivers
var Connector = require('loopback-connector').Connector;
var util = require('util');
var debug = require('debug')('loopback:connector:documentdb');

/**
 * Initialize the  connector against the given data source
 *
 * @param {DataSource} dataSource The loopback-datasource-juggler dataSource
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  var settings = dataSource.settings || {};

  var connector = new DocumentDB(settings);
  dataSource.connector = connector;

  callback();
};

var DocumentDB = function (settings) {
  var self = this;

  Connector.call(this, 'documentdb', settings);
  this.settings.host = settings.host;
  this.settings.masterKey = settings.masterKey;
  this.settings.databaseId = settings.databaseId;
  this.settings.collectionId = settings.collectionId;

  self.client = new DocumentDBClient(self.settings.host, { masterKey: self.settings.masterKey });
};

// Set up the prototype inheritence
util.inherits(DocumentDB, Connector);

// Required functions by loopback connector interface
DocumentDB.prototype.connect = function (callback) {
  var self = this;

  getDatabase(self.client, self.settings.databaseId, function (err, database) {
    if (err) {
      callback && callback(err);
    } else if (!err && !database) {
      debug('Cannot find database with id: ' + self.settings.databaseId);
      var error = {
        name: 'Error',
        status: 404,
        message: 'Unknown "database" id "' + self.settings.databaseId + '".',
        statusCode: 404,
        code: 'DATABASE_NOT_FOUND',
      };
      callback && callback(error);
    } else {
      self.database = database._self;
      getCollection(self.client, self.database, self.settings.collectionId, function (err, collection) {
        if (err) {
          callback && callback(err);
        } else if (!err && !collection) {
          debug('Cannot find collection with id: ' + self.settings.collectionId);
          callback && callback(null);
        } else {
          callback && callback(null, collection._self);
          self.collection = collection._self;

          debug('DocumentDB connection is established! Host: ' + self.settings.host);
          debug('DB: ' + self.settings.databaseId + ' | Collection: ' + self.settings.collectionId);
        }
      });
    }
  });
};

DocumentDB.prototype.disconnect = function (callback) {
  callback();
};

DocumentDB.prototype.ping = function (callback) {
  console.log("DocumentDB.ping is not implemented");
};

//////// CRUD methods

/**
 * Get types associated with the connector
 * @returns {String[]} The types for the connector
 */
DocumentDB.prototype.getTypes = function () {
  return ['db', 'nosql', 'documentdb'];
};

/**
 * Get the default data type for ID
 * @returns {Function} The default type for ID
 */
DocumentDB.prototype.getDefaultIdType = function () {
  return String;
};

/**
 * Create a new model instance for the given data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.create = function (model, data, cb) {
  var self = this;

  // Map model type
  data.type = model;

  // Create document
  self.client.createDocument(self.collection, data, function (err, doc) {
    if (err) {
      cb(err);
    } else {
      cb(null, doc);
    }
  });
};

/**
 * Find a model instance by id
 * @param {String} model The model name
 * @param {*} id The id value
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.find = function find(model, id, cb) {
  var self = this;

  var filter = { where: { id: id } };
  var query = self.buildQuery(model, filter);
  self.client.queryDocuments(self.collection, query).toArray(function (err, results) {
    if (err) {
      cb(err);
    } else {
      cb(null, results);
    }
  });
};

/**
 * Update if the model instance exists with the same id or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.updateOrCreate = function updateOrCreate(model, data, cb) {
  var self = this;

  var id = data.id;
  if (!!id) {
    self.create(model, data, cb);
  } else {
    self.updateAttributes(model, id, data, function (err, updatedModel) {
      if (err && err.status === 404) {
        self.create(model, data, cb);
      } else {
        cb(null, updatedModel);
      }
    });
  }
};

/**
 * Find matching model instances by the filter
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.all = function all(model, filter, cb) {
  var self = this;

  var query = self.buildQuery(model, filter);
  self.client.queryDocuments(self.collection, query)
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.destroyAll = function destroyAll(model, where, cb) {
  console.log("DocumentDB.destroyAll is not implemented");
};

/**
 * Count the number of instances for the given model
 *
 * @param {String} model The model name
 * @param {Function} [cb] The callback function
 * @param {Object} filter The filter for where
 *
 */
DocumentDB.prototype.count = function count(model, cb, where) {
  var self = this;

  var filter = { where: where };
  var query = self.buildQuery(model, filter);
  self.client.queryDocuments(self.collection, query)
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results.length);
      }
    });
};

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [cb] The callback function
 */
DocumentDB.prototype.updateAttributes = function updateAttrs(model, id, data, cb) {
  var self = this;
  self.find(model, id, function (err, result) {
    if (!!err || !result.length) {
      cb(err);
    } else {
      var modelToUpdate = result[0];

      Object.keys(data).forEach(function (key, index) {
        modelToUpdate[key] = data[key];
      });

      self.client.replaceDocument(modelToUpdate._self, modelToUpdate, function (err, replaced) {
        if (err) {
          cb(err);
        } else {
          cb(null, replaced);
        }
      });
    }
  })
};

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} cb Callback function
 */
DocumentDB.prototype.update = function (model, where, data, cb) {
  console.log("DocumentDB.update is not implemented");
};


DocumentDB.prototype.buildQuery = function buildQuery(type, filter) {
  // TODO: This needs to be implemented:
  // limit
  // Operators like >, <, in, ...

  var q = {
    query: 'SELECT * FROM root r',
    parameters: [{
      name: '@type',
      value: type
    }]
  };

  var fields = [];
  fields.push('r.type = @type');

  if (filter && filter.where) {
    Object.keys(filter.where).forEach(function (key) {
      fields.push('r.' + key + ' = @' + key);
      q.parameters.push({
        name: '@' + key,
        value: filter.where[key]
      });
    });
  }
  q.query += ' WHERE ' + fields.join(' AND ');

  return q;
}


//////// Private methods for documentdb
function getDatabase(client, databaseId, callback) {
  var querySpec = {
    query: 'SELECT * FROM root r WHERE  r.id = @id',
    parameters: [{
      name: '@id',
      value: databaseId
    }]
  };

  client.queryDatabases(querySpec).toArray(function (err, results) {
    if (err) {
      callback(err);
    } else {
      if (results.length === 0) {
        // no error occured, but there were no results returned
        // indicating no database exists matching the query
        // so, explictly return null
        callback(null, null);
      } else {
        // we found a database, so return it
        callback(null, results[0]);
      }
    }
  });
}

function getCollection(client, databaseLink, collectionId, callback) {
  var querySpec = {
    query: 'SELECT * FROM root r WHERE r.id=@id',
    parameters: [{
      name: '@id',
      value: collectionId
    }]
  };

  client.queryCollections(databaseLink, querySpec).toArray(function (err, results) {
    if (err) {
      callback(err);
    } else {
      if (results.length === 0) {
        // no error occured, but there were no results returned
        // indicating no collections exists matching the query
        // so, explictly return null
        callback(null, null);
      } else {
        callback(null, results[0]);
      }
    }
  });
}
