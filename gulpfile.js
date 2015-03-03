var gulp = require('gulp');
var jshint = require('gulp-jshint');

var paths = {
    js: 'src/**/*.js',
    test: 'test/**/*.js'
};

gulp.task('lint', function() {
    return gulp.src([paths.js, paths.test])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function() {
    gulp.watch([paths.js, paths.test], ['lint']);
});

gulp.task('default', ['watch', 'lint']);