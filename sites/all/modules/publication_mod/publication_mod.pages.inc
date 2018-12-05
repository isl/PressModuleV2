<?php
// Copyright FORTH-ICS, Emmanouil Dermitzakis
// -*- mode: php;-*-

/**
 * Creates Add Publication page
 * 
 * @return string
 *  The html in which the Add Publication Page will be rendered
 */
function publication_mod_page_add_publication(){
  global $user;
  global $base_url;
  
  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  _add_presslib_library();

  $current_user = _get_user_info_to_json();
  $labs = _get_labs_to_json();

  $max_file_size = ini_get("upload_max_filesize");

  $internalJS = "jQuery(document).ready(function($){ \n" .
    "$('#add-publication').press({ \n" .
      "base_url: '". $base_url . "', \n" .
      "dbURL: '". url('ajax/pub_mod_blazegraph', array('absolute' => TRUE)) ."', \n" .
      "prefix: '" . $ontologyPrefix . "', \n" .
      "authorGroups: { \n".
        "FORTH_ICS_Author: { \n".
          "label: 'FORTH ICS Authors', \n".
          "span: '<span class=\"icon-user\"></span>&nbsp;', \n".
          "priority: 0 \n".
        "}, \n".
        "External_Author: { \n".
          "label: 'External Authors', \n".
          "priority: 1 \n".
        "} \n".
      "}, \n".
      "current_user: " . $current_user .", \n".
      "labs: " . $labs .", \n".
      "organization_label: 'Laboratory', \n".
      "max_file_size: '". $max_file_size. "', \n".
    "}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="add-publication"></div>';

  return $html;
}

/**
 * Creates Search Publication Page
 * 
 * @return string
 *  The html in which the Search Publication Page will be rendered
 */
function publication_mod_page_search_publication(){
  global $user;
  global $base_url;

  // publication_mod_get_pub_count_per_lab("ISL");
  // publication_mod_get_pub_count("Book");

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  $JSONGet = json_encode($_GET);
  // echo $JSONGet;

  _add_presslib_library();

  $current_user = _get_user_info_to_json();

  $labs = _get_labs_to_json();

  $internalJS = "jQuery(document).ready(function($){ \n" .
    "$('#search-publication').pressSearch({ \n" .
      "base_url: '". $base_url . "', \n" .
      "dbURL: '". url('ajax/pub_mod_blazegraph', array('absolute' => TRUE))."', \n" .
      "prefix: '" . $ontologyPrefix . "', \n" .
      "authorGroups: { \n".
        "FORTH_ICS_Author: { \n".
          "label: 'FORTH ICS Authors', \n".
          "span: '<span class=\"icon-user\"></span>&nbsp;' \n".
        "}, \n".
        "External_Author: { \n".
          "label: 'External Authors', \n".
        "} \n".
      "}, \n".
      "current_user: " . $current_user .", \n".
      "labs: " . $labs .", \n".
      "organizations: { \n".
        "org: " . $labs .", \n".
        "label: 'Laboratory' \n".
      "}, \n".
      "parameters: ". $JSONGet . ", \n".
    "}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="search-publication"></div>';
  return $html;
}

/**
 * Creates Edit Publication page
 * 
 * @return string
 *  The html in which the Edit Publication Page will be rendered
 */
function publication_mod_page_edit_publication(){
  global $base_url;
  global $user;

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  if (empty($_GET['uuid']) && empty($_GET['category'])){
    return "You didn't specify a Publication and/or it's Category";
  }

  $uuid = $_GET['uuid'];
  if (substr($uuid, 0, 9) !== 'urn:uuid:'){
    if (uuid_is_valid($uuid)){
      $uuid = 'urn:uuid:'. $uuid;
    }
  }
  $category = $_GET['category'];
  
  $user_data = user_load($user->uid);

  if(!(in_array('administrator', array_values($user_data->roles)) || publication_mod_can_user_edit(
    $uuid,
    $user_data->pub_mod_field_blazegraph_uuid['und'][0]['value'],
    $user_data->pub_mod_field_organization['und'][0]['option'],
    in_array('Publication Mod Power User', array_values($user_data->roles))
  ))){
    drupal_access_denied();
    exit();
  }

  _add_presslib_library();

  $current_user = _get_user_info_to_json();

  $labs = _get_labs_to_json();

  $max_file_size = ini_get("upload_max_filesize");

  $internalJS = "jQuery(document).ready(function($){ \n" .
    "$('#add-publication').press({ \n" .
      "base_url: '". $base_url . "', \n" .
      "dbURL: '". url('ajax/pub_mod_blazegraph', array('absolute' => TRUE))."', \n" .
      "prefix: '" . $ontologyPrefix . "', \n" .
      "authorGroups: { \n".
        "FORTH_ICS_Author: { \n".
          "label: 'FORTH ICS Authors', \n".
          "span: '<span class=\"icon-user\"></span>&nbsp;' \n".
        "}, \n".
        "External_Author: { \n".
          "label: 'External Authors', \n".
        "} \n".
      "}, \n".
      "current_user: " . $current_user .", \n".
      "labs: " . $labs .", \n".
      "organization_label: 'Laboratory', \n".
      "editMode: true, \n".
      "editPublication: { \n".
        "uuid:'". $uuid ."', \n".
        "category: '". $category . "' \n".
      "}, \n".
      "max_file_size: '". $max_file_size. "', \n".
    "}); \n".
  "}); \n";
  drupal_add_js($internalJS, 'inline');

  $html = '<div class="form-horizontal" id="add-publication"></div>';
  return $html;
}


