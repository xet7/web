module.exports = /*@ngInject*/function ($rootScope, $translate, $state, hotkeys, router) {
	const self = this;

	let isActive = true;
	let hotkeyList = { };

	self.initialize = (isEnabled) => {
		self.toggleHotkeys(isEnabled);

		$rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
			if (!toState.name.includes('.hotkeys') && !fromState.name.includes('.hotkeys')) {
				self.clearHotkeys();
				self.addGlobalHotkeys();
			}
		});
	};

	self.getKeys = () => hotkeyList;

	self.addHotkey = (option) => {
		if (!isActive || !option)
			return;

		const key = angular.isArray(option.combo) ? option.combo[0] : option.combo;
		const currentKey = hotkeys.get(key);
		if (currentKey)
			hotkeys.del(currentKey);

		option.description = $translate.instant(option.description);
		console.log('add hotkey', option);
		hotkeys.add(option);

		hotkeyList[key] = {
			combo: option.combo,
			description: option.description
		};
	};

	self.toggleHotkeys = (enable) => {
		isActive = enable;
		if (enable) {
			self.addGlobalHotkeys();
		} else {
			self.clearHotkeys();
		}

		$rootScope.$broadcast('hotkeys-enabled', isActive);
	};

	self.clearHotkeys = () => {
		let r;
		for (let key of Object.keys(hotkeyList)) {
			if (key !== '?') {
				const hotkey = hotkeys.get(key);
				if (hotkey) {
					hotkeys.del(hotkey);
				}
			} else r = hotkeyList[key];
		}

		hotkeyList = {'?': r};
		console.log('hotkeys.clearHotkeys()');
	};

	const notWhenPopupOpened = (callback) =>
		(event, key) => {
			if (!router.isPopupState($state.current.name))
				return callback(event, key);
		};

	self.addGlobalHotkeys = () => {
		self.addHotkey({
			combo: ['c', 'n'],
			description: 'HOTKEY.COMPOSE_EMAIL',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				router.showPopup('compose');
			})
		});

		self.addHotkey({
			combo: ['ctrl+i', 'command+i'],
			description: 'HOTKEY.GOTO_INBOX',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Inbox'});
			})
		});

		/*self.addHotkey({
			combo: ['ctrl+d', 'command+d'],
			description: 'HOTKEY.GOTO_DRAFTS',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Drafts'});
			})
		});*/

		self.addHotkey({
			combo: ['ctrl+s', 'command+s'],
			description: 'HOTKEY.GOTO_SENT',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Sent'});
			})
		});

		self.addHotkey({
			combo: ['ctrl+m', 'command+m'],
			description: 'HOTKEY.GOTO_SPAM',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Spam'});
			})
		});

		self.addHotkey({
			combo: ['ctrl+t', 'command+t'],
			description: 'HOTKEY.GOTO_STARRED',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Starred'});
			})
		});

		self.addHotkey({
			combo: ['ctrl+h', 'command+h'],
			description: 'HOTKEY.GOTO_TRASH',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Trash'});
			})
		});

		self.addHotkey({
			combo: ['ctrl+x', 'command+x'],
			description: 'HOTKEY.GOTO_CONTACTS',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.contacts');
			})
		});

		self.addHotkey({
			combo: ['ctrl+e', 'command+e'],
			description: 'HOTKEY.GOTO_SETTINGS',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				$state.go('main.settings.general');
			})
		});

		self.addHotkey({
			combo: '/',
			description: 'HOTKEY.FOCUS_ON_SEARCH',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				document.getElementById('top-search').focus();
			})
		});

		self.addHotkey({
			combo: 'esc',
			description: 'HOTKEY.LEAVE_FROM_SEARCH',
			callback: notWhenPopupOpened((event, key) => {
				event.preventDefault();
				document.getElementById('top-search').blur();
			}),
			allowIn: ['INPUT']
		});

		self.addHotkey({
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
		});

		console.log('hotkeys.addGlobalHotkeys()');
	};
};