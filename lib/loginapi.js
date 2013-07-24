/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// webmaker-loginapi only exposes it's utility methods if you initialize it with an
// Express instance and an options object with `loginURL` and `audience` defined.

module.exports = function( app, options ) {
  module.exports = require("webmaker-loginapi")( app, options );
};
