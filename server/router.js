const express = require('express');
const path = require('path');

// Custom controllers
const controllers = require('./controllers');

// Initialize routes and attach them to the express application
const attach = (app) => {
  // Pseudo directory /assets maps to static assets in the hosted folder
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));

  // Handle game related requests
  app.get('/', controllers.Game.mainPage);
};

module.exports = {
  attach,
};
