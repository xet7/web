module.exports = /*@ngInject*/($rootScope, $timeout, $scope, $state, $translate,
							   notifications, tests, utils,
							   router,
							   LavaboomAPI, co, translate, crypto, user, inbox, contacts, hotkey, loader, timeAgo) => {

	const translations = {
		LB_INITIALIZING_I18N : '',
		LB_INITIALIZING_OPENPGP : '',
		LB_AUTHENTICATING : '',
		LB_DECRYPTING : '',
		LB_LOADING : '',
		LB_INITIALIZATION_FAILED : '',
		LB_SUCCESS : ''
	};

	$scope.ddEventFilter = (name, event) => event.target.id.startsWith('taTextElement');

	$scope.tooltipDelay = () => (window.getComputedStyle(document.getElementById('compose-action')).display==='none') ? true : 1000000;

	function initializeTimeAgo () {
		return co(function *() {
			const datesTranslations = {
				PREFIX_AGO: '',
				PREFIX_FROM_NOW: '',
				SUFFIX_AGO: '',
				SUFFIX_FROM_NOW: '',
				SECONDS: '',
				MINUTE: '',
				MINUTES: '',
				HOUR: '',
				HOURS: '',
				DAY: '',
				DAYS: '',
				MONTH: '',
				MONTHS: '',
				YEAR: '',
				YEARS: ''
			};

			yield $translate.bindAsObject(datesTranslations, 'DATES.TIMEAGO', null, () => {
				const fullLangCode = $translate.instant('LANG.FULL_CODE');
				const settings = timeAgo.settings.strings[fullLangCode];

				for (let k of Object.keys(datesTranslations))
					datesTranslations[k] = datesTranslations[k].trim();

				if (datesTranslations.PREFIX_AGO)
					settings.prefixAgo = datesTranslations.PREFIX_AGO;
				if (datesTranslations.PREFIX_FROM_NOW)
					settings.prefixFromNow = datesTranslations.PREFIX_FROM_NOW;
				if (datesTranslations.SUFFIX_AGO)
					settings.suffixAgo = datesTranslations.SUFFIX_AGO;
				if (datesTranslations.SUFFIX_FROM_NOW)
					settings.suffixFromNow = datesTranslations.SUFFIX_FROM_NOW;
				if (datesTranslations.SECONDS)
					settings.seconds = datesTranslations.SECONDS;
				if (datesTranslations.MINUTE)
					settings.minute = datesTranslations.MINUTE;
				if (datesTranslations.MINUTES)
					settings.minutes = datesTranslations.MINUTES;
				if (datesTranslations.HOUR)
					settings.hour = datesTranslations.HOUR;
				if (datesTranslations.HOURS)
					settings.hours = datesTranslations.HOURS;
				if (datesTranslations.DAY)
					settings.day = datesTranslations.DAY;
				if (datesTranslations.DAYS)
					settings.days = datesTranslations.DAYS;
				if (datesTranslations.MONTH)
					settings.month = datesTranslations.MONTH;
				if (datesTranslations.MONTHS)
					settings.months = datesTranslations.MONTHS;
				if (datesTranslations.YEAR)
					settings.year = datesTranslations.YEAR;
				if (datesTranslations.YEARS)
					settings.years = datesTranslations.YEARS;
			});
		});
	}

	function registerGlobalHotkeys() {
		hotkey.registerCustomHotkeys($rootScope, [
			{
				combo: ['c', 'n'],
				description: 'HOTKEY.COMPOSE_EMAIL',
				callback: (event, key) => {
					event.preventDefault();
					router.showPopup('compose');
				}
			},
			{
				combo: ['i'],
				name: 'Inbox',
				require: 'g',
				description: 'HOTKEY.GOTO_INBOX',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.inbox.label', {labelName: 'Inbox'});
				}
			},
			{
				combo: ['s'],
				name: 'Sent',
				require: 'g',
				description: 'HOTKEY.GOTO_SENT',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.inbox.label', {labelName: 'Sent'});
				}
			},
			{
				combo: ['p'],
				name: 'Spam',
				require: 'g',
				description: 'HOTKEY.GOTO_SPAM',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.inbox.label', {labelName: 'Spam'});
				}
			},
			{
				combo: ['a'],
				name: 'Starred',
				require: 'g',
				description: 'HOTKEY.GOTO_STARRED',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.inbox.label', {labelName: 'Starred'});
				}
			},
			{
				combo: ['t'],
				name: 'Trash',
				require: 'g',
				description: 'HOTKEY.GOTO_TRASH',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.inbox.label', {labelName: 'Trash'});
				}
			},
			{
				combo: ['c'],
				name: 'Contacts',
				require: 'g',
				description: 'HOTKEY.GOTO_CONTACTS',
				callback: (event, key) => {
					event.preventDefault();
					$state.go('main.contacts');
				}
			},
			{
				combo: ['x'],
				name: 'Settings',
				require: 'g',
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
	}

	$scope.initializeApplication = () => co(function *(){
		try {
			let connectionPromise = LavaboomAPI.connect();

			yield translate.initialize();

			if (!$rootScope.isInitialized) {
				yield $translate.bindAsObject(translations, 'LOADER');
				initializeTimeAgo();
			}

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 1);

			crypto.initialize();

			yield connectionPromise;

			yield tests.initialize();

			loader.incProgress(translations.LB_AUTHENTICATING, 5);
			yield user.gatherUserInformation();

			loader.incProgress(translations.LB_LOADING, 5);
			yield [inbox.initialize(), contacts.initialize()];

			yield tests.performCompatibilityChecks();

			if ($state.current.name == 'empty')
				yield $state.go('main.inbox.label', {labelName: 'Inbox', threadId: null}, {reload: true});

			registerGlobalHotkeys();

			$rootScope.isInitialized = true;

			hotkey.initialize(user.settings.isHotkeyEnabled);
			return {lbDone: translations.LB_SUCCESS};
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});

	$scope.onApplicationReady = () => {
		$rootScope.$broadcast('initialization-completed');
	};
};