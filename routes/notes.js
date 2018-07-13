'use strict';

const express = require('express');
const Note = require('../models/notes');
const mongoose = require('mongoose');

const router = express.Router();




/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId } = req.query;

  let filter= {};

  if(searchTerm) {
    filter.title = {$regex: searchTerm};
  }

  if(folderId){
    filter.folderId = folderId;
  }

  return Note.find(filter).sort({updatedAt: 'desc'})
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

  return Note.findById(id)
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
  
  if(!req.body.title) {
    const err = new Error('Must include `title` in request body');
    err.status = 400;
    return next(err);
  }

  if(!req.body.folderId){
    newItem.folderId = null;
  }

  if(!req.body.content){
    newItem.content = null;
  }

  if(req.body.folderId){
    if (!mongoose.Types.ObjectId.isValid(req.body.folderId)) {
      const err = new Error('The `folderId` is not valid');
      err.status = 400;
      return next(err);
    }
  }
  
  ['title', 'content', 'folderId'].forEach( field => {
    if(field in req.body){
      newItem[field] = req.body[field];
    }
  });

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