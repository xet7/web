const integralDigest = require('../../../helpers/intervalDigest.js'),
	  sinon = require('sinon');

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
		let freshKeysMock = {
				publicKeyArmored: '',
				privateKeyArmored: ''
			},
			readArmoredMock = {
				keys: ['qwerty']
			},
			generateKeyPairDefer;

		beforeEach(inject(($q) => {
			service.importPublicKey = sinon.spy();
			service.importPrivateKey = sinon.spy();

			sinon.stub(openpgp, 'generateKeyPair', () => {
				generateKeyPairDefer = $q.defer();
				return generateKeyPairDefer.promise;
			});

			sinon.stub(openpgp.key, 'readArmored', () => {
				return readArmoredMock;
			});
		}));

		beforeEach(integralDigest.start(50));

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

			generateKeyPairDefer.resolve(freshKeysMock);
			$rootScope.$digest();
		});

		afterEach(integralDigest.stop());

		afterEach(() => {
			openpgp.generateKeyPair.restore();
			openpgp.key.readArmored.restore();
		});
	});

	describe('encrypting', ()=> {
		let encryptMessageDefer;

		beforeEach(integralDigest.start(50));

		beforeEach(inject(($q) => {
			sinon.stub(openpgp, 'encryptMessage', () => {
				encryptMessageDefer = $q.defer();
				return encryptMessageDefer.promise;
			});
		}));

		it('should return promise', () => {
			const envelope = service.encodeEnvelopeWithKeys();
			expect(envelope.then).toBeDefined();
		});

		it('should resolve with data', (done) => {
			let envelope = {
				data: 'message'
			},
				keys = ['public key'];

			service.encodeEnvelopeWithKeys(envelope, keys)
				.then((env) => {
					expect(env).toHaveProperty('data', 'encrypted message');
					done()
				}, (err) => {
					throw new Error(err);
				});

			encryptMessageDefer.resolve('encrypted message');
		});

		afterEach(integralDigest.stop());

		afterEach(() => {
			openpgp.encryptMessage.restore();
		});
	});

	describe('decrypting', ()=> {
		let decodeRawDefer;

		beforeEach(integralDigest.start(100));

		beforeEach(inject(($q) => {
			decodeRawDefer = $q.defer();
			service.decodeRaw = sinon.stub().returns(decodeRawDefer.promise);
		}));

		it('should return promise', () => {
			const envelope = service.decodeEnvelope();
			expect(envelope.then).toBeDefined();
		});

		it('should resolve with data', (done) => {
			let envelope = {
				data: 'message'
			};

			service.decodeEnvelope(envelope)
				.then((env) => {
					expect(env).toHaveProperty('data', 'decrypted message');
					done()
				}, (err) => {
					throw new Error(err);
				});

			decodeRawDefer.resolve('decrypted message');
		});

		afterEach(integralDigest.stop());
	});
});

