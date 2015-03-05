/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function () {
  // User Tags are "some@something.com:foo", which means two
  // strings, joined with a ':', and the first string contains
  // an email address (i.e., an '@').
  var userTagRegex = /^([^@]+@[^@]+)\:[^:]+/,

    // Raw Tags are "foo" or "#fooBar", which means one string
    // which does not include a colon.
    rawTagRegex = /^[^:]+$/,

    // Trim any whitespace around tags
    trimWhitespace = function (tags) {
      return tags.map(function (val) {
        return val.trim();
      });
    };

  return {
    isTagChangeAllowed: function (tag, user, isAdmin) {
      if (isAdmin || rawTagRegex.test(tag)) {
        return true;
      }

      var taggedEmail = userTagRegex.exec(tag);

      if (user && taggedEmail && taggedEmail[1] === user.email) {
        return true;
      }

      return false;
    },
    validateTags: function (tags, user) {
      var taggedEmail;

      tags = trimWhitespace(tags);

      return tags.filter(function (val) {
        // allow if user is an admin, or val is a raw tag
        if ((user && user.isAdmin) || rawTagRegex.test(val)) {
          return true;
        }

        taggedEmail = userTagRegex.exec(val);

        // Allow if val is a user tag, and user is logged in
        if (user && taggedEmail && taggedEmail[1] === user.email) {
          return true;
        }

        return false;
      });
    }
  };
};
