var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");

gulp.task("default", ["css", "img", "browserify"]);

gulp.task("css", function () {
    return gulp.src('src/css/*').pipe(gulp.dest('dist/css'));
})

gulp.task("img", function () {
  return gulp.src('src/img/*').pipe(gulp.dest('dist/img'));
})

gulp.task("browserify", function () {
    return browserify({
        basedir: '.',
        debug: true,
        entries: ['src/scripts/main.tsx'],
        cache: {},
        packageCache: {}
    })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function() {
    gulp.watch('src/**/*.{ts,tsx}', ['browserify']);
    gulp.watch('src/**/*.css', ['css']);
    gulp.watch('src/img/*', ['img']);
});
