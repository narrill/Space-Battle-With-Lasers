module.exports = mod => new Proxy(mod, {
  get: (target, name) => {
    while (!target.content) ;
    return target.content[name];
  },
});
