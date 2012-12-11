/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
Sequelize = require('sequelize');

module.exports.schema = {
  url: {
    type: Sequelize.STRING,
    validate: {
      notNull: true,
      notEmpty: true,
      isUrl: true
    }
  }
};

module.exports.classMethods = {
};

module.exports.instanceMethods = {
};
