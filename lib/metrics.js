/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require("./environment");

var options = {
  host: env.get("STATSD_HOST"),
  port: env.get("STATSD_PORT"),
  prefix: env.get("STATSD_PREFIX") || env.get("NODE_ENV") + ".makeapi",
  // If we don't have a host configured, use a mock object (no stats sent).
  mock: !env.get("STATSD_HOST")
};

module.exports = new(require("node-statsd").StatsD)(options);
