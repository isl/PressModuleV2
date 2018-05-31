<?php
// Copyright FORTH-ICS, Emmanouil Dermitzakis
// -*- mode: php;-*-

function publication_mod_settings_page(){
	$markup = '';

	$markup .= '<h3>Edit Authors</h3>';
	$markup .= '<ul>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/internal_authors">Edit Internal Authors</a></li>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/external_authors">Edit External Authors</a></li>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/merge_authors">Merge Authors</a></li>';
	$markup .= '</ul>';
	$markup .= '<h3>Edit Content</h3>';
	$markup .= '<ul>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/projects">Edit Projects</a></li>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/tags">Edit Tags</a></li>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/edit_orgs">Edit Organizations</a></li>';
	$markup .= '</ul>';
	$markup .= '<h3>Import Content</h3>';
	$markup .= '<ul>';
	$markup .= '<li><a href="/admin/config/publications/publication_mod/import_pubs">Import Publications</a></li>';
	$markup .= '</ul>';
	$page = array(
		'form' => drupal_get_form('publication_mod_settings_form'),
		'afterFormContent' => array('#markup'=>$markup),
	);
	return $page;
}

/*
 * Creates the publication_mod Configuration Page
 */
function publication_mod_settings_form($form, &$form_state){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

  $form['publication_mod_blazegraph_url'] = array(
	'#type' => 'textfield',
	'#title' => t('Blazegraph URL'),
	'#default_value' => $blazegraph_info['blazegraph_url'],
	'#size' => 50,
	'#maxlength' => 200,
	'#description' => t('The sparql REST API URL of Blazegraph'),
	'#required' => TRUE,
  );

  $form['publication_mod_blazegraph_prefix'] = array(
	'#type' => 'textfield',
	'#title' => t('Ontology Prefix'),
	'#default_value' => $blazegraph_info['blazegraph_prefix'],
	'#size' => 50,
	'#maxlength' => 50,
	'#description' => t('The Ontology Prefix that will be used'),
	'#required' => TRUE,
  );

  $form['save'] = array(
	'#type' => 'submit',
	'#value' => 'Save',
	'#submit' => array('publication_mod_settings_form_submit')
  );

  return $form;
}

function publication_mod_settings_form_submit($form, $form_state){
  db_merge('publication_mod')
	->key(array('pm_key' => 'blazegraph_url'))
	->fields(array(
	  'pm_value' => $form_state['values']['publication_mod_blazegraph_url']
	))
	->execute();

  db_merge('publication_mod')
	->key(array('pm_key' => 'blazegraph_prefix'))
	->fields(array(
	  'pm_value' => $form_state['values']['publication_mod_blazegraph_prefix']
	))
	->execute();
}

function _external_authors_edit(){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();

  drupal_add_css("https://cdn.datatables.net/v/dt/dt-1.10.16/b-1.4.2/sl-1.2.3/datatables.css", array('type'=>'external'));
  drupal_add_js("https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js", 'external');
  drupal_add_js("https://cdn.datatables.net/buttons/1.4.2/js/dataTables.buttons.js", 'external');
  drupal_add_js("https://cdn.datatables.net/select/1.2.3/js/dataTables.select.js", 'external');

  $internalJS = "jQuery(document).ready(function($){ \n" .
	"$('#search-external-author').pressExternalAuthors({ \n" .
	  "dbURL: '". $dbURL ."', \n" .
	  "prefix: '" . $ontologyPrefix . "', \n" .
	"}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-external-author"></div>';
  return $html;
}

function _internal_authors_edit(){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();

  drupal_add_css("https://cdn.datatables.net/v/dt/dt-1.10.16/b-1.4.2/sl-1.2.3/datatables.css", array('type'=>'external'));
  drupal_add_js("https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js", 'external');
  drupal_add_js("https://cdn.datatables.net/buttons/1.4.2/js/dataTables.buttons.js", 'external');
  drupal_add_js("https://cdn.datatables.net/select/1.2.3/js/dataTables.select.js", 'external');

  $internalJS = "jQuery(document).ready(function($){ \n" .
	"$('#search-internal-author').pressInternalAuthors({ \n" .
	  "dbURL: '". $dbURL ."', \n" .
	  "prefix: '" . $ontologyPrefix . "', \n" .
	"}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-internal-author"></div>';
  return $html;
}

