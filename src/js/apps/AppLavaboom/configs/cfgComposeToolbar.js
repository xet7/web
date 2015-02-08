angular.module(primaryApplicationName).config(function($provide){

		// this demonstrates changing the classes of the icons for the tools for font-awesome v3.x
		// 
		console.log($provide);
		
		$provide.decorator('taTools', ['$delegate', function(taTools){
					taTools.bold.iconclass = 'icon-bold';
					taTools.italics.iconclass = 'icon-italic';
					taTools.underline.iconclass = 'icon-underline';
					taTools.ul.iconclass = 'icon-list-ul';
					taTools.ol.iconclass = 'icon-list-ol';
					taTools.undo.iconclass = 'icon-undo';
					taTools.redo.iconclass = 'icon-repeat';
					taTools.justifyLeft.iconclass = 'icon-align-left';
					taTools.justifyRight.iconclass = 'icon-align-right';
					taTools.justifyCenter.iconclass = 'icon-align-center';
					taTools.clear.iconclass = 'icon-ban-circle';
					taTools.insertLink.iconclass = 'icon-link';
					// taTools.unlink.iconclass = 'icon-link red';
					// taTools.insertImage.iconclass = 'icon-picture';
					// there is no quote icon in old font-awesome so we change to text as follows
					// delete taTools.quote.iconclass;
					// taTools.quote.buttontext = 'quote';
					return taTools;
				}]);
		
	});