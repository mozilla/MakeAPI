var async = require('async');
var env = require('../lib/environment');

var host = env.get('LOGIN_SERVER_URL_WITH_AUTH');
var loginURL = require("url").parse(host);
var fetchUser = require("request").defaults({
  method: 'GET',
  baseUrl: loginURL.protocol + '//' + loginURL.host,
  auth: {
    user: loginURL.auth.split(':')[0],
    pass: loginURL.auth.split(':')[1]
  },
  json: true
});
var cache = {};
cache[host] = {};
try {
  cache = require("./userlookupcache");
} catch (ignore) {}

var Mongoose = require('mongoose');
Mongoose.connect(env.get('MONGO_URL'));
var Make = require('../lib/models/make')(Mongoose);

Make.aggregate([
  {
    $match: {
      deletedAt: null
    }
  },
  {
    $group: {
      _id: '$email'
    }
  }
], function(error, results) {
  if (error) {
    throw error;
  }

  q.push(results.map(function(e) { return e._id; }));
});

var q = async.queue(function(email, callback) {
  async.retry(async.apply(fetchUser, { url: '/user/email/' + email }), function(error, response) {
    if (error) {
      throw error;
    }

    if (response.statusCode === 200 && response.body.user.email.toLocaleLowerCase() === email.toLocaleLowerCase()) {
      cache[host][email] = response.body.user.username;
      return callback();
    }

    if (response.statusCode === 404 && response.body.error === ("User not found for ID: " + email)) {
      Make.update({
        email: email
      }, {
        deletedAt: Date.now()
      }, {
        multi: true
      }, function(error, numberAffected) {
        if (error) {
          throw error;
        }

        console.log('%s %d', email, numberAffected);
        callback();
      });
      return;
    }

    console.error(response.statusCode, email, response.body);

    throw new Error("How did you get here?");
  });
}, 10);

q.drain = function() {
  Mongoose.disconnect();
  require('fs').writeFileSync(__dirname + '/userlookupcache.json', JSON.stringify(cache));
};
