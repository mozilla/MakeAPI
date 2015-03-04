module.exports = function( grunt ) {

  var jsbeautifyrc = grunt.file.readJSON("node_modules/mofo-style/linters/.jsbeautifyrc");
  var jscsrc = grunt.file.readJSON("node_modules/mofo-style/linters/.jscsrc");
  var jshintrc = grunt.file.readJSON("node_modules/mofo-style/linters/.jshintrc");

  var javaScriptFiles = [
    "Gruntfile.js",
    "server.js",
    "lib/**/*.js",
    "public/js/*.js",
    "routes/**/*.js",
    "test/**/*.js"
  ];
  var jsbeautifyrcReadOnly = jsbeautifyrc;
  jsbeautifyrcReadOnly.mode = "VERIFY_ONLY";

  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    csslint: {
      files: [
        "public/gallery/**/*.css",
        "public/stylesheets/search.css"
      ]
    },
    jshint: {
      options: jshintrc,
      files: javaScriptFiles
    },
    jsbeautifier: {
      modify: {
        src: javaScriptFiles,
        options: jsbeautifyrc
      },
      verify: {
        src: javaScriptFiles,
        options: jsbeautifyrcReadOnly
      }
    },
    jscs: {
      src: javaScriptFiles,
      options:jscsrc
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );
  grunt.loadNpmTasks( "grunt-jsbeautifier" );
  grunt.loadNpmTasks( "grunt-jscs" );

  grunt.registerTask( "clean", [ "jsbeautifier:modify" ] );

  grunt.registerTask( "validate", [ "jsbeautifier:verify", "jshint", "jscs", "csslint" ] );

  grunt.registerTask( "default", [ "validate" ] );
};
