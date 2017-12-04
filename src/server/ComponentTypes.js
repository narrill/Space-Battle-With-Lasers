const fs = require('fs');

const types = {};
let counter = 0;

fs.readdir(`${__dirname}/Systems`, (err, filenames) => {
  if (err) {
    console.error(err);
    return;
  }
  filenames.forEach((filename) => {
    types[filename.toUpperCase()] = counter++;
  });
});

module.exports = types;