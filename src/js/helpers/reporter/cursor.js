const chunkSize = 1024;

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

module.exports = Cursor;