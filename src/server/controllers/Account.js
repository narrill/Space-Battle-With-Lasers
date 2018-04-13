const models = require('../models');
const buildableBPs = require('../ComponentTypes.js').buildableBPs;

const Account = models.Account;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const signupPage = (req, res) => {
  res.render('signup', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (request, response) => {
  const req = request;
  const res = response;

  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  return Account.load(username, password).then((acc) => {
    req.session.account = acc;
    res.json({ redirect: '/play' });
  }).catch((err) => {
    console.log(err);
    return res.status(400).json({ error: 'Wrong username or password' });
  });
};

const signup = (request, response) => {
  const req = request;
  const res = response;

  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  return Account.create(req.body.username, req.body.pass).then((acc) => {
    req.session.account = acc;
    res.json({ redirect: '/play' });
  }).catch((err) => {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use' });
    }
    return res.status(400).json({ error: 'An error occurred' });
  });
};

const submitBP = (request, response) => {
  const bpInfo = request.body;
  request.session.account.submitBP(bpInfo).then((cost) => {
    response.status(200).json({ cost });
  }).catch((err) => {
    console.log(err);
    response.status(400).json({ error: 'Error submitting blueprint' });
  });
};

const components = (request, response) => {
  response.status(200).json(buildableBPs);
};

module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signupPage = signupPage;
module.exports.signup = signup;
module.exports.submitBP = submitBP;
module.exports.components = components;
