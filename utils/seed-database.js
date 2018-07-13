'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/notes');
const Folder = require('../models/folders');
const Tag = require('../models/tags');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

mongoose.connect(MONGODB_URI)
  .then( () => mongoose.connection.db.dropDatabase() )
  .then( () => Folder.insertMany(seedFolders))
  .then((result) => {
    console.info(`Inserted ${result.length} Folders`);
    return Folder.createIndexes();
  })
  .then( () => Tag.insertMany(seedTags))
  .then((result) => {
    console.info(`Inserted ${result.length} Tags`);
    return Tag.createIndexes();
  })  .then( () => Note.insertMany(seedNotes))
  .then( results => {
    console.info(`Inserted ${results.length} Notes`);
  })
  .then( () => mongoose.disconnect() )
  .catch( err => console.error(err) );