module.exports = /*@ngInject*/($timeout, $state, $compile, $sanitize, $templateCache, co, user, consts) => {
	/*function getBase64Image(img) {
		// Create an empty canvas element
		var canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;

		// Copy the image contents to the canvas
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG. You could check img.src to guess the
		// original format, but be aware the using "image/jpg" will re-encode the image.
		var dataURL = canvas.toDataURL('image/png');

		return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
	}

	const transform = (emailBodyHtml) => {
		angular.forEach(emailBodyHtml.find('img'), img => {
			const imgElement = angular.element(img);

			let src = imgElement.attr('src');
			if (!src)
				return;

			src = src.trim();
			if (!src.startsWith('data:')) {
				const imageDataURI = getBase64Image(img);
				console.log('image encoded into', imageDataURI);

				imgElement.attr('src', imageDataURI);
			}
		});
	};*/

	return {
		restrict : 'A',
		require: 'ngModel',
		link  : (scope, el, attrs, ngModel) => {
			/*scope.$watch(
				() => ngModel.$modelValue,
				(emailBody) => {
					console.log(emailBody);
					const emailBodyHtml = angular.element(`<div>${emailBody}</div>`);

					transform(emailBodyHtml);

					console.log('replace with', emailBodyHtml.html());
					ngModel.$setViewValue(emailBodyHtml.html());
				}
			);*/
		}
	};
};