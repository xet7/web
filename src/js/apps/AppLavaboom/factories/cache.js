module.exports = /*@ngInject*/(co) => {
	const Cache = function (name, opts = {}) {
		let cacheByKey = {};
		let cacheById = {};
		const self = this;

		console.log('construct Cache instance name: ', name, 'options:', opts);

		if (!opts.unfold)
			opts.unfold = null;
		if (!opts.list)
			opts.list = value => value;
		
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
				const list = opts.list(cacheByKey[key].value);
				let index = list.findIndex(item => opts.unfold(item) == id);
				if (index > -1)
					list.splice(index, 1);
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
				opts.list(value).forEach(item => {
					const id = opts.unfold(item);
					cacheById[id] = {
						value: item,
						key: key
					};
				});
		};

		this.unshift = (key, item) => {
			if (!cacheByKey[key])
				return false;

			opts.list(cacheByKey[key].value).unshift(item);

			if (opts.unfold) {
				const id = opts.unfold(item);
				cacheById[id] = {
					value: item,
					key: key
				};
			}
		};

		this.invalidate = (key) => {
			if (cacheByKey[key]) {
				const value = cacheByKey[key].value;
				if (opts.unfold)
					opts.list(value).forEach(item => {
						const id = opts.unfold(item);
						delete cacheById[id];
					});
				delete cacheByKey[key];
			}
		};

		this.invalidateAll = () => {
			cacheByKey = {};
			cacheById = {};
		};
	};

	return Cache;
};