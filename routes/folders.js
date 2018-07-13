'use strict';

const express = require('express');
const Folder = require('../models/folders');
const Note = require('../models/notes');
const mongoose = require('mongoose');

const router = express.Router();


/*--------------- GET all /folders ------------------- */
router.get('/', (req, res, next) => {
  return Folder.find().sort({name: 'asc'})
    .then( result => {
      res.json(result);
    })
    .catch(err => next(err));
});




/*--------------- GET all /folders by :id ------------------- */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  return Folder.findById(id)
    .then(result => {
      if(result){
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});





/*--------------- POST new folder ------------------- */
router.post('/', (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    const err = new Error('Request must include folder `name`');
    err.status = 400;
    next(err);
  }

  return Folder.create({'name': name})
    .then(newFolder => {
      res.location(`${req.originalUrl}/${newFolder.id}`).status(201).json(newFolder);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      return next(err);
    });
});




/*--------------- PUT update folder by :id ------------------- */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const newName = req.body.name;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('ID is not a valid id');
    err.status = 400;
    next(err);
  }

  if(!newName) {
    const err = new Error('Must provide a valid `name`');
    err.status = 400;
    next(err);
  }

  //needs to add a validation up here to validate that ID exists in the database

  return Folder.findByIdAndUpdate(id, {$set: {'name': newName}}, {new: true})
    .then(updatedFolder => {
      if(!updatedFolder){
        return Promise.reject();
      }
      res.json(updatedFolder);
    })
    .catch(function(err) {
      if(!err){
        return next(err);
      }
      if(err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      return next(err);
    });
});



/*--------------- DELETE folder by :id ------------------- */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('ID is not a valid format');
    err.status = 400;
    return next(err);
  }

  return Folder.findByIdAndRemove(id)
    .then( response => {
      if(!response) {
        return Promise.reject();
      } else {
        return Note.deleteMany({'folderId': id});
      }
    })
    .then( () => {
      res.sendStatus(204);
    })
    .catch(err => next(err));
});




module.exports = router;