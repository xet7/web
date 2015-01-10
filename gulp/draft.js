// Run unit tests
gulp.task('test:scripts', function() {
	return gulp.src([paths.test.input].concat([paths.test.spec]))
		.pipe(plg.plumber())
		.pipe(plg.karma({ configFile: paths.test.karma }))
		.on('error', function(err) { throw err; });
});

// Generate documentation
gulp.task('build:docs', ['compile', 'clean:docs'], function() {
	return gulp.src(paths.docs.input)
		.pipe(plg.plumber())
		.pipe(plg.fileInclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(plg.tap(function (file, t) {
			if ( /\.md|\.markdown/.test(file.path) ) {
				return t.through(plg.markdown);
			}
		}))
		.pipe(plg.header(fs.readFileSync(paths.docs.templates + '/_header.html', 'utf8')))
		.pipe(plg.footer(fs.readFileSync(paths.docs.templates + '/_footer.html', 'utf8')))
		.pipe(gulp.dest(paths.docs.output));
});

// Copy distribution files to docs
gulp.task('copy:dist', ['compile', 'clean:docs'], function() {
	return gulp.src(paths.output + '/**')
		.pipe(plg.plumber())
		.pipe(gulp.dest(paths.docs.output + '/dist'));
});

// Copy documentation assets to docs
gulp.task('copy:assets', ['clean:docs'], function() {
	return gulp.src(paths.docs.assets)
		.pipe(plg.plumber())
		.pipe(gulp.dest(paths.docs.output + '/assets'));
});

// Remove pre-existing content from docs folder
gulp.task('clean:docs', function () {
	return del.sync(paths.docs.output);
});

// Generate SVG sprites
gulp.task('build:svgs', ['clean:dist'], function () {
	return gulp.src(paths.svgs.input)
		.pipe(plg.plumber())
		.pipe(plg.tap(function (file, t) {
			if ( file.isDirectory() ) {
				var name = file.relative + '.svg';
				return gulp.src(file.path + '/*.svg')
					.pipe(plg.svgmin())
					.pipe(plg.svgstore({
						fileName: name,
						prefix: 'icon-',
						inlineSvg: true
					}))
					.pipe(gulp.dest(paths.svgs.output));
			}
		}))
		.pipe(plg.svgmin())
		.pipe(plg.svgstore({
			fileName: 'icons.svg',
			prefix: 'icon-',
			inlineSvg: true
		}))
		.pipe(gulp.dest(paths.svgs.output));
});

// Generate documentation
gulp.task('docs', [
	'clean:docs',
	'build:docs',
	'copy:dist',
	'copy:assets'
]);

// Generate documentation
gulp.task('tests', [
	'test:scripts'
]);