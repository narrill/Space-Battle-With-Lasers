const Screen = require('./Screen.js');
const ModalEntryScreen = require('./ModalEntryScreen.js');

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
    else
      this.cursor = this._boundCursor(this.cursor + 1);
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
  }

  get onName() {
    return this.cursor === -1;
  }

  toLast() {
    this.cursor = this.elements.length - 1;
    if(this.current.enabled)
      this.current.toLast();
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

  draw(ctx, x, y) {
    ctx.save();
    ctx.font = "12pt Orbitron";
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    const height = ctx.measureText("M").width;
    const indent = height * 4;
    const lineHeight = height * 1.5;
    y -= lineHeight * this.lineOffset;
    for(let c = 0; c < this.elements.length; ++c) {
      y = this.elements[c].draw(ctx, x, y, height, lineHeight, this.cursor === c, indent);
    }
    ctx.restore();
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

class BuilderScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
    this.openRequests = 0;
  }

  draw() {
    if(this.openRequests !== 0)
      return;
    if(this.editor)
      this.editor.draw(this.client.camera.ctx, 50, this.client.camera.height/2);
  }

  onEnter() {
    this.getRequest('/components', (data) => {
      this.editor = new ShipEditor(data);
    });
  }

  keyDown(e) {
    this._handleSelect(this.editor.key(e));
  }

  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      callback(JSON.parse(xhr.response));
      this.openRequests--;
    };
    xhr.open('GET', url);
    xhr.send();
    this.openRequests++;
  }

  _handleSelect(callback) {
    if(callback)
      callback(this.client);
  }
}

module.exports = BuilderScreen;