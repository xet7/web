# Lavaboom WEB 

<img src="https://mail.lavaboom.com/img/Lavaboom-logo.svg" align="right" width="200px" />

Lavaboom's Web written using angular.js, jade, less

Contains the whole web interface and client-side logic. Consists from 2 applications - thin singup/signin application and the core application.

## Requirements

Should be globally installed

- node.js 0.12.x
- gulp 4.x

if `nvm` isn't installed yet:
    `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.3/install.sh | bash`

to install `node` and `gulp`:

    nvm install 0.12.2
    npm uninstall gulp -g
    npm install gulpjs/gulp-cli#4.0 -g

## Installation
    
    git clone https://github.com/lavab/web.git
    cd web
    npm install
    gulp

_or_ in one command:
    `git clone https://github.com/lavab/web.git && cd web && npm install && gulp`

Before running `gulp`, please make sure `npm` finished without errors

## Passing configuration

please check `web/gulp/config.js` for available configuration options

- `isProduction` - is production build?(don't change directly, use `gulp develop`, `gulp production`)
- `nodeVersion` - minimum required node version(don't change)
- `isDebugable` - is debugable build?(if it's not gulp will not generate source maps)
- `isLogs` - is loggable build?(if it's not gulp will not remove all logging statements)
- `defaultApiUri` - where is the API?
- `defaultRootDomain` - where are we installed?
- `livereloadListenAddress` - livereload listen address for development(when running `gulp` default target)
- `livereloadListenPort` - livereload listen port for development(when running `gulp` default target)
- `listenAddress` - web server's listen address for development(when running `gulp` default target)
- `listenPort` - web server's listen port for development(when running `gulp` default target)
 
## Building with plugins

`PLUGINS=[plugin1],[plugin2] gulp` to perform build with plugins, for example

`PLUGINS=sample gulp` will build `web` with a sample plugin from https://github.com/lavab-plugins/sample 

## How to report an issue?

You've found something that looks weird, you suppose this is a bug?
In order to speed up issue processing, please include the following information:
- screenshot, if issue is UX related
- console logs if possible (copy-paste the Console output from Ctrl/Cmd+Alt+I)

If the following information isn't visible on screenshot or if there is no screenshot, please also provide:
- version number(i.e. 0.2.4)
- where it took place (.com / .io / .co)
- when it took place (example: today 14:00 UTC)

## In order to build the web project(on Linux)

1. make sure node.js(>=0.10.35) is installed, you can use nvm for this

2. from root install gulp globally, `npm -g install gulp`

3. clone git repo

4. `npm install && gulp`
it should download npm development dependencies, build the project for development and start the web server on 0.0.0.0:5000 (by default)

## About gulp

Gulp supports watching && live reload of your browser on project's files change.

`gulp develop && gulp serve` - compile project one time for develop and run web server
`gulp production && gulp serve` - compile project one time for production and run web server

## Known issues

keep an eye on gulp output when you:

1. add new files,

2. rename/remove files/directories,

3. switch branches via git

This most likely will cause build failure. Currently you will have to terminate the gulp process(ctrl+c) and start it again. This will be addressed in future iterations of gulpfile.js

## License

This project is licensed under the GPL v3 license. Check __license__ for more
information.
