// plugins for development
var gulp = require('gulp'),
	rimraf = require('rimraf'),
	jade = require('gulp-jade'),
	sass = require('gulp-sass'),
	inlineimage = require('gulp-inline-image'),
	prefix = require('gulp-autoprefixer'),
	plumber = require('gulp-plumber'),
	dirSync = require('gulp-directory-sync'),
	browserSync = require('browser-sync').create(),
	concat = require('gulp-concat'),
	cssfont64 = require('gulp-cssfont64'),
	sourcemaps = require('gulp-sourcemaps'),
	postcss = require('gulp-postcss');
	assets  = require('postcss-assets');

// plugins for build
var purify = require('gulp-purifycss'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	csso = require('gulp-csso');

//plugins for testing
var html5Lint = require('gulp-html5-lint');

var assetsDir = 'assets/';
var outputDir = 'dist/';
var buildDir = 'build/';

//----------------------------------------------------Styleguide
var styleguide = require('sc5-styleguide');
var styleguidePath = 'styleguide'; // папка, куда будет генерироваться стайлгайд
var overviewPath = assetsDir + 'sass/styleguide.md'; //путь до описания стайлгайда
var scssRoot = assetsDir + 'sass/main_global.scss'; // путь до главного sass-файла

gulp.task('styleguide:generate', function() {
	return gulp.src(assetsDir + 'sass/**/*.scss')
		.pipe(styleguide.generate({
			title: 'Glivera team framework',
			enableJade: true,
			server: true,
			rootPath: styleguidePath,
			overviewPath: overviewPath,
			disableHtml5Mode: true,
			extraHead: [
				'<style>html {font-size:10px} body {font-size:16px}</style>',
				'<script src="https://code.jquery.com/jquery-1.12.4.js"></script>',
				'<script src="/dev_scripts/all.js"></script>',
				'<script src="/dev_scripts/main.js"></script>'
			]
		}))
		.pipe(gulp.dest(styleguidePath));
});

gulp.task('styleguide:applystyles', function() {
	return gulp.src(scssRoot)
		.pipe(sass({
			errLogToConsole: true
		}))
		.pipe(styleguide.applyStyles())
		.pipe(gulp.dest(styleguidePath));
});

gulp.task('styleguide:copyFonts', function () {
	return gulp.src('')
		.pipe(plumber())
		.pipe(dirSync(assetsDir + 'fonts/', styleguidePath + '/fonts/', {printSummary: true}))
		.pipe(browserSync.stream());
});

gulp.task('styleguide:copyImages', function () {
	return gulp.src('')
		.pipe(plumber())
		.pipe(dirSync(assetsDir + 'i/', styleguidePath + '/i/', {printSummary: true}))
		.pipe(browserSync.stream());
});

gulp.task('styleguide:copyScripts', function () {
	return gulp.src('')
		.pipe(plumber())
		.pipe(dirSync(outputDir + 'js/', styleguidePath + '/dev_scripts/', {printSummary: true}))
		.pipe(browserSync.stream());
});

gulp.task('styleguide', ['styleguide:generate', 'styleguide:applystyles','styleguide:copyFonts','styleguide:copyImages','styleguide:copyScripts']);
//----------------------------------------------------Styleguide###

//----------------------------------------------------Compiling
gulp.task('jade', function () {
	gulp.src([assetsDir + 'jade/*.jade', '!' + assetsDir + 'jade/_*.jade'])
		.pipe(plumber())
		.pipe(jade({pretty: true}))
		.pipe(gulp.dest(outputDir))
		.pipe(browserSync.stream());
});

gulp.task('sass', function () {
	gulp.src([assetsDir + 'sass/**/*.scss', '!' + assetsDir + 'sass/**/_*.scss'])
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(inlineimage())
		.pipe(prefix('last 3 versions'))
		.pipe(postcss([assets({
			basePath:outputDir,
			loadPaths: ['i/']
		})]))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(outputDir + 'styles/'))
		.pipe(browserSync.stream());
});

gulp.task('jsConcat', function () {
	return gulp.src(assetsDir + 'js/all/**/*.js')
		.pipe(concat('all.js', {newLine: ';'}))
		.pipe(gulp.dest(outputDir + 'js/'))
		.pipe(browserSync.stream());
});

gulp.task('fontsConvert', function () {
	return gulp.src([assetsDir + 'fonts/*.woff', assetsDir + 'fonts/*.woff2'])
		.pipe(cssfont64())
		.pipe(gulp.dest(outputDir + 'styles/'))
		.pipe(browserSync.stream());
});

//----------------------------------------------------Compiling###

//-------------------------------------------------Synchronization
gulp.task('imageSync', function () {
	return gulp.src('')
		.pipe(plumber())
		.pipe(dirSync(assetsDir + 'i/', outputDir + 'i/', {printSummary: true}))
		.pipe(browserSync.stream());
});

gulp.task('fontsSync', function () {
	return gulp.src('')
		.pipe(plumber())
		.pipe(dirSync(assetsDir + 'fonts/', outputDir + 'fonts/', {printSummary: true}))
		.pipe(browserSync.stream());
});

gulp.task('jsSync', function () {
	return gulp.src(assetsDir + 'js/*.js')
		.pipe(plumber())
		.pipe(gulp.dest(outputDir + 'js/'))
		.pipe(browserSync.stream());
});
//-------------------------------------------------Synchronization###


