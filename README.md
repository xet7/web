# Lavaboom WEB

<img src="https://mail.lavaboom.com/img/Lavaboom-logo.svg" align="right" width="200px" />

Lavaboom's Web written using angular.js, jade, less

Contains the whole web interface and client-side logic. Consists from 2 applications - thin singup/signin application and the core application.

## Requirements

Should be globally installed

- node.js 0.10.35
- gulp

## Installation

git clone https://github.com/lavab/web.git
cd web
npm install
gulp

Before running gulp, please make sure npm finished without errors

## Passing configuration

please check web/gulp/config.js for available configuration options

    `isProduction` - is production build?(don't change directly, use `gulp develop`, `gulp productiuon`)
    `nodeVersion` - minimum required node version(don't change)
    `isDebugable` - is debugable build?(if it's not gulp will not generate source maps)
    `isLogs` - is loggable build?(if it's not gulp will not remove all logging statements)
    `defaultApiUri` - where is the API?
    `defaultRootDomain` - where are we installed?
    `livereloadListenAddress` - livereload listen address for development(when running `gulp` default target)
    `livereloadListenPort` - livereload listen port for development(when running `gulp` default target)
    `listenAddress` - web server's listen address for development(when running `gulp` default target)
    `listenPort` - web server's listen port for development(when running `gulp` default target)

## How to report a issue?

You've found something that looks weird, you suppose this is a bug?
In order to speed up issue processing, please include the following information:
- where it took place (.com / .io / .co)
- when it took place (example: today 14:00 UTC, please avoid using timezone and provide time in UTC)
- screenshot if possible (for UX related issues)
- console logs if possible (copy-paste the Console output from Ctrl/Cmd+Alt+I)

## In order to build the web project(on Linux)

1. make sure node.js(>=0.10.35) is installed, you can use nvm for this

2. from root install gulp globally, npm -g install gulp

3. clone git repo

4. npm install && gulp
it should download npm development dependencies, build the project for development and start the web server on 0.0.0.0:5000 (by default)

## About gulp

Gulp supports watching && live reload of your browser on project's files change.

gulp develop && gulp serve - compile project one time for develop and run web server
gulp production && gulp serve - compile project one time for production and run web server

## Known issues

keep an eye on gulp output when you:

1. add new files,

2. rename/remove files/directories,

3. switch branches via git

This most likely will cause build failure. Currently you will have to terminate the gulp process(ctrl+c) and start it again. This will be addressed in future iterations of gulpfile.js

## License

This project is licensed under the MIT license. Check `license` for more
information.
