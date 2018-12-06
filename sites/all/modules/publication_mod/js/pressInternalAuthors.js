/**
 * @fileOverview Creates the External Author configuration page
 * 
 * @requires typeahead.js
 * @requires datatables.js
 */

/**
 * The main function to create the PRESSInternalAuthors Library
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Make globaly available as well
    define(['jquery'], function(jquery) {
      return (root.pressInternalAuthors = factory(jquery));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node / Browserify
    //isomorphic issue
    var jQuery = (typeof window != 'undefined') ? window.jQuery : undefined;
    if (!jQuery) {
      jQuery = require('jquery');
      if (!jQuery.fn) jQuery.fn = {};
    }
    module.exports = factory(jQuery);
  } else {
    // Browser globals
    root.pressInternalAuthors = factory(root.jQuery);
  }
}(this, function($) {

    /**
     * The init function of the library
     * 
     * @param {string} element The name of the Element that the page is going to be created
     * @param {Object} options The options of the element
     * @param {Function} cb
     */
    var PRESSInternalAuthors = function(element, options, cb) {
      this.dbURL = "";
      this.prefix = "";

      this.element = $(element);

      //custom options from user
      if (typeof options !== 'object' || options === null)
        options = {};

      //allow setting options with data attributes
      //data-api options will be overwritten with custom javascript options
      options = $.extend(this.element.data(), options);

      if (typeof options.dbURL === 'string')
        this.dbURL = options.dbURL;

      if (typeof options.prefix === 'string')
        this.prefix = options.prefix;

      this.loader = $('<div id="loader">');
      this.filterLoader = $('<div id="filterLoader">');
      // element.append(this.loader);

      element.append(this.getAuthorField());
    };

    PRESSInternalAuthors.prototype = {
      constructor: PRESSInternalAuthors,

      /**
       * Creates the Author text input using typeahead.js
       *
       * @returns {Object} A jQuery element object containing the new field
       */
      getAuthorField: function() {

        var $group = $('<div class="form-group" id="author-bloodhound"></div>');
        var $label = $('<label class="col-sm-2 control-label" for="author-input" style="float:left;padding: 4px 2px;">Author:</label>');
        var $d = $('<div class="col-sm-9 scrollable-dropdown-menu" style="float:left; padding: 4px 8px;"></div>');
        var tooltip = 'Each word has to be at least 3 characters long to search.';
        var $input = $('<input id="author-input" data-toggle="tooltip" data-placement="top" title="'+tooltip+'" class="typeahead form-text" type="text"/>');
        // $input.mouseover(function(e){$(this).tooltip();});
        $input.mouseover();

        $d.append($input);

        $group.append($label);
        $group.append($d);
        var bloodhound = new Bloodhound({
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('fullName'),
          sufficient: 500,
          remote: {
            url: this.dbURL,
            wildcard: '%QUERY',
            prepare: (function(prefix){
                  return function(query, settings){

              var queries = query.split(' ');

              BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                        'prefix press: <'+prefix+'> \n' +
                        'SELECT ?uuid (CONCAT(?givenName, \" \", ?familyName) '+
                          'AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) WHERE { \n';
              for(var i=0; i<queries.length; i++){
                if (queries[i].length < 3) return false;
                BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
                  '?uuid ?p'+i+' ?o'+i+' . \n'+
                  'filter(?p'+ i +' = foaf:familyName || ?p'+i+' = foaf:givenName). \n';
              }

              BDSquery += 'OPTIONAL { \n' +
              '?uuid press:personGroup ?group. \n' +
              '} \n' +
              'FILTER(?group = "FORTH_ICS_Author") \n'+
              '?uuid foaf:familyName ?familyName. \n'+
              '?uuid foaf:givenName ?givenName. \n'+
              'optional{?uuid foaf:mbox ?mbox}. }';

              settings.data = {
                query : BDSquery,
              };
              return settings;
            };})(this.prefix),
            transform: (function (){
              return function(response){
                console.log(response);
                if (typeof response !== 'object') return [];
                var tr=[];
                var results = response.results.bindings;
                for(var i=0; i<results.length; i++){
                  tr[i] = {
                    uuid: results[i].uuid.value,
                    fullName: results[i].fullName.value,
                    familyName: results[i].familyName.value,
                    givenName: results[i].givenName.value
                  };
                  if ('mail' in results[i]){
                    tr[i].mail = results[i].mail.value;
                  }
                }
                console.log(tr);
                return tr;
              };
            })(),
            // cache: false    //NOTE Sure about this?
          }
        });

        var j=0;
        var dataset = {
          source: bloodhound,
          name: 'Internal',
          display: 'fullName',
          templates: {
            header: '<h4 class="author-category">Internal Authors</h4>',
            suggestion: function(data) {
              var mail = '';
              if ('mail' in data){
                mail = ' - ' + data.mail;
              }
              // return '<p><strong>' + data.fullName + '</strong></p>';
              return '<p><strong>' + data.fullName + '</strong>' + mail + '</p>';
            }
          },
          limit: 300

        };
        var autocomplete = $input.typeahead({
          hint: false,
          highlight: false,
          minLength: 3
        }, dataset);

        $input.bind('typeahead:select keypress', (function(that){
            return function(ev, suggestion) {
            if (ev.type === 'keypress' && ev.which != 13) {
              return;
            }
            console.log(suggestion);
            var sug = {
              familyName: {value: suggestion.familyName},
              givenName: {value: suggestion.givenName},
              uuid: {value: suggestion.uuid}
            }
            if (suggestion.mail){
              sug.mail = {value: suggestion.mail};
            }
            console.log(sug);
            that.getAuthorsTable([sug])
            $(this).typeahead('val', '');
          };
        })(this));
        var $searchButton = $('<input type="button" class="form-submit" value="Search" style="float:left;"></input>');
        $searchButton.click($.proxy(this.searchAuthors, this));
        $group.append($searchButton);
        return $group;
      },

      /**
       * Creates the search query for the tags and calls getAuthorsTable()
       * to create the table
       */
      searchAuthors: function(){
        console.log('pressed');
        var queries = $('#author-input').val().split(' ');

        BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                  'prefix press: <'+this.prefix+'> \n' +
                  'SELECT ?uuid (CONCAT(?givenName, \" \", ?familyName) '+
                    'AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) WHERE { \n';
        for(var i=0; i<queries.length; i++){
          if (queries[i].length < 3) return false;
          BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
            '?uuid ?p'+i+' ?o'+i+' . \n'+
            'filter(?p'+ i +' = foaf:familyName || ?p'+i+' = foaf:givenName). \n';
        }

        BDSquery += 'OPTIONAL { \n' +
        '?uuid press:personGroup ?group. \n' +
        '} \n' +
        'FILTER(?group = "FORTH_ICS_Author") \n'+
        '?uuid foaf:familyName ?familyName. \n'+
        '?uuid foaf:givenName ?givenName. \n'+
        'optional{?uuid foaf:mbox ?mbox}. }';

        $.when(this.getQuery(BDSquery)).done((function(a){
          this.getAuthorsTable(a.results.bindings);
        }).bind(this));
      },

      /**
       * Creates the Author table for displaying the results
       * 
       * @param  {Object} response The response from Blazegraph containing the Author Data
       */
      getAuthorsTable: function(response){
        $('#myTable_wrapper').remove();
        $table = $('<table id="myTable" class="display"><thead><tr><th>Given Name</th><th>Family Name</th>'+
          '<th>Mail</th><th>UUID</th></tr></thead></table>');
        this.element.append($table);
        that = this;
        var table = $table.DataTable(
          {
            dom: 'lfrtip<"dtButton"B>',
            buttons: [
              {
                text: 'Clear Selections',
                action: function(e, dt, button, config){
                  dt.rows('.selected').deselect();
                }
              },
              {
                text: 'Delete Selected Authors',
                className: 'removeButton',
                action: function(e, dt, button, config){
                  var items = '';
                  var i=0;
                  var uuids = [];
                  selected = dt.rows('.selected');
                  for(i=0; i<selected.data().length; i++){
                    var row = selected.data()[i];
                    items += '  • '+row.givenName.value+' '+row.familyName.value+'\n';
                    uuids.push(row.uuid.value);
                  }
                  if (uuids.length === 0){
                    alert('No Authors Selected!');
                  }
                  else if(confirm('Are you sure you want to delete the selected authors?\n\n'+
                    items)){
                      $.when(that.deleteAuthors(uuids)).done(function(a){
                        console.log(selected);
                        selected.remove().draw();
                      });
                  }
                },
              },
              {
                text: 'Make Authors External Authors',
                className: 'changeGroupButton',
                action: function(e, dt, button, config){
                  var items = '';
                  var i=0;
                  var uuids = [];
                  selected = dt.rows('.selected');
                  for(i=0; i<selected.data().length; i++){
                    var row = selected.data()[i];
                    items += '  • '+row.givenName.value+' '+row.familyName.value+'\n';
                    uuids.push(row.uuid.value);
                  }
                  if (uuids.length === 0){
                    alert('No Authors Selected!');
                  }
                  else if(confirm('Are you sure you want to make the selected authors External Authors?\n\n'+
                    items)){
                      $.when(that.changeAuthorsGroup(uuids)).done(function(a){
                        console.log(selected);
                        selected.remove().draw();
                      });
                  }
                },
              }
            ],
            data:response,
            columns:[
              {data: 'givenName.value'},
              {data:'familyName.value'},
              {
                data: 'mail',
                render: function(data, type, row){
                  if(data !== undefined){
                    return data.value;
                  }
                  return '';
                }
              },
              {data:'uuid.value'}
            ],
            select: {
              items: 'row',
              style: 'multi',
            },
          }
        );
      },

      /**
       * Adds limit and offset to a query and makes the request to Blazegraph.
       * 
       * @param  {string} q The Query 
       * @param  {number} limit The limit of the query
       * @param  {number} offset The offset of the query
       * @return {Object} A jqXHR object
       */
      getQuery: function(q, limit, offset){
        console.log('getQuery');
        if (typeof limit === 'undefined'){
          limit = 0;
        }
        if (typeof offset === 'undefined'){
          offset = 0;
        }
        if (limit > 0){
          q += ' limit '+ limit;
        }
        if (offset > 0){
          q += ' offset '+ offset;
        }
        return $.ajax({
          dataType: 'json',
          method: "GET",
          url: this.dbURL,
          data: {
            query: q
          }
        })
        .done(function(response) {
          return response;
        })
        .fail(function(response) {
          alert("Oops! There was an error with getting query! See console for more info.");
          console.error(response);
        });
      },

      /**
       * Creates the query based on the author uuids provided and makes the request to 
       * delete the authors
       * 
       * @param  {Array} tags An array of the authors' uuids that are going to be deleted
       * 
       * @return {Object} A jqXHR object
       */
      deleteAuthors(uuids){
        prefix = this.prefix;
        var query = "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";

        query += 'DELETE { \n';
        query += '?person ?p ?o. \n';
        query += '?x ?y ?person. \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '?person rdf:type foaf:Person. \n';
        query += 'filter(';
        var i=0;
        for(i=0; i<uuids.length; i++){
          query+= '?person = <'+ uuids[i] +'>';
          if (i<uuids.length -1){
            query += '|| \n';
          }
        }
        query += '). \n';
        query += '?person ?p ?o. \n';
        query += 'OPTIONAL{?x ?y ?person}. \n';
        query += '}';

        console.log(query);

        return $.ajax({
          dataType: 'json',
          method: "POST",
          dataType: 'html',
          url: this.dbURL,
          data: {
            update: query
          }
        })
        .done(function(response) {
          return response;
        })
        .fail(function(response) {
          alert("Oops! There was an error with getting query! See console for more info.");
          console.error(response);
        });
      },

      /**
       * Creates the query based on the author uuids provided and makes the request to 
       * change the group (Internal to External) of the authors
       * 
       * @param  {Array} tags An array of the authors' uuids that are going to be altered
       * 
       * @return {Object} A jqXHR object
       */
      changeAuthorsGroup(uuids){
        prefix = this.prefix;
        var query = "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";
        query += "prefix press: <"+ prefix +"> \n";

        query += 'DELETE { \n';
        query += '?person press:personGroup "FORTH_ICS_Author". \n';
        query += '}\n';
        query += 'INSERT{\n';
        query += '?person press:personGroup "External_Author". \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '?person rdf:type foaf:Person. \n';
        query += '?person press:personGroup "FORTH_ICS_Author". \n';
        query += 'filter(';
        var i=0;
        for(i=0; i<uuids.length; i++){
          query+= '?person = <'+ uuids[i] +'>';
          if (i<uuids.length -1){
            query += '|| \n';
          }
        }
        query += '). \n';
        query += '}';

        console.log(query);

        return $.ajax({
          dataType: 'json',
          method: "POST",
          dataType: 'html',
          url: this.dbURL,
          data: {
            update: query
          }
        })
        .done(function(response) {
          return response;
        })
        .fail(function(response) {
          alert("Oops! There was an error with getting query! See console for more info.");
          console.error(response);
        });
      }
    };

    // We add the library to jQuery functions
    $.fn.pressInternalAuthors = function(options, callback) {
      this.each(function() {
        var el = $(this);
        if (el.data('pressInternalAuthors'))
          el.data('pressInternalAuthors').remove();
        el.data('pressInternalAuthors', new PRESSInternalAuthors(el, options, callback));
      });
      return this;
    };

    return PRESSInternalAuthors;
  }));
