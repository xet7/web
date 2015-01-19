	angular.module('AppLavaboom').controller('ComposeController', function($scope,  LavaboomAPI) {

	$scope.selected = null;

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


  $scope.tagTransform = function (newTag) {
    var item = {
        name: newTag,
        email: newTag.toLowerCase()+'@email.com',
        age: 'unknown',
        country: 'unknown'
    };

    return item;
  };

	$scope.multipleDemo.selectedPeople = [$scope.people[5], $scope.people[4]];
	  $scope.person = {};
	  $scope.people = [
	    { name: 'Adam',      email: 'adam@email.com',      age: 12, country: 'United States' },
	    { name: 'Amalie',    email: 'amalie@email.com',    age: 12, country: 'Argentina' },
	    { name: 'Estefana', email: 'estefania@email.com', age: 21, country: 'Argentina' },
	    { name: 'Adrian',    email: 'adrian@email.com',    age: 21, country: 'Ecuador' },
	    { name: 'Wladimir',  email: 'wladimir@email.com',  age: 30, country: 'Ecuador' },
	    { name: 'Samantha',  email: 'samantha@email.com',  age: 30, country: 'United States' },
	    { name: 'Nicole',    email: 'nicole@email.com',    age: 43, country: 'Colombia' },
	    { name: 'Natasha',   email: 'natasha@email.com',   age: 54, country: 'Ecuador' },
	    { name: 'Michael',   email: 'michael@email.com',   age: 15, country: 'Colombia' },
	    { name: 'NicolÃ¡s',   email: 'nicolas@email.com',    age: 43, country: 'Colombia' }
	  ];

	// $scope.multipleDemo.selectedPeople = [$scope.people[5], $scope.people[4]];
	$scope.multipleDemo.selectedPeople2 = $scope.multipleDemo.selectedPeople;
	$scope.multipleDemo.selectedPeopleWithGroupBy = [$scope.people[8], $scope.people[6]];
	$scope.multipleDemo.selectedPeopleSimple = ['samantha@email.com','wladimir@email.com'];

	$scope.show = function() {
		alert("selected " + $scope.selected.name + ' with value ' + $scope.selected.value);
	};

	$scope.format = function(i) {
		var output = '<span class="';
		if (i.encrypted) {
		output += 'icon-lock';
		} else {
			output += 'icon-unlock';
		}
		output += "></span>";
		return i.email + output;
	};


	});