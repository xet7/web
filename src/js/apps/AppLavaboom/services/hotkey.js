module.exports = /*@ngInject*/function ($rootScope, $translate, $state, hotkeys, router, utils) {
	const self = this;

	let isActive = true;
	let hotkeyList = { };

	self.initialize = (isEnabled) => {
		self.toggleHotkeys(isEnabled);

		$rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
			self.clearHotkeys();
		});
		$rootScope.$on('hotkeys-state-changed', () => {
			if (!isActive)
				self.clearHotkeys();
		});
	};

	self.getKeys = () => utils.toArray(hotkeyList);

	function addHotkey (option, addedFromState, isGlobal) {
		option = angular.copy(option);
		let combo = angular.copy(option.combo);

		const key = angular.isArray(option.combo) ? option.combo[0] : option.combo;
		const currentKey = hotkeys.get(key);
		if (currentKey)
			return;

		option.description = $translate.instant(option.description);
		hotkeys.add(option);

		hotkeyList[key] = {
			combo: combo,
			description: option.description,
			addedFromState,
			isGlobal
		};

		console.debug('added hotkey', option);
	}

	self.registerCustomHotkeys = (scope, hotkeys, options) => {
		if (!options)
			options = {};

		if (!scope)
			throw new Error('hotkey.registerCustomHotkeys please define scope!');
		if (!options.scope)
			throw new Error('hotkey.registerCustomHotkeys please define scope name!');

		if (!options.isPopup)
			options.isPopup = false;
		if (!options.isGlobal)
			options.isGlobal = false;
		if (!options.addedFromState)
			options.addedFromState = $state.current.name;

		console.log('registerCustomHotkeys', options, 'isActive: ', isActive);

		function register(isFirstTime = false) {
			if (!isFirstTime && router.isPopupState($state.current.name) && !options.isPopup)
				return;

			if (!$state.current.name.includes(options.addedFromState))
				return;

			console.debug(`hotkeys: register(${options.scope}),
				current state is ${$state.current.name} added from state is ${options.addedFromState}`, hotkeys);

			for (let k of hotkeys)
				addHotkey(k, options.addedFromState, options.isGlobal);
		}

		if (isActive)
			register(true);

		scope.$on('$stateChangeSuccess', () => register());
		scope.$on('hotkeys-state-changed', () => register());
	};

	self.toggleHotkeys = (isEnabled) => {
		isActive = isEnabled;
		$rootScope.$broadcast('hotkeys-state-changed');
	};

	self.isActive = () => isActive;

	self.clearHotkeys = () => {
		console.log('hotkeys.clearHotkeys()');

		let isPopupState = router.isPopupState($state.current.name);
		let isLegendState = isPopupState && $state.current.name.endsWith('.hotkeys');

		for (let key of Object.keys(hotkeyList)) {
			if (key !== '?') {
				let hotkey = hotkeys.get(key);
				let hotkeyOptions = hotkeyList[key];
				let isParent = $state.current.name.includes(hotkeyOptions.addedFromState);

				if (!hotkey || !hotkeyOptions)
					continue;

				if (isActive && hotkeyOptions.isGlobal && (!isPopupState || hotkeyOptions.isPopup))
					continue;

				if (!isActive || !isParent || (isPopupState && !hotkeyOptions.isPopup)) {
					console.debug('hotkeys: removed', hotkeyList[key]);
					hotkeys.del(hotkey);

					if (!isLegendState)
						delete hotkeyList[key];
				}
			}
		}
	};

	self.registerCustomHotkeys($rootScope, [
		{
			combo: ['c', 'n'],
			description: 'HOTKEY.COMPOSE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				router.showPopup('compose');
			}
		},
		{
			combo: ['ctrl+i', 'command+i'],
			description: 'HOTKEY.GOTO_INBOX',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Inbox'});
			}
		},
		{
			combo: ['ctrl+s', 'command+s'],
			description: 'HOTKEY.GOTO_SENT',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Sent'});
			}
		},
		{
			combo: ['ctrl+m', 'command+m'],
			description: 'HOTKEY.GOTO_SPAM',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Spam'});
			}
		},
		{
			combo: ['ctrl+t', 'command+t'],
			description: 'HOTKEY.GOTO_STARRED',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Starred'});
			}
		},
		{
			combo: ['ctrl+h', 'command+h'],
			description: 'HOTKEY.GOTO_TRASH',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Trash'});
			}
		},
		{
			combo: ['ctrl+x', 'command+x'],
			description: 'HOTKEY.GOTO_CONTACTS',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.contacts');
			}
		},
			{
			combo: ['ctrl+e', 'command+e'],
			description: 'HOTKEY.GOTO_SETTINGS',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.settings.general');
			}
		},
		{
			combo: '/',
			description: 'HOTKEY.FOCUS_ON_SEARCH',
			callback: (event, key) => {
				event.preventDefault();

				let element = document.getElementById('top-search');
				if (element)
					element.focus();
			}
		},
			{
			combo: 'esc',
			description: 'HOTKEY.LEAVE_FROM_SEARCH',
			callback: (event, key) => {
				event.preventDefault();

				let element = document.getElementById('top-search');
				if (element)
					element.blur();
			},
			allowIn: ['INPUT']
		},
		{
			combo: '?',
			description: 'HOTKEY.CHEATSHEET',
			callback: (event, key) => {
				if ($state.current.name.includes('.hotkeys')) {
					event.preventDefault();
					router.hidePopup();
				}
				else if (!router.isPopupState($state.current.name)) {
					event.preventDefault();
					router.showPopup('hotkeys');
				}
			},
			allowIn: ['INPUT']
		}
	], {isPopup: false, isGlobal: true, scope: 'root'});
};