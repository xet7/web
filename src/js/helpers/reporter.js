const printStackTrace = require('../../bower_components/stacktrace-js/dist/stacktrace.js');
const flushTimeout = 1000;

const
	Chunk = require('./reporter/chunk'),
	Cursor = require('./reporter/cursor'),
	Entry = require('./reporter/entry');

let storage = null;
let chunkSavers = {};
let cursorSaver = null;

const cursor = Cursor.Load(storage);

const storeEntry = (entry) => {
	try {
		const index = cursor.getChunkIndex();
		let chunk = Chunk.Load(storage, index);

		chunk.entries.push(entry);
		cursor.next();

		if (!chunkSavers[index])
			chunkSavers[index] = setTimeout(() => {
				try {
					chunk.store(storage);
				} finally {
					delete chunkSavers[index];
				}
			}, flushTimeout);
		if (!cursorSaver)
			cursorSaver = setTimeout(() => {
				try {
					cursor.store(storage);
				} finally {
					cursorSaver = null;
				}
			}, flushTimeout);
	} catch (err) {

	}
};

const proxy = (obj, name) => {
	obj[name] = (...args) => {
		storeEntry(new Entry(name, args[0], args.slice(1)));
	};
};

module.exports.install = (_storage) => {
	storage = _storage;

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

module.exports.exportEntries = () => {
	let entries = [];

	const exportCursor = {
		lastChunkIndex: cursor.lastChunkIndex,
		lastChunkLength: cursor.lastChunkLength,
		length: cursor.length
	};
	cursor.next();
	cursor.store(storage);

	for(let i = 0; i <= cursor.lastChunkIndex; i++) {
		for (let e of Chunk.Load(storage, i).entries) {
			entries.push(e);
		}
	}

	return {
		entries: entries,
		cursor: exportCursor
	};
};

module.exports.clearEntries = (clearCursor) => {
	for(let i of Object.keys(chunkSavers))
		clearTimeout(chunkSavers[i]);
	if (cursorSaver)
		clearTimeout(cursorSaver);
	chunkSavers = {};
	cursorSaver = null;

	for(let i = 0; i < clearCursor.lastChunkIndex; i++)
		Chunk.Delete(storage, i);

	cursor.lastChunkIndex -= clearCursor.lastChunkIndex;

	if (clearCursor.lastChunkLength < cursor.lastChunkLength) {
		let lastChunk = Chunk.Load(storage, clearCursor.lastChunkIndex);
		lastChunk.entries = lastChunk.entries.slice(clearCursor.lastChunkLength);
	}
	else
	{

	}

	cursor.clear(storage);
	Chunk.ClearCache();
};