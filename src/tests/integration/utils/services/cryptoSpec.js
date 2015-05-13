jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*1000;

describe('Crypto Service', () => {
	let service,
		$rootScope,
		rootScopeUpdateIntervalId;

	beforeEach(angular.mock.module('utils'));

	beforeEach(inject((crypto, _$rootScope_) => {
		service = crypto;
		$rootScope = _$rootScope_;
	}));

	beforeEach(inject(($httpBackend) => {
		//GET /translations/en.json
		$httpBackend.whenGET('/translations/en.json').respond();
		service.initialize();
	}));

	describe('keys generating', () => {
		beforeEach(function() {
			//INFO: dirty hack for over come angular-co wrapper
			//that doesn't give hook on generator resolve before digest
			rootScopeUpdateIntervalId = setInterval(function() {
				console.info('...still waiting for crypto response');
				$rootScope.$digest();
			}, 1000);
		});

		it('should return public and private keys', (done) => {
			service.generateKeys('','',1024).then(function(keys) {
				expect(keys).toHaveProperty('pub');
				expect(keys).toHaveProperty('prv');
				done();
			}, function(err) {
				throw new Error(err);
			});
		});

		afterEach(function() {
			clearInterval(rootScopeUpdateIntervalId);
		});
	});
});
