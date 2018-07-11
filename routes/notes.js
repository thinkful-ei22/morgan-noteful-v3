'use strict';

const express = require('express');
const Note = require('../models/notes');

const router = express.Router();




/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  let filter = {};

  if(searchTerm) {
    filter.title = {$regex: searchTerm};
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

  return Note.findById(id)
    .then( result => {
      if(result) {
        res.json(result);
      } else{
        next();
      }
    })
    .catch(err => next(err));
});






/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  let newItem = {};
  
  if(!req.body.title) {
    const err = new Error('Must include `title` in request body');
    err.status = 404;
    return next(err);
  }
  
  ['title', 'content'].forEach( field => {
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
  const id = req.params.id;

  let updateInfo = {};

  const possibleUpdates = ['title', 'content'];
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

  return Note.findByIdAndUpdate(id,
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