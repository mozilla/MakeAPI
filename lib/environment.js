module.exports = (function () {
  var Habitat = require("habitat");
  Habitat.load(require("path").resolve(__dirname, "../.env"));
  return new Habitat();
}());
