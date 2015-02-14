module.exports = ($delegate) => {
	$delegate.bold.iconclass = 'icon-bold';
	$delegate.italics.iconclass = 'icon-italic';
	$delegate.underline.iconclass = 'icon-underline';
	$delegate.ul.iconclass = 'icon-list-ul';
	$delegate.ol.iconclass = 'icon-list-ol';
	$delegate.undo.iconclass = 'icon-undo';
	$delegate.redo.iconclass = 'icon-repeat';
	$delegate.justifyLeft.iconclass = 'icon-align-left';
	$delegate.justifyRight.iconclass = 'icon-align-right';
	$delegate.justifyCenter.iconclass = 'icon-align-center';
	$delegate.clear.iconclass = 'icon-ban-circle';
	$delegate.insertLink.iconclass = 'icon-link';
	// $delegate.unlink.iconclass = 'icon-link red';
	// $delegate.insertImage.iconclass = 'icon-picture';
	// there is no quote icon in old font-awesome so we change to text as follows
	// delete $delegate.quote.iconclass;
	// $delegate.quote.buttontext = 'quote';
	return $delegate;
};