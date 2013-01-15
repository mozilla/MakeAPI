/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

require('../../lib/extensions/object');

var makes = {
  aFineMake: {
    url: "http://thimble.webmaker.org/p/fj6v",
    contentType: "text/html",
    locale: "en_us",
    title: "Soapbox - Let your voice be heard",
    body: "<h1>Make Your Own Rant Page</h1><p>blah blah blah, this is your pulpit.</p>",
    difficulty: 'Beginner',
    author: "simon@simonwex.com",
    contentAuthor: 'swex@mozilla.com',
    published: true
  },
  aReallyCrapBrokenMake: {
    url: "notaurl",
    contentType: null,
    locale: "en_us",
    title: "",
    description: "",
    author: "notanemail",
    published: true
  },
  aMakeWithGoodIntentionsButStillNoGood: {
    url: "ftp://blahblah.com/",
    contentType: 'text/json',
    locale: "en_us",
    title: null,
    description: "",
    author: "notanemail",
    published: false
  },
  aMakeWithInvalidRemix: {
    remixedFrom: 'garbage',

    url: "http://thimble.webmaker.org/p/fj6v",
    contentType: "text/html",
    locale: "en_us",
    title: "Soapbox - Let your voice be heard",
    body: "<h1>Make Your Own Rant Page</h1><p>blah blah blah, this is your pulpit.</p>",
    difficulty: 'Beginner',
    author: "simon@simonwex.com",
    contentAuthor: 'swex@mozilla.com',

    published: true
  },
};


module.exports = makes;
/*

{
    id:
    version: 
    url: 
    contentType:
    locale: 
    title: 
    description: 
    author: 
    contentAuthor:
    published:
    createdAt:
    updatedAt:
    deletedAt:
  }
  */