/**
 * Creates page for Project Addition.
 * @return string
 *  The html in which the Add Project Page will be rendered
 */
function publication_mod_page_add_project(){
  _add_presslib_library();

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  $inlineJS = 'jQuery(document).ready(function($){';
  $inlineJS .= 'initProjects("'.$ontologyPrefix.'", "'. url('ajax/pub_mod_blazegraph', array('absolute' => TRUE)) .'");'; 
  $inlineJS .= '}); ';
  drupal_add_js($inlineJS, 'inline');

  $html = '';
  $html .= '<div class="modal fade" id="responseModal" tabindex="-1" role="responseDialog">';
  $html .= '  <div class="modal-dialog" >';
  $html .= '    <div class="modal-content">';
  $html .= '      <div class="modal-header">';
  $html .= '        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
  $html .= '        <h4 class="modal-title" id="myModalLabel">Project Insertion Completed</h4>';
  $html .= '      </div>';
  $html .= '      <div class="modal-body">';
  $html .= '      </div>';
  $html .= '      <div class="modal-footer">';
  $html .= '        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
  $html .= '      </div>';
  $html .= '    </div>';
  $html .= '  </div>';
  $html .= '</div>';
  $html .= '<form class="form-horizontal">';
  $html .= '<div class="form-group">';
  $html .= '<label class="control-label col-sm-2" for="projectName"><span style="color:red">*</span>Project Name:</label>';
  $html .= '<div class="col-sm-10">';
  $html .= '<input class="form-control input-sm" id="projectName" type="text"/>';
  $html .= '</div>';
  $html .= '</div>';
  $html .= '';
  $html .= '<div class="form-group">';
  $html .= '<label class="control-label col-sm-2" for="projectAcronym"><span style="color:red">*</span>Project Acronym:</label>';
  $html .= '<div class="col-sm-10">';
  $html .= '<input class="form-control input-sm" id="projectAcronym" type="text"/>';
  $html .= '</div>';
  $html .= '</div>';
  $html .= '';
  $html .= '<div class="form-group">';
  $html .= '<label class="control-label col-sm-2" for="projectId"><span style="color:red">*</span>Project ID:</label>';
  $html .= '<div class="col-sm-10">';
  $html .= '<input class="form-control input-sm" id="projectId" type="text"/>';
  $html .= '</div>';
  $html .= '</div>';
  $html .= '';
  $html .= '<div class="form-group">';
  $html .= '<label class="control-label col-sm-2"><span style="color:red">*</span>Project Status:</label>';
  $html .= '<div class="col-sm-4">';
  $html .= '<label class="radio-inline"><input type="radio" name="optradio" value="Active">Active</label>';
  $html .= '<label class="radio-inline"><input type="radio" name="optradio" value="Completed">Completed</label>';
  $html .= '</div>';
  $html .= '</div>';
  $html .= '';
  $html .= '<div class="form-group">';
  $html .= '<label class="col-sm-2 control-label"><span style="color:red">*</span>Project Start Date:</label>';
  $html .= '<div class="col-sm-4">';
  $html .= '<input id="startDate" class="form-control input-sm" type="text" value="">';
  $html .= '</div>';
  $html .= '<label class="col-sm-2"><span style="color:red">*</span>Project End Date:</label>';
  $html .= '<div class="col-sm-4">';
  $html .= '<input id="endDate" class="form-control input-sm" type="text" value="">';
  $html .= '</div>';
  $html .= '</div>';
  $html .= '<div class="form-group">';
  $html .= '</div>';
  $html .= '<div class="col-sm-10"></div><div class="col-sm-2"><input id="project-submit" class="btn btn-primary" type="button" value="Submit" /></div>';
  $html .= '</form>';

  return $html;
}

/**
 * Creates a page of the pages of all the publications
 */
