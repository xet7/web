module.exports = /*@ngInject*/(co) => {
	const Cache = function (name, opts = {}) {
		let cacheByKey = {};
		let cacheByKeyTags = {};
		let cacheById = {};
		const self = this;

		console.log('construct Cache instance name: ', name, 'options:', opts);

		if (!opts.unfold)
			opts.unfold = null;
		
		this.get = (key) => {
			const r = cacheByKey[key];
			if (!r)
				return null;

			const now = new Date();

			if (now - r.time > opts.ttl) {
				console.log('cache(1) ', name, 'invalidate:', now, r.time);
				self.invalidate(key);

				return null;
			}

			return r.value;
		};

		this.getTagged = (key, tags) => {
			const now = new Date();

			const byKey = cacheByKey[key];
			if (!byKey || now - byKey.time > opts.ttl) {
				console.log('cache(2) ', name, 'invalidate:', now, byKey);
				self.invalidate(key);

				return null;
			}

			const r = cacheByKeyTags[key];
			if (!r)
				return null;

			const taggedKey = tags.join(':');
			const v = r[taggedKey];
			if (!v)
				return null;

			return v;
		};

		this.getById = (id) => {
			const r = cacheById[id];
			if (!r)
				return null;

			const rList = cacheByKey[r.key];

			const now = new Date();

			if (now - rList.time > opts.ttl) {
				self.invalidate(r.key);

				return null;
			}

			return r.value;
		};

		this.removeById = (id) => {
			for(let key of Object.keys(cacheByKey)) {
				const list = cacheByKey[key].value;
				let index = list.findIndex(item => opts.unfold(item) == id);
				if (index > -1)
					list.splice(index, 1);
			}
			for(let key of Object.keys(cacheByKeyTags)) {
				const taggedLists = cacheByKeyTags[key];
				for(let taggedKey of Object.keys(taggedLists)) {
					const taggedList = taggedLists[taggedKey];
					let index = taggedList.findIndex(item => opts.unfold(item) == id);
					if (index > -1)
						taggedList.splice(index, 1);
				}
			}
			delete cacheById[id];
		};

		this.exposeIds = () => {
			return Object.keys(cacheById).reduce((a, id) => {
				a[id] = cacheById[id].value;
				return a;
			}, {});
		};

		this.exposeKeys = (key) => {
			return cacheByKey[key] ? cacheByKey[key].value : null;
		};

		this.put = (key, value) => {
			const date = new Date();

			cacheByKey[key] = {
				value: value,
				time: date
			};

			if (opts.unfold)
				value.forEach(item => {
					const id = opts.unfold(item);
					cacheById[id] = {
						value: item,
						key: key
					};
				});
		};

		this.putTagged = (key, tags, value) => {
			const taggedKey = tags.join(':');
			if (!cacheByKeyTags[key])
				cacheByKeyTags[key] = {};

			cacheByKeyTags[key][taggedKey] = value;

			if (opts.unfold)
				value.forEach(item => {
					const id = opts.unfold(item);
					cacheById[id] = {
						value: item,
						key: key
					};
				});
		};

		this.invalidate = (key) => {
			if (cacheByKey[key]) {
				const value = cacheByKey[key].value;
				if (opts.unfold)
					value.forEach(item => {
						const id = opts.unfold(item);
						delete cacheById[id];
					});
				delete cacheByKey[key];
				delete cacheByKeyTags[key];
			}
		};

		this.invalidateAll = () => {
			cacheByKeyTags = {};
			cacheByKey = {};
			cacheById = {};
		};
	};

	return Cache;
};