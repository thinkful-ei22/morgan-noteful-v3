'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGO_URI } = require('../config');
const Note = require('../models/notes');
const seedData = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);


describe('Testing /api/notes endpoints', function() {

  before( function() {
    return mongoose.connect(TEST_MONGO_URI)
      .then( () => mongoose.connection.db.dropDatabase());
  });

  beforeEach( function() {
    return Note.insertMany(seedData);
  });

  afterEach( function() {
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
            expect(note).to.have.keys(['id', 'title', 'content', 'createdAt', 'updatedAt']);
            expect(note).to.be.a('object');
          });
          return Note.find();
        }).then( function(dbResult) {
          expect(apiResult.length).to.equal(dbResult.length);
        });

    });

    it('should return a single object when GET request to api/notes/:id', function(){
      let grabbedItem;
      return chai.request(app)
        .get('/api/notes')
        .then(result => {
          grabbedItem = result.body[0];
          return chai.request(app).get(`/api/notes/${grabbedItem.id}`);       
        })
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body).to.be.a('object');
          expect(response.body).to.have.keys(['id', 'title', 'content', 'createdAt', 'updatedAt']);
          expect(response).to.be.json;
          expect(response.body.id).to.equal(grabbedItem.id);
          expect(response.body.title).to.equal(grabbedItem.title);
          expect(response.body.content).to.equal(grabbedItem.content);
          expect(response.body.createdAt).to.equal(grabbedItem.createdAt);
          expect(response.body.updatedAt).to.equal(grabbedItem.updatedAt);
        });
    });

    it('should return correct error if :id is not found in database', function(){
      return chai.request(app)
        .get('/api/notes/PROBABLY-NOT-A-REAL-ID-OF-A-NOTE')
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

  });
});