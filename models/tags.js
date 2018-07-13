'use strict';

const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  'name': {type: String, required: true, unique: true}
});

tagSchema.set('timestamps', true);

tagSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Tag', tagSchema);