const integralDigest = require('../../../helpers/intervalDigest.js'),
	gen = require('jasmine-es6-generator'),
	numBits = 512;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 1000;

describe('Crypto Service', () => {
	let service,
		$rootScope,
		email = 'some@email.com',
		nameAndEmail = `John Doh <${email}>`,
		pwd = 'password';

	beforeEach(angular.mock.module('LavaUtils'));

	beforeEach(inject((crypto, _$rootScope_) => {
		service = crypto;
		$rootScope = _$rootScope_;
	}));

	//mock user email. because it inject directly to service
	beforeEach(inject((user) => {
		user.email = email;
	}));

	beforeEach(inject(($httpBackend) => {
		$httpBackend.whenGET('/translations/LavaUtils/en.json').respond();
		$httpBackend.whenGET('/partials/inbox/defaultSignature.html').respond();
	}));

	beforeEach(()=>
		service.initialize()
	);

	describe('keys generating', () => {
		beforeEach(integralDigest.start());

		it('should return public and private keys', (done) =>
			service.generateKeys('', '', numBits).then((keys) => {
				expect(keys).toHaveProperty('pub');
				expect(keys).toHaveProperty('prv');
				done();
			}, done.fail)
		);

		afterEach(integralDigest.stop());
	});

	describe('encrypting-decrypting chain', () => {
		let publicKeys;

		beforeEach(integralDigest.start());

		beforeEach(gen(function*() {
			let keys = yield service.generateKeys(nameAndEmail, pwd, numBits);
			service.importPublicKey(keys.pub);
			service.importPrivateKey(keys.prv);
			service.storeKeyring();
			service.authenticateByEmail(email, pwd);
			publicKeys = [keys.pub.armor()];
		}));

		it('should encrypt', gen(function*() {
			const orgMessage = 'original message',
				env = yield service.encodeWithKeys(orgMessage, publicKeys);

			expect(env).toHaveProperty('pgpData');
			expect(env.pgpData).not.toEqual(orgMessage);
		}));

		it('should decrypt encrypted', gen(function*() {
			const orgMessage = 'original message';

			let encodedMail = yield service.encodeWithKeys(orgMessage, publicKeys),
				decodedMail = yield service.decodeRaw(encodedMail.pgpData);

			expect(decodedMail).toEqual(orgMessage);
		}));

		afterEach(integralDigest.stop());
	});

	afterEach(() => {
		service.removeAllKeys();
		service.removeSensitiveKeys();
	});
});
