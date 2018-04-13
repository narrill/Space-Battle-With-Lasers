const utilities = require('../server/utilities.js'); 
const Menu = require('./Menu.js');
const requests = require('./requests');

let canvas;
let ctx;

let csrf;

let signup = false;

let activeElement;
let error;

class Prompt {
  constructor(text, submitFunc, masked = false) {
    this.text = text;
    this.submitFunc = submitFunc;
    this._entry = "";
    this.masked = masked;
  }

  draw(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    utilities.fillText(
      ctx, 
      this.text + ": " + this.entry, 
      canvas.width/2, 
      canvas.height/2, 
      "24pt Orbitron", 
      'black'
    );
  }

  key(e) {
    if(e.key === 'Backspace'){
      if(this._entry.length > 0)
        this._entry = this._entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      this.submitFunc();
    }
    else
      this._entry += e.key;
  }

  clear() {
    this._entry = "";
  }

  get entry() {
    if(this.masked) {
      let str = "";
      for(let c = 0; c < this._entry.length; ++c)
        str += '*';
      return str;
    }
    else
      return this._entry;
  }
}

let menu;
let userPrompt;
let passwordPrompt;
let password2Prompt;

userPrompt = new Prompt("Username", () => {
  activeElement = passwordPrompt;
});

passwordPrompt = new Prompt("Password", () => {
  if(signup)
    activeElement = password2Prompt;
  else 
    requests.postRequest('/login', {username: userPrompt._entry, pass: passwordPrompt._entry}, csrf, (status, res) => {
      if(status === 200)
        window.location.replace(res.redirect);
      else {
        error = res.error;
        activeElement = menu;
      }
      userPrompt.clear();
      passwordPrompt.clear();
    });
}, true);

password2Prompt = new Prompt("Repeat password", () => {
  requests.postRequest('/signup', {username: userPrompt._entry, pass: passwordPrompt._entry, pass2: password2Prompt._entry}, csrf, (status, res) => {
    if(status === 200)
      window.location.replace(res.redirect);
    else {
      error = res.error;
      activeElement = menu;
    }
    userPrompt.clear();
    passwordPrompt.clear();
    password2Prompt.clear();
  });
}, true);

menu = new Menu([
  {text: 'Login', func: () => { 
    signup = false;
    activeElement = userPrompt; 
  }},
  {text: 'Signup', func: () => {
    signup = true;
    activeElement = userPrompt;
  }}
]);

const BOX_HEIGHT = 200;

const draw = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.fillRect(0, (canvas.height/2) - (BOX_HEIGHT / 2), canvas.width, BOX_HEIGHT);

  activeElement.draw(ctx);

  if(error)
    utilities.fillText(ctx, error, canvas.width / 2, canvas.height / 2 + BOX_HEIGHT, "24pt Orbitron", "white");

  requestAnimationFrame(draw);
};

window.onkeydown = (e) => {
  activeElement.key(e);
};

window.onload = () => {
  csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
  menu.draw = menu.draw.bind(menu, ctx, canvas.width / 2, canvas.height / 2, '24pt Orbitron', true, 'black');
  activeElement = menu;
  requestAnimationFrame(draw);
};