const
	printStackTrace = require('../../bower_components/stacktrace-js/dist/stacktrace.js'),
	PPromise = require('./promise-polyfill'),
	Chunk = require('./reporter/chunk'),
	Cursor = require('./reporter/cursor'),
	Entry = require('./reporter/entry');

const flushTimeout = 1000;

let chunkSavers = {};
let cursorSaver = null;

const cursor = Cursor.Load();

const storeEntry = (entry) => {
	try {
		const index = cursor.getChunkIndex();
		Chunk.Load(index).then(chunk => {
			try {
				chunk.entries.push(entry);
				cursor.next();

				if (!chunkSavers[index])
					chunkSavers[index] = setTimeout(() => {
						try {
							chunk.store();
						} finally {
							delete chunkSavers[index];
						}
					}, flushTimeout);
				if (!cursorSaver)
					cursorSaver = setTimeout(() => {
						try {
							cursor.store();
						} finally {
							cursorSaver = null;
						}
					}, flushTimeout);
			} catch (err) {

			}
		});
	} catch (err) {

	}
};

const proxy = (obj, name) => {
	obj[name] = (...args) => {
		storeEntry(new Entry(
			name,
			args[0],
			args.slice(1),
			printStackTrace().slice(1)
		));
	};
};

module.exports.install = (_storage) => {
	Cursor.storage = Chunk.storage = _storage;

	for(let name of ['log'])
		proxy(console, name);
};

module.exports.reportError = (error) => {
	storeEntry(new Entry(
		'exception',
		error.message,
		[],
		printStackTrace({e : error})
	));
};

module.exports.exportEntries = () => new PPromise((resolve, reject) => {
	let entries = [];
	let exportCursor = null;

	if (cursor.lastChunkLength > 0) {
		exportCursor = {
			skipChunkIndex: cursor.skipChunkIndex,
			lastChunkIndex: cursor.lastChunkIndex,
			lastChunkLength: cursor.lastChunkLength,
			length: cursor.length
		};

		cursor.nextChunk();
		cursor.store();
	} else
		exportCursor = {
			skipChunkIndex: cursor.skipChunkIndex,
			lastChunkIndex: Math.max(0, cursor.lastChunkIndex - 1),
			lastChunkLength: cursor.lastChunkLength,
			length: cursor.length
		};

	let promises = [];
	for(let i = exportCursor.skipChunkIndex; i <= exportCursor.lastChunkIndex; i++) {
		let chunkStorePromise = new PPromise((resolve, reject) => {
			Chunk.Load(i)
				.then(chunk => {
					for (let e of chunk.entries) {
						entries.push(e);
					}
					resolve();
				})
				.catch(e => {
					reject(e);
				});
		});

		promises.push(chunkStorePromise);
	}

	PPromise.all(promises)
		.then(() => resolve({
			assets: Entry.assets,
			entries: entries,
			cursor: exportCursor
		}))
		.catch(e => reject(e));
});

module.exports.clearEntries = (clearCursor = null) => {
	if (!clearCursor) {
		console.warn('clearEntries called without a cursor - delete everything');
		cursor.clear();
		Chunk.ClearCache();
		return;
	}

	console.warn('clearEntries clear chunks from ', clearCursor.skipChunkIndex, 'till', clearCursor.lastChunkIndex);

	for(let i = clearCursor.skipChunkIndex; i <= clearCursor.lastChunkIndex; i++) {
		if (chunkSavers[i]) {
			clearTimeout(chunkSavers[i]);
			delete chunkSavers[i];
		}
		Chunk.Delete(i);
	}

	if (cursorSaver) {
		clearTimeout(cursorSaver);
		cursorSaver = null;
	}
	cursor.skipChunkIndex = clearCursor.lastChunkIndex + 1;
	if (cursor.skipChunkIndex > cursor.lastChunkIndex)
		cursor.lastChunkIndex = cursor.skipChunkIndex;

	console.warn('clearEntries skipChunkIndex is now ', cursor.skipChunkIndex);
	cursor.store();
};