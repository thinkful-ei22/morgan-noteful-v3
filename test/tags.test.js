'use strict';

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');

const seedNoteData = require('../db/seed/notes');
const seedFolderData = require('../db/seed/folders');
const seedTagData = require('../db/seed/tags');
const { TEST_MONGO_URI } = require('../config');

const Tag = require('../models/tags');
const Note = require('../models/notes');
const Folder = require('../models/folders');

const app = require('../server');

const expect = chai.expect;
chai.use(chaiHttp);


describe('TAGS /api/tags endpoints', function(){

  before(function(){
    this.timeout(6000);
    return mongoose.connect(TEST_MONGO_URI)
      .then(function(){
        return mongoose.connection.db.dropDatabase();
      });
  });



  beforeEach(  function() {
    this.timeout(30000);
    return Promise.all([
      Folder.insertMany(seedFolderData),
      Tag.insertMany(seedTagData),
      Note.insertMany(seedNoteData)
    ])
      .then(function(){
        return Folder.createIndexes();
      })
      .then(function(){
        return Tag.createIndexes();
      });
  });



  afterEach(function(){
    this.timeout(6000);
    return mongoose.connection.db.dropDatabase();
  });



  after(function(){
    return mongoose.disconnect();
  });



  describe('GET to /api/tags', function(){
    it('should return an array of tags', function(){
      
      let apiResponse;

      return chai.request(app).get('/api/tags')
        .then(function(res){
          apiResponse = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length.at.least(1);
          res.body.forEach(function(tagObj){
            expect(tagObj).to.include.keys(['name', 'id']);
          });
          return Tag.find();
        })
        .then(function(dbResponse){
          expect(dbResponse.length).to.equal(apiResponse.length);
          dbResponse.forEach(function(tagObj){
            expect(tagObj.toObject()).to.include.keys(['name', 'id']);
          });
        });
    });
  });



  describe('GET by ID to api/note/:id', function(){
    it('should return an object when correct ID is provided', function(){
      let grabbedItem;

      return Tag.findOne()
        .then(function(response){
          grabbedItem = response;
          return chai.request(app).get('/api/tags/' + grabbedItem.id);
        })
        .then(function(apiResponse){
          expect(apiResponse.body).to.be.a('object');
          expect(apiResponse).to.have.status(200);
          expect(apiResponse.body).to.have.keys(['name', 'id', 'createdAt', 'updatedAt']);
          expect(apiResponse.body.name).to.equal(grabbedItem.name);
          expect(apiResponse.body.id).to.equal(grabbedItem.id);
          expect(new Date (apiResponse.body.createdAt)).to.eql(grabbedItem.createdAt);
          expect(new Date (apiResponse.body.updatedAt)).to.eql(grabbedItem.updatedAt);
        });
    });

    it('should return a 400 if ID is not valid', function(){
      return chai.request(app).get('/api/tags/BAD-ID')
        .then(function(response) {
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Must provide valid mongo ID');
        });
    });

    it('should return a 404 if ID is valid but not in Database', function(){
      return chai.request(app).get('/api/tags/22220000222200002222eeee')
        .then(function(response) {
          expect(response).to.have.status(404);
          expect(response.body.message).to.equal('Not Found');
        });
    });
  });


  describe('POST request to /api/tags', function(){
    it('should create and return an item if name is valid', function(){
      const newTag = {name:'Tom Riddle'};

      let apiResponse;
      return chai.request(app).post('/api/tags').send(newTag)
        .then(function(res){
          apiResponse = res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res.body).to.include.keys(['name', 'id', 'createdAt', 'updatedAt']);
          expect(res.body).to.be.a('object');
          expect(res).to.be.json;
          return Tag.findById(res.body.id);
        })
        .then(function(dbResponse){
          expect(dbResponse.toObject()).to.have.keys(['name', 'id', 'createdAt', 'updatedAt']);
          expect(dbResponse.name).to.equal(apiResponse.body.name);
          expect(dbResponse.id).to.equal(apiResponse.body.id);
          expect(new Date (apiResponse.body.createdAt)).to.eql(dbResponse.createdAt);
          expect(new Date (apiResponse.body.updatedAt)).to.eql(dbResponse.updatedAt);
        });
    });

    it('should return 400 if the name is not valid', function(){
      const emptyTitle = {name: ''};
      const nullTitle = {name: null};

      return chai.request(app).post('/api/tags').send(emptyTitle)
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Tag must have a `name`');
          return chai.request(app).post('/api/tags').send(nullTitle);
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Tag must have a `name`');
        });
    });

    it('should return appropriate error if tag name already exists', function(){
      return Tag.findOne()
        .then(function(tag){
          return chai.request(app).post('/api/tags').send({'name': tag.name});
        })
        .then(function(response){
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('The tag name already exists');
        });
    });
  });



  describe('PUT requests to /api/tag/:id', function(){
    it('should return updated tag when valid ID is provided', function(){
      const update = {'name': 'UPdAtEd NaMe'};

      let grabbedItem;
      let apiResponse;

      return Tag.findOne()
        .then(function(tag){
          grabbedItem = tag;
          return chai.request(app).put('/api/tags/' + grabbedItem.id).send(update);
        })
        .then(function(res){
          apiResponse = res;
          expect(apiResponse).to.have.status(200);
          expect(apiResponse).to.be.json;
          expect(apiResponse.body).to.be.a('object');
          expect(apiResponse.body).to.include.keys(['name', 'id', 'createdAt', 'updatedAt']);
          expect(apiResponse.body.name).to.equal(update.name);
          expect(apiResponse.body.id).to.equal(grabbedItem.id);
          expect(new Date (apiResponse.body.createdAt)).to.eql(grabbedItem.createdAt);
          expect(new Date (apiResponse.body.updatedAt)).to.not.eql(grabbedItem.updatedAt);
          return Tag.findById(res.body.id);
        })
        .then(function(dbResponse){
          expect(dbResponse.name).to.equal(update.name);
          expect(dbResponse.id).to.equal(grabbedItem.id);
          expect(dbResponse.createdAt).to.eql(grabbedItem.createdAt);
          expect(dbResponse.updatedAt).to.not.eql(grabbedItem.updatedAt);
        });
    });
  });

});