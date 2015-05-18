module.exports = /*@ngInject*/function ($rootScope, $translate, $state, $timeout, hotkeys, router, utils, consts) {
	const self = this;

	let isActive = true;
	let hotkeyList = { };
	let multiHotkeyList = {};
	let restoreHotkeys = null;

	self.initialize = (isEnabled) => {
		self.toggleHotkeys(isEnabled);

		$rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
			if (restoreHotkeys) {
				$timeout.cancel(restoreHotkeys);
				restoreHotkeys = null;
			}
			clearHotkeys(!isActive);
		});
		$rootScope.$on('hotkeys-state-changed', () => {
			if (!isActive)
				clearHotkeys(true);
		});
	};

	self.getKeys = () => utils.toArray(hotkeyList);

	function enableMultiHotkey (multiKey, addedFromState, isGlobal) {
		if (multiHotkeyList[multiKey].isActive)
			return;
		
		clearHotkeys(true);

		multiHotkeyList[multiKey].isActive = true;
		for(let k of multiHotkeyList[multiKey].list)
			addHotkey(k, addedFromState, isGlobal, true);

		multiHotkeyList[multiKey].timeout = $timeout(() => {
			multiHotkeyList[multiKey].timeout = null;
			disableMultiHotkey(multiKey);
		}, consts.HOTKEY_MULTI_TIMEOUT);

		restoreHotkeys = $timeout(() => {
			$rootScope.$broadcast('hotkeys-state-changed');
		}, consts.HOTKEY_MULTI_TIMEOUT);
	}

	function disableMultiHotkey (multiKey) {
		if (multiHotkeyList[multiKey].timeout) {
			$timeout.cancel(multiHotkeyList[multiKey].timeout);
			multiHotkeyList[multiKey].timeout = null;
		}

		multiHotkeyList[multiKey].isActive = false;
		for(let k of multiHotkeyList[multiKey].list)
			removeHotkey(k, true);
	}

	function removeHotkey (option, isDeleteFromList = false) {
		console.debug('hotkeys: removed', option);
		
		for(let k of angular.isArray(option.combo) ? option.combo : [option.combo]) {
			hotkeys.del(k);

			if (isDeleteFromList)
				delete hotkeyList[k];
		}
	}

	function addHotkey (option, addedFromState, isGlobal, isStep = false) {
		option = angular.copy(option);
		let combo = angular.copy(option.combo);
		const key = angular.isArray(option.combo) ? option.combo[0] : option.combo;

		if (option.require) {
			if (!multiHotkeyList[option.require])
				multiHotkeyList[option.require] = {
					isActive: false,
					list: []
				};

			multiHotkeyList[option.require].list.push({
				combo: option.combo,
				name: option.name,
				description: option.description,
				callback: option.callback
			});

			addHotkey({
				combo: [option.require],
				description: option.requireDescription,
				callback: event => {
					event.preventDefault();

					enableMultiHotkey(option.require, addedFromState, isGlobal);
				}
			}, addedFromState, isGlobal, true);
		}
		else
		{
			let callback = option.callback;
			option.callback = (event, key) => {
				console.log('router.isOpenedDialog()', router.isOpenedDialog());
				if (router.isOpenedDialog())
					return;

				callback(event, key);
			};

			const currentKey = hotkeys.get(key);
			if (currentKey)
				return;

			hotkeys.add(option);

			option.description = $translate.instant(option.description);
			hotkeyList[key] = {
				combo: combo,
				require: option.require,
				description: option.description,
				isStep,
				addedFromState,
				isGlobal
			};
		}

		console.debug('added hotkey', option);
	}

	function clearHotkeys (isRemoveAll = false) {
		console.log('hotkeys.clearHotkeys', isRemoveAll);

		let isPopupState = router.isPopupState($state.current.name);
		let isLegendState = isPopupState && $state.current.name.endsWith('.hotkeys');
		if (isLegendState) {
			for (let multiKey of Object.keys(multiHotkeyList))
				disableMultiHotkey(multiKey);
		}

		for (let key of Object.keys(hotkeyList)) {
			if (key !== '?') {
				let hotkey = hotkeys.get(key);
				let hotkeyOptions = hotkeyList[key];
				let isParent = $state.current.name.includes(hotkeyOptions.addedFromState);

				if (!hotkey || !hotkeyOptions)
					continue;

				if (!isLegendState && !isRemoveAll && hotkeyOptions.isGlobal && (!isPopupState || hotkeyOptions.isPopup))
					continue;

				if (isLegendState || isRemoveAll || !isParent || (isPopupState && !hotkeyOptions.isPopup))
					removeHotkey(hotkeyOptions, !isLegendState);
			}
		}
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
			let isPopupState = router.isPopupState($state.current.name);
			let isLegendState = isPopupState && $state.current.name.endsWith('.hotkeys');
			let currentStateName = isLegendState ? $state.current.name.replace('.hotkeys', '') : $state.current.name;

			if (!isFirstTime && !options.isPopup && router.isPopupState(currentStateName))
				return;

			if (!options.isGlobal && !currentStateName.includes(options.addedFromState))
				return;

			console.debug(`hotkeys: register(${options.scope}),
				current state is ${currentStateName} added from state is ${options.addedFromState}`, hotkeys);

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

	self.isActive = (multiKey) => isActive && (!multiKey || (multiHotkeyList[multiKey] && multiHotkeyList[multiKey].isActive));

	self.getMultiComboPrettified = (multiKey, name) => {
		let keys = multiHotkeyList[multiKey] ? multiHotkeyList[multiKey].list.filter(k => k.name == name) : null;
		return keys && keys.length > 0 ? keys[0].combo.join(',') : '';
	};
};