/*
  dependencies to external libraries
  please strictly follow syntax of // = require "[relative path to script]"
  don't forget to put " at the borders of included file!
  we post process this file to use normal/minified versions of dependencies,
  so if a given library has a .min.js version it will be used automatically replaced when compiled in production mode
*/

// white magic support to make ES6 alive
// = require "../bower_components/traceur-runtime/traceur-runtime.js"

// temporary hack to load co.js, will be removed as we move to browserify
window.coJS = (function() {
	var module = {};
	// = require "../../node_modules/co/index.js"
	return module.exports;
})();

// = require "../bower_components/lodash/dist/lodash.underscore.js"

// = require "../bower_components/angular/angular.js"
// = require "../bower_components/angular-translate/angular-translate.js"
// = require "../bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js"
// = require "../bower_components/angular-ui-router/release/angular-ui-router.js"
// = require "../bower_components/angular-bootstrap/ui-bootstrap.js"
// = require "../bower_components/angular-sanitize/angular-sanitize.js"
// = require "../bower_components/angular-ui-select/dist/select.js"

// = require "../bower_components/angular-validation-match/dist/angular-input-match.js"
// = require "../bower_components/lavaboom/dist/lavaboom-angular.js"
// = require "../bower_components/lavaboom/dist/lavaboom-api.js"
// = require "../bower_components/angular-base64/angular-base64.js"
// = require "../bower_components/file-saver/FileSaver.js"
// = require "../vendor/openpgp.js"
// = require "../bower_components/cryptojslib/rollups/sha3.js"



/*
 a reference to particular angular application from apps folder
 */

// = require-application "appLavaboomLogin.js"