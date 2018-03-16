// Basic http node module
const http = require('http');

// Express and router
const express = require('express');
const router = require('./router.js');

// Socket.io library and custom events
const socketLib = require('socket.io');
const socketHandler = require('./socketHandler.js');

// Handlebars view engine
const expressHandlebars = require('express-handlebars');

// Define a port based on the environment variables or default to 3000
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// Create express application
const app = express();

// Configure application
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);

// Attach routes to the application
router.attach(app);

// Create the express server
const server = http.createServer(app);

// Initialize the socket.io library and and attach events
const io = socketLib(server);
socketHandler.init(io);

// Set the express server to listen on the specified port
server.listen(port);
