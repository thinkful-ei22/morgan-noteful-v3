'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {type: String, required: true},
  content: String,
  createdAt: { type: Date, default: Date.now},
  updatedAt: Date
});

noteSchema.set('toObject', {
  virtuals: true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

noteSchema.set('timestamps', true); //mongoose built-in Date functionality

module.exports = mongoose.model('Note', noteSchema); //automatically creates "notes" collection