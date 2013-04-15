module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    csslint: {
      files: [
        "public/**/*.css"
      ]
    },
    jshint: {
      files: [
        "Gruntfile.js",
        "server.js",
        "lib/**/*.js",
        "public/**/*.js",
        "routes/**/*.js"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "csslint", "jshint" ]);
};
