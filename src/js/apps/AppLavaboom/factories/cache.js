module.exports = /*@ngInject*/(co) => {
	const Cache = function (opts = {}) {
		let cacheByKey = {};
		let cacheById = {};
		const self = this;

		if (!opts.unfold)
			opts.unfold = null;
		
		this.get = (key) => {
			const r = cacheByKey[key];
			if (!r)
				return null;

			const now = new Date();

			if (now - r.time > opts.ttl) {
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
						key: key,
						time: date
					};
				});
		};

		this.invalidate = (key) => {
			if (cacheByKey[key]) {
				const value = cacheByKey[key];
				if (opts.unfold)
					value.forEach(item => {
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

		this.call = (promiseInvoker, args) => co(function* (){
			let key = JSON.stringify(args);

			let r = self.get(key);
			if (r)
				return r;

			r = yield promiseInvoker.apply(this, args);

			self.put(key, r);

			return r;
		});
	};

	return Cache;
};