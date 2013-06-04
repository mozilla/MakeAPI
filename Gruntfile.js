module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    csslint: {
      files: [
        "public/gallery/**/*.css",
        "public/stylesheets/search.css"
      ]
    },
    jshint: {
      options: {
        es5: true,
        newcap: false
      },
      files: [
        "Gruntfile.js",
        "server.js",
        "lib/**/*.js",
        "public/js/*.js",
        "routes/**/*.js",
        "test/**/*.js"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "csslint", "jshint" ]);
};
