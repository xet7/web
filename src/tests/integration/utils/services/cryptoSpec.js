const integralDigest = require('../../../helpers/intervalDigest.js'),
	numBits = 512;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*1000;

describe('Crypto Service', () => {
	let service,
		$rootScope,
		co;

	beforeEach(angular.mock.module('utils'));

	beforeEach(inject((crypto, _$rootScope_, _co_) => {
		service = crypto;
		$rootScope = _$rootScope_;
		co = _co_;
	}));

	beforeEach(inject(($httpBackend) => {
		//GET /translations/en.json
		$httpBackend.whenGET('/translations/en.json').respond();
		service.initialize();
	}));

	describe('keys generating', () => {
		beforeEach(integralDigest.start());

		it('should return public and private keys', (done) =>
			service.generateKeys('', '', numBits).then((keys) => {
				expect(keys).toHaveProperty('pub');
				expect(keys).toHaveProperty('prv');
				done();
			}, (err) => {
				throw new Error(err);
			})
		);

		afterEach(integralDigest.stop());
	});

	describe('encrypting-decrypting chain', () => {
		let publicKeys,
			email = 'some@email.com',
			nameEmail = `John Doh <${email}>`,
			pwd = 'password';

		beforeEach(integralDigest.start());

		beforeEach((done) => coJS(function*() {
			let keys = yield service.generateKeys(nameEmail, pwd, numBits);
			service.authenticateByEmail(email, pwd);
			publicKeys = [keys.pub.armor()];
			done();
		}));

		it('should encrypt', (done) => coJS(function*() {
			const orgMessage = 'original message',
				env = yield service.encodeWithKeys(orgMessage, publicKeys);

			expect(env).toHaveProperty('pgpData');
			expect(env.pgpData).not.toEqual(orgMessage);
			done();
		}));

		it('should decrypt encrypted', (done) => coJS(function*() {
			const orgMessage = 'original message';

			let encodedMail = yield service.encodeWithKeys(orgMessage, publicKeys),
				decodedMail = yield service.decodeRaw(encodedMail.pgpData);

			expect(decodedMail).toEqual(orgMessage);
			done();
		}));

		afterEach(integralDigest.stop());
	});
});
