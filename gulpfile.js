'use strict';

let gulp = require('gulp');
let jasmine = require('gulp-jasmine');
let istanbul = require('gulp-istanbul');
let eslint = require('gulp-eslint');

gulp.task('pre-test', () =>{
    return gulp.src(['src/core/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

// Run tests
gulp.task('run-tests-with-coverage', ['pre-test'], () => {
    global.testConfiguration = {
        runTransform : (process.env.RUN_TRANSFORM) ? (process.env.RUN_TRANSFORM === 'true') : true
    };

    return gulp.src('test/**/*.js')
        .pipe(jasmine())
        .pipe(istanbul.writeReports());
});

gulp.task('run-tests', () => {
    global.testConfiguration = {
        runTransform : true
    };

    return gulp.src('test/**/*.js')
        .pipe(jasmine());
});

gulp.task('run-eslint', () => {
    return gulp.src(['src/**/*.js', 'test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});