function _merge_authors(){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();

  drupal_add_css("https://cdn.datatables.net/v/dt/dt-1.10.16/b-1.4.2/sl-1.2.3/datatables.css", array('type'=>'external'));
  drupal_add_js("https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js", 'external');
  drupal_add_js("https://cdn.datatables.net/buttons/1.4.2/js/dataTables.buttons.js", 'external');
  drupal_add_js("https://cdn.datatables.net/select/1.2.3/js/dataTables.select.js", 'external');

  $internalJS = "jQuery(document).ready(function($){ \n" .
	"$('#search-author').pressMergeAuthors({ \n" .
	  "dbURL: '". $dbURL ."', \n" .
	  "prefix: '" . $ontologyPrefix . "', \n" .
	"}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-author"></div>';
  return $html;
}

function _projects_edit(){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();
  drupal_add_css("https://cdn.datatables.net/v/dt/dt-1.10.16/b-1.4.2/sl-1.2.3/datatables.css", array('type'=>'external'));
  drupal_add_js("https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js", 'external');
  drupal_add_js("https://cdn.datatables.net/buttons/1.4.2/js/dataTables.buttons.js", 'external');
  drupal_add_js("https://cdn.datatables.net/select/1.2.3/js/dataTables.select.js", 'external');

  $internalJS = "jQuery(document).ready(function($){ \n" .
	"$('#search-project').pressEditProjects({ \n" .
	  "dbURL: '". $dbURL ."', \n" .
	  "prefix: '" . $ontologyPrefix . "', \n" .
	"}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-project"></div>';
  return $html;
}

function _tags_edit(){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();
  drupal_add_css("https://cdn.datatables.net/v/dt/dt-1.10.16/b-1.4.2/sl-1.2.3/datatables.css", array('type'=>'external'));
  drupal_add_js("https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js", 'external');
  drupal_add_js("https://cdn.datatables.net/buttons/1.4.2/js/dataTables.buttons.js", 'external');
  drupal_add_js("https://cdn.datatables.net/select/1.2.3/js/dataTables.select.js", 'external');

  $internalJS = "jQuery(document).ready(function($){ \n" .
	"$('#search-tag').pressEditTags({ \n" .
	  "dbURL: '". $dbURL ."', \n" .
	  "prefix: '" . $ontologyPrefix . "', \n" .
	"}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-tag"></div>';
  return $html;
}

function publication_mod_import_pubs_form($form, &$form_state){
  // $form['price'] = array(
  //   '#type' => 'textfield', //you can find a list of available types in the form api
  //   '#title' => 'What is Your Price?',
  //   '#size' => 10,
  //   '#maxlength' => 10,
  //   '#required' => TRUE, //make this field required
  // );

  $form['submit_button'] = array(
	'#type' => 'submit',
	'#value' => t('Import from Blazegraph'),

	'#ajax' => array(
	  'callback' => 'publication_mod_import_submit_callback',
	  'wrapper' => 'import-wrapper',
	  'progress' => array(
		  'type' => 'bar',
		  'message' => t('Starting import...'),
		  'url' => 'import_pubs/progress', //url to fetch current progress percentage
		  'interval' => '1000' //progress bar will refresh in 1 second
	  )
	)
  );
  $form['checkboxes_fieldset'] = array(
	'#title' => t("Result"),
	// The prefix/suffix provide the div that we're replacing, named by
	// #ajax['wrapper'] above.
	'#prefix' => '<div id="import-wrapper">',
	'#suffix' => '</div>',
	'#type' => 'fieldset',
	'#description' => t('This is where we get automatically generated checkboxes'),
  );
  return $form;
}

/**
 * Create Pages for each publication callback
 * @param type $form 
 * @param type $form_state 
 * @return type
 */
