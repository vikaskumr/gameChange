// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const loopbackConsole = require('loopback-console');

const app = module.exports = loopback();
app.NODE_ENV = 'development';

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) { throw err; }

  // start the server if `$ node server.js`
  if (loopbackConsole.activated()) {
    loopbackConsole.start(app, {
      prompt: 'Wealthfy # ',
      // Other REPL or loopback-console config
    }, function (err, ctx) {
      // Perform post-boot operations here.
      // The 'ctx' handle contains the console context, including the following
      // properties: app, lbContext, handles, models
    });
  } else if (require.main === module) {
    app.start();
  }
});
