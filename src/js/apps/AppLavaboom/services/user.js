angular.module(primaryApplicationName).service('user', function($q, $rootScope) {
	var self = this;

	this.name = 'Tester';

	this.token = {
		expiry_date: "2015-01-15T11:34:13.344664039Z",
		id: "5U0Xo0CQ5h5OpDJ91e8v",
		date_created: "2015-01-12T11:34:13.344669232Z",
		date_modified: "2015-01-12T11:34:13.344669232Z",
		name: "Auth token expiring on 2015-01-15T11:34:13Z",
		owner: "u0yAvJtNtVvTpcIWCSiR",
		type: "auth"
	};
});