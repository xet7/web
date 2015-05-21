var path		= require('path'),
	http		= require('http'),
	express		= require('express'),
	staticGzip	= require('connect-gzip-static'),
	livereload	= require('connect-livereload'),
	config		= require('./gulp/config'),
	paths		= require('./gulp/paths');

module.exports = function () {
	var app = express();

	// default index redirect
	app.use(function (req, res, next) {
		if (req.url == '/')
			req.url = '/index.html';

		console.log('serve', req.url);
		res.setHeader('X-Powered-By', 'Darth Vader');
		next();
	});

	// inject livereload
	app.use(livereload({
		port: config.livereloadListenPort
	}));

	// serve content, search for pre-compiled gzip with gracefully fallback to plaintext
	['css', 'img', 'js', 'translations', 'vendor'].forEach(function (folder) {
		app.use(staticGzip(paths.output + '/' + folder));
	});

	// server index
	app.use(staticGzip(paths.output));

	// html5 support
	app.all('/*', function(req, res, next) {
		if (req.url.endsWith('.html')) {
			res.status(404)
				.send('Not found');
			return;
		}

		req.url = '/index.html';

		staticGzip(paths.output)(req, res, next);
	});

	// woa!
	var server = http.Server(app);
	server.listen(config.listenPort, config.listenAddress);

	console.log('Serving content from ' + path.resolve(__dirname, paths.output));
	console.log('LISTENING ON ' + config.listenAddress + ':' + config.listenPort);
};