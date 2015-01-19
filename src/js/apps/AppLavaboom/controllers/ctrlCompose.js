/**
 * AngularJS default filter with the following expression:
 * "person in people | filter: {name: $select.search, sec: $select.search}"
 * performs a AND between 'name: $select.search' and 'sec: $select.search'.
 * We want to perform a OR.
 */
window.app.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

angular.module('AppLavaboom').controller('ComposeController', function($scope, LavaboomAPI) {

      $scope.disabled = undefined;
	  $scope.searchEnabled = undefined;

	  $scope.enable = function() {
	    $scope.disabled = false;
	  };

	  $scope.disable = function() {
	    $scope.disabled = true;
	  };

	  $scope.enableSearch = function() {
	    $scope.searchEnabled = true;
	  };

	  $scope.disableSearch = function() {
	    $scope.searchEnabled = false;
	  };

	  $scope.clear = function() {
	    $scope.person.selected = undefined;
	    $scope.address.selected = undefined;
	    // $scope.country.selected = undefined;
	  };






	  $scope.tagTransform = function (newTag) {
	    var item = {
	        name: newTag,
	        email: newTag.toLowerCase()+'@email.com',
	        sec: 'unknown'
	    };

	    return item;
	  };

	  $scope.person = {};

	  $scope.people = [
	    { name: 'Adam',      email: 'adam@email.com',      sec: 1},
	    { name: 'Amalie',    email: 'amalie@email.com',    sec: 0},
	    { name: 'Estefanía', email: 'estefania@email.com', sec: 0},
	    { name: 'Adrian',    email: 'adrian@email.com',    sec: 1},
	    { name: 'Wladimir',  email: 'wladimir@email.com',  sec: 0},
	    { name: 'Samantha',  email: 'samantha@email.com',  sec: 0},
	    { name: 'Nicole',    email: 'nicole@email.com',    sec: 1},
	    { name: 'Natasha',   email: 'natasha@email.com',   sec: 1},
	    { name: 'Michael',   email: 'michael@email.com',   sec: 0},
	    { name: 'Nicolás',   email: 'nicolas@email.com',    sec: 0}
	  ];

	  

	  $scope.composeSelected = {};
	  
	  $scope.composeSelected.to = [$scope.people[5], $scope.people[4]];
	  $scope.composeSelected.cc = [];
	  $scope.composeSelected.bcc = [];

	  $scope.htmlVariable = '<h2>Try me!</h2><p>textAngular is a super cool WYSIWYG Text Editor directive for AngularJS</p><p><b>Features:</b></p><ol><li>Automatic Seamless Two-Way-Binding</li><li style="color: blue;">Super Easy <b>Theming</b> Options</li><li>Simple Editor Instance Creation</li><li>Safely Parses Html for Custom Toolbar Icons</li><li>Doesn\'t Use an iFrame</li><li>Works with Firefox, Chrome, and IE8+</li></ol><p><b>Code at GitHub:</b> <a href="https://github.com/fraywing/textAngular">Here</a> </p>';

	
});