module.exports = /*@ngInject*/($scope, $translate, $interval, consts, user) => {
	$scope.currentPlanName = user.accountType;
	console.log('$scope.currentPlanName', $scope.currentPlanName);

	$scope.planList = consts.PLAN_LIST;
	$scope.plans = { };

	const translations = {
		LB_CURRENT: ''
	};
	$translate.bindAsObject(translations, 'MAIN.SETTINGS.PLAN');

	consts.PLAN_LIST.forEach(name => {
		$scope.plans[name] = {
			TITLE: '',
			LB_TAG: '',
			LB_ITEMS: ''
		};

		$translate.bindAsObject($scope.plans[name], 'MAIN.SETTINGS.PLAN.' + name.toUpperCase(), t => {
			t.LB_ITEMS = t.LB_ITEMS.split('|');
			t.title = name == $scope.currentPlanName ? translations.LB_CURRENT : '';
			return t;
		});
	});
};