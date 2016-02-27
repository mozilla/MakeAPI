var async = require('async');
var AWS = require('aws-sdk');
var env = require('../lib/environment');

var Mongoose = require('mongoose');
Mongoose.connect(env.get('MONGO_URL'));
var Make = require('../lib/models/make')(Mongoose);
var S3 = new AWS.S3({
  region: 'us-east-1',
  params: {
    Bucket: env.get('S3_EXPORT_BUCKET'),
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'public, max-age=86400'
  }
});

var countDocuments = function(callback) {
  Make.count({
    deletedAt: null
  }, callback);
};

var fetchDocuments = function(totalDocuments, callback) {
  var documentsFetched = 0;
  var increment = 2500;
  var aggregatedMakes = {};

  async.whilst(
    function test() {
      return documentsFetched < totalDocuments;
    },
    function work(callback) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(documentsFetched + "/" + totalDocuments + " fetched");

      Make.aggregate([
        {
          $match: {
            deletedAt: null
          }
        },
        { $skip: documentsFetched },
        { $limit: increment },
        {
          $group: {
            _id: {
              email: '$email'
            },
            makes: {
              $push: {
                id: '$_id.oid',
                contentType: '$contentType',
                createdAt: '$createdAt',
                description: '$description',
                editurl: '$editurl',
                locale: '$locale',
                remixedFrom: '$remixedFrom',
                remixurl: '$remixurl',
                thumbnail: '$thumbnail',
                title: '$title',
                updatedAt: '$updatedAt',
                url: '$url'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            email: '$_id.email',
            makes: '$makes'
          }
        }
      ], function(error, results) {
        if (error) {
          return callback(error);
        }

        results.forEach(function(result) {
          if (!aggregatedMakes[result.email]) {
            aggregatedMakes[result.email] = [];
          }

          aggregatedMakes[result.email] = aggregatedMakes[result.email].concat(result.makes);
        });

        documentsFetched += increment;

        callback();
      });
    },
    function done(error) {
      Mongoose.disconnect();

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(totalDocuments + "/" + totalDocuments + " fetched\n");

      callback(error, aggregatedMakes);
    }
  );
};

var loginURL = require("url").parse(env.get('LOGIN_SERVER_URL_WITH_AUTH'));
var fetchUser = require("request").defaults({
  method: 'GET',
  baseUrl: loginURL.protocol + '//' + loginURL.host,
  auth: {
    user: loginURL.auth.split(':')[0],
    pass: loginURL.auth.split(':')[1]
  },
  json: true
});

var processDocuments = function(aggregatedMakes, callback) {
  var emails = Object.keys(aggregatedMakes);
  var exported = 0;
  var totalExports = emails.length;

  var q = async.queue(function(email, callback) {
    async.waterfall([
      async.retry(async.apply(fetchUser, { url: '/user/email/' + email })),
      function(response, callback) {
        if (response.statusCode === 404) {
          return callback();
        }

        var obj = {
          username: response.body.user.username,
          makes: aggregatedMakes[email]
        };

        callback(null, obj);
      },
      function(usersMakes, callback) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(exported++ + "/" + totalExports + " exported");

        if (!callback) {
          return usersMakes();
        }

        S3.putObject({
          Key: usersMakes.username + '/makes.json',
          Body: new Buffer(JSON.stringify(usersMakes.makes), 'utf8')
        }, callback);
      }
    ], callback);
  }, 20);

  q.drain = callback;
  q.push(emails);
};

async.waterfall([
  countDocuments,
  fetchDocuments,
  processDocuments
], function(error, result) {
  if (error) {
    throw error;
  }
});