function publication_mod_page_all_publications(){
  global $base_url;

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('all_pubs'));

  echo $blazegraph_info['all_pubs'];

  return;

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  $query = 'prefix press:<' . $ontologyPrefix .'>
            select ?pub ?url (group_concat(?concat; separator="") as ?authors) where {
            {
                select ?pub ?slot ?auth where{
                  ?pub rdf:type [rdfs:subClassOf* press:Publication].
                  optional{?pub press:hasContributor ?slot.
                  ?slot ?p ?con.
                  ?p rdfs:subPropertyOf press:contributorType.
                  ?slot press:listIndex ?index.
                  optional{?con foaf:givenName ?givenName.}
                  optional{?con foaf:familyName ?familyName.}
                  bind(substr(str(?p), 31) as ?type).
                           }
                  bind(concat(?type, "|", ?index, "|", str(?con), "|", ?givenName, " ", ?familyName) as ?auth).
                }
             }
             bind(concat("[", ?auth, "]") as ?concat).
             ?pub press:publicationUrl ?url.
            }group by ?pub ?url';
  $q = http_build_query(array('query' => $query));

  $options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'),
    'method' => 'POST',
    'data' => $q
  );
  $h = "";
  $result = drupal_http_request($dbURL, $options);
  $results = json_decode($result->data);
  //echo '<pre>' . print_r($result, true) . '</pre>';
  foreach ($results->results->bindings as $pub => $info) {
    $offset = 0;
    $pub_authors = array();
    while ($offset < strlen($info->authors->value)){
      $start = strpos($info->authors->value, '[', $offset);
      $end = strpos($info->authors->value, ']', $offset);
      $author = substr($info->authors->value, $start+1, $end - $offset-1);
      // echo $author;
      // echo '<br>';
      $offset = $end+1;

      $author_info = explode("|", $author);
      if(!array_key_exists($author_info[0], $pub_authors)){
        $pub_authors[$author_info[0]] = array();
      }
      $pub_authors[$author_info[0]][$author_info[1]] = array(
        'uri' => $author_info[2],
        'name' => $author_info[3]
      );
    }
    foreach ($pub_authors as $con_type => $cons) {
      ksort($cons);
      foreach ($cons as $key => $value) {
        echo $key . '. ' . $value['name'] . ' ';
      }
    }
    echo $info->pub->value;
    echo '<br>';
  }
}

/**
 * Creates a page of the Publications of a certain author
 * @param string $author
 *  Author's User Name
 */

function publication_mod_page_author_publications($author){
  if(!isset($author) || empty($author)){
    return;
  }

  $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
  $dbURL = $blazegraph_info['blazegraph_url'];
  $ontologyPrefix = $blazegraph_info['blazegraph_prefix'];

  $user = user_load_by_name($author);
  if(!$user){
    echo "User not found";
    return;
  }

  $uwrapper = entity_metadata_wrapper('user', $user);
  $author_uri = $uwrapper->value()->pub_mod_field_blazegraph_uuid['und'][0]['value'];
  // echo '<pre>' . print_r($uwrapper->value(), true) . '</pre>';
  $query = 'prefix press: <'. $ontologyPrefix. '>
          select ?publicationUrl ?englishTitle ?chapterTitle ?bookTitle ?type where{
            ?con0 rdfs:subPropertyOf* press:contributorType. 
            ?slot0 ?con0 <'. $author_uri.'>.
            ?pub press:hasContributor ?slot0.
            ?pub rdf:type ?type.
            ?type rdfs:subClassOf* press:Publication. 
            ?pub press:publicationUrl ?publicationUrl.
            OPTIONAL{?pub press:englishTitle ?englishTitle}.
            OPTIONAL{?pub press:chapterTitle ?chapterTitle}.
            OPTIONAL{?pub press:bookTitle ?bookTitle}.
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

  // echo '<pre>' . print_r($result, true) . '</pre>';

  $html = '
<h1>'. $uwrapper->value()->pub_mod_field_first_name['und'][0]['value'] . ' ' . $uwrapper->value()->pub_mod_field_last_name['und'][0]['value'] . '\'s Publications</h1>';
  
  $data = json_decode($result->data);
  $results = $data->results->bindings;
  foreach ($results as $key => $value) {
    if(isset($value->chapterTitle)){
      $title = $value->chapterTitle->value;
    }elseif (isset($value->bookTitle)) {
      $title = $value->bookTitle->value;
    }elseif (isset($value->englishTitle)){
      $title = $value->englishTitle->value;
    }
    $html .= '<a href="/'. $value->publicationUrl->value . '">' . $title .'</a><br/>';
  }
  echo $html;
}
