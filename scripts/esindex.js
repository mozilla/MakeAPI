var async = require("async");

var Mongo = require("../lib/mongoose")(handle_error);
var Make = require("../lib/models/make")(Mongo.mongoInstance());

var documentCount = 0;
var currentSkipValue = 0;
var aggregationLimit = 2500;
var criteria = process.argv[3] ? JSON.parse(process.argv[2]) : {};
var parallel_index_limit = process.argv[2] ? process.argv[2] : 2;

var handle_error = function(error) {
  if (error) {
    console.error(error);
    process.exit(1);
  }
}

var get_document_count = function(callback) {
  Make.count({
    deletedAt: null
  },function(count_err, count) {
    if (count_err) {
      return callback(count_err);
    }

    documentCount = count
    console.info("Found " + documentCount + " documents to index");
    callback();
  });
}

var index_documents = function(index_callback) {
  async.doWhilst(
    function doit(do_callback) {
      Make.find(criteria, null, { skip: currentSkipValue, limit: aggregationLimit }, function(find_error, results) {
        if (find_error) {
          return do_callback(find_error);
        }

        async.eachLimit(results, parallel_index_limit, function(doc, each_callback) {
          doc.index(each_callback);
        }, do_callback);
      });
    },
    function whilst() {
      currentSkipValue += aggregationLimit;
      console.log("Indexed %d documents", currentSkipValue);
      return currentSkipValue < documentCount;
    },
    index_callback
  );
};

async.waterfall([
  get_document_count,
  index_documents
], function(waterfall_error) {
  if (waterfall_error) {
    handle_error(waterfall_error);
  }

  process.exit(0);
});
