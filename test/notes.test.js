'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGO_URI } = require('../config');
const Note = require('../models/notes');
const Folder = require('../models/folders');
const Tag = require('../models/tags');
const seedNoteData = require('../db/seed/notes');
const seedFolderData = require('../db/seed/folders');
const seedTagData = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);


describe('Testing /api/notes endpoints', function() {

  before( function() {
    return mongoose.connect(TEST_MONGO_URI, {connectTimeoutMS: 4000})
      .then( function() {
        return mongoose.connection.db.dropDatabase();
      });
  });

  beforeEach( function() {
    this.timeout(8000);
    return Promise.all([
      Note.insertMany(seedNoteData),
      Folder.insertMany(seedFolderData),
      Tag.insertMany(seedTagData)
    ])
      .then( function(){
        return Folder.createIndexes();
      })
      .then( function(){
      //  return Tag.createIndexes();
      });
  });

  afterEach( function() {
    this.timeout(5000);
    return mongoose.connection.db.dropDatabase();
  });

  after( function(){
    return mongoose.disconnect();
  });




  describe('GET request handler', function(){
    it('should return an array of notes when GET request to api/notes', function(){
      let apiResult;
      return chai.request(app)
        .get('/api/notes')
        .then( function(response) {
          apiResult = response.body;
          expect(response.body).to.be.a('array');
          expect(response.body).to.have.length.at.least(1);
          expect(response).to.be.json;
          expect(response).to.have.status(200);
          response.body.forEach( note => {
            expect(note).to.include.keys(['id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId']);
            expect(note).to.be.a('object');
          });
          return Note.find();
        }).then( function(dbResult) {
          expect(apiResult.length).to.equal(dbResult.length);
        });

    });

    it('should return a single object when GET request to api/notes/:id', function(){
      this.timeout(6000);

      let grabbedItem;
      return chai.request(app).get('/api/notes')
        .then(result => {
          grabbedItem = result.body[0];
          return chai.request(app).get(`/api/notes/${grabbedItem.id}`);       
        })
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('object');
          expect(response.body).to.include.keys(['id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId']);
          expect(response).to.be.json;
          expect(response.body.id).to.equal(grabbedItem.id);
          expect(response.body.title).to.equal(grabbedItem.title);
          expect(response.body.content).to.equal(grabbedItem.content);
          expect(response.body.createdAt).to.eql(grabbedItem.createdAt);
          expect(response.body.updatedAt).to.eql(grabbedItem.updatedAt);
          expect(response.body.folderId).to.equal(grabbedItem.folderId);
          return Note.findById(grabbedItem.id);
        })
        .then( dbResponse => {
          expect(dbResponse.id).to.equal(grabbedItem.id);
          expect(dbResponse.title).to.equal(grabbedItem.title);
          expect(dbResponse.content).to.equal(grabbedItem.content);
          expect(dbResponse.createdAt).to.eql(new Date (grabbedItem.createdAt));
          expect(dbResponse.updatedAt).to.eql(new Date (grabbedItem.updatedAt));
          expect(dbResponse.folderId.toString()).to.equal(grabbedItem.folderId); //Database folderId comes back as Object
        });
    });

    it('should return correct error if :id is not valid', function(){
      return chai.request(app)
        .get('/api/notes/PROBABLY-NOT-A-REAL-ID-OF-A-NOTE')
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

  });




  describe('POST request handlers', function() {
    it('should return a new object with Mongoose generated ID', function(){
      const dummyNote = {
        title: 'Dummiest of Notes',
        content: 'Dum and Dummer is the best movie ever',
        folderId: '111111111111111111111101',
        tags:['222222222222222222222200']
      };

      let apiResponse;
      return chai.request(app).post('/api/notes').send(dummyNote)
        .then(response => {
          apiResponse = response.body;
          expect(response).to.be.json;
          expect(response).to.have.status(201);
          expect(response).to.have.header('location');
          expect(response.body).to.be.a('object');
          expect(response.body.title).to.equal(dummyNote.title);
          expect(response.body.content).to.equal(dummyNote.content);
          expect(response.body.folderId).to.equal(dummyNote.folderId);
          expect(response.body).to.include.keys(['id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId']);
          return Note.findById(response.body.id);
        })
        .then( dbResponse => {
          expect(dbResponse.title).to.equal(dummyNote.title);
          expect(dbResponse.content).to.equal(dummyNote.content);
          expect(dbResponse.folderId.toString()).to.equal(dummyNote.folderId);
          expect(dbResponse.id).to.equal(apiResponse.id);
          expect(dbResponse.createdAt).to.eql(new Date(apiResponse.createdAt));
          expect(dbResponse.updatedAt).to.deep.equal(new Date(apiResponse.updatedAt));
        });
    });

    it('should return correct error if title is not provided in request body', function(){
      const badData = {
        content: 'This note is missing a title'
      };

      return chai.request(app).post('/api/notes').send(badData)
        .then(apiResponse => {
          expect(apiResponse).to.have.status(400);
          expect(apiResponse.body.message).to.equal('Must include `title` in request body');
        });
    });
  });




  describe('PUT request handlers', function(){
    it('should update title and content when passed in requeset body', function() {
      const dummyUpdate = {
        title: 'Mmmmmmmmmmm...mocha....',
        content: 'Mmmmmmmm...chai tea.....',
        folderId: '111111111111111111111102',
        tags: []
      };
      let apiResponse;
      let grabbedItem;

      return Note.findOne().then(res => {
        grabbedItem = res;
        return chai.request(app).put('/api/notes/' + grabbedItem.id).send(dummyUpdate);
      })
        .then(response => {
          apiResponse = response.body;
          expect(response).to.be.json;
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('object');
          expect(response.body).to.include.keys(['id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId']);
          expect(response.body.title).to.equal(dummyUpdate.title);
          expect(response.body.content).to.equal(dummyUpdate.content);
          expect(response.body.folderId).to.equal(dummyUpdate.folderId);
          return Note.findById(response.body.id);
        })
        .then(dbItem => {
          expect(dbItem.title).to.equal(dummyUpdate.title);
          expect(dbItem.content).to.equal(dummyUpdate.content);
          expect(dbItem.folderId.toString()).to.equal(dummyUpdate.folderId);
          expect(apiResponse.title).to.equal(dbItem.title);
          expect(apiResponse.content).to.equal(dbItem.content);
          expect(apiResponse.folderId).to.equal(dbItem.folderId.toString());
          expect(apiResponse.id).to.equal(dbItem.id);
          expect(new Date(apiResponse.createdAt)).to.deep.equal(new Date(dbItem.createdAt));
          expect(new Date(apiResponse.updatedAt)).to.deep.equal(new Date(dbItem.updatedAt));
        });
    });

    it('should return correct error if :id is not valid', function(){
      return chai.request(app)
        .put('/api/notes/PROBABLY-NOT-A-REAL-ID-OF-A-NOTE')
        .send({title: 'fake title', content:'fake content'})
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('should return correct error message if title is not provided', function(){
      const updateObj = {
        title: '', 
        content:'title is empty string',
        folderId: '000011110000111100001111',
        tags: []
      };

      let testId;
      return Note.findOne().then(res => {
        testId = res.id;
        return chai.request(app).put('/api/notes/' + testId).send(updateObj);
      })
        .then(response => {
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Must provide `title` in request body');
        });

    });
  });




  describe('DELETE request handlers', function(){
    it('should delete a note when provided valid :id in request parameters', function(){
      let preCount;
      let grabbedItem;

      return  Note.count()
        .then( count => {
          preCount = count;
          return Note.findOne();
        })
        .then(dbItem => {
          grabbedItem = dbItem;
          return chai.request(app).del('/api/notes/' + dbItem.id);
        })
        .then(response => {
          expect(response).to.have.status(204);
          return Note.count();
        })
        .then(count => {
          expect(count).to.equal(preCount - 1);
          return Note.findById(grabbedItem.id);
        })
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });
});