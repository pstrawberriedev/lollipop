var debug = require('debug');
var http = require('http');
var path = require('path');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackDevConfig = require('./webpack.dev.config');
var compiler = webpack(webpackDevConfig);
var router = require('./src/api/router');
var app = express();

// Middlewares
if (app.get('env') === 'development') {
  app.use(webpackDevMiddleware(compiler, {
      publicPath: webpackDevConfig.output.publicPath,
      stats: {colors: true}
  }));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', function(req, res) {
  res.send('./client/index.html');
});
app.use('/api', router);


// Server
function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

var port = normalizePort(process.env.PORT || 3000);
app.set('port', port);
app.use(function(req, res, next) {
  var err = new Error('Page not found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
});

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

module.exports = app;
