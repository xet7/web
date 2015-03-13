module.exports = /*@ngInject*/($scope, $translate, $interval, consts) => {
	$scope.currentPlanName = 'BASIC';
	$scope.plans = { };

	consts.PLAN_LIST.forEach(name => {
		$scope.plans[name] = {
			TITLE: '',
			LB_TAG: '',
			LB_ITEMS: ''
		};
		$translate.bindAsObject($scope.plans[name], 'MAIN.SETTINGS.PLAN.' + name, t => {
			t.LB_ITEMS = t.LB_ITEMS.split('|');
			return t;
		});
	});
};