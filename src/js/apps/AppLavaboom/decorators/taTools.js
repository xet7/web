module.exports = /*@ngInject*/($delegate) => {
	$delegate.h1.iconClass = 'icon-H1';
	$delegate.h2.iconClass = 'icon-H2';
	$delegate.h3.iconClass = 'icon-H3';
	$delegate.pre.iconclass = 'icon-format-code';
	$delegate.bold.iconclass = 'icon-format-bold';
	$delegate.italics.iconclass = 'icon-format-italic';
	$delegate.underline.iconclass = 'icon-format-underline';
	$delegate.ul.iconclass = 'icon-format-list-bulleted';
	$delegate.ol.iconclass = 'icon-format-list-numbered';
	$delegate.undo.iconclass = 'icon-undo';
	$delegate.redo.iconclass = 'icon-repeat';
	$delegate.justifyLeft.iconclass = 'icon-format-align-left';
	$delegate.justifyRight.iconclass = 'icon-format-align-right';
	$delegate.justifyCenter.iconclass = 'icon-format-align-center';
	$delegate.clear.iconclass = 'icon-ban-circle';
	$delegate.insertImage.iconclass = 'icon-format-photo';
	$delegate.indent.iconclass = 'icon-format-indent';
	$delegate.outdent.iconclass = 'icon-format-dedent';
	// $delegate.unlink.iconclass = 'icon-link red';
	// $delegate.insertImage.iconclass = 'icon-picture';
	// there is no quote icon in old font-awesome so we change to text as follows
	// delete $delegate.quote.iconclass;
	$delegate.quote.iconclass = 'icon-format-quote';
	return $delegate;
};