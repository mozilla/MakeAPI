var async = require('async');
var request = require('request');
var url = require('url');
var AWS = require('aws-sdk');
var env = require('../lib/environment');
var mongoose = require( '../lib/mongoose' )(connectionReady);
var Make = require( '../lib/models/make' )( mongoose.mongoInstance() );

if (!env.get('S3_EXPORT_BUCKET') || !env.get('AWS_S3_EXPORT_ACCESS_KEY') || !env.get('AWS_S3_EXPORT_SECRET_ACCESS_KEY')) {
  console.error('You must define S3_EXPORT_BUCKET, AWS_S3_EXPORT_ACCESS_KEY, and AWS_S3_EXPORT_SECRET_ACCESS_KEY in your config');
  process.exit(1);
}

var documentCount;
var aggregatedMakes = {};
var aggregatedRedactedMakes = {};
var currentSkipValue = 0;
var aggregationLimit = 2500;
var host = env.get('LOGIN_SERVER_URL_WITH_AUTH');
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

var cache = {};
cache[host] = {};
try { cache = require('./userlookupcache'); } catch(ignored) {}

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
  console.time("fetch documents");
  async.doWhilst(
    fetchAggregatedSet,
    canFetchMore,
    function(error) {
      console.timeEnd("fetch documents");
      if (error) {
        return handleError(error);
      }
      console.info("Finished aggregation, found makes by ", Object.keys(aggregatedMakes).length, "users");
      callback();
    }
  )
}

function replaceUserEmail(makes, email, callback) {
  if (cache[host][email]) {
    aggregatedRedactedMakes[cache[host][email]] = makes;
    return process.nextTick(callback);
  }

  async.retry(
    async.apply(loginServerGetRequest, { url: '/user/email/' + email})
  , function(error, response) {
    if (error) {
      return callback(error);
    }

    if (response.statusCode === 404) {
      return callback();
    }

    aggregatedRedactedMakes[response.body.user.username] = makes;
    callback();
  });
}

function replaceEmails(callback) {
  console.time("replace emails");
  console.info("Redacting user emails and replacing them with usernames. This will also take a while.");
  async.forEachOfLimit(aggregatedMakes, 20, replaceUserEmail, function(error) {
    console.timeEnd("replace emails");
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

  console.time("export to s3");

  async.forEachOfLimit(
    aggregatedRedactedMakes,
    5,
    putJSON,
    function(error) {
      console.timeEnd("export to s3");
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
      require('fs').writeFileSync('userlookupcache.json', JSON.stringify(cache));
      console.info('Export completed!');
      process.exit();
    }
  ]);
}
