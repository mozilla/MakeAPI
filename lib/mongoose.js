/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var mongoose = require("mongoose"),
  env = require("./environment"),
  isDbOnline = false,
  storedError = "Database connection is not online.";

function defaultDbReadyFn(err) {
  if (err) {
    storedError = err.toString();
    console.log("Failed to connect to MongoDB - " + storedError);
  }
}

module.exports = function (dbReadyFn) {
  dbReadyFn = dbReadyFn || defaultDbReadyFn;

  if (!isDbOnline) {
    mongoose.connection.on("open", function () {
      isDbOnline = true;
      dbReadyFn();
    });

    mongoose.connection.on("error", function (err) {
      isDbOnline = false;
      dbReadyFn(err);
    });

    mongoose.connect(
      env.get("MONGOLAB_URI") ||
      env.get("MONGOHQ_URL") ||
      env.get("MONGO_URL")
    );
  }

  return {
    mongoInstance: function () {
      return mongoose;
    },
    isDbOnline: function (req, res, next) {
      if (isDbOnline) {
        return next();
      }

      next(new Error(storedError));
    }
  };
};
