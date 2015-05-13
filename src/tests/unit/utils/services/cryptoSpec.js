var sinon = require('sinon');

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

		beforeEach(inject(($q) => {
			service.importPublicKey = sinon.spy();
			service.importPrivateKey = sinon.spy();

			sinon.stub(openpgp, 'generateKeyPair', () => {
				//INFO: dirty hack for over come angular-co wrapper
				//that doesn't give hook on generator resolve before digest
				setTimeout(() => $rootScope.$digest(), 50);

				defer = $q.defer();
				return defer.promise;
			});

			sinon.stub(openpgp.key, 'readArmored', () => {
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

		it('should return public and private keys', (done) => {
			service.generateKeys().then((keys) => {
				expect(keys).toHaveProperty('pub');
				expect(keys).toHaveProperty('prv');
				done();
			}, (err) => {
				throw new Error(err);
			});

			defer.resolve(freshKeysMock);
			$rootScope.$digest();
		});

		afterEach(() => {
			openpgp.generateKeyPair.restore();
			openpgp.key.readArmored.restore();
		});
	});
});
