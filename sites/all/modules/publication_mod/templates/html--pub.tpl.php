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

body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: Calibri, Arial, Helvetica, sans-serif;
      font-size: 19px;
      font-weight: lighter;
      line-height: 1.5em;
      color: #505050;
    }

    .element {
      margin-bottom: 30px;
      padding-bottom: 18px;
      font-size: 17px;
      line-height: 1.3em;
      border-bottom: 1px solid #C9D3DF;
    }

    .titlePaper {
      font-family: OpenSansL;
      color: #1F82C0;
      font-size: 24px;
    }

    .titleAbstract {
      font-family: AGHelv;
      font-size: 36px;
      line-height: 1.5em;
      color: #000000;
    }

    .citation {
      color: #fff;
      font-size: 17px;
      line-height: 1.3em;
      padding: 20px;
      margin-bottom: 2em;
      background-color: #505050;
    }
</style>
<!--[if IE 8 ]>    <html class="ie8 ielt9"> <![endif]-->
<!--[if lt IE 9]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
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
