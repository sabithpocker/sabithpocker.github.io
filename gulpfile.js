const { src, dest, series, watch } = require("gulp");
const terser = require("gulp-terser");
const sass = require("gulp-sass");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const postcss = require("gulp-postcss");
const browserSync = require("browser-sync").create();

const minifyJS = () =>
  src("./src/js/**/*.js").pipe(terser()).pipe(dest("./dist/js"));

const sassToCss = () =>
  src("./src/sass/**/*.sass").pipe(sass()).pipe(dest("./src/css"));

const postCss = () =>
  src("./src/css/**/*.css")
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest("./dist/css"));

const reloadBrowser = (done) => {
  browserSync.reload();
  done();
};

const serve = () =>
  browserSync.init({
    server: {
      baseDir: "./",
    },
  });

exports.default = () => {
  serve();
  watch(
    ["./src/js/**/*.js", "./src/sass/**/*.sass"],
    series(minifyJS, sassToCss, postCss, reloadBrowser)
  );
};

exports.build = (done) => {
  series(minifyJS, sassToCss, postCss);
  done();
};
