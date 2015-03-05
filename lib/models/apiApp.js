/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (mongoose) {
  var validate = require("mongoose-validator").validate;

  var schema = new mongoose.Schema({
    privatekey: {
      type: String,
      required: true,
      unique: true
    },
    publickey: {
      type: String,
      required: true,
      unique: true
    },
    domain: {
      type: String,
      required: true
    },
    revoked: {
      type: Boolean,
      required: true,
      "default": false
    },
    contact: {
      type: String,
      required: true,
      validate: validate("isEmail")
    },
    admin: {
      type: Boolean,
      required: true,
      "default": false
    }
  });

  var ApiApp = mongoose.model("ApiApp", schema);

  return ApiApp;
};
