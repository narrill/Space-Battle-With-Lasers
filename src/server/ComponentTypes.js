const fs = require('fs');

const COMPONENT_DIRECTORY_NAME = 'Components';

const TYPES = {};
let counter = 0;
const classes = {};
const dir = `${__dirname}/${COMPONENT_DIRECTORY_NAME}/`;
const filenames = fs.readdirSync(dir);

// This is necessary to circumvent the AirBnB ESLint plugin.
// I wouldn't normally do this, but their style guide is
// really dumb, so suck it.
const req = require;

filenames.forEach((filename) => {
  const className = /(.+).js$/.exec(filename)[1];
  const splitClassName = className.split(/(?=[A-Z])/).join('_');
  TYPES[splitClassName.toUpperCase()] = counter++;
  classes[className] = req(`./${COMPONENT_DIRECTORY_NAME}/${filename}`);
});

// TO-DO
// update this to provide a collection of "top-level" components for use in the ship builder
// this can be done with a static bool on the component classes

module.exports = { TYPES, classes };
