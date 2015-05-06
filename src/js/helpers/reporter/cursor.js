const
	Chunk = require('./chunk');

const chunkSize = 32;

function Cursor (skipChunkIndex = 0, lastChunkIndex = 0, lastChunkLength = 0, length = 0) {
	const self = this;

	self.skipChunkIndex = skipChunkIndex;
	self.lastChunkIndex = lastChunkIndex;
	self.lastChunkLength = lastChunkLength;
	self.length = length;

	self.store = () => {
		Cursor.storage['lavab-logs-cursor'] = JSON.stringify(this);
	};

	self.clear = () => {
		for (let i = skipChunkIndex; i <= self.lastChunkIndex; i++) {
			Chunk.Delete(i);
		}

		self.lastChunkIndex = skipChunkIndex;
		self.lastChunkLength = 0;
		self.length = 0;

		self.store();
	};

	self.next = () => {
		self.length++;
		self.lastChunkLength++;
		if (self.lastChunkLength >= chunkSize) {
			self.lastChunkIndex++;
			self.lastChunkLength = 0;
		}
	};

	self.nextChunk = () => {
		self.lastChunkLength = 0;
		self.lastChunkIndex++;
	};

	self.getChunkIndex = () => self.lastChunkIndex + (self.lastChunkLength < chunkSize ? 0 : 1);
}

Cursor.storage = sessionStorage;

Cursor.Load = () => {
	try {
		const cursor = JSON.parse(Cursor.storage['lavab-logs-cursor']);
		return new Cursor(cursor.skipChunkIndex, cursor.lastChunkIndex, cursor.lastChunkLength, cursor.length);
	} catch (err) {
		return new Cursor();
	}
};

module.exports = Cursor;