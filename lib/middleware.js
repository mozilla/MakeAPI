/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var http = require("http"),
  hyperquest = require("hyperquest"),
  url = require("url"),
  env = require("./environment"),
  hawkModule = require("./hawk")(),
  tags = require("./tags")();

module.exports = function (makeModel, apiAppModel, List) {
  var Make = makeModel,
    hawkOptions = {},
    credentialsLookupStrategy = require("./strategy")(apiAppModel, env.get("USE_DEV_KEY_LOOKUP")),
    LOGIN_API = env.get("LOGIN_SERVER_URL_WITH_AUTH");

  // API Key write permissions feature flag
  var ENFORCE_WRITE_PERMISSIONS = env.get("ENFORCE_WRITE_PERMISSIONS");

  // fields that collaborator accounts can update
  var COLLABORATOR_FIELDS = [
    "tags"
  ];

  if (env.get("FORCE_SSL")) {
    hawkOptions.port = 443;
  }

  function findUserElem(id, array) {
    var elem;
    for (var i = array.length - 1; i >= 0; i--) {
      elem = array[i];
      if (elem.userId === id) {
        return elem;
      }
    }
    return null;
  }

  function userRequest(path, callback) {
    var get = hyperquest({
      headers: {
        "Content-Type": "application/json"
      },
      uri: url.resolve(LOGIN_API, "/user/" + path)
    });
    get.on("error", callback);
    get.on("response", function (resp) {
      if (resp.statusCode !== 200) {
        return callback({
          error: "There was an error on the login server",
          statusCode: resp.statusCode
        });
      }

      var bodyParts = [];
      var bytes = 0;
      resp.on("data", function (data) {
        bodyParts.push(data);
        bytes += data.length;
      });

      resp.on("end", function () {
        var body = Buffer.concat(bodyParts, bytes).toString("utf8");
        var json;

        try {
          json = JSON.parse(body);
        } catch (e) {
          return callback({
            error: "Error parsing login server response"
          });
        }

        callback(null, json.user);
      });
    });
  }

  return {
    canTag: function (req, res, next) {
      var tag = req.params.tag;
      if (!tag) {
        return hawkModule.respond(400, res, req.credentials, req.artifacts, {
          status: "failure",
          reason: "tag missing"
        }, "application/json");
      }

      if (!tags.isTagChangeAllowed(tag, req.user, req.credentials.admin)) {
        return hawkModule.respond(401, res, req.credentials, req.artifacts, {
          status: "failure",
          reason: "unauthorized"
        }, "application/json");
      }

      return process.nextTick(next);
    },
    validateAppTags: function (req, res, next) {
      var makeTags = req.body.tags,
        validTags = [];

      if (!makeTags) {
        return next();
      }

      if (makeTags && makeTags.length) {
        validTags = tags.validateTags(makeTags, req.user);
      }

      // keep app tags
      if (req.make) {
        validTags = validTags.concat(req.make.appTags);
      }

      // update the body of the request with the approved tags, filtering for duplicates
      req.body.tags = validTags.filter(function (tag, pos, arr) {
        return arr.indexOf(tag) === pos;
      });

      next();
    },
    adminAuth: function (req, res, next) {
      var id = (req.session && req.session.user) ? req.session.user.id : "";
      if (id) {
        userRequest("id/" + id, function (err, user) {
          if (err) {
            return next(err);
          }
          if (!user || !user.isAdmin) {
            return res.redirect(302, "/login");
          }
          req.hatchet.adminUser = user;
          next();
        });
      } else {
        res.redirect(302, "/login");
      }
    },
    collabAuth: function (req, res, next) {
      var id = (req.session && req.session.user) ? req.session.user.id : "";
      if (id) {
        userRequest("id/" + id, function (err, user) {
          if (err) {
            return next(err);
          }
          if (!user.isCollaborator && !user.isAdmin) {
            return res.redirect(302, "/login");
          }
          req.isCollab = user.isCollaborator;
          // check if an event is associated with this call
          if (req.hatchet) {
            req.hatchet.adminUser = user;
          }
          next();
        });
      } else {
        res.redirect(302, "/login");
      }
    },
    hawkAuth: function (req, res, next) {
      hawkModule.Hawk.server.authenticate(req,
        credentialsLookupStrategy,
        hawkOptions,
        function (err, creds, artifacts) {
          if (err) {
            return hawkModule.respond(401, res, creds, artifacts, {
              status: "failure",
              reason: "Unauthorized"
            }, "application/json");
          }
          req.credentials = creds;
          req.artifacts = artifacts;
          next();
        }
      );
    },
    isHawkAdmin: function (req, res, next) {
      if (req.credentials.admin) {
        return next();
      }
      hawkModule.respond(401, res, req.credentials, req.artifacts, {
        status: "failure",
        reason: "Insufficient permissions"
      }, "application/json");
    },
    getMake: function (req, res, next) {
      if (!req.params.id) {
        return hawkModule.respond(400, res, req.credentials, req.artifacts, {
          status: "failure",
          reason: "ID missing"
        }, "application/json");
      }
      Make.findById(req.params.id).where("deletedAt", null).exec(function (err, make) {
        if (err) {
          if (err.name === "CastError") {
            return hawkModule.respond(400, res, req.credentials, req.artifacts, {
              status: "failure",
              reason: "The supplied value does not look like a Make ID."
            }, "application/json");
          } else {
            return hawkModule.respond(500, res, req.credentials, req.artifacts, {
              status: "failure",
              reason: err.toString()
            }, "application/json");
          }
        }
        if (!make) {
          return hawkModule.respond(400, res, req.credentials, req.artifacts, {
            status: "failure",
            reason: "Make Does Not Exist"
          }, "application/json");
        }
        req.make = make;
        next();
      });
    },
    report: function (req, res, next) {
      var make = req.make;
      userRequest("username/" + req.body.maker, function (err, user) {
        if (err) {
          return next(err);
        }
        var report = findUserElem(user.id, make.reports);
        if (!report) {
          make.reports.push({
            userId: user.id
          });
          req.user = user;
          next();
        } else {
          next({
            status: 400,
            message: "User already reported this make"
          });
        }
      });
    },
    cancelReport: function (req, res, next) {
      var make = req.make;

      userRequest("username/" + req.body.maker, function (err, user) {
        if (err) {
          return next(err);
        }
        var report = findUserElem(user.id, make.reports);
        if (report) {
          make.reports.splice(make.reports.indexOf(report), 1);
          req.user = user;
          next();
        } else {
          next({
            status: 400,
            message: "User has not reported this make"
          });
        }
      });
    },
    fieldFilter: function (req, res, next) {
      var sanitizedUpdate = {};
      if (req.isCollab) {
        COLLABORATOR_FIELDS.forEach(function (safeField) {
          sanitizedUpdate[safeField] = req.body[safeField];
        });
        req.body = sanitizedUpdate;
      }
      next();
    },
    like: function (req, res, next) {
      var make = req.make;
      userRequest("username/" + req.body.maker, function (err, user) {
        if (err) {
          return next(err);
        }
        var userLike = findUserElem(user.id, make.likes);
        if (!userLike) {
          make.likes.push({
            userId: user.id
          });
          req.user = user;
          next();
        } else {
          next({
            status: 400,
            message: "User already Likes"
          });
        }
      });
    },
    unlike: function (req, res, next) {
      var make = req.make;
      userRequest("username/" + req.body.maker, function (err, user) {
        if (err) {
          return next(err);
        }
        var userLike = findUserElem(user.id, make.likes);
        if (userLike) {
          make.likes.splice(make.likes.indexOf(userLike), 1);
          req.user = user;
          next();
        } else {
          next({
            status: 400,
            message: "User does not like"
          });
        }
      });
    },
    // modelName must be "make" or "list" only
    checkOwnerApp: function (modelName) {
      if (["make", "list"].indexOf(modelName) === -1) {
        throw new Error(
          "checkOwnerApp middleware can only be configured with 'make' or 'list'. You passed in: '" +
          modelName +
          "'"
        );
      }

      return function (req, res, next) {
        // Don't enforce write permissions if not enabled.
        if (!ENFORCE_WRITE_PERMISSIONS) {
          return next();
        }

        var model = req[modelName],
          user = req.credentials.user;
        // check if the authenticated application has admin permissions, or if it owns the make
        if (req.credentials.admin !== true && user !== model.ownerApp) {
          return hawkModule.respond(403, res, req.credentials, req.artifacts, {
            status: "failure",
            reason: "unauthorized"
          }, "application/json");
        }
        next();
      };
    },
    getUser: function (req, res, next) {
      var email;
      // Support older POST/PUT body formats for Makes
      if (req.body.maker && req.body.make) {
        req.body = req.body.make;
      }

      if (req.body.email) {
        // This is a new Make
        email = req.body.email;
      } else {
        // This is an update/delete
        email = req.make.email;
      }

      userRequest("email/" + email, function (err, user) {
        if (err) {
          return next(err);
        }
        req.user = user;
        req.hatchet.userId = user.id;
        next();
      });
    },
    getRemixMake: function (req, res, next) {
      if (!req.body.remixedFrom) {
        return next();
      }
      Make.findById(req.body.remixedFrom).exec(function (err, make) {
        if (err) {
          return next(err);
        }

        req.hatchet.remixMake = make;

        // we gotta look it up (username)..
        userRequest("email/" + make.email, function (err, user) {
          if (err) {
            if (err.statusCode !== 404) {
              return next(new Error(err.error));
            }
            // don't fail on an account that's been deleted
            return next();
          }

          req.hatchet.remixUser = user;
          next();
        });
      });
    },
    setHatchetEventType: function (type) {
      return function (req, res, next) {
        req.hatchet = {
          type: type
        };
        next();
      };
    },
    getList: function (req, res, next) {
      if (!req.params.id) {
        return hawkModule.respond(400, res, req.credentials, req.artifacts, {
          status: "failure",
          reason: "ID missing"
        }, "application/json");
      }
      List.findById(req.params.id, function (err, list) {
        if (err) {
          if (err.name === "CastError") {
            return hawkModule.respond(400, res, req.credentials, req.artifacts, {
              status: "failure",
              reason: "The supplied value does not look like a List ID."
            }, "application/json");
          } else {
            return hawkModule.respond(500, res, req.credentials, req.artifacts, {
              status: "failure",
              reason: err.toString()
            }, "application/json");
          }
        }
        if (!list) {
          return hawkModule.respond(400, res, req.credentials, req.artifacts, {
            status: "failure",
            reason: "List Does Not Exist"
          }, "application/json");
        }
        req.list = list;
        next();
      });
    },
    getListCreator: function (req, res, next) {
      var id;

      if (req.body && req.body.userId) {
        id = req.body.userId;
      } else if (req.list) {
        id = req.list.userId;
      } else {
        return next(new Error("List Creator ID cannot be found. Check the request parameters"));
      }

      userRequest("id/" + id, function (err, user) {
        if (err) {
          return next(err);
        }

        req.user = user;
        next();
      });
    },
    crossOrigin: function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      next();
    },
    errorHandler: function (err, req, res, next) {
      if (typeof err === "string") {
        console.error("You're passing a string into next(). Go fix this: %s", err);
      }

      var error = {
        message: JSON.stringify(err),
        status: http.STATUS_CODES[err.status] ? err.status : 500
      };

      res.status(error.status);
      res.json(error);
    },
    fourOhFourHandler: function (req, res, next) {
      var err = {
        message: "You found a loose thread!",
        status: 404
      };

      res.status(err.status);
      res.json(err);
    }
  };
};