//watching files and run tasks
gulp.task('watch', function () {
	gulp.watch(assetsDir + 'jade/**/*.jade', ['jade']);
	gulp.watch(assetsDir + 'sass/**/*.scss', ['sass','styleguide']);
	gulp.watch(assetsDir + 'js/**/*.js', ['jsSync','styleguide:copyScripts']);
	gulp.watch(assetsDir + 'js/all/**/*.js', ['jsConcat']);
	gulp.watch(assetsDir + 'i/**/*', ['imageSync','styleguide:copyImages']);
	gulp.watch(assetsDir + 'fonts/**/*', ['fontsSync', 'fontsConvert']);
});

//livereload and open project in browser
gulp.task('browser-sync', function () {
	browserSync.init({
		port: 1337,
		server: {
			baseDir: outputDir
		}
	});
});


//---------------------------------building final project folder
//clean build folder
gulp.task('cleanBuildDir', function (cb) {
	rimraf(buildDir, cb);
});


//minify images
gulp.task('imgBuild', function () {
	return gulp.src(outputDir + 'i/**/*')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest(buildDir + 'i/'))
});

//copy fonts
gulp.task('fontsBuild', function () {
	return gulp.src(outputDir + 'fonts/**/*')
		.pipe(gulp.dest(buildDir + 'fonts/'))
});

//copy html
gulp.task('htmlBuild', function () {
	return gulp.src(outputDir + '**/*.html')
		.pipe(gulp.dest(buildDir))
});

//copy and minify js
gulp.task('jsBuild', function () {
	return gulp.src(outputDir + 'js/**/*')
		.pipe(uglify())
		.pipe(gulp.dest(buildDir + 'js/'))
});

//copy, minify css
gulp.task('cssBuild', function () {
	return gulp.src(outputDir + 'styles/**/*')
		.pipe(purify([outputDir + 'js/**/*', outputDir + '**/*.html']))
		.pipe(csso())
		.pipe(gulp.dest(buildDir + 'styles/'))
});


//--------------------------------------------If you need iconfont
// var iconfont = require('gulp-iconfont'),
// 	iconfontCss = require('gulp-iconfont-css'),
// 	fontName = 'iconfont';
// gulp.task('iconfont', function () {
// 	gulp.src([assetsDir + 'i/icons/*.svg'])
// 		.pipe(iconfontCss({
// 			path: 'assets/sass/templates/_icons_template.scss',
// 			fontName: fontName,
// 			targetPath: '../../sass/_icons.scss',
// 			fontPath: '../fonts/icons/',
// 			svg: true
// 		}))
// 		.pipe(iconfont({
// 			fontName: fontName,
// 			svg: true,
// 			formats: ['svg','eot','woff','ttf']
// 		}))
// 		.pipe(gulp.dest('assets/fonts/icons'));
// });

//--------------------------------------------If you need svg sprite
// var svgSprite = require('gulp-svg-sprites'),
// 	svgmin = require('gulp-svgmin'),
// 	cheerio = require('gulp-cheerio'),
// 	replace = require('gulp-replace');
//
// gulp.task('svgSpriteBuild', function () {
// 	return gulp.src(assetsDir + 'i/icons/*.svg')
// 		// minify svg
// 		.pipe(svgmin({
// 			js2svg: {
// 				pretty: true
// 			}
// 		}))
// 		// remove all fill and style declarations in out shapes
// 		.pipe(cheerio({
// 			run: function ($) {
// 				$('[fill]').removeAttr('fill');
// 				$('[style]').removeAttr('style');
// 			},
// 			parserOptions: { xmlMode: true }
// 		}))
// 		// cheerio plugin create unnecessary string '&gt;', so replace it.
// 		.pipe(replace('&gt;', '>'))
// 		// build svg sprite
// 		.pipe(svgSprite({
// 				mode: "symbols",
// 				preview: false,
// 				selector: "icon-%f",
// 				svg: {
// 					symbols: 'symbol_sprite.html'
// 				}
// 			}
// 		))
// 		.pipe(gulp.dest(assetsDir + 'i/'));
// });
// // create sass file for our sprite
// gulp.task('svgSpriteSass', function () {
// 	return gulp.src(assetsDir + 'i/icons/*.svg')
// 		.pipe(svgSprite({
// 				preview: false,
// 				selector: "icon-%f",
// 				svg: {
// 					sprite: 'svg_sprite.html'
// 				},
// 				cssFile: '../sass/_svg_sprite.scss',
// 				templates: {
// 					css: require("fs").readFileSync(assetsDir + 'sass/templates/_sprite_template.scss', "utf-8")
// 				}
// 			}
// 		))
// 		.pipe(gulp.dest(assetsDir + 'i/'));
// });
// gulp.task('svgSprite', ['svgSpriteBuild', 'svgSpriteSass']);

//testing your build files
gulp.task('validation', function () {
	return gulp.src(buildDir + '**/*.html')
		.pipe(html5Lint());
});

gulp.task('default', ['jade', 'sass', 'imageSync', 'fontsSync', 'fontsConvert', 'jsConcat', 'jsSync', 'watch', 'browser-sync','styleguide']);

gulp.task('build', ['cleanBuildDir'], function () {
	gulp.start('imgBuild', 'fontsBuild', 'htmlBuild', 'jsBuild', 'cssBuild');
});

