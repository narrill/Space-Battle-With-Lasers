const Screen = require('./Screen.js');
const ModalEntryScreen = require('./ModalEntryScreen.js');
const ModalConfirmationScreen = require('./ModalConfirmationScreen.js');
const drawing = require('./drawing.js');
const Menu = require('./Menu.js');
const requests = require('./requests.js');

const drawHighlight = (ctx, x, y, text, height) => {
  ctx.save();
  const width = ctx.measureText(text).width;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'blue';
  ctx.fillRect(x, y - height, width, height);
  ctx.restore();
};

class FieldView {
  constructor(component, fieldName) {
    this.component = component;
    this.name = fieldName;
  }

  draw(ctx, x, y, textHeight, lineHeight, highlighted) {
    const text = `${this.name}: ${this.value}`;
    if(highlighted)
      drawHighlight(ctx, x, y, text, textHeight);
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);
    return y + lineHeight;
  }

  get value() {
    return this.component[this.name];
  }

  set value(val) {
    if(typeof val === typeof this.value)
      this.component[this.name] = val;
  }

  select() {
    return (client) => {
      client.enterModal(ModalEntryScreen, (value) => {
        this.value = value;
      });
    }
  }
}

class Navigable {
  constructor(ob, toggleableElements) {
    this.elements = [];
    Object.keys(ob).forEach((key) => {
      if(ob[key] instanceof Object)
        this.elements.push(new ComponentEditor(key, ob[key], toggleableElements));
      else
        this.elements.push(new FieldView(ob, key));
    });
    this.cursor = toggleableElements - 1;
    this.max = this.elements.length;
    this.min = this.cursor;
  }

  _boundCursor(cursor) {
    return (cursor - this.min + this.max - this.min) % (this.max - this.min) + this.min;
  }

  get current() {
    return this.elements[this.cursor];
  }

  get lines() {
    let lines = this.min * -1;
    for(let c = 0; c < this.elements.length; ++c) {
      const l = this.elements[c].lines;
      lines += (l) ? l : 1;
    }
    return lines;
  }

  forward() {
    if(this.current && this.current.canForward)
      this.current.forward();
    else {
      this.cursor = this._boundCursor(this.cursor + 1);
      if(this.current && !this.current.canForward && this.current.toFirst)
        this.current.toFirst();
    }
  }

  backward() {
    if(this.current.canBackward)
      this.current.backward();
    else {
      this.cursor = this._boundCursor(this.cursor - 1);
      if(this.current && this.current.enabled)
        this.current.toLast();
    }
  }
}

class ComponentEditor extends Navigable {
  constructor(name, component, toggleable = true) {
    super(component, false);
    this.enabled = !toggleable;
    this.toggleable = toggleable;
    this.data = component;
    this.name = name;
  }

  draw(ctx, x, y, textHeight, lineHeight, highlighted, indent) {
    if(highlighted && this.onName) {
      drawHighlight(ctx, x, y, this.name, textHeight);
    }
    ctx.globalAlpha = (this.enabled) ? 1 : 0.5;
    ctx.fillText(this.name, x, y);
    x += indent;
    y += lineHeight;

    if(this.enabled || !this.toggleable) {
      for (let i = 0; i < this.elements.length; ++i) {
        y = this.elements[i].draw(ctx, x, y, textHeight, lineHeight, highlighted && this.cursor === i, indent);
      }
    }
    return y;
  }

  get lines() {
    return (this.enabled) ? super.lines : 1;
  }

  get canForward() {
    return this.enabled && (this.cursor !== this.elements.length - 1 || this.current.canForward);
  }

  get canBackward() {
    return this.cursor !== -1;
  };

  get onName() {
    return this.cursor === -1;
  }

  toLast() {
    this.cursor = this.elements.length - 1;
    if(this.current.enabled)
      this.current.toLast();
  }

  toFirst() {
    this.cursor = this.min;
  }

  select() {
    if(this.toggleable && this.onName)
      this.enabled = !this.enabled;
    else if(!this.onName)
      return this.current.select();
  }
}

class ShipEditor extends Navigable {
  constructor(availableComponents) {
    super(availableComponents, true);
    this.lineOffset = 0;
  }

