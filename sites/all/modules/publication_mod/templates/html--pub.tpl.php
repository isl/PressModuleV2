<!DOCTYPE html>
<html>
<head>
<?php print $head; ?>
<title><?php print $head_title; ?></title>
<?php print $styles; ?>
<?php print $scripts; ?>
<style type="text/css" media="all">
@import url("/sites/all/themes/phoenix_responsive_theme/css/homepage_style.css");
@import url("/sites/all/themes/phoenix_responsive_theme/css/general_style.css");
@import url("/sites/all/themes/phoenix_responsive_theme/css/publications_style.css");
@import url("/sites/all/themes/phoenix_responsive_theme/css/responsive.css");
@import url("/sites/all/modules/publication_mod/css/publications/ics_styles_inside-02-11-2018.css");
@import url("/sites/all/modules/publication_mod/css/publications/topnav-09-09-2018.css");
@import url("/sites/all/modules/publication_mod/css/publications/publication.css");
</style>
<!--[if IE 8 ]>    <html class="ie8 ielt9"> <![endif]-->
<!--[if lt IE 9]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
<script src="https://cdn.jsdelivr.net/npm/citation-js@0.4.0-10/build/citation.js"></script>
</head>
<body class="<?php print $classes; ?>"<?php print $attributes; ?>>
	<div id="skip-link">
		<a href="#main-content" class="element-invisible element-focusable"><?php print t('Skip to main content'); ?></a>
	</div>
  	<?php print $page_top; ?>
	<?php print $page; ?>
	<?php print $page_bottom; ?>
</body>
</html>
