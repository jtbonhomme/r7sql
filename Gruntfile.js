/* jshint node:true */

var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
  'use strict';

  var
    _ = grunt.util._,

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  // Shell logging function
  function logShell(err, stdout, stderr, cb) {
    if (err) {
      grunt.log.error('Command failed on ' + HOST.red);
    } else {
      grunt.log.ok('Command executed on ' + HOST.green);
    }
    cb();
  }


  // Project configuration.
  grunt.initConfig({
    dirs: {
      sql:     'sql/',
      tmp:     'tmp/',
      js:      'js/'
    },

    files: {
      all: '**/*',
      js:  '**/*.js',
      sql:  '**/*.sql'
    },

    meta: {
      banner: [
        '/**',
        ' * <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>',
        ' */'
      ].join('\n')
    },

    clean: {
      all: [
        '<%= dirs.tmp %>*'
      ],
      tmp: ['<%= dirs.tmp %>*']
    },


    jshint: {
      files: [
        'Gruntfile.js',
        '<%= dirs.js %><%= files.js %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },


    // Developement tools
    //
    watch: {
      jshint: {
        files: '<%= dirs.js %><%= files.js %>',
        tasks: 'jshint'
      }
    },

    shell: {
      options: {
        failOnError: true,
        callback: logShell,
        stdout: true,
        stderr: true
      },
      ls: {
        command: 'ls -als'
      }
    }
  });


  // Custom tasks
  grunt.registerTask('build',       'Builds the whole webapp',                  ['jshint', 'clean:all', 'build:js', 'build:css', 'index', 'touch:version', 'clean:tmp']);
  grunt.registerTask('watch',       'watch',                                    ['watch']);

/*
  grunt.registerTask('build:css',   'Builds the css',                           ['concat:css']);
  grunt.registerTask('build:js',    'Builds the javacript',                     ['copy:js', 'mince', 'wording', 'copy:worded', 'jst', 'concat:js', 'env', 'dev']);
  grunt.registerTask('build',       'Builds the whole webapp',                  ['jshint', 'clean:all', 'build:js', 'build:css', 'index', 'touch:version', 'clean:tmp']);
  grunt.registerTask('build:min',   'Builds and minifying the whole webapp',    ['build', 'uglify', 'cssmin']);
  grunt.registerTask('build:nolint','Builds the whole webapp without lint',     ['clean:all', 'build:js', 'build:css', 'index', 'touch:version', 'clean:tmp']);

  grunt.registerTask('test',        'Builds and test',                          ['build', 'concat:specs', 'mocha']);
  grunt.registerTask('test:min',    'Builds and test minified version',         ['build:min', 'concat:specs', 'mocha']);
  grunt.registerTask('test:nolint', 'Builds and test without lint',             ['build:nolint', 'concat:specs', 'mocha']);

  grunt.registerTask('pack:prod',   'Packages a webapp for production servers', ['test:min', 'compress:full']);
  grunt.registerTask('pack:wyplay', 'Packages a webapp for wyplay binaries',    ['test:min', 'compress:light']);

  grunt.registerTask('deploy',      'Deploys a webapp on stb',                  ['build', 'shell:deploy']);
  grunt.registerTask('deploy:min',  'Deploys a minified webapp on stb',         ['build:min', 'shell:deploy']);
  grunt.registerTask('deploy:dev',  'Deploys without lint.',                    ['build:nolint', 'shell:deploy']);

  grunt.registerTask('debug',       'Start remote debugging',                   ['shell:stop', 'shell:debug']);
  grunt.registerTask('refresh',     'Restart the qt webkit',                    ['shell:stop', DEBUG ? 'shell:startDebug' : 'shell:start']);

  grunt.registerTask('docs',        'Generates documentation',                  ['yuidoc']);

  // Aliases
  grunt.registerTask('doc', 'docs');
  grunt.registerTask('watch', 'refresh');
*/
  // Default
  grunt.registerTask('default', 'watch');
};
