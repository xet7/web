module.exports = /*@ngInject*/(dateFilter, translateFilter) => {
	return (date) => {
		let now = new Date();
		let dateObj = new Date(date);

		if (dateObj.toDateString() == now.toDateString())
			return translateFilter('DATES.TODAY');

		let yesterday = new Date(new Date().setDate(new Date().getDate()-1));

		if (dateObj.toDateString() == yesterday.toDateString())
			return translateFilter('DATES.YESTERDAY');

		return dateFilter(dateObj);
	};
};