'use strict';

const mongoose = require('mongoose');
const express = require('express');
const Tag = require('../models/tags');
const Note = require('../models/notes');

const router = express.Router();


/* ----------- GET all tags -------------- */
router.get('/', (req, res, next) => {
  return Tag.find().sort({name: 'asc'})
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
});



/* ----------- GET tag by :ID -------------- */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Must provide valid mongo ID');
    err.status = 400;
    return next(err);
  }

  return Tag.findById(id)
    .then(result => {
      if(result){
        return res.json(result);
      } else {
        return next();
      }
    })
    .catch(err => next(err));
});




/* ----------- POST new tag -------------- */
router.post('/', (req, res, next) => {

  if(!req.body.name) {
    const err = new Error('Tag must have a `name`');
    err.status = 400;
    next(err);
  }

  return Tag.create({'name': req.body.name})
    .then(newTag => {
      res.location(`${req.originalUrl}/${newTag.id}`).status(201).json(newTag);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });

});



/* ----------- PUT/update tag by :ID -------------- */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Must provide valid mongo ID');
    err.status = 400;
    return next(err);
  }

  if(!req.body.name) {
    const err = new Error('Tag must have a `name`');
    err.status = 400;
    next(err);
  }

  return Tag.findByIdAndUpdate(id, {'name': req.body.name}, {new: true})
    .then(updatedTag => {
      if(updatedTag){
        return res.json(updatedTag);
      } else {
        return next();
      }
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});



/* ----------- DELETE tag by :ID -------------- */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Must provide valid mongo ID');
    err.status = 400;
    return next(err);
  }

  return Promise.all([
    Tag.findByIdAndRemove(id),
    Note.updateMany(
      {tags: id}, 
      {$pull: {tags: id}}, 
      {new: true}
    )
  ]).then( ([tagResult, noteResult]) => {
    if(!tagResult){
      return next();
    }
    return res.sendStatus(204);
    //option to return updated Note:
    // console.log('NOTERESULT IS:  ' + noteResult);
    // return res.json(noteResult);
  }).catch(err => next(err));

});




module.exports = router;