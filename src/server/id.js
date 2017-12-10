const has = Object.prototype.hasOwnProperty;

let idCounter = 0;
const idDictionary = {};

const takeIdTag = () => {
  while (has.call(idDictionary, idCounter)) {
    idCounter++;
    if (idCounter > 65535) { idCounter = 0; }
  }
  idDictionary[idCounter] = true;
  return idCounter;
};

const returnIdTag = (id) => {
  delete idDictionary[id];
};

module.exports = {
  takeIdTag,
  returnIdTag,
};
