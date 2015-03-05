/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

var async = require("async"),
  hatchet = require("hatchet"),
  hawkModule = require("../lib/hawk")(),
  metrics = require("../lib/metrics"),
  queryBuilder = require("../lib/queryBuilder"),
  sanitize = require("../lib/sanitizer"),
  version = require("../package").version;

module.exports = function (makeModel) {
  var Make = makeModel,
    mapUsernames = require("../lib/mapUsernames")(Make);

  function error(res, err, type, code) {
    metrics.increment("make." + type + ".error");
    res.json(code, {
      error: err
    });
  }

  function hawkError(req, res, err, code, type) {
    metrics.increment("make." + type + ".error");
    hawkModule.respond(code, res, req.credentials, req.artifacts, {
      status: "failure",
      reason: err
    }, "application/json");
  }

  function buildHatchetData(req, make, type) {
    var hatchetData = {
      userId: req.user ? req.user.id : "",
      username: req.user ? req.user.username : "",
      email: req.user ? req.user.email : "",
      make: make.toObject()
    };

    if (req.credentials) {
      hatchetData.apiApp = req.credentials.user;
    }

    var remixMake = req.hatchet.remixMake,
      remixUser = req.hatchet.remixUser,
      adminUser = req.hatchet.adminUser;

    if (type === "create_make" && make.remixedFrom && remixMake) {
      hatchetData.remixMake = remixMake;
      if (remixUser) {
        hatchetData.remixUserId = remixUser.make;
        hatchetData.remixEmail = remixUser.email;
        hatchetData.remixUsername = remixUser.username;
      } else {
        hatchetData.remixUserId = -1;
      }
    } else if (/^admin_.*$/.test(type) && adminUser) {
      hatchetData.adminUserId = adminUser.id;
      hatchetData.adminUserEmail = adminUser.email;
    }

    return hatchetData;
  }

  function handleSave(req, res, err, make, type) {
    var hatchetData;
    if (err) {
      hawkError(req, res, err, 400, type);
    } else {
      hatchetData = buildHatchetData(req, make, req.hatchet.type);
      hatchet.send(req.hatchet.type, hatchetData);
      metrics.increment("make." + type + ".success");
      hawkModule.respond(200, res, req.credentials, req.artifacts, make, "application/json");
    }
  }

  function updateFields(req, res, make, body, type) {
    Make.publicFields.forEach(function (field) {
      // only update if the field exists on the body
      if (field in body) {
        if (field === "likes") {
          make.likes.push(body.likes);
        } else if (field === "tags") {
          make.tags = body.tags.map(sanitize);
        } else {
          make[field] = body[field];
        }
      }
    });

    if (body.email) {
      make.email = body.email;
    }

    // if 'ownerApp' exists, this is an update, so pass over. 'ownerApp' should never change over the life of a make.
    if (!make.ownerApp) {
      // assign the make the public key [uuid] of the app that authenticated with the makeAPI
      make.ownerApp = req.credentials.user;
    }

    // If createdAt doesn't exist, we know this is a Create, otherwise stamp updatedAt
    if (!make.createdAt) {
      make.createdAt = make.updatedAt = Date.now();
    } else {
      make.updatedAt = Date.now();
    }

    make.save(function (err, make) {
      return handleSave(req, res, err, make, type);
    });
  }

  function buildQuery(requestQuery, authenticated, callback) {
    queryBuilder.search(requestQuery, function (err, dsl) {
      if (err) {
        if (err.code === 404) {
          // A non-existant user means we can assume the search will return 0 makes
          return callback(err);
        }
        return callback(new Error("Failed to build the Query"));
      }
      callback(null, dsl, requestQuery);
    }, authenticated);
  }

  function makeSearch(dsl, requestQuery, callback) {
    Make.search(dsl, function (err, results) {
      if (err) {
        return callback(new Error("The query produced invalid ElasticSearch DSL"));
      }
      callback(null, results.hits.hits, requestQuery, results.hits.total);
    });
  }

  function transformMakes(searchResults, requestQuery, total, callback) {
    mapUsernames(searchResults, function (err, mappedMakes) {
      if (err) {
        return callback(err);
      }
      callback(null, mappedMakes, requestQuery, total);
    });
  }

  function getRemixCounts(searchResults, requestQuery, total, callback) {
    var now;
    if (requestQuery.getRemixCounts === "true") {
      now = Date.now();
      async.mapSeries(searchResults, function iterator(make, mapCallback) {
        queryBuilder.remixCount(make._id, 0, now, function (err, dsl) {
          if (err) {
            return mapCallback(new Error("Error while fetching remixCount for " + make.url));
          }
          Make.search(dsl, function (err, results) {
            if (err) {
              return mapCallback(new Error("Error while fetching remixCount for " + make.url));
            }
            make.remixCount = results.hits.total;
            mapCallback(null, make);
          });
        });
      }, function done(err, hydratedSearchResults) {
        if (err) {
          return callback(err);
        }
        callback(null, hydratedSearchResults, total);
      });
    } else {
      callback(null, searchResults, total);
    }
  }

  function doSearch(req, res, authenticated) {
    async.waterfall([
      function (callback) {
        callback(null, req.query, authenticated);
      },
      buildQuery,
      makeSearch,
      transformMakes,
      getRemixCounts
    ], function (err, makes, total) {
      if (err) {
        if (err.code === 404) {
          metrics.increment("make.search.success");
          return res.json({
            makes: [],
            total: 0
          });
        }
        return error(res, err.toString(), "search", 500);
      }
      metrics.increment("make.search.success");
      res.json({
        makes: makes,
        total: total
      });
    });
  }

  return {
    create: function (req, res) {
      updateFields(req, res, new Make(), req.body, "create");
    },
    update: function (req, res) {
      updateFields(req, res, req.make, req.body, "update");
    },
    remove: function (req, res) {
      var make = req.make;

      make.deletedAt = Date.now();
      make.save(function (err, make) {
        if (err) {
          return hawkError(req, res, err, 500, "remove");
        }
        hatchet.send(req.hatchet.type, buildHatchetData(req, make, req.hatchet.type));
        metrics.increment("make.remove.success");
        hawkModule.respond(200, res, req.credentials, req.artifacts, make, "application/json");
      });
    },
    search: function (req, res) {
      if (!req.query) {
        return error(res, "Malformed Request", "search", 400);
      }
      doSearch(req, res, false);
    },
    protectedSearch: function (req, res) {
      if (!req.query) {
        return error(res, "Malformed Request", "search", 400);
      }
      doSearch(req, res, true);
    },
    remixCount: function (req, res) {
      if (!req.query || !req.query.id) {
        return error(res, "Malformed Request", "remixCount", 400);
      }
      var id = req.query.id,
        from = req.query.from || 0,
        to = req.query.to || Date.now();

      queryBuilder.remixCount(id, from, to, function (err, dsl) {
        if (err) {
          return error(res, err, "remixCount", err.code);
        }
        Make.search(dsl, function (err, results) {
          return res.json({
            count: results.hits.total
          });
        });
      });
    },
    autocomplete: function (req, res) {
      if (!req.query.t) {
        return error(res, "Autocomplete term required", "autocomplete", 400);
      }
      var query = queryBuilder.autocomplete(req.query.t, req.query.s);
      Make.search(query, function (err, results) {
        if (err) {
          error(res, err, "autocomplete", 500);
        } else {
          metrics.increment("make.autocomplete.success");
          res.json({
            tags: results.facets.tags.terms,
            total: results.facets.tags.terms.length
          });
        }
      });
    },
    healthcheck: function (req, res) {
      res.json({
        http: "okay",
        version: version
      });
    },
    tag: function (req, res) {
      var tag = req.params.tag;
      var make = req.make;
      if (make.tags.indexOf(tag) !== -1) {
        return hawkError(req, res, "Already tagged with " + tag, 400, "tag");
      }

      make.tags.push(tag);
      make.save(function (err, make) {
        return handleSave(req, res, err, make, "tag");
      });
    },
    untag: function (req, res) {
      var tag = req.params.tag;
      var make = req.make;
      if (make.tags.indexOf(tag) === -1) {
        return hawkError(req, res, "Not tagged with " + tag, 400, "tag");
      }
      make.tags.splice(make.tags.indexOf(tag), 1);
      make.save(function (err, make) {
        return handleSave(req, res, err, make, "untag");
      });
    },
    restore: function (req, res) {
      var id = req.params.id;

      Make.findById(id).where("deletedAt").ne(null).exec(function (err, make) {
        if (err) {
          return hawkError(req, res, err, 500, "restore");
        }

        if (!make) {
          return hawkError(req,
            res,
            "Could not find a make with the id '" + id + "' ensure it exists and has been deleted recently.",
            400,
            "restore"
          );
        }

        make.deletedAt = null;
        make.save(function (err, updated) {
          handleSave(req, res, err, updated, "restore");
        });
      });
    }
  };
};
