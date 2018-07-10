'use strict';

const mongoose = require('mongoose');
const MONGODB_URI = require('../config').MONGODB_URI;
const Note = require('../models/notes');




//find (optionally by search term)
// mongoose.connect(MONGODB_URI)
//   .then( () => {
//     const searchTerm = '';
//     let filter = {};

//     if(searchTerm) {
//       filter.title = {$regex: searchTerm};
//     }

//     return Note.find(filter).sort({updatedAt: 'desc'});
//   })
//   .then(results => console.log(results))
//   .then(() => mongoose.disconnect())
//   .catch(err => {
//     console.error(`Error: ${err.message}`);
//     console.error(err);
//   });





//Find note by ID using Note.findById
// mongoose.connect(MONGODB_URI)
//   .then( () => {
//     //const id = req.params.id;
//     const id = '000000000000000000000005';

//     return Note.findById(id);
//   })
//   .then(result => {
//     console.log(result);
//   })
//   .then(() => mongoose.disconnect())
//   .catch(err => console.log(err.message));
  






//create new note using Note.create
// mongoose.connect(MONGODB_URI)
//   .then( () => {
//     const dummyItem = {
//       title: 'This is a new Title',
//       content: 'Blahhhhhhh'
//     };

//     //pull from req.body
//     let newItem = {};
//     newItem = dummyItem;

//     if (!newItem.title) {
//       return console.error('Must provide title');
//     }

//     return Note.create(newItem);
//   })
//   .then(result => {
//     console.log(result);
//   })
//   .then( () => mongoose.disconnect())
//   .catch(err => console.log(err.message));






//Update a note by id using Note.findByIdAndUpdate
// mongoose.connect(MONGODB_URI)
//   .then( () => {
//     //pull id from params
//     const id = '000000000000000000000007';
//     const dummyUpdate = {
//       title: 'Ugh',
//       content: 'UUUGGGGHHHHH'
//     };

//     //verify that ID in params matches ID in req.body

//     //checks to see what fields are being updated
//     let updateInfo = {};
//     const possibleUpdates = ['title', 'content'];
//     possibleUpdates.forEach( field => {
//       if(field in dummyUpdate) {
//         updateInfo[field] = dummyUpdate[field];
//       }
//     });

//     return Note.findByIdAndUpdate(id,
//       {$set: updateInfo}, 
//       {multi: false, upsert: false, new: true});
//   })
//   .then(result => {
//     console.log(result);
//   })
//   .then(() => mongoose.disconnect())
//   .catch(err => console.log(err.message));





//Delete a note by id using Note.findByIdAndRemove
// mongoose.connect(MONGODB_URI)
//   .then( () => {
//     //pull id from req.params
//     const id = '000000000000000000000006';

//     return Note.findByIdAndRemove(id);
//   })
//   .then(result => {
//     //sends back the entire document
//     if(result) {
//       console.log('successfully deleted id: ' + result._id);
//     } else {
//       console.log('could not find id');
//     }
//   })
//   .then(() => mongoose.disconnect())
//   .catch(err => console.log(err.message));
  