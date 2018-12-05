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

}

function _get_uuid(){
	$blazegraph_info = _publication_mod_get_blazegraph_info(array('blazegraph_url', 'blazegraph_prefix'));

	$q = http_build_query(array('uuid'));

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

function _add_external_author(){

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

