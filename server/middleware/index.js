const requiresLogin = (req, res, next) => {
  // Are we gonna have a login system?
  // Probably if we plan on using a DB to store user data
  next();
};

module.exports = {
  requiresLogin,
};
