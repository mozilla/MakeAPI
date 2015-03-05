/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require("../../environment"),
  hyperquest = require("hyperquest");

var loginServerUrl = env.get("LOGIN_SERVER_URL_WITH_AUTH", "http://localhost:3000"),
  getUserURL = require("url").resolve(loginServerUrl, "/user/username/"),
  LOGINAPI_ERR = "Error building user search query: ";

var generic = require("./generic");

module.exports = function likesFilter(username, filterOccurence, callback) {
  var get = hyperquest.get({
    headers: {
      "Content-Type": "application/json"
    },
    uri: getUserURL + username
  });

  get.on("error", function (err) {
    callback({
      error: LOGINAPI_ERR + "Login API request failed",
      code: 500
    });
  });

  get.on("response", function (resp) {
    // 404 on a username doesn't necessarily mean we don't want the search to execute
    if ([200, 404].indexOf(resp.statusCode) === -1) {
      return callback({
        error: LOGINAPI_ERR + "Received a status code of " + resp.statusCode,
        code: resp.statusCode || 500
      });
    }
    var bodyParts = [],
      bytes = 0;

    resp.on("data", function (data) {
      bodyParts.push(data);
      bytes += data.length;
    });

    resp.on("end", function () {
      var responseBody = Buffer.concat(bodyParts, bytes).toString("utf8");

      try {
        responseBody = JSON.parse(responseBody);
      } catch (exception) {
        return callback({
          error: LOGINAPI_ERR + "Unable to parse Login API response body",
          code: 500
        });
      }

      // Check that a user object was found
      if (!responseBody.user) {
        if (filterOccurence === "or") {
          // If this is an OR filtered query, ignore the undefined user
          // because the search may return results for other fields in the query
          return callback(null, null);
        } else {
          // invalid username, 404 the request
          return callback({
            code: 404
          });
        }
      }

      var filter = generic.generateSearchFilter("term", {
        "likes.userId": responseBody.user.id
      });

      callback(null, filter);
    });
  });
};