  draw(ctx, x, y, active) {
    ctx.save();
    ctx.font = "12pt Orbitron";
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    const height = ctx.measureText("M").width;
    const indent = height * 4;
    const lineHeight = height * 1.5;
    y -= lineHeight * this.lineOffset;
    for(let c = 0; c < this.elements.length; ++c) {
      y = this.elements[c].draw(ctx, x, y, height, lineHeight, active && this.cursor === c, indent);
    }
    ctx.restore();
  }

  get shipBP() {
    const bp = {};
    for(let c = 0; c < this.elements.length; ++c) {
      if(this.elements[c].enabled)
        bp[this.elements[c].name] = this.elements[c].data;
    }
    return bp;
  }

  _boundLineOffset(offset) {
    const lines = this.lines;
    return (offset + lines) % lines;
  }

  select() {
    return this.current.select();
  }

  key(e) {
    if(e.key === 'ArrowDown') {
      this.lineOffset = this._boundLineOffset(this.lineOffset + 1);
      this.forward();
    }
    else if(e.key === 'ArrowUp') {
      this.lineOffset = this._boundLineOffset(this.lineOffset - 1);
      this.backward();
    }
    else if(e.key === 'Enter')
      return this.select();
  }
}

class ModelEditor {
  constructor() {
    this.grid = {
      gridLines: 500, // number of grid lines
      gridSpacing: 1, // pixels per grid unit
      gridStart: [-250, -250], // corner anchor in world coordinates
      z:0,
      colors: [
        {
          color: 'green',
          interval: 50
        },
        {
          color: 'blue',
          interval: 2,
        },
        {
          color: 'darkblue',
          interval: 1,
        },
      ],
    };
    this.verts = [
      [-20, 17],
      [0, 7],
      [20, 17],
      [0, -23],
    ];

    this.cursor = 0;
    this.vertSelected = false;
  }

  draw(camera, active) {
    drawing.drawGrid(camera, this.grid);
    const ctx = camera.ctx;
    const screenVerts = [];
    for(let c = 0; c < this.verts.length; ++c) {
      screenVerts.push(camera.worldPointToCameraSpace(this.verts[c][0], this.verts[c][1]));
    }
    ctx.beginPath();
    ctx.moveTo(screenVerts[0][0], screenVerts[0][1]);
    for(let c = 1; c < screenVerts.length; ++c) {
      ctx.lineTo(screenVerts[c][0], screenVerts[c][1]);
    }
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();

    if(active) {
      const selectedVert = screenVerts[this.cursor];
      ctx.beginPath();
      ctx.arc(selectedVert[0], selectedVert[1], 8, 0, 2 * Math.PI);
      if(this.vertSelected) {
        ctx.fillStyle = 'red';
        ctx.fill();
      }
      else {
        ctx.strokeStyle = 'red';
        ctx.stroke();
      }
    }
  }

  get model() {
    return {
      vertices: this.verts,
      thrusterPoints: {
        medial: {
          positive: [[0, 7]],
          negative: [[0, 2]],
        },
        lateral: {
          positive: [[10, -5]],
          negative: [[-10, -5]],
        },
        rotational: {
          positive: [[2, -10]],
          negative: [[-2, -10]],
        },
        width: 5,
      },
      weaponOffset: [0, -30],
      overlay: {
        colorCircle: true,
        destructible: true,
      },
    };
  }

  get currentVert() {
    return this.verts[this.cursor];
  }

  get nextVert() {
    return this.verts[this._boundCursor(this.cursor - 1)];
  }

  addVert() {
    const currentVert = this.currentVert;
    const nextVert = this.nextVert;
    const midVert = [
      Math.round((currentVert[0] + nextVert[0]) / 2),
      Math.round((currentVert[1] + nextVert[1]) / 2)
    ];

    this.verts.splice(this.cursor, 0, midVert);
  }

  removeVert() {
    if(this.verts.length <= 3) return;
    this.verts.splice(this.cursor, 1);
    this.cursor = this._boundCursor(this.cursor);
  }

  forward() {
    this.cursor = this._boundCursor(this.cursor + 1);
  }

