/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

var async = require("async"),
  hawkModule = require("../lib/hawk")(),
  hatchet = require("hatchet"),
  mapUsernames = require("../lib/mapUsernames"),
  queryBuilder = require("../lib/queryBuilder");

module.exports = function (List, Make) {
  mapUsernames = mapUsernames(Make);

  function hawkError(req, res, err, code) {
    hawkModule.respond(code, res, req.credentials, req.artifacts, {
      status: "failure",
      reason: err
    }, "application/json");
  }

  function getList(id, callback) {
    List.findById(id, function (err, list) {
      if (err) {
        return callback(err);
      }
      if (!list) {
        return callback({
          code: 400,
          error: "Invalid Id"
        });
      }
      callback(null, list);
    });
  }

  function buildQuery(list, callback) {
    if (!list.makes.length) {
      return callback(null, null, list);
    }
    queryBuilder.search({
      limit: list.length,
      or: true,
      id: list.makes.join(",")
    }, function (err, dsl) {
      if (err) {
        return callback(err);
      }
      callback(null, dsl, list);
    });
  }

  function doSearch(dsl, list, callback) {
    if (!list.makes.length) {
      return callback(null, null, list);
    }
    Make.search(dsl, function (err, results) {
      if (err) {
        return callback(err);
      }
      callback(null, results.hits.hits, list);
    });
  }

  function transformMakes(makes, list, callback) {
    if (!list.makes.length) {
      return callback(null, null, list);
    }
    mapUsernames(makes, function (err, mappedMakes) {
      if (err) {
        return callback(err);
      }
      callback(null, mappedMakes, list);
    });
  }

  function orderList(makes, list, callback) {
    if (!list.makes.length) {
      return callback(null, null, list);
    }
    makes.sort(function (a, b) {
      if (list.makes.indexOf(a._id) < list.makes.indexOf(b._id)) {
        return -1;
      } else if (list.makes.indexOf(a._id) > list.makes.indexOf(b._id)) {
        return 1;
      }
      return 0;
    });
    callback(null, makes, list);
  }

  function create(req, res) {
    var body = req.body;

    if (!body ||
      !body.makes ||
      !Array.isArray(body.makes) ||
      !body.userId ||
      typeof body.userId !== "number"
    ) {
      return hawkError(req, res, "Invalid post body", 400, "create");
    }

    var list = new List({
      makes: body.makes,
      userId: body.userId,
      ownerApp: req.credentials.user,
      title: body.title || req.user.username + "'s Untitled List",
      description: body.description || ""
    });

    list.save(function (err, list) {
      if (err) {
        return hawkError(req, res, err, 500, "create");
      }
      hatchet.send("make_list_create", {
        list: list.toObject(),
        userId: req.user.id,
        username: req.user.username,
        email: req.user.email,
        apiApp: req.credentials.user
      });
      hawkModule.respond(200, res, req.credentials, req.artifacts, list, "application/json");
    });
  }

  function update(req, res) {
    var body = req.body,
      list = req.list;

    if (list.userId !== body.userId) {
      return hawkError(req, res, "User does not own make", 403);
    }

    if (!body || (body.makes && !Array.isArray(body.makes))) {
      return hawkError(req, res, "Invalid post body", 400);
    }

    List.updateFields.forEach(function (field) {
      if (body[field]) {
        list[field] = body[field];
      }
    });

    list.save(function (err) {
      if (err) {
        return hawkError(req, res, err, 500);
      }
      hatchet.send("make_list_update", {
        list: req.list,
        apiApp: req.credentials.user
      });
      hawkModule.respond(200, res, req.credentials, req.artifacts, req.list, "application/json");
    });
  }

  function remove(req, res) {
    var list = req.list;

    if (list.userId !== req.body.userId) {
      return hawkError(req, res, "User does not own make", 403);
    }

    list.remove(function (err) {
      if (err) {
        return hawkError(req, res, err, 500);
      }
      hatchet.send("make_list_remove", {
        list: req.list,
        apiApp: req.credentials.user
      });
      hawkModule.respond(200, res, req.credentials, req.artifacts, req.list, "application/json");
    });
  }

  function get(req, res) {
    var id = req.params.id;

    if (!id) {
      return res.json(400, "no id specified");
    }

    async.waterfall([
      function (callback) {
        callback(null, id);
      },
      getList,
      buildQuery,
      doSearch,
      transformMakes,
      orderList
    ], function (err, orderedMakes, list) {
      if (err) {
        if (err.code === 404) {
          return res.json({
            makes: [],
            total: 0
          });
        }
        return res.json(500, err);
      }
      res.json({
        makes: orderedMakes || [],
        title: list.title,
        description: list.description
      });
    });
  }

  function getUserLists(req, res) {
    var id = req.params.id;
    if (!id) {
      return res.json(400, "no id specified");
    }
    List.find({
      userId: id
    }, function (err, lists) {
      if (err) {
        return res.json(500, err);
      }
      res.json({
        lists: lists || []
      });
    });
  }

  return {
    create: create,
    update: update,
    remove: remove,
    get: get,
    getUserLists: getUserLists
  };
};
