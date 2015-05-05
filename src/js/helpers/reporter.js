const printStackTrace = require('../../bower_components/stacktrace-js/dist/stacktrace.js');
const chunkSize = 1024;

let chunksCache = {};

function Chunk (entries, index) {
	this.entries = entries;

	this.store = (storage) => {
		const chunk = JSON.stringify(this);
		storage['lavab-logs-chunk-' + index] = chunk;
	};
}

Chunk.Delete = (storage, index) => {
	delete storage['lavab-logs-chunk-' + index];
};

Chunk.Load = (storage, index) => {
	if (chunksCache[index])
		return chunksCache[index];

	let chunk = null;
	try {
		const chunkData = JSON.parse(storage['lavab-logs-chunk-' + index]);
		chunk = new Chunk(chunkData.entries, index);
	} catch (err) {
		chunk = new Chunk([], index);
	}

	chunksCache[index] = chunk;
	return chunk;
};

function Cursor (lastChunkIndex = 0, lastChunkLength = 0, length = 0) {
	const self = this;

	self.lastChunkIndex = lastChunkIndex;
	self.lastChunkLength = lastChunkLength;
	self.length = length;

	self.store = (storage) => {
		storage['lavab-logs-cursor'] = JSON.stringify(this);
	};

	self.clear = (storage) => {
		for(let i = 0; i <= self.lastChunkIndex; i++) {
			Chunk.Delete(storage, i);
		}

		self.lastChunkIndex = 0;
		self.lastChunkLength = 0;
		self.length = 0;

		self.store(storage);
	};

	self.next = () => {
		self.lastChunkLength++;
		if (self.lastChunkLength >= chunkSize)
			self.lastChunkIndex++;
		self.length++;
	};

	self.getChunkIndex = () => self.lastChunkIndex + (self.lastChunkLength < chunkSize ? 0 : 1);
}

Cursor.Load = (storage) => {
	try {
		const cursor = JSON.parse(storage['lavab-logs-cursor']);
		return new Cursor(cursor.lastChunkIndex, cursor.lastChunkLength, cursor.length);
	} catch (err) {
		return new Cursor();
	}
};

function Entry (name, message, objects, stacktrace = null) {
	const self = this;

	self.date = new Date();
	self.stacktrace = stacktrace ? stacktrace : printStackTrace().slice(2);

	self.type = name;
	self.message = message;
	self.objects = objects.map(o => {
		try {
			return JSON.stringify(o);
		} catch (err) {
			return '~~~';
		}
	});
}

let storage = null;
const cursor = Cursor.Load(storage);

const storeEntry = (entry) => {
	const index = cursor.getChunkIndex();

	let chunk = Chunk.Load(storage, index);

	chunk.entries.push(entry);
	chunk.store(storage);

	cursor.next();
	cursor.store(storage);
};

const getEntries = () => {
	let entries = [];

	for(let i = 0; i <= cursor.lastChunkIndex; i++) {
		for (let e of Chunk.Load(storage, i).entries) {
			entries.push(e);
		}
	}

	return entries;
};

const proxy = (obj, name) => {
	obj[name] = (...args) => {
		try {
			storeEntry(new Entry(name, args[0], args.slice(1)));
		} catch (err) {

		}
	};
};

module.exports.install = (_storage) => {
	storage = _storage;

	for(let name of ['log'])
		proxy(console, name);
};

module.exports.reportError = (error) => {
	try {
		storeEntry(new Entry('exception', error.message, [], printStackTrace({e : error})));
	} catch (err) {

	}
};

module.exports.exportEntries = () => {
	return getEntries();
};

module.exports.clearEntries = () => {
	cursor.clear(storage);
	chunksCache = {};
};