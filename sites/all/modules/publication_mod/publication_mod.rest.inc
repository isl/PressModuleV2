<?php
// Copyright FORTH-ICS, Emmanouil Dermitzakis
// -*- mode: php;-*-

function _get_publication_info(){
	if(empty($_GET['uuid']) || empty($_GET['pubFields'])){
		return;
	}

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$uuid = $_GET['uuid'];
	$pubFields = $_GET['pubFields'];

	$query = "prefix press: <". $blazegraph_info['blazegraph_prefix'] .">";
	$query .= "SELECT * WHERE { \n";
	$query .= "{?pub press:publicationUuid \"" . $uuid . "\". \n";
  $query .= "OPTIONAL {?pub press:creationDate ?creationDate.}. \n";
  $query .= "OPTIONAL {?pub press:modifiedDate ?modifiedDate.}. \n";

  foreach ($pubFields as $field) {
  	$query .= "OPTIONAL {?pub press:". $field . " ?" . $field . "}. \n";
  }
	
	$query .= "}UNION{";
	$query .= "?pub press:publicationUuid \"" . $uuid . "\". \n";
	$query .= "?pub press:appearsIn ?project. \n";
	$query .= "?project press:projectName ?projectName. \n";
	$query .= "}UNION{ \n";
	$query .= "?pub press:publicationUuid \"" . $uuid . "\". \n";
	$query .= "?pub press:hasContributor ?conSlot. \n";
	// $query .= "?conList press:slot ?conSlot. \n";
	$query .= "?con rdfs:subPropertyOf* press:contributorType. \n";
	$query .= "?conSlot ?con ?person. \n";
	$query .= "?conSlot press:listIndex ?personIndex. \n";
	$query .= "?person foaf:familyName ?familyName. \n";
	$query .= "?person press:personGroup ?group. \n";
	$query .= "OPTIONAL {?person foaf:givenName ?givenName.}. \n";
	$query .= "OPTIONAL {?person foaf:mbox ?mbox.}. \n";
	$query .= "}UNION{ \n";
	$query .= "?pub press:publicationUuid \"" . $uuid . "\". \n";
	$query .= "?pub press:belongsTo ?org. \n";
	$query .= "?org press:organizationName ?orgName. \n";
	$query .= "} UNION {\n";
	$query .= "?pub press:publicationUuid \"" . $uuid . "\". \n";
	$query .= "?pub press:tag ?tag. \n";
	$query .= "} \n";
	$query .= "} \n";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _get_categories(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] . "> ";
	$query .= 'SELECT (strafter(str(?low), "#") AS ?lowid) ?lowlabel ?optgroup ';
	$query .= '(strafter(str(?superclass), "#") AS ?superclassid) ?superlabel ';
	$query .= "WHERE { ";
	$query .= "?low rdfs:subClassOf* press:Publication. ";
	$query .= "OPTIONAL {?low rdfs:label ?lowlabel}. ";
	$query .= "OPTIONAL {?low press:optgroup ?optgroup}. ";
	$query .= "OPTIONAL {?low rdfs:subClassOf ?superclass . ";
	$query .= "?superclass rdfs:label ?superlabel} ";
	$query .= "} ORDER BY ?label";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _get_tags(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
  $query .= "SELECT distinct ?tag WHERE { ";
  $query .= "?pub press:tag ?tag} ";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _search_tag(){
	if(empty($_GET['query'])){
		return;
	}

	$terms = $_GET['query'];

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
	$query .= "prefix bds: <http://www.bigdata.com/rdf/search#> \n";
	$query .= "SELECT distinct ?tag WHERE { \n";
	$query .= "?tag bds:search \"" . $terms . "*\". \n";
	$query .= "?pub press:tag ?tag . \n";
	$query .= "}";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _get_data_properties(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
	$query .= 'select DISTINCT (strafter(str(?p), "#") AS ?pid) ?label (strafter(str(?type), "#") AS ?ptype) ?range ';
	$query .= "WHERE { ";
	$query .= "?class ^rdfs:domain ?p . ";
	$query .= "?p rdf:type ?type . ";
	$query .= "FILTER (?type = owl:DatatypeProperty || ?type = owl:ObjectProperty) . ";
	$query .= "OPTIONAL{?p rdfs:label ?label }. ";
	$query .= "OPTIONAL {?p rdfs:range ?range}";
	$query .= "{";
	$query .= "?class rdfs:subClassOf* press:Publication.";
	$query .= "}union{";
	$query .= "?class rdfs:subClassOf* press:Contributor_Slot.";
	$query .= "}";
	$query .= "}order by ?p ";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _search_author(){
	if(empty($_GET['terms']) || empty($_GET['groupKey'])){
		return;
	}

	$terms = $_GET['terms'];
	$groupKey = $_GET['groupKey'];

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
	$query .= "prefix bds: <http://www.bigdata.com/rdf/search#> \n";
	$query .= "SELECT ?uuid (CONCAT(?givenName, \" \", ?familyName) ";
	$query .= "AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) WHERE { \n";
	foreach ($terms as $key => $term) {
		$query .= "?o" . $key . " bds:search \"" . $term . "*\". \n";
		$query .= "?uuid ?p" . $key . " ?o" . $key . " . \n";
		$query .= "filter(?p" . $key . " = foaf:familyName || ?p" . $key . " = foaf:givenName). \n";
	}
	$query .= "?uuid foaf:familyName ?familyName. \n";
	$query .= "?uuid foaf:givenName ?givenName. \n";
	$query .= "OPTIONAL{?uuid foaf:mbox ?mbox}. \n";
	$query .= "?uuid press:personGroup \"" . $groupKey . "\". }";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _get_uuid(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$q = http_build_query(array('uuid'));

	$options = array(
    'headers' => array(
      'Accept'=>'text/plain',
    ),
    'method' => 'GET',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'] . '?uuid', $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _add_external_author(){
	if(empty($_POST['uuid']) ||
			empty($_POST['firstName']) ||
			empty($_POST['lastName']) ||
			empty($_POST['mail'])){
		return;
	}

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$uuid = $_POST['uuid'];
	$firstName = $_POST['firstName'];
	$lastName = $_POST['lastName'];
	$mail = $_POST['mail'];

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
	$query = "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";

	$query .= "INSERT{ \n";
	$query .= "?uuid rdf:type foaf:Person; \n";
	$query .= "<" . $blazegraph_info['blazegraph_prefix'] . "personGroup> \"External_Author\"; \n";
	$query .= "foaf:familyName \"" . $lastName . "\"; \n";
	$query .= "foaf:givenName \"" . $firstName . "\"; \n";
	$query .= "foaf:mbox \"mailto:" . $mail . "\"; \n";
	$query .= "<" . $blazegraph_info['blazegraph_prefix'] . "personUuid> ?struuid . \n";
	$query .= "}WHERE{\n";
	$query .= "SELECT ?uuid ?struuid WHERE {BIND(<" . $uuid . "> as ?uuid). BIND(str(?uuid) as ?struuid)} \n";
	$query .= "}";

	$q = http_build_query(array('update'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _search_project(){
	if(empty($_GET['query'])){
		return;
	}

	$term = $_GET['query'];

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
  $query .= "prefix bds: <http://www.bigdata.com/rdf/search#> \n";
	$query .= "SELECT ?projectID ?name WHERE { \n";
	$query .= "?name bds:search \"" . $term . "*\". \n";
	$query .= "?name bds:matchAllTerms \"true\". \n";
	$query .= "?projectID press:projectName ?name. \n";
	$query .= "} ";

	$q = http_build_query(array('query'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  echo $result->data;
}

function _create_insert_query($properties, $edit=FALSE){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
	$currentDate = date_iso8601(time());

	$query = "INSERT DATA { \n";
	$query .= "<" . $properties['uuid'] . "> rdf:type press:". $properties['category'] . "; \n";
	if($edit){
		$query .= "press:creationDate \"" . $properties['creationDate'] . "\"^^xsd:dateTime; \n";
	}else{
		$query .= "press:creationDate \"" . $currentDate . "\"^^xsd:dateTime; \n";
	}
	$query .= "press:modifiedDate \"". $currentDate . "\"^^xsd:dateTime; \n";
	$query .= "press:publicationUuid \"". $properties['uuid'] . "\"; \n";

	$except = array('uuid', 'category', 'delete', 'creationDate');

	foreach ($properties as $property => $value) {
		switch ($property) {
			case "belongsTo":
				foreach ($value as $org) {
					$query .= "press:belongsTo <". $blazegraph_info['blazegraph_prefix'] . "Organization/" . $org . ">; \n";
				}
				break;
			case "contributors":
				foreach ($value as $con_type => $cons) {
					foreach ($cons as $index => $con) {
						$query .= "press:hasContributor [rdf:type press:Contributor_Slot; \n";
						$query .= "press:" . $con_type . " <". $con['uri'] .">; \n";
						$query .= "press:listIndex ". $index . "; ]; \n";
					}
				}
				break;
			case "project":
				foreach ($value as $project) {
					$query .= "press:appearsIn <". $project['uri'] . ">; \n";
				}
				break;
			case "localLink":
				if($value != '')
					$query .= "press:localLink \"". $value . "\"; \n";
				break;
			case "tag":
				foreach ($value as $tag) {
					$query .= "press:tag \"". $tag ."\"; \n";
				}
				break;
			default:
				if(!in_array($property, $except)){
					$query .= "press:" . $property . " \"". addslashes($value) ."\"; \n";
				}
				break;
		}
	}
	$query .= ".}\n";

	return $query;
}

function _add_publication(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$label_query = <<<EOT
	prefix press:<http://www.ics.forth.gr/Press#>

SELECT ?property ?label where{
  ?property rdf:type ?type.
  FILTER(?type = owl:DatatypeProperty || ?type = owl:ObjectProperty).
  ?property rdfs:label ?label.
}
EOT;
	
	$q = http_build_query(array('query'=>$label_query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $label_result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  $labels = array();
  $label_data = json_decode($label_result->data);

  foreach ($label_data->results->bindings as $pair) {
  	if(strpos($pair->property->value, "#") !== false){
  		$exploded = explode("#", $pair->property->value);
	  	$prop = $exploded[count($exploded)-1];
	  }else if(strpos($pair->property->value, ":")){
	  	$exploded = explode("#", $pair->property->value);
	  	$prop = $exploded[count($exploded)-1];
	  }else{
	  	$prop = $pair->property->value;
	  }
  	$labels[$prop] = $pair->label->value;
  }
	$postOptions = json_decode($_POST['options'], true);
  $pub_page_contents = _create_publication_page_body($postOptions, $labels);

  $pub_page_info = publication_mod_add_publication(
  	$pub_page_contents['title'],
  	$pub_page_contents['summary'],
  	$pub_page_contents['body'],
  	$postOptions['category'],
  	$postOptions['contributors'],
  	$_FILES
  );

  $publication_options = $postOptions;
  $publication_options['uuid'] = $pub_page_info['uuid'];
  $publication_options['publicationUrl'] = $pub_page_info['path'];
  $publication_options['localLink'] = $pub_page_info['file_url'];

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> \n";
	$query .= "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";
	
	$query .= _create_insert_query($publication_options);

	$q = http_build_query(array('update'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  // watchdog('publication_mod', '$result: <pre>%result</pre>', array('%result'=>print_r($result, TRUE)), WATCHDOG_DEBUG);
  
  echo json_encode(array(
		'blzg_response' => $result->data,
		'pub_url' => $publication_options['publicationUrl']
	));
}

function _edit_publication(){
	if(empty($_POST['options'])){
		return;
	}

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$label_query = <<<EOT
	prefix press:<http://www.ics.forth.gr/Press#>

SELECT ?property ?label where{
  ?property rdf:type ?type.
  FILTER(?type = owl:DatatypeProperty || ?type = owl:ObjectProperty).
  ?property rdfs:label ?label.
}
EOT;
	
	$q = http_build_query(array('query'=>$label_query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $label_result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  $labels = array();
  $label_data = json_decode($label_result->data);

  foreach ($label_data->results->bindings as $pair) {
  	if(strpos($pair->property->value, "#") !== false){
  		$exploded = explode("#", $pair->property->value);
	  	$prop = $exploded[count($exploded)-1];
	  }else if(strpos($pair->property->value, ":")){
	  	$exploded = explode("#", $pair->property->value);
	  	$prop = $exploded[count($exploded)-1];
	  }else{
	  	$prop = $pair->property->value;
	  }
  	$labels[$prop] = $pair->label->value;
  }

	$postOptions = json_decode($_POST['options'], true);

  $pub_page_contents = _create_publication_page_body($postOptions, $labels);

  $pub_page_info = publication_mod_edit_publication(
		$postOptions['uuid'],
  	$pub_page_contents['title'],
  	$pub_page_contents['summary'],
  	$pub_page_contents['body'],
  	$postOptions['category'],
  	$postOptions['contributors'],
  	$_FILES
  );

  $publication_options = $postOptions;
  $publication_options['uuid'] = $pub_page_info['uuid'];
	$publication_options['publicationUrl'] = $pub_page_info['path'];
	if($pub_page_info['file_url'] !== '')
  	$publication_options['localLink'] = $pub_page_info['file_url'];

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> \n";
	$query .= "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";
	$query .= "DELETE { \n";
	$query .= "?pub ?p ?o. \n";
	$query .= "?pub press:hasContributor ?conSlot. \n";
	$query .= "?conSlot ?y ?z. \n";
	$query .= "}\n";
	$query .= "WHERE{ \n";
	$query .= "?pub press:publicationUuid \"" . $postOptions['uuid'] . "\". \n";
	$query .= "?pub ?p ?o. \n";
	$query .= "OPTIONAL{?pub press:hasContributor ?conSlot. \n";
	$query .= "OPTIONAL{?conSlot ?y ?z.}} \n";
	$query .= "};\n";

	$query .= _create_insert_query($publication_options, true);

	$q = http_build_query(array('update'=>$query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
	http_response_code($result->code);
	
	echo json_encode(array(
		'blzg_response' => $result->data,
		'pub_url' => $publication_options['publicationUrl']
	));
}

function _delete_publication(){
	if(empty($_POST['uuid'])){
		return;
	}
	$uuid = $_POST['uuid'];

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$delete_query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> \n";
	$delete_query .= "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";
	$delete_query .= "DELETE { \n";
	$delete_query .= "?pub ?p ?o. \n";
	$delete_query .= "?pub press:hasContributor ?conSlot. \n";
	$delete_query .= "?conSlot ?y ?z. \n";
	$delete_query .= "}\n";
	$delete_query .= "WHERE{ \n";
	$delete_query .= "?pub press:publicationUuid \"" . $uuid . "\". \n";
	$delete_query .= "?pub ?p ?o. \n";
	$delete_query .= "OPTIONAL{?pub press:hasContributor ?conSlot. \n";
	$delete_query .= "OPTIONAL{?conSlot ?y ?z.}} \n";
	$delete_query .= "}\n";	

	$query = new EntityFieldQuery();
  $query->entityCondition('entity_type', 'node')
    ->entityCondition('bundle', 'publication_mod_publications')
    ->fieldCondition('pub_mod_field_blazegraph_uuid', 'value', $uuid, '=');

  $result = $query->execute();
  if(isset($result['node']) && count($result['node']) == 1){
  	$ids = array_keys($result['node']);
  	$entity = node_load($ids[0]);
  }

  if ($entity){
  	node_delete($entity->nid);
  }
  libxml_use_internal_errors(true);
  $doc = new DOMDocument();

  $doc->loadHTML($blazegraph_info['all_pubs']);
  $div = $doc->getElementById('all_pubs');
  $pub_div = $doc->getElementById($uuid);
  
  if($pub_div && $pub_div->parentNode){
    $pub_div->parentNode->removeChild($pub_div);
  }
  $html = $doc->saveHTML();
  _publication_mod_set_blazegraph_info('all_pubs', $html);


  $q = http_build_query(array('update'=>$delete_query));

	$options = array(
    'headers' => array(
      'Accept'=>'application/sparql-results+json',
      'content-type'=> 'application/x-www-form-urlencoded'
    ),
    'method' => 'POST',
    'data' => $q
  );

  $result = drupal_http_request($blazegraph_info['blazegraph_url'], $options);
  foreach ($result->headers as $key => $value) {
    header($key . ':' . $value);
  }
  http_response_code($result->code);
  echo json_encode(array(
		'blzg_response' => $result->data,
	));
}