function publication_mod_import_submit_callback($form, $form_state){
  global $base_url;
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  //Get all pubs without a publicationUrl

  $query = 'prefix press: <'. $ontologyPrefix. '>
			select * where{
			  ?pub rdf:type [rdfs:subClassOf* press:Publication].
			  FILTER NOT EXISTS{?pub press:publicationUrl ?publicationUrl}.
			  ?pub rdf:type ?type.
			}';

  $q = http_build_query(array('query' => $query));

  $options = array(
	'headers' => array(
	  'Accept'=>'application/sparql-results+json',
	  'content-type'=> 'application/x-www-form-urlencoded'),
	'method' => 'POST',
	'data' => $q
  );

  $result = drupal_http_request($dbURL, $options);

  $obj = json_decode($result->data);
  $pub_count = count($obj->results->bindings);
  $count = 0;
  

  foreach($obj->results->bindings as $pub){
	$pub_uri = $pub->pub->value;
	$pub_type = explode("#", $pub->type->value)[1];

	$pub_page = _publication_mod_create_page_body($pub_uri);

	$new_node_info = publication_mod_ajax_callback($pub_page['title'], $pub_type, $pub_page['html'], $pub_page['summary'], $pub_uri);

	//Add publicationUrl to created publication.
	$update = 'prefix press: <'. $ontologyPrefix. '>
			delete{
			  ?pub press:publicationUrl ?old_url.
			}
			insert{
			  ?pub press:publicationUrl "'.$new_node_info['path'].'".
			}
			where{
			  BIND (<'. $pub_uri .'> as ?pub).
			  OPTIONAL {?pub press:publicationUrl ?old_url}.
			}';

	$q = http_build_query(array('update' => $update));

	$options = array(
	  'headers' => array(
		'Accept'=>'application/sparql-results+json',
		'content-type'=> 'application/x-www-form-urlencoded'),
	  'method' => 'POST',
	  'data' => $q
	);

	$update_results = drupal_http_request($dbURL, $options);

	//Update status bar
	variable_set('publication_mod_import_status', round((++$count/$pub_count)*100));
  }

  variable_set('publication_mod_import_status', 0);
  return 'Insertion Completed';
}

/**
 * Get progress of importing
 * @return type
 */
function publication_mod_import_progress(){
  $progress = array(
	  'message' => t('Starting import...'),
	  'percentage' => -1,
  );

  $completed_percentage = variable_get('publication_mod_import_status', 0); // calculate progress percentage here

  if($completed_percentage){
	  $progress['message'] = t('Importing...');
	  $progress['percentage'] = $completed_percentage ;
  }

  drupal_json_output($progress);
}

function publication_mod_edit_orgs_form($form, &$form_state){

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_orgs'));

//   $query = 'prefix press:<' . $ontologyPrefix .'>'.
// 'select ?org ?org_name where{'.
//   '?org rdf:type press:Organization;'.
//        'press:organizationName ?org_name.'.
// '}';

//   $q = http_build_query(array('query' => $query));

//   $options = array(
//     'headers' => array(
//       'Accept'=>'application/sparql-results+json',
//       'content-type'=> 'application/x-www-form-urlencoded'),
//     'method' => 'POST',
//     'data' => $q
//   );

//   $result = drupal_http_request($dbURL, $options);

//   $data = json_decode($result->data);
//   $default_value = '';
//   foreach ($data->results->bindings as $org) {
//     $blazegraph_value = substr($org->org->value, strlen($ontologyPrefix . 'Organization/'));
//     $default_value .= $org->org_name->value . ' | ' . $blazegraph_value . ' | [' . $org->org_name->value . ']&#13;&#10;'; 
//   }



  $form['publication_mod_org_configuration'] = array(
	'#type' => 'textarea',
	'#title' => t('Organizations Format'),
	'#default_value' => $blazegraph_info['blazegraph_orgs'],
	'#description' => t('Above you can see the organizations that already exist.<br/>You can add an organization in each line in the format "[Label] | [Blazegraph_value] | [array of possible values for LDAP]"<br/>e.g. "ISL | ISL | [ISL, ISLGRP]"'),
	'#required' => FALSE,
	'#weight' => 0,
	'#rows' => 15,
  );

  $form['submit_button'] = array(
	'#type' => 'submit',
	'#value' => t('Submit Changes'),
	'#submit' => array('publication_mod_orgs_form_submit'),
	'#weight' => 1
  );

  $form['import_orgs_button'] = array(
	'#type' => 'submit',
	'#value' => t('Import organizations from Blazegraph'),
	'#submit' => array('publication_mod_import_orgs'),
	'#weight' => 2
  );

  return $form;
}

