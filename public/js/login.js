/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global $ */

$(function () {
  var loginBtn = $(".webmaker-login"),
    logoutBtn = $(".webmaker-logout"),
    errMessage = $("#err-message");

  var auth = new window.WebmakerAuthClient({
    csrfToken: $("meta[name=\"csrf-token\"]").attr("content"),
    handleNewUserUI: false
  });

  function onLogin(user) {
    if (user.isAdmin || user.isCollaborator) {
      window.location.replace("./admin");
    } else {
      loginBtn.hide();
      logoutBtn.show();
      errMessage.html("Your account is not authorised to use this tool.").show();
    }
  }

  function onLogout() {
    logoutBtn.hide();
    errMessage.html("").hide();
    loginBtn.show();
  }

  function onError() {
    errMessage.html("Authentication failed.").show();
  }

  loginBtn.click(auth.login);
  logoutBtn.click(auth.logout);

  auth.on("login", onLogin);
  auth.on("logout", onLogout);
  auth.on("error", onError);

  auth.verify();
});
