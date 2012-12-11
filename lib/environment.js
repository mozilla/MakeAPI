/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


// This is for Heroku
if (process.env.REDISTOGO_URL){
  process.env.REDIS_URL = process.env.REDISTOGO_URL
}

module.exports = new require('habitat');
