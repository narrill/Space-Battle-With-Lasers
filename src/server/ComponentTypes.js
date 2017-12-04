const fs = require('fs');

const COMPONENT_DIRECTORY_NAME = "Components";

const TYPES = {};
let counter = 0;
const classes = {};
const dir = `${__dirname}\\${COMPONENT_DIRECTORY_NAME}\\`;
const filenames = fs.readdirSync(dir);

filenames.forEach((filename) => {
  const className = /(.+).js$/.exec(filename)[1];
  const splitClassName = className.split(/(?=[A-Z])/).join("_");
  TYPES[splitClassName.toUpperCase()] = counter++;
  classes[className] = require(`./${COMPONENT_DIRECTORY_NAME}/${filename}`);
});

module.exports = { TYPES, classes };