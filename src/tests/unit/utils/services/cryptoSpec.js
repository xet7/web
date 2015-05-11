describe('Crypto Service', () => {
	let service;

	beforeEach(angular.mock.module('utils'));

	beforeEach(inject((crypto) => {
		service = crypto;
	}));

	it('should exist', () => {
		expect(service).not.toBeNull();
	});
});

