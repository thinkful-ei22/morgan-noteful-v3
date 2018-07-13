'use strict';

const express = require('express');
const Note = require('../models/notes');
const mongoose = require('mongoose');

const router = express.Router();




/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  let filter= {};

  if(searchTerm) {
    filter.title = {$regex: searchTerm};
  }

  if(folderId){
    filter.folderId = folderId;
  }

  if(tagId){
    filter.tags = tagId;
  }

  return Note.find(filter).populate('tags').sort({updatedAt: 'desc'})
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error(`Error: ${err.message}`);
      next(err);
    });
});






/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  return Note.findById(id).populate('tags')
    .then( result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      console.error(err.message);
      next(err);
    });
});






/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  let newItem = {};

  //grabs info from request body, stores in newItem
  ['title', 'content', 'folderId', 'tags'].forEach( field => {
    newItem[field] = req.body[field];
  });

  //validates folderId (if it has one)
  if(newItem.folderId && !mongoose.Types.ObjectId.isValid(newItem.folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  //validates that there is a title
  if(!newItem.title) {
    const err = new Error('Must include `title` in request body');
    err.status = 400;
    return next(err);
  }

  //If there are tagID's in the tags array, validates that each one is valid
  if(newItem.tags.length !== 0) {
    if(newItem.tags.find( tagId => {
      return !mongoose.Types.ObjectId.isValid(tagId);
    })){
      const err = new Error('The `tagId`s are not all valid');
      err.status = 400;
      return next(err);
    }
  }

  if(!newItem.folderId){
    newItem.folderId = null;
  }

  if(!newItem.content){
    newItem.content = null;
  }

  return Note.create(newItem)
    .then(response => {
      res.location(`${req.originalUrl}${response.id}`).status(201).json(response);
    })
    .catch(err => next(err));
});







/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (req.body.folderId){
    if (!mongoose.Types.ObjectId.isValid(req.body.folderId)) {
      const err = new Error('The `folderId` is not valid');
      err.status = 400;
      return next(err);
    }
  }

  let updateInfo = {};

  const possibleUpdates = ['title', 'content', 'folderId'];
  possibleUpdates.forEach( field => {
    if(field in req.body) {
      updateInfo[field] = req.body[field];
    }
  });
  
  if(updateInfo.title === '') {
    const err = new Error('Must provide `title` in request body');
    err.status = 400;
    return next(err);
  }
  // Sends error 500 if folderId is an empty string. Look into this later
  return Note.findByIdAndUpdate(noteId,
    {$set: updateInfo}, 
    {multi: false, upsert: false, new: true})
    .then( result => {
      res.json(result);
    })
    .catch(err => next(err));
});






/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndRemove(id)
    .then(result => {
      if(result){
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
});




module.exports = router;