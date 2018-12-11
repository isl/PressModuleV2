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

	$withCounter = isset($_GET['counter']) && strtolower($_GET['counter']) != 'false' ? true : false;
	

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] . "> ";
	$query .= 'select (strafter(str(?low), "#") AS ?lowid) ?lowlabel ?optgroup ?pubCounter';
	$query .= '(strafter(str(?superclass), "#") AS ?superclassid) ?superlabel ';

	if($withCounter){
		$query .= <<<EOT
		WHERE {
			{
				SELECT (COUNT(?pub) as ?pubCounter) ?low
				WHERE {
					?low rdfs:subClassOf* press:Publication.
					OPTIONAL { ?pub rdf:type [rdfs:subClassOf* ?low]}.
				} GROUP BY ?low
			}
			OPTIONAL {?low rdfs:label ?lowlabel}.
			OPTIONAL {?low press:optgroup ?optgroup}.
			OPTIONAL {?low rdfs:subClassOf ?superclass}.
		}
EOT;
	}else{
		$query .= "WHERE { ";
		$query .= "?low rdfs:subClassOf* press:Publication. ";
		$query .= "OPTIONAL {?low rdfs:label ?lowlabel}. ";
		$query .= "OPTIONAL {?low press:optgroup ?optgroup}. ";
		$query .= "OPTIONAL {?low rdfs:subClassOf ?superclass . ";
		$query .= "?superclass rdfs:label ?superlabel} ";
		$query .= "} ORDER BY ?label";
	}

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

