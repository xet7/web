module.exports = /*@ngInject*/($rootScope, $translate, $filter) => {
	

	return (input) => {
		var yesterday = new Date((new Date()).valueOf() - 1000*60*60*24).toDateString();
		var today = (new Date()).toDateString();
		var inputString = (new Date(input)).toDateString();
		if(inputString == today){
			return $filter('date')(new Date(input), 'HH:mm');
		} else if (inputString == yesterday) {
			return 'Yesterday';
		} else {
			return $filter('date')(new Date(input), 'dd/M/yyyy');
		}

	};
};