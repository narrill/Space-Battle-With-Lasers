// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/constructors.js

const dependencyCatch = require('./dependencyCatch.js');
const id = require('./id.js');
const collisions = require('./collisions.js');
const constructors = dependencyCatch(require('./constructors.js'));

const destructors = {
  destroyWarhead(obj) {
    const radial = obj.warhead.radial;
    constructors.createRadial(
      obj.game,
      obj.x,
      obj.y,
      radial.velocity,
      radial.decay,
      radial.color,
      obj,
      collisions[radial.collisionFunction],
      radial.collisionProperties,
    );
  },
  queueRespawn(obj) {
    obj.game.respawnQueue.push({
      time: obj.game.elapsedGameTime + (obj.respawnTime * 1000),
      params: obj.constructionObject,
    });
  },
  destroyRemoteInput(obj) {
    obj.remoteInput.remoteSend(null, 'destroyed');
  },
  returnIdTag(src) {
    if (!src) { return; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      if (key !== 'game' && key !== 'owner' && src[key] instanceof Object && !(src[key] instanceof Array)) {
        destructors.returnIdTag(src[key]);
      } else if (key === 'id') {
        id.returnIdTag(src[key]);
      }
    });
  },

};

module.exports = destructors;
