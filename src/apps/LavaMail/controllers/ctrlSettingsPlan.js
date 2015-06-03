module.exports = ($scope, $translate, $interval, consts, user, $sce) => {
	$scope.currentPlanName = user.accountType;

	$scope.planList = consts.PLAN_LIST.filter(plan => {
		if (user.isHiddenAccountType(plan))
			return plan == user.accountType;
		return true;
	});

	$scope.plans = { };

	const translations = {
		LB_CURRENT: '',
		LB_GET_ON_IGG_TEXT: '',
		LB_GET_ON_IGG_TITLE: ''
	};
	const translationsForPlans = {};
	$translate.bindAsObject(translations, 'LAVAMAIL.SETTINGS.PLAN');

	$scope.planList.forEach(name => {
		translationsForPlans[name] = {
			TITLE: '',
			LB_TAG: '',
			LB_ITEMS: ''
		};
		((name) => {
			$translate.bindAsObject(translationsForPlans[name], 'LAVAMAIL.SETTINGS.PLAN.' + name.toUpperCase(), t => {
				let plan = {
					title: t.TITLE,
					tag: t.LB_TAG,
					items: t.LB_ITEMS.split('|').map(item => $sce.trustAsHtml(item)),
					hoverTitle: name == user.accountType ? translations.LB_CURRENT : ''
				};

				if (user.accountType == 'beta' && name == 'supporter') {
					plan.tag = translations.LB_GET_ON_IGG_TEXT;
					plan.tagTitle = translations.LB_GET_ON_IGG_TITLE;
					plan.tagIsLink = true;
					plan.tagHref =
						'https://www.indiegogo.com/projects/lavaboom-secure-email-for-everyone/contributions/new/#/contribute?perk_amt=17&perk_id=2839034';
				}

				$scope.plans[name] = plan;
				return t;
			});
		})(name);
	});
};