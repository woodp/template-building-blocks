'use strict';

let gulp = require('gulp');
let jasmine = require('gulp-jasmine');
let nyc = require('nyc');

// Workaround to make sure gulp exits on successful test run.
gulp.doneCallback = (err) => {
    process.exit(err ? 1 : 0);
}
// Run tests
gulp.task('run-tests', () => {
    return gulp.src('spec/**/*.js')
        .pipe(jasmine());
        //.pipe(nyc({}));
});