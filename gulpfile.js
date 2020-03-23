'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var prefix = require('gulp-autoprefixer');
var strip_comments = require('gulp-strip-json-comments');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var cleanCSS = require('gulp-clean-css');

// Allows gulp --dev to be run for a more verbose output
var isProduction = true;
var sassStyle = 'compressed';
var sourceMap = false;

if ( gutil.env.dev === true ) {
    sassStyle = 'expanded';
    sourceMap = true;
    isProduction = false;
}

gulp.task('sass', function () {
    gulp.src(['./assets/scss/app.scss'])
        .pipe(plumber())
        .pipe(!isProduction ? sourcemaps.init() : gutil.noop())
        .pipe(
            sass({
                outputStyle: sassStyle,
                includePaths: [
                    './node_modules/bootstrap-sass/assets/stylesheets/'
                ]
            })
            .on('error', sass.logError)
        )
        .pipe(strip_comments())
        .pipe(!isProduction ? sourcemaps.write() : gutil.noop())
        .pipe(isProduction ? prefix({
            browsers: ['last 20 version', 'Firefox 4', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }) : gutil.noop())
        .pipe(isProduction ? cleanCSS({compatibility: 'ie8'}) : gutil.noop())
        .pipe(gulp.dest('./assets/deploy/css'));
});

gulp.task('js', function () {
    return gulp.src('./assets/js/**')
        .pipe(concat('all.js'))
        .pipe((gutil.env.dev === true) ? gutil.noop() : uglify())
        .pipe(gulp.dest('./assets/deploy/js'));
});

gulp.task('watch', function() {
    gulp.watch('./assets/scss/**/*.*', ['sass']);
    gulp.watch(['./assets/js/*.js'], ['js']);
});

gulp.task('default', ['sass', 'js', 'watch']);