function _create_search_query($options=array(), $blazegraph_info=array()){
	if(empty($options)) return "";

	$searchField = isset($options['searchField']) && !empty($options['searchField']) ? $options['searchField'] : '';
	$authors = isset($options['authors']) && !empty($options['authors']) ? $options['authors'] : array();
	$orgs = isset($options['orgs']) && !empty($options['orgs']) ? $options['orgs'] : array();
	$yearFrom = isset($options['yearFrom']) && !empty($options['yearFrom']) ? $options['yearFrom'] : '';
	$yearTo = isset($options['yearTo']) && !empty($options['yearTo']) ? $options['yearTo'] : '';
	$tags = isset($options['tags']) && !empty($options['tags']) ? $options['tags'] : array();
	$category = isset($options['category']) && !empty($options['category']) ? $options['category'] : '';
	$subcategory = isset($options['subcategory']) && !empty($options['subcategory']) ? $options['subcategory'] : '';
	$peerReviewed = isset($options['peerReviewed']) && $options['peerReviewed'] == 'true';
	$method = isset($options['method']) && !empty($options['method']) ? $options['method'] : 'advanced';
	$filters = isset($options['filters']) && !empty($options['filters']) ? $options['filters'] : array();

	if(empty($blazegraph_info)){
		$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
	}
	$blzg_prefix = $blazegraph_info['blazegraph_prefix'];

	$filterQuery = '';
	if(!empty($filters)){
		$filterQuery .= "\n #FILTERS \n";
	}
	foreach($filters as $key => $filter){
		switch ($key) {
			case 'year':
				$filterQuery .= "?pub press:year \"$filter\". \n";
				break;
			case 'category':
				$filterQuery .= "?pub rdf:type $filter. \n";
				break;
			case 'tag':
				foreach ($filter as $value) {
					$filterQuery .= "?pub press:tag \"$value\". \n";
				}
				break;
			case 'org':
				foreach ($filter as $org){
					$filterQuery .= "?pub press:belongsTo $org. \n";
				}
				break;
			case 'project':
				foreach ($filter as $project) {
					$filterQuery .= "?pub press:appearsIn $project. \n";
				}
				break;
			case 'contributor':
				if(!empty($filter)){
					$filterQuery .= "?filtercon rdfs:subPropertyOf* press:contributorType. \n";
					foreach ($filter as $index => $con){
						$filterQuery .= "?filterSlot$index ?filtercon $con. \n";
						$filterQuery .= "?pub press:hasContributor ?filterSlot$index. \n";
					}
				}
				break;
			default:
				break;
		}
	}
	$q = '';
	$prefixes = '';
	if($method == 'browse'){

		$prefixes = "prefix press:<$blzg_prefix>\n";
		$q = <<<EOT
		select * where {
			?pub rdf:type [rdfs:subClassOf* press:$category].
			?pub rdf:type ?type.
			BIND(strafter(str(?type), "#") AS ?typeID).
			$filterQuery
			?pub press:year ?year.
			BIND(concat(str(?year), str(?pub)) as ?order).
			OPTIONAL{?pub press:externalLink ?externalLink}.
			OPTIONAL{?pub press:bookTitle ?bookTitle}.
			OPTIONAL{?pub press:chapterTitle ?chapterTitle}.
			OPTIONAL{?pub press:englishTitle ?englishTitle}.
			OPTIONAL{?pub press:localLink ?localLink}.
			OPTIONAL{?pub press:publicationUrl ?publicationUrl}.
		}order by desc(?order)
EOT;
	}else{

		$prefixes = <<<EOT
prefix bds: <http://www.bigdata.com/rdf/search#>
prefix press: <$blzg_prefix>
prefix org: <{$blzg_prefix}Organization/>
EOT;

		$select = <<<EOT
SELECT ?pub (SUM(?score) as ?sumScore) ?year ?englishTitle ?order ?type ?externalLink
	?bookTitle ?chapterTitle ?typeID ?publicationUrl ?localLink WHERE{

EOT;
		
		$authorQuery = '';
		foreach ($authors as $key => $author) {
			$authorQuery .= <<<EOT
?con$key rdfs:subPropertyOf* press:contributorType. 
?slot$key ?con$key <$author>.
?pub press:hasContributor ?slot$key.

EOT;
		}
		
		$orgQuery = '';
		if(count($orgs) > 0){
			$orgQuery = "?pub press:belongsTo ?org. \nFILTER(";
			
			foreach ($orgs as $key => $org) {
				if($key > 0){
					$orgQuery .= '|| ';
				}
				$orgQuery .= "?org = org:". $org;
			}
			$orgQuery .= "). \n";
		}

		$tagQuery = '';
		if(count($tags) > 0){
			foreach ($tags as $tag){
				$tagQuery = "?pub press:tag \"" . $tag . "\".\n";
			}
		}

		$yearQuery = '';
		if($yearFrom != '' || $yearTo != ''){
			$yearQuery = "?pub press:year ?year. \n";
			$yearQuery .= "FILTER (";
			if($yearFrom != '' && $yearTo != ''){
				$yearQuery .= "xsd:integer(?year) >= " . $yearFrom . " && xsd:integer(?year) <= " . $yearTo;
			}else if($yearFrom != ''){
				$yearQuery .= "xsd:integer(?year) >= " . $yearFrom;
			}else if($yearTo != ''){
				$yearQuery .= "xsd:integer(?year) <= " . $yearTo;
			}
			$yearQuery .= "). \n";
		}

		$reviewedQuery = '';

		if($category == '' && $peerReviewed){
			$reviewedQuery = <<<EOT
?type rdfs:subClassOf* ?ancClass.
?pub rdf:type ?type.
FILTER(?ancClass = press:Journal_Peer_Reviewed || ?ancClass = press:Conf_Peer_Reviewed).

EOT;
		}else if($category != ''){
			if(!$peerReviewed){
				if($subcategory != ''){
					$reviewedQuery .= <<<EOT
?type rdfs:subClassOf* press:$subcategory.
?pub rdf:type ?type.

EOT;
				}else{
					$reviewedQuery .= <<<EOT
?type rdfs:subClassOf* press:$category.
?pub rdf:type ?type.

EOT;
				}
			}else {
				if($subcategory !== ''){
					$reviewedQuery .= <<<EOT
?type rdfs:subClassOf* press:$subcategory.
?pub rdf:type ?type.

EOT;
				}else{
					$reviewedQuery .= <<<EOT
?type rdfs:subClassOf* press:$category.
?pub rdf:type ?type.
?type rdfs:subClassOf* ?ancClass.
FILTER(?ancClass = press:Journal_Peer_Reviewed || ?ancClass = press:Conf_Peer_Reviewed).

EOT;
				}
			}
		}

		$fieldQuery = '';
		$multipleFieldsQuery = '';
		$authorFieldsQuery = '';

		if($searchField != ''){
			$fieldQuery = <<<EOT
		{
			?searchField bds:search "$searchField".
			?searchField bds:relevance ?score.
			?pub ?predicate ?searchField.
			?pub rdf:type [rdfs:subClassOf* press:Publication].
			MINUS {?pub press:englishAbstract ?searchField}.
			MINUS {?pub press:publicationUrl ?searchField}.
		}UNION{
			?personSearchField bds:search "$searchField".
			?personSearchField bds:relevance ?score.
			?person ?s ?personSearchField.
			?person rdf:type foaf:Person.
			?con rdfs:subPropertyOf* press:contributorType.
			?slot ?con ?person.
			?pub press:hasContributor ?slot.
		}
EOT;
			$multipleFieldsQuery = <<<EOT
		{
			?searchField bds:search "$searchField".
			?searchField bds:relevance ?score.
			?pub ?predicate ?searchField.
			?pub rdf:type [rdfs:subClassOf* press:Publication].
			MINUS {?pub press:englishAbstract ?searchField}.
			MINUS {?pub press:publicationUrl ?searchField}.
EOT;
			$authorFieldsQuery = <<<EOT
	}UNION{
	?personSearchField bds:search "$searchField".
	?personSearchField bds:relevance ?score.
	?person ?s ?personSearchField.
	?person rdf:type foaf:Person.
	?con rdfs:subPropertyOf* press:contributorType.
	?slot ?con ?person.
	?pub press:hasContributor ?slot.
EOT;
		}

		$restOfFields = '';

		if ($reviewedQuery == ''){
			$restOfFields .= "?pub rdf:type ?type. \n";
		}
		if ($yearQuery == ''){
			$restOfFields .= "?pub press:year ?year. \n";
		}
		if ($searchField == ''){
			$restOfFields .= "BIND(concat(str(?year), str(?pub)) as ?order). \n";
		}
		$restOfFields .= <<<EOT
		?type rdfs:subClassOf* press:Publication.
		BIND(strafter(str(?type), "#") AS ?typeID).
		OPTIONAL{?pub press:externalLink ?externalLink}.
		OPTIONAL{?pub press:bookTitle ?bookTitle}.
		OPTIONAL{?pub press:chapterTitle ?chapterTitle}.
		OPTIONAL{?pub press:englishTitle ?englishTitle}.
		OPTIONAL{?pub press:localLink ?localLink}.
		OPTIONAL{?pub press:publicationUrl ?publicationUrl}.
EOT;

		$closure = "\n}GROUP BY ?pub ?year ?englishTitle ?order ?type ?externalLink ";
		$closure .= "?bookTitle ?chapterTitle ?typeID ?publicationUrl ?localLink ";
		$closure .= "order by desc(?sumScore)";

		$query = '';
		if($searchField != ''){
			$multipleFieldsQuery .= $authorQuery . $orgQuery . $yearQuery . $reviewedQuery . $tagQuery;
			$authorFieldsQuery .= $authorQuery . $orgQuery . $yearQuery . $reviewedQuery . $tagQuery;
		}else{
			$query = $authorQuery . $orgQuery . $yearQuery . $reviewedQuery . $tagQuery;
		}
		
		$q = '';
		if($searchField != ''){
			$q = $select . $multipleFieldsQuery . $filterQuery . $restOfFields . $authorFieldsQuery . $restOfFields . "} \n" . $closure;
		}else{
			$q = $select . $query . $filterQuery . $restOfFields . $closure;
		}
	}


	return array(
		'prefix' => $prefixes,
		'query' => $q,
		'options' => $options
	);
}

function _search_publication(){
	$searchField = isset($_GET['searchField']) && !empty($_GET['searchField']) ? $_GET['searchField'] : '';
	$authors = isset($_GET['authors']) && !empty($_GET['authors']) ? $_GET['authors'] : array();
	$orgs = isset($_GET['orgs']) && !empty($_GET['orgs']) ? $_GET['orgs'] : array();
	$yearFrom = isset($_GET['yearFrom']) && !empty($_GET['yearFrom']) ? $_GET['yearFrom'] : '';
	$yearTo = isset($_GET['yearTo']) && !empty($_GET['yearTo']) ? $_GET['yearTo'] : '';
	$tags = isset($_GET['tags']) && !empty($_GET['tags']) ? $_GET['tags'] : array();
	$category = isset($_GET['category']) && !empty($_GET['category']) ? $_GET['category'] : '';
	$subcategory = isset($_GET['subcategory']) && !empty($_GET['subcategory']) ? $_GET['subcategory'] : '';
	$peerReviewed = isset($_GET['peerReviewed']) && $_GET['peerReviewed'] == 'true';
	$method = isset($_GET['method']) && !empty($_GET['method']) ? $_GET['method'] : 'advanced';
	$filters = isset($_GET['filters']) && !empty($_GET['filters']) ? $_GET['filters'] : array();
	$limit = isset($_GET['limit']) && !empty($_GET['limit']) ? intval($_GET['limit']) : 10;
	$offset = isset($_GET['offset']) && !empty($_GET['offset']) ? intval($_GET['offset']) : 0;

	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
	$blzg_prefix = $blazegraph_info['blazegraph_prefix'];

	$query = _create_search_query($_GET, $blazegraph_info);

	$prefixes = $query['prefix'];
	$queryWithoutPrefix = $query['query'];
	$completeQuery = $query['prefix'] . $query['query'];

	if($limit > 0){
		$completeQuery .= ' limit ' . $limit;
	}
	
	if($offset > 0){
		$completeQuery .= ' offset ' . $offset;
	}

	$countQuery = <<<EOT
	$prefixes
	select (count(?pub) as ?count) WITH {
	$queryWithoutPrefix
	} as %countSet
	WHERE {
		INCLUDE %countSet.
	}
EOT;

	$ch1 = curl_init();
	$ch2 = curl_init();

	curl_setopt($ch1, CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($completeQuery));
	curl_setopt($ch2, CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($countQuery));
	curl_setopt($ch1, CURLOPT_POST, 1);
	curl_setopt($ch2, CURLOPT_POST, 1);
	curl_setopt($ch1, CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
	curl_setopt($ch2, CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
	curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
	// curl_setopt($ch1, CURLOPT_POSTFIELDS, array('query=' . urlencode($completeQuery)));
	// curl_setopt($ch2, CURLOPT_POSTFIELDS, array('query=' . urlencode($countQuery)));
	$mh = curl_multi_init();
	curl_multi_add_handle($mh, $ch1);
	curl_multi_add_handle($mh, $ch2);

	$running = null;
	do {
		curl_multi_exec($mh, $running);
	}while($running);

	curl_multi_remove_handle($mh, $ch1);
	curl_multi_remove_handle($mh, $ch2);
	curl_multi_close($mh);

	$pub_response = curl_multi_getcontent($ch1);
	$count_response = curl_multi_getcontent($ch2);
	$results = json_decode($pub_response, true);
	$count = intval(json_decode($count_response, true)['results']['bindings'][0]['count']['value']);

	if($count == 0){
		echo json_encode(array(
			'query' => $completeQuery,
			'count' => 0
		));
		exit();
	}
	$contributorsQuery = <<<EOT
	prefix press: <$blzg_prefix>
	select * where {
		?pub press:hasContributor ?slot.
		FILTER(
EOT;
	foreach ($results['results']['bindings'] as $index => $pub) {
		if($index > 0) $contributorsQuery .= '||';
		$contributorsQuery .= ' ?pub = <' . $pub['pub']['value'] . '> ';
	}
	$contributorsQuery .= <<<EOT
	).
	?pub press:year ?year.
	BIND(concat(str(?year), str(?pub)) as ?order).
	?con rdfs:subPropertyOf* press:contributorType.
	?slot ?con ?person.
	BIND(strafter(str(?con), "#") AS ?type).
	?slot press:listIndex ?personIndex.
	OPTIONAL{?person foaf:givenName ?givenName}.
	?person foaf:familyName ?familyName.
}order by desc(?order)
EOT;

	$multipleFieldsQuery = <<<EOT
	prefix press:<$blzg_prefix>
	select * where {
		{
			?pub press:belongsTo ?org.
			FILTER(
EOT;
	foreach ($results['results']['bindings'] as $index => $pub) {
		if($index > 0) $multipleFieldsQuery .= '||';
		$multipleFieldsQuery .= "?pub = <" . $pub['pub']['value'] . "> ";
	}
	$multipleFieldsQuery .= <<<EOT
	).
	?org press:organizationName ?orgName.
}UNION{
	?pub press:tag ?tag.
	FILTER (
EOT;
	foreach ($results['results']['bindings'] as $index => $pub) {
		if($index > 0) $multipleFieldsQuery .= '||';
		$multipleFieldsQuery .= "?pub = <" . $pub['pub']['value'] . "> ";
	}
	$multipleFieldsQuery .= "). \n } \n }";

	$ch1 = curl_init();
	$ch2 = curl_init();

	curl_setopt($ch1, CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($contributorsQuery));
	curl_setopt($ch2, CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($multipleFieldsQuery));
	curl_setopt($ch1, CURLOPT_POST, 1);
	curl_setopt($ch2, CURLOPT_POST, 1);
	curl_setopt($ch1, CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
	curl_setopt($ch2, CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
	curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
	
	$mh = curl_multi_init();
	curl_multi_add_handle($mh, $ch1);
	curl_multi_add_handle($mh, $ch2);

	$running = null;
	do {
		curl_multi_exec($mh, $running);
	}while($running);

	curl_multi_remove_handle($mh, $ch1);
	curl_multi_remove_handle($mh, $ch2);
	curl_multi_close($mh);

	$con_response = curl_multi_getcontent($ch1);
	$field_response = curl_multi_getcontent($ch2);
	$con_results = json_decode($con_response, true);
	$field_results = json_decode($field_response, true);

	
	$result_arr = array();
	foreach ($results['results']['bindings'] as $key => $pub) {
		if(!isset($result_arr[$pub['pub']['value']])){
			$result_arr[$pub['pub']['value']] = array();
		}

		foreach ($pub as $prop_key => $value){
			
			$result_arr[$pub['pub']['value']][$prop_key] = $value['value'];
		}
	}

	foreach ($con_results['results']['bindings'] as $key => $con) {
		if(!isset($result_arr[$con['pub']['value']]['contributors'])){
			$result_arr[$con['pub']['value']]['contributors'] = array();
		}
		if(!isset($result_arr[$con['pub']['value']]['contributors'][$con['type']['value']])){
			$result_arr[$con['pub']['value']]['contributors'][$con['type']['value']] = array();
		}
		$result_arr[$con['pub']['value']]['contributors'][$con['type']['value']][$con['personIndex']['value']] = array();
		foreach($con as $con_key => $value){
			$result_arr[$con['pub']['value']]['contributors'][$con['type']['value']][$con['personIndex']['value']][$con_key] = $value['value'];
		}
	}

	foreach ($field_results['results']['bindings'] as $key => $field) {
		if(array_key_exists('org', $field)){
			if(!isset($result_arr[$field['pub']['value']]['org'])){
				$result_arr[$field['pub']['value']]['org'] = array();
			}
			$result_arr[$field['pub']['value']]['org'][] = array(
				'org' => $field['org']['value'],
				'orgName' => $field['orgName']['value'],
			);
		}else if(array_key_exists('tag', $field)){
			if(!isset($result_arr[$field['pub']['value']]['tag'])){
				$result_arr[$field['pub']['value']]['tag'] = array();
			}
			$result_arr[$field['pub']['value']]['tag'][] = $field['tag']['value'];
		}
    }
    $toSort = array_values($result_arr);
    if($searchField != ''){
        usort($toSort, function($a, $b){
            if(intval($a['sumScore']) < intval($b['sumScore'])){
                return 1;
            }else if (intval($a['sumScore']) > intval($b['sumScore'])){
                return -1;
            }else{
                return 0;
            }
        });
    }else{
        usort($toSort, function($a, $b){
            return strcmp($b['order'], $a['order']);
        });
    }
	$response = array(
		'options' => $query['options'],
		'query' => $completeQuery,
		'results' => $toSort,
		'count' => $count
	);

	echo json_encode($response);
}

function _get_filters(){
    $offset = isset($_GET['offset']) && !empty($_GET['offset']) ? intval($_GET['offset']) : 0;
	$limit = isset($_GET['limit']) && !empty($_GET['limit']) ? intval($_GET['limit']) : 10;
    $filter_keys = isset($_GET['filter_keys']) && !empty($_GET['filter_keys']) ? $_GET['filter_keys'] : 'all';

    if($filter_keys == 'all'){
        $filter_keys = ['contributor', 'tag', 'year', 'org', 'category', 'project'];
    }else{
        $filter_keys = array($filter_keys);
    }

    $blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
	$blzg_prefix = $blazegraph_info['blazegraph_prefix'];

	$query = _create_search_query($_GET, $blazegraph_info);

	$prefixes = $query['prefix'];
	$queryWithoutPrefix = $query['query'];

	if(strpos($prefixes, 'bds') === false){
		$prefixes .= "\n prefix bds: <http://www.bigdata.com/rdf/search#> \n";
    }
    $ch = array();
    $mh = curl_multi_init();
    foreach ($filter_keys as $filter) {
        switch ($filter) {
            case 'contributor':
                $contributorFiltersQuery = <<<EOT
$prefixes
select ?contributoruuid ?contributorgivenName ?contributorfamilyName (count(?contributoruuid) as ?pubcount) WITH {
    $queryWithoutPrefix
} as %authorFilterSet WHERE {
    include %authorFilterSet.
    ?con rdfs:subPropertyOf* press:contributorType.
    ?pub press:hasContributor ?slot.
    ?slot ?con ?contributoruuid.
    OPTIONAL{?contributoruuid foaf:givenName ?contributorgivenName}.
    ?contributoruuid foaf:familyName ?contributorfamilyName.
}group by ?contributoruuid ?contributorgivenName ?contributorfamilyName order by desc(?pubcount) limit $limit
EOT;
            
                if($offset > 0 ){
                    $contributorFiltersQuery .= " offset $offset";
                }

                $ch['contributor'] = curl_init();
                curl_setopt($ch['contributor'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($contributorFiltersQuery));
                curl_setopt($ch['contributor'], CURLOPT_POST, 1);
                curl_setopt($ch['contributor'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['contributor'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['contributor']);
                break;
            case 'tag':
                $tagFiltersQuery = <<<EOT
$prefixes
select ?tag (count(?tag) as ?Tagcount) WITH {
    $queryWithoutPrefix
} as %tagFilterSet WHERE {
    include %tagFilterSet.
    ?pub press:tag ?tag.
}group by ?tag order by desc(?Tagcount) limit $limit
EOT;
        
                if($offset > 0 ){
                    $tagFiltersQuery .= " offset $offset";
                }
                
                $ch['tag'] = curl_init();
                curl_setopt($ch['tag'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($tagFiltersQuery));
                curl_setopt($ch['tag'], CURLOPT_POST, 1);
                curl_setopt($ch['tag'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['tag'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['tag']);
            
                break;
            case 'year':
                $yearFiltersQuery = <<<EOT
$prefixes
select ?year (count(?year) as ?pubcount) WITH {
    $queryWithoutPrefix
} as %yearFilterSet WHERE {
    include %yearFilterSet.
    ?pub press:year ?year.
}group by ?year order by desc(?pubcount) limit $limit
EOT;
            
                if($offset > 0 ){
                    $yearFiltersQuery .= " offset $offset";
                }

                $ch['year'] = curl_init();
                curl_setopt($ch['year'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($yearFiltersQuery));
                curl_setopt($ch['year'], CURLOPT_POST, 1);
                curl_setopt($ch['year'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['year'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['year']);
                break;
            case 'category':
                $categoryFiltersQuery = <<<EOT
$prefixes
select ?type (count(?type) as ?pubcount) WITH {
    $queryWithoutPrefix
} as %typeFilterSet WHERE {
    include %typeFilterSet.
    ?pub rdf:type ?type.
}group by ?type order by desc(?pubcount) limit $limit
EOT;
            
                if($offset > 0 ){
                    $categoryFiltersQuery .= " offset $offset";
                }
                
                $ch['category'] = curl_init();
                curl_setopt($ch['category'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($categoryFiltersQuery));
                curl_setopt($ch['category'], CURLOPT_POST, 1);
                curl_setopt($ch['category'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['category'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['category']);
                break;
            case 'org':
                $orgFiltersQuery = <<<EOT
$prefixes
select ?org ?organizationName (count(?org) as ?pubcount) WITH {
    $queryWithoutPrefix
} as %orgFilterSet WHERE {
    include %orgFilterSet.
    ?pub press:belongsTo ?org.
    ?org press:organizationName ?organizationName.
}group by ?org ?organizationName order by desc(?pubcount) limit $limit
EOT;
            
                if($offset > 0 ){
                    $orgFiltersQuery .= " offset $offset";
                }
                
                $ch['org'] = curl_init();
                curl_setopt($ch['org'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($orgFiltersQuery));
                curl_setopt($ch['org'], CURLOPT_POST, 1);
                curl_setopt($ch['org'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['org'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['org']);
                break;
            case 'project':
                $projectFiltersQuery = <<<EOT
$prefixes
select ?projectUUID ?projectName (count(?projectUUID) as ?pubcount) WITH {
    $queryWithoutPrefix
} as %projectFilterSet WHERE {
    include %projectFilterSet.
    ?pub press:appearsIn ?projectUUID.
    ?projectUUID press:projectName ?projectName.
}group by ?projectUUID ?projectName order by desc(?pubcount) limit $limit
EOT;
            
                if($offset > 0 ){
                    $projectFiltersQuery .= " offset $offset";
                }

                $ch['project'] = curl_init();
                curl_setopt($ch['project'], CURLOPT_URL, $blazegraph_info['blazegraph_url'] . '?query=' . urlencode($projectFiltersQuery));
                curl_setopt($ch['project'], CURLOPT_POST, 1);
                curl_setopt($ch['project'], CURLOPT_HTTPHEADER, array('Accept:application/sparql-results+json'));
                curl_setopt($ch['project'], CURLOPT_RETURNTRANSFER, true);
                curl_multi_add_handle($mh, $ch['project']);
                break;
            default:
                break;
        }
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running);
    }while($running);
    
    foreach ($ch as $key => $value) {
        curl_multi_remove_handle($mh, $value);
    }
    curl_multi_close($mh);

    $response = array();
    foreach ($ch as $key => $value) {
        $decoded = json_decode(curl_multi_getcontent($value), true)['results']['bindings'];
        $response[$key] = array();
        foreach($decoded as $f_index => $r){
            $response[$key][$f_index] = array();
            foreach($r as $filter_key => $filter_val){
                $response[$key][$f_index][$filter_key] = $filter_val['value'];
            }
        }
    }
    
    echo json_encode($response);
}

function _get_author_info(){
	if(!isset($_GET['authors']) || empty($_GET['authors'])){
		return;
	}
	$authors = $_GET['authors'];
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));
	$blzg_prefix = $blazegraph_info['blazegraph_prefix'];

	$query = <<<EOT
	prefix bds: <http://www.bigdata.com/rdf/search#>
	prefix press: <$blzg_prefix>
	SELECT ?uuid (CONCAT(?givenName, " ", ?familyName)
	AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) ?group WHERE {
	?uuid rdf:type foaf:Person.
	FILTER(
EOT;
	
	foreach($authors as $index => $author){
		if($index > 0) $query .= ' || ';
		$query .= "?uuid = <" . $author . ">";
	}

	$query .= <<<EOT
	).
	?uuid foaf:familyName ?familyName.
	optional{?uuid foaf:givenName ?givenName.}.
	optional{?uuid foaf:mbox ?mbox}.
	?uuid press:personGroup ?group.
}
EOT;
	
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
	echo $result->data;
}