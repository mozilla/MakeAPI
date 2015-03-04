var env = require("../lib/environment"),
  hyperquest = require("hyperquest"),
  sanitize = require("./sanitizer"),
  url = require("url");

var getByEmailsURL = url.resolve(env.get("LOGIN_SERVER_URL_WITH_AUTH"), "/usernames");

module.exports = function (Make) {
  return function (makes, callback) {
    var emails = makes.slice().map(function (hit) {
      return hit._source.email;
    }).filter(function (email, pos, self) {
      return self.indexOf(email) === pos;
    });

    var get = hyperquest.post(getByEmailsURL, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    get.on("error", function (err) {
      callback(new Error("Error fetching usernames: Login API request failed"));
    });

    get.on("response", function (resp) {
      if (resp.statusCode !== 200) {
        return callback(new Error("Error fetching usernames: Received a status code of " + resp.statusCode));
      }
      var bodyParts = [],
        bytes = 0;
      resp.on("data", function (data) {
        bodyParts.push(data);
        bytes += data.length;
      });

      resp.on("end", function () {
        var responseBody = Buffer.concat(bodyParts, bytes).toString("utf8"),
          mappedUsers;

        try {
          mappedUsers = JSON.parse(responseBody);
        } catch (e) {
          return callback(new Error("Error fetching usernames: Unable to parse Login API response body"));
        }

        makes = makes.map(function (esMake) {
          var safeMake = {},
            source = esMake._source,
            userData = mappedUsers[source.email];

          Make.publicFields.forEach(function (val) {
            safeMake[val] = source[val];
          });

          // _id, createdAt and updatedAt are not a part of our public fields.
          // We need to manually assign it to the object we are returning
          safeMake._id = esMake._id;
          safeMake.createdAt = source.createdAt;
          safeMake.updatedAt = source.updatedAt;

          safeMake.tags = source.tags.map(sanitize);

          if (userData) {
            // Attach the Maker's username and return the result
            safeMake.username = userData.username;
            safeMake.emailHash = userData.emailHash;
          } else {
            // The user account was likely deleted.
            // We need cascading delete, so that this code will only be hit on rare circumstances
            // cron jobs can be used to clean up anything that slips through the cracks.
            safeMake.username = "";
            safeMake.emailHash = "";
          }
          return safeMake;
        });
        callback(null, makes);
      });
    });
    get.end(JSON.stringify(emails), "utf8");
  };
};
