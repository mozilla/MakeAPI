var async = require('async');
var Gauge = require('gauge');
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

    documentCount = count;
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

var gauge = new Gauge();

function canFetchMore() {
  gauge.show("Fetching data: " + currentSkipValue, currentSkipValue / documentCount);

  currentSkipValue += aggregationLimit;
  return currentSkipValue < documentCount;
}

function aggregateDocuments(callback) {
  console.time("Fetching data");
  async.doWhilst(
    fetchAggregatedSet,
    canFetchMore,
    function(error) {
      console.log("");
      console.timeEnd("Fetching data");
      if (error) {
        return handleError(error);
      }

      mongoose.mongoInstance().disconnect();

      callback();
    }
  )
}

function replaceUserEmail(makes, email, callback) {
  gauge.show("Replacing emails: " + replaced_emails, replaced_emails / total_emails);
  replaced_emails++;

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

    cache[host][email] = response.body.user.username;
    aggregatedRedactedMakes[response.body.user.username] = makes;
    callback();
  });
}

var total_emails = 0;
var replaced_emails = 0;

function replaceEmails(callback) {
  console.time("Replacing emails");
  total_emails = Object.keys(aggregatedMakes).length;
  async.forEachOfLimit(aggregatedMakes, 20, replaceUserEmail, function(error) {
    gauge.show("Replacing emails: " + replaced_emails, replaced_emails / total_emails);
    console.log("");
    console.timeEnd("Replacing emails");
    if (error) {
      return handleError(error);
    }
    callback();
  })
}

function outputToS3(callback) {
  var s3 = new AWS.S3({
    accessKeyId: env.get('AWS_S3_EXPORT_ACCESS_KEY'),
    secretAccessKey: env.get('AWS_S3_EXPORT_SECRET_ACCESS_KEY'),
    region: 'us-east-1',
    sslEnabled: true
  });
  var bucket = env.get('S3_EXPORT_BUCKET');
  var files_written = 0;
  var total_files = Object.keys(aggregatedRedactedMakes).length;

  function putJSON(makes, username, callback) {
    gauge.show("Putting files: " + files_written++, files_written / total_files);

    async.retry(async.apply(s3.putObject.bind(s3), {
      Bucket: bucket,
      Key: username + '/makes.json',
      Body: new Buffer(JSON.stringify(makes), 'utf8'),
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=86400'
    }), callback);
  }

  console.time("Putting files");

  async.forEachOfLimit(
    aggregatedRedactedMakes,
    5,
    putJSON,
    function(error) {
      gauge.show("Putting files: " + files_written, files_written / total_files);
      console.log("");
      console.timeEnd("Putting files");
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
    function(waterfall_error) {
      require('fs').writeFileSync(__dirname + '/userlookupcache.json', JSON.stringify(cache));

      if (waterfall_error) {
        return handleError(waterfall_error);
      }

      console.info('Export completed!');
      process.exit(0);
    }
  ]);
}
