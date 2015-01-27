angular.module(primaryApplicationName).controller('CtrlContactsProfile', function($scope, $stateParams, contacts) {
	var profileId = $stateParams.profileId;

	$scope.details = {
		firstName: 'Eddard',
		lastName: 'Stark',
		displayName: 'dark star',
		companyName: 'TROLL inc'
	};
	$scope.emails = [
		{
			type: 'private',
			email: 'house.stark@gmail.com',
			isStar: false,
			isCollapsed: false,
			key: {
				keyId: '62CEB525',
				length: '4096',
				algos: 'RSA',
				fingerprint: '62CE62CEB52562CEB62CEB525525B525'
			}
		},
		{
			type: 'business',
			email: 'ned@stark.com',
			isStar: false,
			isCollapsed: false,
			key: {
				keyId: '62CEB525',
				length: '4096',
				algos: 'RSA',
				fingerprint: '62CE62CEB52562CEB62CEB525525B525'
			}
		}
	];

	$scope.downloadPublicKey = (key) => {

	};
});
