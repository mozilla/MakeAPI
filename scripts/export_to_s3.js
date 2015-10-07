var async = require('async');
var request = require('request');
var url = require('url');
var AWS = require('aws-sdk');
var env = require('../lib/environment');
var mongoose = require( '../lib/mongoose' )(connectionReady);
var Make = require( '../lib/models/make' )( mongoose.mongoInstance() );

var documentCount;
var aggregatedMakes = {};
var aggregatedRedactedMakes = {};
var currentSkipValue = 0;
var aggregationLimit = 2500;
var loginURL = url.parse(env.get('LOGIN_SERVER_URL_WITH_AUTH'));
var loginServerGetRequest = request.defaults({
  method: 'get',
  baseUrl: loginURL.protocol + '//' + loginURL.host,
  auth: {
    user: loginURL.auth.split(':')[0],
    pass: loginURL.auth.split(':')[1]
  },
  json: true
});

function handleError(error) {
  console.error('An error occurred: ', error);
  process.exit(1);
}


function getDocumentCount(callback) {
  Make.count({
    deletedAt: null
  },function(err, count) {
    if (err) {
      return handleError(err);
    }

    documentCount = count
    console.info("Found " + documentCount + " documents to aggregate and export.");
    callback();
  });
}

function mergeAggregateResult(results, callback) {
  results.forEach(function(result) {
    if (!aggregatedMakes[result.email]) {
      aggregatedMakes[result.email] = [];
    }

    aggregatedMakes[result.email] = aggregatedMakes[result.email].concat(result.makes);
  });

  callback();
}

function fetchAggregatedSet(callback) {
  Make.aggregate([
    {
      $match: {
        deletedAt: null
      }
    },
    { $skip: currentSkipValue },
    { $limit: aggregationLimit },
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
  ], function(error, result) {
    if (error) {
      return handleError(error);
    }
    mergeAggregateResult(result, callback);
  });
}

function canFetchMore() {
  currentSkipValue += aggregationLimit;
  return currentSkipValue < documentCount;
}

function aggregateDocuments(callback) {
  console.info("Aggregating makes by email address... go get some coffee, this could take a while.");
  async.doWhilst(
    fetchAggregatedSet,
    canFetchMore,
    function(error) {
      if (error) {
        return handleError(error);
      }
      console.info("Finished aggregation, found makes by ", Object.keys(aggregatedMakes).length, "users");
      callback();
    }
  )
}

function replaceUserEmail(makes, email, callback) {
  loginServerGetRequest({
    url: '/user/email/' + email
  }, function(error, response, body) {
    if (error) {
      return callback(error);
    }

    if (response.statusCode === 404) {
      return callback();
    }

    aggregatedRedactedMakes[body.user.username] = makes;
    callback();
  });
}

function replaceEmails(callback) {
  console.info("Redacting user emails and replacing them with usernames. This will also take a while.");
  async.forEachOfLimit(aggregatedMakes, 20, replaceUserEmail, function(error) {
    if (error) {
      return handleError(error);
    }
    callback();
  })
}

function outputToS3(callback) {
  console.info('Writing json files to S3... how about another cup of coffee?');
  var s3 = new AWS.S3({
    accessKeyId: env.get('AWS_S3_EXPORT_ACCESS_KEY'),
    secretAccessKey: env.get('AWS_S3_EXPORT_SECRET_ACCESS_KEY'),
    region: 'us-east-1',
    sslEnabled: true
  });
  var bucket = env.get('S3_EXPORT_BUCKET');

  function putJSON(makes, username, callback) {
    s3.putObject({
      Bucket: bucket,
      Key: username + '/makes.json',
      Body: new Buffer(JSON.stringify(makes), 'utf8'),
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=86400'
    }, callback);
  }

  async.forEachOfLimit(
    aggregatedRedactedMakes,
    5,
    putJSON,
    function(error) {
      if (error) {
        return handleError(error);
      }

      callback();
    }
  );
}

function connectionReady(error) {
  if (error) {
    console.error('Connection Error:', error);
    process.exit(1);
  }

  async.waterfall([
    getDocumentCount,
    aggregateDocuments,
    replaceEmails,
    outputToS3,
    function() {
      console.info('Export completed!');
      process.exit();
    }
  ]);
}
