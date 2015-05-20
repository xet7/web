module.exports = /*@ngInject*/($delegate, taRegisterTool, textAngularHelpers) => {
	taRegisterTool('submit', {
		iconclass: 'fa fa-bold',
		tooltiptext: 'submit',
		action: function(){
			if (textAngularHelpers.ctrlEnterCallback)
				textAngularHelpers.ctrlEnterCallback();
		},
		commandKeyCode: 10
	});

	$delegate.toolbar[1].push('submit');

	return $delegate;
};