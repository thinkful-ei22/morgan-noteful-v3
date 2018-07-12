'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/notes');
const Folder = require('../models/folders');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

mongoose.connect(MONGODB_URI)
  .then( () => mongoose.connection.db.dropDatabase() )
  .then( () => Note.insertMany(seedNotes))
  .then( () => Folder.insertMany(seedFolders))
  .then( results => {
    console.info(`Inserted ${results.length} Notes`);
  })
  .then( () => mongoose.disconnect() )
  .catch( err => console.error(err) );