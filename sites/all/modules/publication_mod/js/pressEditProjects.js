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
      // element.append(this.loader);

      element.append(this.getProjectField());
    };

    PRESSEditProjects.prototype = {
      constructor: PRESSEditProjects,

      //Get Project Field using typeahead.js and sortable.js
      getProjectField: function() {  //Typeahead Field for searching Projects

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
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Project_Name'),
          sufficient: 500,
          remote: {
            url: this.dbURL,
            wildcard: '%QUERY',
            prepare: (function(prefix){
                  return function(query, settings){

              var queries = query.split(' ');

              BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                        'prefix press: <'+prefix+'> \n' +
                        'SELECT ?uuid ?Project_Name ?Project_Date_End ?Project_Date_Start ?Project_ID ?Project_Status WHERE { \n';
              for(var i=0; i<queries.length; i++){
                if (queries[i].length < 3) return false;
                BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
                  '?uuid press:Project_Name ?o'+i+' . \n';
              }

              BDSquery += '?uuid press:Project_Name ?Project_Name. \n'+
              '?uuid press:Project_ID ?Project_ID. \n'+
              '?uuid press:Project_Date_Start ?Project_Date_Start. \n'+
              '?uuid press:Project_Date_End ?Project_Date_End. \n'+
              '?uuid press:Project_Status ?Project_Status. }';

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
                    Project_Name: results[i].Project_Name.value,
                    Project_Status: results[i].Project_Status.value,
                    Project_Date_Start: results[i].Project_Date_Start.value,
                    Project_Date_End: results[i].Project_Date_End.value,
                    Project_ID: results[i].Project_ID.value
                  };
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
          name: 'External',
          display: 'fullName',
          templates: {
            header: '<h4 class="author-category">External Authors</h4>',
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
              Project_Name: {value: suggestion.Project_Name},
              Project_ID: {value: suggestion.Project_ID},
              Project_Status: {value: suggestion.Project_Status},
              Project_Date_End: {value: suggestion.Project_Date_End},
              Project_Date_Start: {value: suggestion.Project_Date_Start},
              uuid: {value: suggestion.uuid}
            }
            console.log(sug);
            that.getProjectsTable([sug])
            $(this).typeahead('val', '');
          };
        })(this));
        var $searchButton = $('<input type="button" class="form-submit" value="Search" style="float:left;"></input>');
        $searchButton.click($.proxy(this.searchProjects, this));
        $group.append($searchButton);
        return $group;
      },

      searchProjects: function(){
        console.log('pressed');
        var queries = $('#project-input').val().split(' ');

        BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                    'prefix press: <'+this.prefix+'> \n' +
                    'SELECT ?uuid ?Project_Name ?Project_Date_End ?Project_Date_Start ?Project_ID ?Project_Status WHERE { \n';
        for(var i=0; i<queries.length; i++){
          if (queries[i].length < 3) return false;
          BDSquery += '?o'+i+' bds:search "'+queries[i]+'*". \n'+
            '?uuid press:Project_Name ?o'+i+' . \n';
        }

        BDSquery += '?uuid press:Project_Name ?Project_Name. \n'+
        '?uuid press:Project_ID ?Project_ID. \n'+
        '?uuid press:Project_Date_Start ?Project_Date_Start. \n'+
        '?uuid press:Project_Date_End ?Project_Date_End. \n'+
        '?uuid press:Project_Status ?Project_Status. }';

        $.when(this.getQuery(BDSquery)).done((function(a){
          this.getProjectsTable(a.results.bindings);
        }).bind(this));
      },
      getProjectsTable: function(response){
        $('#myTable_wrapper').remove();
        $table = $('<table id="myTable" class="display"><thead><tr><th>Project Name</th><th>Project ID</th>'+
          '<th>Project Status</th><th>Start Date</th><th>End Date</th><th>UUID</th></tr></thead></table>');
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
                text: 'Delete Selected Projects',
                className: 'removeButton',
                action: function(e, dt, button, config){
                  var items = '';
                  var i=0;
                  var uuids = [];
                  selected = dt.rows('.selected');
                  for(i=0; i<selected.data().length; i++){
                    var row = selected.data()[i];
                    items += '  • '+row.Project_Name.value+', '+row.Project_ID.value+'\n';
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
            columns:[
              {data:'Project_Name.value'},
              {data:'Project_ID.value'},
              {data:'Project_Status.value'},
              {data:'Project_Date_Start.value'},
              {data:'Project_Date_End.value'},
              {data:'uuid.value'}
            ],
            select: {
              items: 'row',
              style: 'multi',
            },
          }
        );
      },

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

      deleteProjects(uuids){
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
      }
    };

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