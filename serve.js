var Promise		= require('bluebird');

var fs			= Promise.promisifyAll(require('fs')),
	path		= require('path'),
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
		console.log('serve', req.url);
		if (req.url == '/')
			req.url = '/index.html';
		next();
	});

	app.get('/translate.json', function (req, res, next) {
		var lang = req.query.lang;
		console.log('Got translation request for ', lang);

		if (lang.length != 2)
			return res.status(501);

		try {
			var translation = require('./translations/' + lang + '.js');
		} catch (err) {
			res.status(501);
			console.error('Cannot read translation for language', lang, err.message, err.stack);
		}

		res.json(translation);
	});

	// inject livereload
	app.use(livereload({
		port: config.livereloadListenPort
	}));

	// serve content, search for pre-compiled gzip with gracefully fallback to plaintext
	app.use(staticGzip(paths.output));

	// woa!
	var server = http.Server(app);
	server.listen(config.listenPort, config.listenAddress);

	console.log('Serving content from ' + path.resolve(__dirname, paths.output));
	console.log('LISTENING ON ' + config.listenAddress + ':' + config.listenPort);
};