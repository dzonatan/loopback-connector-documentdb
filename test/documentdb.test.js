require('./init.js');
var should = require('should');
var sinon = require('sinon');
var QueryIterator = require('../node_modules/documentdb/lib/queryIterator');

var db;
var mock;

describe('Azure DocumentDB connector', function () {
  // remove all databases from the endpoint before each test
  before(function() {
    db = getDataSource();

    // Mock
    mock = sinon.mock(db.connector.client);
  });

  it('should return same document when successfuly created', function (done) {
    // Arrange
    var model = { id: 123, smth: 'abc' };

    // Mock
    mock.expects('createDocument').yields(null, model);

    // Act
    db.connector.create(null, model, function (err, createdModel) {

      // Assert
      createdModel.should.be.exactly(model);
      done();
    });
  });

  it('should return error when creation did not succeeded', function (done) {
    // Arrange
    var model = { id: 123, smth: 'abc' };
    var error = { code: 404, description: 'something happened...' };

    // Mock
    mock.expects('createDocument').yields(error, null);

    // Act
    db.connector.create(null, model, function (err, createdModel) {

      // Assert
      err.should.be.exactly(error);
      done();
    });
  });

  it('should return document when found', function (done) {
    // Arrange
    var model = { id: 123, smth: 'abc', type: 'documentType' };

    // Mock
    mock.expects('queryDocuments').returns(new QueryIterator(null, null, null, function (options, callback) {
      callback(null, model, []);
    }));

    // Act
    db.connector.find(model.type, model.id, function (err, foundModels) {

      // Assert
      foundModels[0].should.be.exactly(model);
      done();
    });
  });

  it('should return error when not found', function (done) {
    // Arrange
    var error = { code: 404, description: 'something happened...' };

    // Mock
    mock.expects('queryDocuments').returns(new QueryIterator(null, null, null, function (options, callback) {
      callback(error, null, []);
    }));

    // Act
    db.connector.find('type', 123, function (err, foundModels) {

      // Assert
      err.should.be.exactly(error);
      done();
    });
  });

  it('should correctly update document properties', function (done) {
    // Arrange
    var model = { id: 123, smth: 'abc', type: 'documentType' };
    var changedModel = { id: 123, smth: 'ebd', type: 'documentType' };

    // Mock
    mock.expects('queryDocuments').returns(new QueryIterator(null, null, null, function (options, callback) {
      callback(null, model, []);
    }));
    mock.expects('replaceDocument').withArgs(undefined, changedModel).yields(null, changedModel);

    // Act
    db.connector.updateAttributes(model.type, model.id, changedModel, function (err, updatedModel) {
      
      // Assert
      updatedModel.should.be.exactly(changedModel);
      mock.verify();
      done();
    });
  });

  it('should correctly build query without filter', function () {
    // Arrange
    var type = 'docType1';

    // Act
    var query = db.connector.buildQuery(type, null);

    // Assert
    query.query.should.be.exactly('SELECT * FROM root r WHERE r.type = @type');
    query.parameters.should.be.lengthOf(1);
    query.parameters[0].should.have.property('name', '@type');
    query.parameters[0].should.have.property('value', type);
  });

  it('should correctly build query with where filter', function () {
    // Arrange
    var type = 'docType1';
    var filter = { where: { id: 123, someProp: 'abc' } };

    // Act
    var query = db.connector.buildQuery(type, filter);

    // Assert
    query.query.should.be.exactly('SELECT * FROM root r WHERE r.type = @type AND r.id = @id AND r.someProp = @someProp');
    query.parameters.should.be.lengthOf(3);
    query.parameters[0].should.have.property('name', '@type');
    query.parameters[0].should.have.property('value', type);
    query.parameters[1].should.have.property('name', '@id');
    query.parameters[1].should.have.property('value', filter.where.id);
    query.parameters[2].should.have.property('name', '@someProp');
    query.parameters[2].should.have.property('value', filter.where.someProp);
  });
});
