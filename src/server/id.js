let idCounter = 0;
const idDictionary = {};

const takeIdTag = () => {
  while (idDictionary[idCounter] === true) {
    idCounter++;
    if (idCounter > 65535) { 
      idCounter = 0;
    }
  }
  idDictionary[idCounter] = true;
  return idCounter;
};

const returnIdTag = (id) => {
  idDictionary[id] = false;
};

module.exports = {
  takeIdTag,
  returnIdTag,
};
