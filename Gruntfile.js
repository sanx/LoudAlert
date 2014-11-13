module.exports = function(grunt) {
    // Project configuration.  
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {
                        cwd: 'build/rawjs',
                        src: 'common.js',
                        dest: 'build/js',
                        expand: true
                    },
                    {
                        cwd: 'build/rawjs',
                        src: 'server.js',
                        dest: 'build/js',
                        expand: true
                    }
                ]
            }
        },
        shell: {
            'jsx': {
                command: "node ./node_modules/react-tools/bin/jsx src/js build/rawjs"
            }
        },
        browserify: {
            './build/js/client.js': ['./build/rawjs/client.js']
        },
        watch: {
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['clean', 'default', 'develop'],
                options: {
                    spawn: false
                }
            }
        },
        develop: {
            server: {
                file: 'build/js/server.js',
                nodeArgs: ['--harmony'],
                args: [],
                env: { NODE_ENV: 'development' }
            }
        },
        clean: [
            './build'
        ],
        compass: {
            dist: {
                options: {
                    outputStyle: 'expanded',
                    require: ['susy', 'breakpoint'],
                    sassDir: 'sass',
                    cssDir: '_site/css',
                    watch: true
                }
            }
        }
    });
    // Load Copy plugin.
    grunt.loadNpmTasks('grunt-contrib-copy'); 
    // Load Shell plugin.
    grunt.loadNpmTasks('grunt-shell'); 
    // Load Browserify plugin.
    grunt.loadNpmTasks('grunt-browserify'); 
    // Load Clean plugin.
    grunt.loadNpmTasks('grunt-contrib-clean');
    // Load Watch plugin.
    grunt.loadNpmTasks('grunt-contrib-watch');
    // Load Develop plugin.
    grunt.loadNpmTasks('grunt-develop');
    // Load Compass plugin.
    grunt.loadNpmTasks('grunt-contrib-compass'); 

    grunt.registerTask('default', ['shell:jsx', 'copy:main', 'browserify']);
    //grunt.registerTask('dev', ['']);
};

/* vim: expandtab:tabstop=4:softtabstop=4:shiftwidth=4:set filetype=javascript: */
