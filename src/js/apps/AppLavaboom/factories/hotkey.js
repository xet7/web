module.exports = /*@ngInject*/($rootScope, $translate, $state, hotkeys, router) => {
	let isActive = true;
	let hotkeyList = { };

	function Hotkey() {
	}

	Hotkey.getKeys = () => hotkeyList;

	Hotkey.addHotkey = (option) => {
		if (!isActive || !option)
			return;

		const key = angular.isArray(option.combo) ? option.combo[0] : option.combo;
		const currentKey = hotkeys.get(key);
		if (currentKey)
			hotkeys.del(currentKey);

		option.description = $translate.instant(option.description);
		hotkeys.add(option);

		hotkeyList[key] = {
			combo: option.combo,
			description: option.description
		};
	};

	Hotkey.toggleHotkeys = (enable) => {
		isActive = enable;
		if (enable) {
			Hotkey.addGlobalHotkeys();
		} else {
			Hotkey.clearHotkeys();
		}

		$rootScope.$broadcast('hotkeys-enabled', isActive);
	};

	Hotkey.clearHotkeys = () => {
		let r;
		for (let key of Object.keys(hotkeyList)) {
			if (key !== '?') {
				const hotkey = hotkeys.get(key);
				if (hotkey) {
					hotkeys.del(hotkey);
				}
			} else r = hotkeyList[key];
		}

		hotkeyList = [r];
		console.log('Hotkey.clearHotkeys()');
	};

	Hotkey.addGlobalHotkeys = () => {
		Hotkey.addHotkey({
			combo: ['c', 'n'],
			description: 'HOTKEY.COMPOSE_EMAIL',
			callback: (event, key) => {
				event.preventDefault();
				router.showPopup('compose');
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+i', 'command+i'],
			description: 'HOTKEY.GOTO_INBOX',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Inbox'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+d', 'command+d'],
			description: 'HOTKEY.GOTO_DRAFTS',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Drafts'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+s', 'command+s'],
			description: 'HOTKEY.GOTO_SENT',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Sent'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+m', 'command+m'],
			description: 'HOTKEY.GOTO_SPAM',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Spam'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+t', 'command+t'],
			description: 'HOTKEY.GOTO_STARRED',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Starred'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+h', 'command+h'],
			description: 'HOTKEY.GOTO_TRASH',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.inbox.label', {labelName: 'Trash'});
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+x', 'command+x'],
			description: 'HOTKEY.GOTO_CONTACTS',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.contacts');
			}
		});

		Hotkey.addHotkey({
			combo: ['ctrl+e', 'command+e'],
			description: 'HOTKEY.GOTO_SETTINGS',
			callback: (event, key) => {
				event.preventDefault();
				$state.go('main.settings.general');
			}
		});

		Hotkey.addHotkey({
			combo: '/',
			description: 'HOTKEY.FOCUS_ON_SEARCH',
			callback: (event, key) => {
				if(!router.isPopupState($state.current.name)){
					event.preventDefault();
					document.getElementById('top-search').focus();
				}
			}
		});

		Hotkey.addHotkey({
			combo: 'esc',
			description: 'HOTKEY.LEAVE_FROM_SEARCH',
			callback: (event, key) => {
				if(!router.isPopupState($state.current.name)) {
					event.preventDefault();
					document.getElementById('top-search').blur();
				}
			},
			allowIn: ['INPUT']
		});

		Hotkey.addHotkey({
			combo: '?',
			description: 'HOTKEY.CHEATSHEET',
			callback: (event, key) => {
				if(!router.isPopupState($state.current.name)) {
					event.preventDefault();
					router.showPopup('hotkeys');
				}
			},
			allowIn: ['INPUT']
		});

		console.log('Hotkey.addGlobalHotkeys()');
	};

	return Hotkey;
};