/**
 * @fileOverview Creates the Edit Projects configuration page
 * 
 * @requires typeahead.js
 * @requires datatables.js
 */

/**
 * The main function to create the PRESSEditProjects Library
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Make globaly available as well
    define(['jquery'], function(jquery) {
      return (root.pressEditProjects = factory(jquery));
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
    root.pressEditProjects = factory(root.jQuery);
  }
}(this, function($) {

    /**
     * The init function of the library
     * 
     * @param {string} element The name of the Element that the page is going to be created
     * @param {Object} options The options of the element
     * @param {Function} cb
     */
    var PRESSEditProjects = function(element, options, cb) {
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

      element.append(this.getProjectField());
    };

    PRESSEditProjects.prototype = {
      constructor: PRESSEditProjects,

      /**
       * Creates Project text input using typeahead.js
       *
       * @returns {Object} A jQuery element object containing the new field
       */
      getProjectField: function() {

        var $group = $('<div class="form-group" id="project-bloodhound"></div>');
        var $label = $('<label class="col-sm-2 control-label" for="project-input" style="float:left;padding: 4px 2px;">Project Name:</label>');
        var $d = $('<div class="col-sm-9 scrollable-dropdown-menu" style="float:left; padding: 4px 8px;"></div>');
        var tooltip = 'Each word has to be at least 3 characters long to search.';
        var $input = $('<input id="project-input" data-toggle="tooltip" data-placement="top" title="'+tooltip+'" class="typeahead form-text" type="text"/>');
        // $input.mouseover(function(e){$(this).tooltip();});
        $input.mouseover();

        $d.append($input);

        $group.append($label);
        $group.append($d);
        var bloodhound = new Bloodhound({
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('projectName'),
          sufficient: 500,
          remote: {
            url: this.dbURL,
            wildcard: '%QUERY',
            prepare: (function(prefix){
                  return function(query, settings){

              var queries = query.split(' ');

              BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                        'prefix press: <'+prefix+'> \n' +
                        'SELECT ?uuid ?projectName ?projectDateEnd ?projectDateStart ?projectId ?projectStatus WHERE { \n';
              for(var i=0; i<queries.length; i++){
                if (queries[i].length < 3) return false;
                BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
                  '?uuid press:projectName ?o'+i+' . \n';
              }

              BDSquery += '?uuid press:projectName ?projectName. \n'+
              'OPTIONAL{?uuid press:projectId ?projectId}. \n'+
              'OPTIONAL{?uuid press:projectDateStart ?projectDateStart}. \n'+
              'OPTIONAL{?uuid press:projectDateEnd ?projectDateEnd}. \n'+
              'OPTIONAL{?uuid press:projectStatus ?projectStatus}. }';

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
                    projectName: results[i].projectName.value,
                  };
                  if('projectStatus' in results[i]){
                    tr[i].projectStatus = results[i].projectStatus.value;
                  }
                  if('projectDateStart' in results[i]){
                    tr[i].projectDateStart = results[i].projectDateStart.value;
                  }
                  if('projectDateEnd' in results[i]){
                    tr[i].projectDateEnd = results[i].projectDateEnd.value;
                  }
                  if('projectId' in results[i]){
                    tr[i].projectId = results[i].projectId.value;
                  }
                }
                console.log(tr);
                return tr;
              };
            })(),
            // cache: false
          }
        });

        var j=0;
        var dataset = {
          source: bloodhound,
          name: 'External',
          display: 'projectName',
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
            if(!suggestion){
              $input.typeahead('close');
              that.searchProjects();
              return;
            }
            var sug = {
              projectName: {value: suggestion.projectName},
              projectId: {value: suggestion.projectId},
              projectStatus: {value: suggestion.projectStatus},
              projectDateEnd: {value: suggestion.projectDateEnd},
              projectDateStart: {value: suggestion.projectDateStart},
              uuid: {value: suggestion.uuid}
            }
            
            that.getProjectsTable([sug])
            $(this).typeahead('val', '');
          };
        })(this));
        var $searchButton = $('<input type="button" class="form-submit" value="Search" style="float:left;"></input>');
        $searchButton.click($.proxy(this.searchProjects, this));
        $group.append($searchButton);
        return $group;
      },

      /**
       * Creates the search query for the projects and calls getProjectsTable()
       * to create the table
       */
      searchProjects: function(){
        console.log('pressed');
        var queries = $('#project-input').val().split(' ');

        BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                    'prefix press: <'+this.prefix+'> \n' +
                    'SELECT ?uuid ?projectName ?projectDateEnd ?projectDateStart ?projectId ?projectStatus WHERE { \n';
        for(var i=0; i<queries.length; i++){
          if (queries[i].length < 3) return false;
          BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
            '?uuid press:projectName ?o'+i+' . \n';
        }

        BDSquery += '?uuid press:projectName ?projectName. \n'+
        'OPTIONAL{?uuid press:projectId ?projectId}. \n'+
        'OPTIONAL{?uuid press:projectDateStart ?projectDateStart}. \n'+
        'OPTIONAL{?uuid press:projectDateEnd ?projectDateEnd}. \n'+
        'OPTIONAL{?uuid press:projectStatus ?projectStatus}. }';

        $.when(this.getQuery(BDSquery)).done((function(a){
          this.getProjectsTable(a.results.bindings);
        }).bind(this));
      },

      /**
       * Creates the Project table for displaying the results
       * 
       * @param  {Object} response The response from Blazegraph containing the Project Data
       */
      getProjectsTable: function(response){
        $('#myTable_wrapper').remove();
        $table = $('<table id="myTable" class="display"><thead><tr><th>Project Name</th><th>Project ID</th>'+
          '<th>Project Status</th><th>Start Date</th><th>End Date</th><th>UUID</th></tr></thead></table>');
        this.element.append($table);
        that = this;
        var columns = [
          {data:'projectName.value', defaultContent: "", name: 'projectName', 'data_p': 'press:projectName'},
          {data:'projectId.value', defaultContent: "", name: 'projectId', 'data_p': 'press:projectId'},
          {data:'projectStatus.value', defaultContent: "", name: 'projectStatus', 'data_p': 'press:projectStatus'},
          {data:'projectDateStart.value', defaultContent: "", name: 'projectDateStart', 'data_p': 'press:projectDateStart'},
          {data:'projectDateEnd.value', defaultContent: "", name: 'projectDateEnd', 'data_p': 'press:projectDateEnd'},
          {data:'uuid.value', defaultContent: "", name: 'uuid'}
        ];
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
                text: 'Delete Selected Projects',
                className: 'removeButton',
                action: function(e, dt, button, config){
                  var items = '';
                  var i=0;
                  var uuids = [];
                  selected = dt.rows('.selected');
                  for(i=0; i<selected.data().length; i++){
                    var row = selected.data()[i];
                    items += '  • '+row.projectName.value+', '+row.projectId.value+'\n';
                    uuids.push(row.uuid.value);
                  }
                  if (uuids.length === 0){
                    alert('No Projects Selected!');
                  }
                  else if(confirm('Are you sure you want to delete the selected projects?\n\n'+
                    items)){
                      $.when(that.deleteProjects(uuids)).done(function(a){
                        console.log(selected);
                        selected.remove().draw();
                      });
                  }
                },
              }
            ],
            data:response,
            columns: columns,
            select: {
              items: 'row',
              style: 'multi',
            },
          }
        );

        // Open editable field on double click
        $('#myTable tbody').on('dblclick', 'td:not(.input-open)', function(){
          var cell = table.cell(this);
          var index = cell.index();
          var column = index.column;
          var columnName = columns[column].name;
          var prevVal = cell.data();
          if(['projectName', 'projectDateStart', 'projectDateEnd'].includes(columnName)){
            $(this).addClass('input-open');
            $(this).html('<input class="form-text" type="text" value="'+cell.data()+'"></input>');
            if(['projectDateStart', 'projectDateEnd'].includes(columnName)){
              $(this).find('input').datepicker({
                'dateFormat': 'yy-mm-dd'
              });
            }
            $(this).find('input').select();

            $(this).find('input').keyup(function(ev){
              if(ev.which == 13 || ev.keyCode == 13){
                that.loader.show();
                var newVal = $(this).val().trim();
                if(newVal === ''){
                  $(cell.node()).text(prevVal);
                  $(cell.node()).removeClass('input-open');
                  return;
                }
                cell.data(newVal);
                if(newVal !== prevVal){
                  $.when(that.editProject(table.row(index.row).data().uuid.value,
                    columns[column].data_p,
                    newVal)
                  ).done(function(a){
                    that.loader.hide();
                    console.log('DONE');
                  });
                  $(cell.node()).removeClass('input-open');
                }
              }else if(ev.which == 27 || ev.keyCode == 27){
                console.log('CANCEL');
                $(cell.node()).text(prevVal);
                $(cell.node()).removeClass('input-open');
              }
            });
          }
        });
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
       * Creates the query based on the uuids provided and makes the request to 
       * delete the projects
       * 
       * @param  {Array} uuids An array of the projects' uuids that are going to
       * be deleted
       * 
       * @return {Object} A jqXHR object
       */
      deleteProjects: function(uuids){
        prefix = this.prefix;
        var query = 'prefix press: <'+prefix+'> \n';

        query += 'DELETE { \n';
        query += '?project ?p ?o. \n';
        query += '?x ?y ?project. \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '?project rdf:type press:Project. \n';
        query += 'filter(';
        var i=0;
        for(i=0; i<uuids.length; i++){
          query+= '?project = <'+ uuids[i] +'>';
          if (i<uuids.length -1){
            query += '|| \n';
          }
        }
        query += '). \n';
        query += '?project ?p ?o. \n';
        query += 'OPTIONAL{?x ?y ?project}. \n';
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
       * Creates the query based on the uuid, editKey and editValue provided and
       * makes the request to edit the project
       * 
       * @param  {string} uuid The uuid of the editing project
       * @param  {string} editKey The field key that is going to be edited
       * @param  {string} editValue The new value
       * 
       * @return {Object} A jqXHR object
       */
      editProject: function(uuid, editKey, editValue){
        console.log('uuid:', uuid);
        console.log('editKey:', editKey);
        console.log('editValue:', editValue);

        var prefix = this.prefix;

        var query = 'prefix press: <'+prefix+'> \n';

        query += 'DELETE { \n';
        query += '<'+uuid+'> ' + editKey+ ' ?o. \n';
        query += '}\n';
        query += 'INSERT { \n';
        query += '<'+uuid+'> '+editKey+' "'+editValue+'". \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '<'+uuid+'> rdf:type press:Project. \n';
        query += 'OPTIONAL{ <'+uuid+'>' + editKey + ' ?o}. \n';
        query += '}';

        console.log(query);

        return $.ajax({
          dataType: 'json',
          method: 'POST',
          dataType: 'html',
          url: this.dbURL,
          data: {
            update: query
          }
        })
        .done(function(response){
          return response;
        })
        .fail(function(response) {
          alert("Oops! There was an error with getting query! See console for more info.");
          console.error(response);
        });
      }
    };

    // We add the library to jQuery functions
    $.fn.pressEditProjects = function(options, callback) {
      this.each(function() {
        var el = $(this);
        if (el.data('pressEditProjects'))
          el.data('pressEditProjects').remove();
        el.data('pressEditProjects', new PRESSEditProjects(el, options, callback));
      });
      return this;
    };

    return PRESSEditProjects;
  }));