  backward() {
    this.cursor = this._boundCursor(this.cursor - 1);
  }

  _boundCursor(cursor) {
    return (cursor + this.verts.length) % this.verts.length;
  }

  key(e) {
    if(e.key === 'Enter')
      this.vertSelected = !this.vertSelected;
    else if(e.key === 'a') 
      this.addVert();
    else if(e.key === 'Backspace')
      this.removeVert();
    else if(this.vertSelected) {
      if(e.key === 'ArrowUp')
        this.currentVert[1]--;
      else if(e.key === 'ArrowDown')
        this.currentVert[1]++;
      else if(e.key === 'ArrowLeft')
        this.currentVert[0]--;
      else if(e.key === 'ArrowRight')
        this.currentVert[0]++;
    }
    else if(!this.vertSelected) {
      if(e.key === 'ArrowUp')
        this.forward();
      else if(e.key === 'ArrowDown')
        this.backward();
      else if(e.key === 'ArrowLeft')
        this.forward();
      else if(e.key === 'ArrowRight')
        this.backward();
    }
  }
}

class BuilderScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
    this.modelEditor = new ModelEditor();
    this.editors = [this.modelEditor];
    this.cursor = 0;
  }

  update() {
    if(this.client.input.wheel)
      this.client.camera.zoom *= 1 + (this.client.input.wheel / 2000);
  }

  draw() {
    this.modelEditor.draw(this.client.camera, this.activeEditor === this.modelEditor);
    if(this.shipEditor) {
      this.shipEditor.draw(this.client.camera.ctx, 50, this.client.camera.height/2, this.activeEditor === this.shipEditor);
      this.menu.draw(this.client.camera.ctx, this.client.camera.width - 100, this.client.camera.height/2, "20pt Orbitron", this.activeEditor === this.menu);
    }
  }

  onEnter() {
    this.client.camera.x = 0;
    this.client.camera.y = 0;
    this.client.camera.rotation = 0;
    this.client.camera.zoom = 15;
    requests.getRequest('/components', (data) => {
      this.shipEditor = new ShipEditor(data);
      this.editors.push(this.shipEditor);
      this.menu = new Menu([
        {text: "Submit", func: () => (client) => {
          const bp = this.shipEditor.shipBP;
          let weapons = 0;
          if(bp.laser) weapons++;
          if(bp.cannon) weapons++;
          if(bp.launcher) weapons++;
          if(!bp.powerSystem || !bp.stabilizer || !bp.thrusterSystem || weapons !== 1) {
            client.enterModal(ModalConfirmationScreen, () => {}, "Your ship must have a power system, stabilizer, thruster system, and one weapon");
            return;
          }
          client.enterModal(ModalEntryScreen, (shipName) => {            
            bp.model = this.modelEditor.model;
            const ship = {
              name: shipName,
              bp: bp
            };
            const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            requests.postRequest('/addShip', ship, csrf, (statusCode, json) => {
              const message = (statusCode === 200) ? "Success" : "Error submitting blueprint";
              client.enterModal(ModalConfirmationScreen, () => {
                if(statusCode === 200) {
                  const cost = json.cost;
                  this.client.shipList[shipName] = cost;
                  client.switchScreen(client.titleScreen);
                }
              }, message);
            });
          }, "Enter a name for the ship");
        }},
        {text: "Back", func: () => (client) => client.switchScreen(client.titleScreen)}
      ]);
      this.editors.push(this.menu);
    });
  }

  onExit() {
    this.editors.pop();
    this.editors.pop();
    delete this.shipEditor;
    delete this.menu;
  }

  get activeEditor() {
    return this.editors[this.cursor];
  }

  keyDown(e) {
    if(e.key === 'Tab')
      this.forward();
    this._handleSelect(this.activeEditor.key(e));
  }  

  forward() {
    this.cursor = this._boundCursor(this.cursor + 1);
  }

  _boundCursor(cursor) {
    return (cursor + this.editors.length) % this.editors.length;
  }

  _handleSelect(callback) {
    if(callback)
      callback(this.client);
  }
}

module.exports = BuilderScreen;