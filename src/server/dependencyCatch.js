module.exports = mod => new Proxy(mod, {
  get: (target, name) => {
    while (!target.content) { console.log('waiting'); }
    return target.content[name];
  },
});
