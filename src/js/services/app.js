angular.module(primaryApplicationName).service('app',
	function() {
		this.isLoginApplication = primaryApplicationName === 'AppLavaboomLogin';
		this.isInboxApplication = primaryApplicationName === 'AppLavaboom';
	});