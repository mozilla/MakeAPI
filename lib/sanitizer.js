/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// This function will sanitize an input string of all illegal characters.
// Illegal characters are all whitespace characters, and any character that
// is not a letter, number, underscore, dash or Unicode character from \u\u00C0-\uFFFF\

module.exports = function sanitize( inputStr ) {
  return inputStr.replace( /[^\w\u00C0-\uFFFF\-\:_%]/g, '' ).replace( /\%3[CE]/g, '' );
};
