const fs = require('fs');

const COMPONENT_DIRECTORY_NAME = 'Components';

const TYPES = {};
let counter = 0;
const classes = {};
const buildableBPs = {};
const dir = `${__dirname}/${COMPONENT_DIRECTORY_NAME}/`;
const filenames = fs.readdirSync(dir);

// This is necessary to circumvent the AirBnB ESLint plugin.
// I wouldn't normally do this, but their style guide is
// really dumb, so suck it.
const req = require;

const decapitalize = str => str.charAt(0).toLowerCase() + str.slice(1);

filenames.forEach((filename) => {
  const className = /(.+).js$/.exec(filename)[1];
  const splitClassName = className.split(/(?=[A-Z])/).join('_');
  TYPES[splitClassName.toUpperCase()] = counter++;
  classes[className] = req(`./${COMPONENT_DIRECTORY_NAME}/${filename}`);
  if (classes[className].isBuildable) {
    buildableBPs[decapitalize(className)] = classes[className].getBP();
  }
});

module.exports = { TYPES, classes, buildableBPs };
