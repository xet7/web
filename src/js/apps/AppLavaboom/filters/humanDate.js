module.exports = (dateFilter, translateFilter) => {
	return (date) => {
		var now = new Date();
		var dateObj = new Date(date);

		if (dateObj.toDateString() == now.toDateString())
			return translateFilter('DATES.TODAY');

		var yesterday = new Date(new Date().setDate(new Date().getDate()-1));

		if (dateObj.toDateString() == yesterday.toDateString())
			return translateFilter('DATES.YESTERDAY');

		return dateFilter(dateObj);
	};
};