module.exports = ($rootScope, $translate, $filter) => {
	

	return (input) => {
		
		return $filter('date')(new Date(input), 'HH:mm');
	
	};
};