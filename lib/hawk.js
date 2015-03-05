/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function () {
  var Hawk = require("hawk");

  return {
    Hawk: Hawk,
    respond: function (code, res, creds, artifacts, payload, contentType) {
      payload = JSON.stringify(payload);

      var headers = {
          "Content-Type": contentType
        },
        header = Hawk.server.header(creds, artifacts, {
          payload: payload,
          contentType: contentType
        });

      headers["Server-Authorization"] = header;

      res.writeHead(code, headers);
      res.end(payload);
    }
  };
};
