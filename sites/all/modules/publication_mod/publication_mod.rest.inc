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

function _get_data_properties(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$query = "prefix press: <" . $blazegraph_info['blazegraph_prefix'] ."> ";
	$query .= 'SELECT DISTINCT (strafter(str(?p), "#") AS ?pid) ?label (strafter(str(?type), "#") AS ?ptype) ?range ';
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

function _add_publication(){

}

