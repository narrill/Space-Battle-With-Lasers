const utilities = require('../utilities.js');
const keys = require('../keys.js');
const enums = require('../enums.js');
const NetworkWorldInfo = require('../NetworkWorldInfo.js');
const Serializer = require('../Serializer.js');
// require('../SerializerTest.js');

const myKeys = keys.myKeys;
const myMouse = keys.myMouse;

const has = Object.prototype.hasOwnProperty;

class RemoteInput {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.keyboard = [];
    this.mouse = [];
    this.mouseDirection = 0;
    this.lastSend = 0;
    this.sendInterval = 66.6666;
    this.nonInterp = {};
    this.sentInitial = false;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update() {
    const owner = this.owner;
    const stab = owner.stabilizer;
    if (this.keyboard[myKeys.KEYBOARD.KEY_TAB]
      && !this.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      stab.enabled = !stab.enabled;
      this.keyboard[myKeys.KEYBOARD.KEY_TAB] = false;
    }

    if (this.keyboard[myKeys.KEYBOARD.KEY_C]) {
      stab.clamps.enabled = !stab.clamps.enabled;
      this.keyboard[myKeys.KEYBOARD.KEY_C] = false;
    }

    // set this thruster values
    const ts = owner.thrusterSystem;
    // medial motion
    if (this.keyboard[myKeys.KEYBOARD.KEY_W]) {
      owner.objMedialThrusters(ts.medial.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_S]) {
      owner.objMedialThrusters(-ts.medial.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objMedialStabilizers(); }

    // lateral motion
    if (this.keyboard[myKeys.KEYBOARD.KEY_A]) {
      owner.objLateralThrusters(ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_D]) {
      owner.objLateralThrusters(-ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objLateralStabilizers(); }

    // rotational motion - mouse    
    // console.log(-this.remoteInput.mouseDirection); 
    const mouseDirection = this.mouseDirection;
    const mouseSensitivity = 250;
    owner.objRotationalThrusters(
      (((-mouseDirection) / mouseSensitivity) * ts.rotational.maxStrength) / stab.thrustRatio,
    );
    if (this.keyboard[myKeys.KEYBOARD.KEY_LEFT]) {
      owner.objRotationalThrusters(ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_RIGHT]) {
      owner.objRotationalThrusters(-ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objRotationalStabilizers(); }

    // weapons
    if (this.mouse[myMouse.BUTTONS.LEFT]
      || this.keyboard[myKeys.KEYBOARD.KEY_SPACE]) {
      if (has.call(owner, 'laser')) {
        owner.objFireLaser();
      } else if (has.call(owner, 'cannon')) {
        owner.objFireCannon();
      } else if (has.call(owner, 'launcher')) {
        owner.objFireLauncher();
      }
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_E]) {
      owner.objFireTargetingSystem();
    }

    // power system
    if (this.keyboard[myKeys.KEYBOARD.KEY_SHIFT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.THRUSTERS] = 1;
    }
    if (this.mouse[myMouse.BUTTONS.RIGHT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.LASERS] = 1;
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.SHIELDS] = 1;
    }

    const sinceLastSend = owner.game.elapsedGameTime - this.lastSend;
    if (this.remoteSend && sinceLastSend >= this.sendInterval) {
      this.lastSend += this.sendInterval;
      owner.game.queueFunction(this.sendData.bind(this));
    }
  }

  messageHandler(data) {
    if (data.disconnect && this.remoteSend) { delete this.remoteSend; }
    if (data.keyCode) { this.keyboard[data.keyCode] = data.pos; }
    if (data.mb || data.mb === 0) { this.mouse[data.mb] = data.pos; }
    if (data.md || data.md === 0) {
      this.mouseDirection = data.md;
    }
  }

  destroy() {
    this.remoteSend(null, 'destroyed');
  }

  sendData() {
    // Helpers
    const populateWICategory = (fi, type) => {
      const fiCollection = fi[type];
      const wiCollection = [];
      if (fiCollection.length) {
        for (let c = 0; c < fiCollection.length; c++) {
          wiCollection.push(fiCollection[c].networkRepresentation);
        }
      }
      return wiCollection;
    };

    const populateNonInterpWICategory = (fi, type) => {
      const fiCollection = fi[type];
      const wiCollection = [];
      const wiDestroyedCollection = [];
      const newItemsById = {};
      for (let c = 0; c < fiCollection.length; c++) {
        const item = fiCollection[c];
        newItemsById[item.id] = item;
      }
      const previousItemsById = this.nonInterp[type] || {};
      const newKeys = Object.keys(newItemsById);
      for (let c = 0; c < newKeys.length; c++) {
        const aid = newKeys[c];
        if (!previousItemsById[aid]) {
          const item = newItemsById[aid];
          wiCollection.push(item.networkRepresentation);
        }
      }
      const prevKeys = Object.keys(previousItemsById);
      for (let c = 0; c < prevKeys.length; c++) {
        const itemId = Number(prevKeys[c]);
        if (!newItemsById[itemId]) {
          wiDestroyedCollection.push(itemId);
        }
      }
      this.nonInterp[type] = newItemsById;
      return { created: wiCollection, destroyed: wiDestroyedCollection };
    };

    const owner = this.owner;

    if (!this.sentInitial) {
      this.remoteSend({
        interval: this.sendInterval,
        asteroidColors: owner.game.asteroids.colors,
      }, 'worldInfoInit');
      this.sentInitial = true;
    }

    const fetchInfo = owner.game.spatialHash.boundedFetch([owner.x, owner.y], 15000);

    const worldInfo = new NetworkWorldInfo({
      objs: populateWICategory(fetchInfo, 'obj'),
      asteroids: populateNonInterpWICategory(fetchInfo, 'asteroid'),
      prjs: populateNonInterpWICategory(fetchInfo, 'prj'),
      hitscans: populateWICategory(fetchInfo, 'hitscan'),
      radials: populateWICategory(fetchInfo, 'radial'),
      playerInfo: owner.networkPlayerRepresentation,
    });

    const serializer = new Serializer();
    serializer.push(NetworkWorldInfo, worldInfo);
    const buf = serializer.write();

    this.remoteSend(buf);
  }
}

module.exports = RemoteInput;
