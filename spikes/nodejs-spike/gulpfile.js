'use strict';

let gulp = require('gulp');
let jasmine = require('gulp-jasmine');
//let nyc = require('nyc');
let istanbul = require('gulp-istanbul');

// Workaround to make sure gulp exits on successful test run.
gulp.doneCallback = (err) => {
    //process.exit(err ? 1 : 0);
    process.kill(process.pid);
}

gulp.task('pre-test', () =>{
    return gulp.src(['core/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

// Run tests
gulp.task('run-tests-with-coverage', ['pre-test'], () => {
    return gulp.src('spec/**/*.js')
        .pipe(jasmine())
        .pipe(istanbul.writeReports());
        //.pipe(nyc({}));
});

gulp.task('run-tests', () => {
    return gulp.src('spec/**/*.js')
        .pipe(jasmine());
        //.pipe(nyc({}));
});