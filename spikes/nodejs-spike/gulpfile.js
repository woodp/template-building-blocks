'use strict';

let gulp = require('gulp');
let jasmine = require('gulp-jasmine');
let nyc = require('nyc');
// Run tests
gulp.task('run-tests', () => {
    //return gulp.src('spec/resourcesSpec.js')
    return gulp.src('spec/**/*.js')
        .pipe(jasmine());
        //.pipe(nyc({}));
})