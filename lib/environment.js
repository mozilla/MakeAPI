/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


//TODO: see if there's a better way to do this, perhaps just in the env config on heroku -- use bash substitution?

// Condition env vars for Heroku
if (process.env.REDISTOGO_URL){
  process.env.REDIS_URL = process.env.REDISTOGO_URL
}

if (process.env.MONGOHQ_URL){
  process.env.MONGO_URL = process.env.MONGOHQ_URL
}


module.exports = new require('habitat');
