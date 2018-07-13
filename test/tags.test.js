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
    return mongoose.connect(TEST_MONGO_URI)
      .then(function(){
        mongoose.connection.db.dropDatabase();
      });
  });



  beforeEach(function(){
    return Promise.all([
      Tag.insertMany(seedTagData),
      Folder.insertMany(seedFolderData),
      Note.insertMany(seedNoteData)
    ])
      .then(function(){
        return Tag.createIndexes();
      })
      .then(function(){
        return Folder.createIndexes();
      });
  });



  afterEach(function(){
    return mongoose.connection.db.dropDatabase();
  });



  after(function(){
    return mongoose.disconnect();
  });



  describe('GET to /api/tags', function(){
    it('should return an array of tags', function(){

    });
  });

});