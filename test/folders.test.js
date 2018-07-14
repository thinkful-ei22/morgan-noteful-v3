'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const Folder = require('../models/folders');
const app = require('../server');
const seedFolders = require('../db/seed/folders.json');
const { TEST_MONGO_URI } = require('../config');

const expect = chai.expect;
chai.use(chaiHttp);



describe('Testing /api/folders endpoints', function(){

  before( function() {
    this.timeout(6000);
    return mongoose.connect(TEST_MONGO_URI, {connectTimeoutMS: 6000})
      .then( function(){ 
        return mongoose.connection.db.dropDatabase();
      });
    ///.catch(err => console.log(err));
  });

  beforeEach(  function() {
    this.timeout(8000);
    return Promise.all([
      Folder.insertMany(seedFolders),
      Folder.createIndexes()
    ]);
  });

  afterEach( function() {
    mongoose.connection.db.dropDatabase();
  });


  after( function() {
    return mongoose.disconnect();
  });


  describe('GET to endpoint /api/folders', function(){
    it('should return all folders when GET request is made', function(){
      this.timeout(6000);

      let apiFolders;

      return chai.request(app).get('/api/folders')
        .then(function(apiResult){
          apiFolders = apiResult.body;
          expect(apiResult).to.be.json;
          expect(apiResult).to.have.status(200);
          expect(apiResult.body).to.have.lengthOf.at.least(1);
          apiResult.body.forEach(folder => {
            expect(folder).to.include.keys(['name', 'createdAt', 'updatedAt']);
          });
          return Folder.count();
        })
        .then(count => {
          expect(apiFolders.length).to.equal(count);
        });
    });

    it('should return correctly sorted folders', function(){
      this.timeout(6000);

      return chai.request(app).get('/api/folders')
        .then(response => {
          const originalResponse = response.body;
          const sortedResponse = response.body.sort((a, b) => {
            return a.name - b.name;
          });
          expect(originalResponse).to.deep.equal(sortedResponse);
        });
    });
  });





  describe('GET requests to /api/folders/:id', function(){
    it('should return a single object if given valid ID', function(){
      this.timeout(6000);

      let grabbedFolder;

      return Folder.findOne()
        .then( function(folder) {
          grabbedFolder = folder;
          return chai.request(app).get('/api/folders/' + folder.id);
        })
        .then(function(response) {
          expect(response.body).to.be.a('object');
          expect(response.body).to.be.a('object');
          expect(response).to.have.status(200);
          expect(response.body).to.include.keys(['name', 'createdAt', 'updatedAt']);
          expect(response.body.name).to.equal(grabbedFolder.name);
          expect(new Date (response.body.createdAt)).to.eql(grabbedFolder.createdAt);
          expect(new Date (response.body.updatedAt)).to.eql(grabbedFolder.updatedAt);
        });
    });

    it('should return correct error if invalid id is provided', function(){
      this.timeout(6000);

      const badId = 'uugghhhh';
      return chai.request(app).get('/api/notes/' + badId)
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should return correct error if item is not founnd', function(){
      this.timeout(6000);

      const notAnId = '0000000000000000000000ff';
      return chai.request(app).get('/api/notes/' + notAnId)
        .then(function(response){
          expect(response).to.have.status(404);
          expect(response.body.message).to.equal('Not Found');
        });
      
    });
  });




  describe('POST endpoint to /api/folders', function(){
    it('should insert a new folder when POST request is made', function(){
      this.timeout(6000);

      const dummyInsert = {'name': 'Apple'};
      let apiResponse;

      return chai.request(app).post('/api/folders').send(dummyInsert)
        .then(function(response) {
          apiResponse = response.body;
          expect(response).to.have.status(201);
          expect(response.headers).to.include.keys('location');
          expect(response).to.be.json;
          expect(response.body.name).to.equal('Apple');
          expect(response.body).to.include.keys(['name', 'createdAt', 'id', 'updatedAt']);
          return Folder.findOne({name: 'Apple'});
        })
        .then(function(dbResponse){
          expect(dbResponse.name).to.equal('Apple');
          expect(dbResponse.id).to.equal(apiResponse.id);
          expect(dbResponse.createdAt).to.eql(new Date (apiResponse.createdAt));
          expect(dbResponse.updatedAt).to.eql(new Date (apiResponse.updatedAt));
        });
    });


    it('should return 400 error if name is not included', function(){
      this.timeout(6000);

      const badName = {'name':''};
      const noName = {'name': null};

      return chai.request(app).post('/api/folders').send(badName)
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Request must include folder `name`');
          return chai.request(app).post('/api/folders').send(noName);
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Request must include folder `name`');
        });
    });


    it('should return appropriate response if name is not unique', function(){
      this.timeout(6000);

      return Folder.findOne()
        .then(function(item){
          return chai.request(app).post('/api/folders').send({'name': item.name});
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('The folder name already exists');
        });

    });
  });





  describe('PUT requests to /api/folders/:id', function(){
    it('should update a folder name when valid ID is sent', function(){
      this.timeout(6000);

      const update = {'name': 'PROBABlY NoT a ReAl NamE'};
      let grabbedItem;

      return Folder.findOne()
        .then(function(item){
          grabbedItem = item;
          return chai.request(app).put('/api/folders/' + item.id).send(update);
        })
        .then(function(apiResponse){
          expect(apiResponse).to.be.json;
          expect(apiResponse).to.have.status(200);
          expect(apiResponse.body).to.include.keys(['name', 'createdAt', 'id', 'updatedAt']);
          expect(apiResponse.body.name).to.equal('PROBABlY NoT a ReAl NamE');
          expect(apiResponse.body.id).to.equal(grabbedItem.id);
          return Folder.findById(grabbedItem.id);
        })
        .then(function(dbResponse){
          expect(dbResponse.name).to.equal('PROBABlY NoT a ReAl NamE');
          expect(dbResponse.updatedAt).to.not.eql(grabbedItem.updatedAt);
        });
    });

    it('should return 400 if invalid ID is sent in request parameters', function(){
      this.timeout(6000);

      return chai.request(app).put('/api/folders/INVALID-ID').send({'name': 'PROBABlY NoT a ReAl NamE'})
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('ID is not a valid id');
        });
    });

    it('should return 404 status is ID is valid but not found in database', function(){
      this.timeout(6000);

      return chai.request(app).put('/api/folders/0000000000000000000000ee').send({'name': 'PROBABlY NoT a ReAl NamE'})
        .then(function(response){
          expect(response).to.have.status(404);
          expect(response.body.message).to.equal('Not Found');
        });
    });

    it('should return 400 if title is empty or null', function(){
      this.timeout(6000);

      const emptyName = {'name':''};
      const noName = {'name': null};

      let grabbedId;

      return Folder.findOne()
        .then(function(item){
          grabbedId = item.id;
          return chai.request(app).put('/api/folders/' + grabbedId).send(emptyName);
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Must provide a valid `name`');
          return chai.request(app).put('/api/folders/' + grabbedId).send(noName);
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Must provide a valid `name`');
        });
    });
  });





  describe('DELETE requests to endpoint /api/folders/:id', function(){
    it('should delete a folder when valid ID is sent as request parameter', function(){
      this.timeout(6000);

      let preCount;
      let grabbedItem;
      return Promise.all([
        Folder.findOne(),
        Folder.count()
      ])
        .then( function([folderItem, count]) {
          grabbedItem = folderItem;
          preCount = count;
          return chai.request(app).del('/api/folders/' + folderItem.id);
        })
        .then( function(apiResponse){
          expect(apiResponse).to.have.status(204);
          return Folder.count();
        })
        .then( function(count){
          expect(count).to.equal(preCount - 1);
        });
    });

    it('should return 400 if ID is not valid mongo ID format', function(){
      return chai.request(app).del('/api/folders/badId')
        .then( function(apiResonse){
          expect(apiResonse).to.have.status(400);
          expect(apiResonse.body.message).to.equal('ID is not a valid format');
        });
    });

    it('should return 404 if ID is valid but not found', function(){
      return chai.request(app).del('/api/folders/0000000000000000000000ee')
      /* if this test ever fails, double-check seed data to make sure this ID is
      not actually in the data */

        .then( function(apiResponse){
          expect(apiResponse).to.have.status(404);
        });
    });
  });


});