function publication_mod_orgs_form_submit($form, $form_state){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix', 'blazegraph_orgs'));
  
  db_merge('publication_mod')
	->key(array('pm_key' => 'blazegraph_orgs'))
	->fields(array(
	  'pm_value' => $form_state['values']['publication_mod_org_configuration']
	))
	->execute();
  
  $prev_orgs = explode("\n", $blazegraph_info['blazegraph_orgs']);
  $prev_orgs_options = array();
  $new_orgs = explode("\n", $form_state['values']['publication_mod_org_configuration']);
  $new_orgs_options = array();

  $update_query = array();
  $update_query[] = 'prefix press:<' . $blazegraph_info['blazegraph_prefix'] .'> ';
  $update_query[] = 'delete { ';
  $update_query[] = '?org ?p ?o.';
  $update_query[] = '}';

  foreach ($prev_orgs as $org) {
  	if($org != ""){
	    $org_info = explode('|', $org);
	    $key = trim($org_info[0]);
	    $bg_value = trim($org_info[1]);
	    $prev_orgs[$bg_value] = $key;
	}
  }

  $update_query[] = 'insert { ';
  foreach ($new_orgs as $org) {
  	if($org != ""){
	    $org_info = explode('|', $org);
	    $key = trim($org_info[0]);
	    $bg_value = trim($org_info[1]);
	    $new_orgs[$bg_value] = $key;
	    $update_query[] = '<'. $blazegraph_info['blazegraph_prefix']. 'Organization/' . $bg_value . '> rdf:type press:Organization; ';
	    $update_query[] = 'press:organizationName "'. $key .'";';
	    $update_query[] = 'rdfs:label "'. $key .'".';
	}
  }

  $update_query[] = '} where { ';
  $update_query[] = '?org rdf:type press:Organization; ';
  $update_query[] = '?p ?o.';
  $update_query[] = '}';

  $q = http_build_query(array('update' => implode("", $update_query)));

  $options = array(
    'headers' => array(
	  'Accept'=>'html',
	  'Content-Type'=> 'application/x-www-form-urlencoded'),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);

  if($result->code != 200){
	  watchdog('publication_mod', 'result = <pre>%result</pre>', array(
	  	'%result' => print_r($result, true),
	  ), WATCHDOG_DEBUG);
  }
}

function publication_mod_import_orgs($form, $form_state){
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];
  $dbURL = $blazegraph_info['blazegraph_url'];
  

  $query = 'prefix press:<' . $ontologyPrefix .'> '.
	'select ?org ?org_name where{ '.
	'?org rdf:type press:Organization; '.
	   'press:organizationName ?org_name. '.
	'}';

  $q = http_build_query(array('query' => $query));

  $options = array(
	'headers' => array(
	  'Accept'=>'application/sparql-results+json',
	  'content-type'=> 'application/x-www-form-urlencoded'),
	'method' => 'POST',
	'data' => $q
  );

  $result = drupal_http_request($dbURL, $options);

  $data = json_decode($result->data);
  $default_value = '';
  foreach ($data->results->bindings as $org) {
	$blazegraph_value = substr($org->org->value, strlen($ontologyPrefix . 'Organization/'));
	$default_value .= $org->org_name->value . ' | ' . $blazegraph_value . ' | [' . $org->org_name->value . ']&#13;&#10;'; 
  }

  db_merge('publication_mod')
	->key(array('pm_key' => 'blazegraph_orgs'))
	->fields(array(
	  'pm_value' => html_entity_decode($default_value)
	))
	->execute();
}