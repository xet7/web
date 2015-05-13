const integralDigest = require('../../../helpers/intervalDigest.js');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*1000;

describe('Crypto Service', () => {
	let service,
		$rootScope;

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
		beforeEach(integralDigest.start);

		it('should return public and private keys', (done) =>
			service.generateKeys('','',1024).then((keys) => {
				expect(keys).toHaveProperty('pub');
				expect(keys).toHaveProperty('prv');
				done();
			}, (err) => {
				throw new Error(err);
			})
		);

		afterEach(integralDigest.stop);
	});
});
