/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

var env = require("../lib/environment");

module.exports = function (apiAppModel) {
  var uuid = require("uuid"),
    App = apiAppModel,
    audience = env.get("AUDIENCE"),
    login = env.get("LOGIN_SERVER"),
    personaHostname = env.get("PERSONA_HOSTNAME", "https://login.persona.org");

  return {
    admin: function (req, res) {
      res.render("admin.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.csrfToken(),
        iscollaborator: req.isCollab ? 1 : 0,
        personaHostname: personaHostname
      });
    },
    login: function (req, res) {
      res.render("login.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.csrfToken(),
        personaHostname: personaHostname
      });
    },
    addApp: function (req, res) {
      var newApp = req.body;

      if (!newApp.contact || !newApp.domain) {
        return res.json(400, {
          error: "Missing data"
        });
      }

      newApp.privatekey = uuid.v4();
      newApp.publickey = uuid.v4();
      newApp.revoked = false;
      newApp.admin = false;

      var app = new App(newApp);

      app.save(function (err, app) {
        if (err) {
          res.json(500, {
            error: err
          });
        } else {
          res.json({
            app: app
          });
        }
      });
    }
  };
};
