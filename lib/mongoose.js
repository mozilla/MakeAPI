/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);


//TODO: Write some connection error handling code
// if connecting on the default mongoose connection
// mongoose.connection.on('error', handleError);

module.exports = mongoose;
