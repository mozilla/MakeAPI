/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var 
Sequelize = require("sequelize"),
validator = require("validator"),
uuid      = require("node-uuid");


module.exports.schema = {
  version: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true,
      notNull: true
    }
  },
  url: {
    type: Sequelize.STRING,
    validate: {
      isUrl: true
    }
  },
  contentType: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
      notNull: true
    }
  },
  locale: {
    type: Sequelize.STRING,
    defaultValue: 'en_us',
    validate: {
      notEmpty: true,
      notNull: true
    }
  },
  title: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
      notNull: true
    }
  },
  description: Sequelize.TEXT,
  author: {
    type: Sequelize.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contentAuthor: {
    type: Sequelize.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  publishedAt: {
    type: Sequelize.DATE
  }
};

module.exports.callbacks = {
};

module.exports.classMethods = {
};

module.exports.instanceMethods = {
};
