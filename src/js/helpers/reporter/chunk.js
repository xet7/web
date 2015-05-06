const
	reporter = require('../reporter'),
	PPromise = require('../promise-polyfill');

let chunksCache = {};
let loadPromises = {};

var worker = new Worker(window.globs.IS_PRODUCTION == 'true' ? window.assets['/js/lzWorker.js'] : '/js/lzWorker.js');

function Chunk (entries, index) {
	this.entries = entries;

	this.store = () => {
		worker.postMessage(['compress', index, JSON.stringify(this)]);
	};
}

const getName = index => 'lavab-logs-chunk-' + index;

Chunk.storage = sessionStorage;

Chunk.Delete = (index) => {
	delete Chunk.storage[getName(index)];
};

Chunk.Load = (index) => new PPromise((resolve, reject) => {
	if (chunksCache[index])
		return resolve(chunksCache[index]);

	let chunk = null;
	try {
		let data = Chunk.storage[getName(index)];
		if (!data) {
			chunk = new Chunk([], index);
			chunksCache[index] = chunk;
			return resolve(chunk);
		}

		loadPromises[index] = {
			resolve,
			reject
		};
		worker.postMessage(['decompress', index, data]);
	} catch (err) {
		chunk = new Chunk([], index);
		chunksCache[index] = chunk;
		return resolve(chunk);
	}
});

Chunk.ClearCache = () => chunksCache = {};

worker.onmessage = function(e) {
	const action = e.data[0];

	switch (action) {
		case 'decompressed':
		{
			let index = e.data[1];
			let decompressed = e.data[2];
			let originalLength = e.data[3];
			let tookMs = e.data[4];

			let chunkData = JSON.parse(decompressed);

			loadPromises[index].resolve(new Chunk(chunkData.entries, index));

			reporter.console('log', 'loaded ', decompressed.length, 'bytes, for chunk ', index, 'from', originalLength, 'bytes, took', tookMs);
		}
			break;

		case 'compressed':
		{
			let index = e.data[1];
			let compressed = e.data[2];
			let originalLength = e.data[3];
			let tookMs = e.data[4];

			Chunk.storage['lavab-logs-chunk-' + index] = compressed;

			reporter.console('log', 'stored ', originalLength, 'bytes, for chunk ', index, 'compressed to', compressed.length, 'bytes, took', tookMs);
		}
			break;
	}
};

module.exports = Chunk;