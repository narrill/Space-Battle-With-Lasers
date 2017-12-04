const fs = require('fs');

const TYPES = {};
let counter = 0;
const classes = {};

fs.readdir(`${__dirname}/Systems`, (err, filenames) => {
  if (err) {
    console.error(err);
    return;
  }
  filenames.forEach((filename) => {
  	const className = /(.+).js$/.exec(filename)[1];
    types[className.toUpperCase()] = counter++;
    classes[className] = require(`./Systems/${filename}`);
  });
});

module.exports = { TYPES, classes };