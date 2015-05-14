module.exports = /*@ngInject*/($rootScope, $scope, $state, router, hotkey) => {
	const settingsList = ['main.settings.general', 'main.settings.profile', 'main.settings.security', 'main.settings.plan'];

	{
		const goSettings = (event, delta) => {
			event.preventDefault();

			let i = settingsList.findIndex(s => s == $state.current.name);
			if (i > -1) {
				i = i + delta;
				if (i < 0)
					i = settingsList.length + i;
				if (i > settingsList.length - 1)
					i = settingsList.length - i;
				$state.go(settingsList[i]);
			}
		};

		hotkey.registerCustomHotkeys($scope, [
			{
				combo: ['h', 'k', 'left', 'up'],
				description: 'HOTKEY.MOVE_UP',
				callback: (event, key) => goSettings(event, -1)
			},
			{
				combo: ['j', 'l', 'right', 'down'],
				description: 'HOTKEY.MOVE_DOWN',
				callback: (event, key) => goSettings(event, +1)
			}
		], {scope: 'ctrlSettingsList', addedFromState: 'main.settings'});
	}
};