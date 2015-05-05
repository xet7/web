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

Chunk.ClearCache = () => chunksCache = {};

module.exports = Chunk;