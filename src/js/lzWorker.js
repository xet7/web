const
	lzString = require('../bower_components/lz-string/libs/lz-string.js');

self.onmessage = function(e) {
	let
		action = e.data[0],
		start = new Date().getTime(),
		index, data;

	switch (action) {
		case 'compress':
			index = e.data[1];
			data = e.data[2];

			var compressed = lzString.compressToUTF16(data);
			self.postMessage(['compressed', index, compressed, data.length, new Date().getTime() - start]);

			break;

		case 'decompress':
			index = e.data[1];
			data = e.data[2];

			var decompressed = lzString.decompressFromUTF16(data);
			self.postMessage(['decompressed', index, decompressed, data.length, new Date().getTime() - start]);

			break;
	}
};