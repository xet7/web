This is the web application written using angular.js, jade, less

**In order to build the web project(on Linux)**

1. make sure node.js(>=0.10.35) is installed, you can use nvm for this

2. from root install gulp globally, npm -g install gulp

3. clone git repo

4. npm install && gulp
it should download npm development dependencies, build the project for development and start the web server on 0.0.0.0:5000 (by default)

**About gulp**

Gulp supports watching && live reload of your browser on project's files change.

gulp develop && gulp serve - compile project one time for develop and run web server
gulp production && gulp serve - compile project one time for production and run web server

**Known issues**

keep an eye on gulp output when you:

1. add new files,

2. rename/remove files/directories,

3. switch branches via git

This most likely will cause build failure. Currently you will have to terminate the gulp process(ctrl+c) and start it again. This will be addressed in future iterations of gulpfile.js

**Attention**

1. Please work in your own branch for any feature(feature/*, branched out from develop), make sure your code passes all JsHint tests, compiles and works without any errors under develop and production targets.
2. For any text strings use i18n toml files in src/translations/[lang-code].toml
