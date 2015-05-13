var sinon = require('sinon'),
	_ = require('lodash');

describe('Crypto Service', () => {
	let service,
		$rootScope,
		$timeout;

	beforeEach(angular.mock.module('utils'));

	beforeEach(inject((crypto, _$rootScope_, _$timeout_) => {
		service = crypto;
		$rootScope = _$rootScope_;
		$timeout = _$timeout_;
	}));

	beforeEach(inject(($httpBackend) => {
		//GET /translations/en.json
		$httpBackend.whenGET('/translations/en.json').respond();
	}));

	describe('keys generating', () => {
		var freshKeysMock = {
				publicKeyArmored: '',
				privateKeyArmored: ''
			},
			readArmoredMock = {
				keys: ['qwerty']
			},
			defer;

		beforeEach(inject(function($q) {
			service.importPublicKey = sinon.spy();
			service.importPrivateKey = sinon.spy();

			sinon.stub(openpgp, 'generateKeyPair', function() {
				//INFO: dirty hack for over come angular-co wrapper
				//that doesn't give hook on generator resolve before digest
				setTimeout(function() {
					$rootScope.$digest();
				}, 50);

				defer = $q.defer();
				return defer.promise;
			});

			sinon.stub(openpgp.key, 'readArmored', function() {
				return readArmoredMock;
			});
		}));

		it('should return promise', () => {
			const keys = service.generateKeys();
			expect(keys.then).toBeDefined();
		});

		it('should call openpgp generator', () => {
			service.generateKeys();
			expect(openpgp.generateKeyPair).toHaveBeenCalled();
		});

		it('should resolve generateKeyPair success', (done) => {
			let success = sinon.spy(),
				fail = sinon.spy();

			try {
				service.generateKeys().then(function(keys) {
					console.log('success', keys);
					done();
				}, function(er) {
					console.log('fail', er);
					done('fail');
				});

				defer.resolve(freshKeysMock);
				$rootScope.$digest();
			} catch(er) {
				console.log('fail', er);
				done('fail');
			}
		});

		afterEach(function() {
			openpgp.generateKeyPair.restore();
			openpgp.key.readArmored.restore();
		});
	});
});
