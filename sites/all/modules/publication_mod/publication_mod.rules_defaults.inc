<?php
function publication_mod_default_rules_configuration() {
	  $config = array();

	  $rules_path = drupal_get_path('module', 'publication_mod') . '/rules';
	  $files = file_scan_directory($rules_path, '/\.rule$/');

	  foreach ($files as $filepath => $file) {
	    require $filepath;
	    if (isset($rule)) {
	      $config['publication_mod_' . $file->name] = rules_import($rule);
	    }
	  }

	  return $config;
}