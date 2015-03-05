/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (Mongoose) {
  var listSchema = new Mongoose.Schema({
    makes: {
      type: [String]
    },
    userId: {
      type: Number,
      required: true
    },
    ownerApp: {
      type: String,
      required: true
    },
    title: {
      type: String
    },
    description: {
      type: String
    }
  });

  listSchema.virtual("id").get(function () {
    return this._id;
  });

  var List = Mongoose.model("List", listSchema);

  List.updateFields = [
    "makes",
    "title",
    "description"
  ];

  return List;
};
