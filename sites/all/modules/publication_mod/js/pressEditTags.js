(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Make globaly available as well
    define(['jquery'], function(jquery) {
      return (root.pressEditTags = factory(jquery));
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
    root.pressEditTags = factory(root.jQuery);
  }
}(this, function($) {

    var PRESSEditTags = function(element, options, cb) {
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

      this.loader = $('<div id="loader">').hide();
      this.filterLoader = $('<div id="filterLoader">');
      element.append(this.loader);

      element.append(this.getTagField());
      element.append('<br/><br/><p>Each word has to be at least 3 characters long '+
        'to search.<br/>Double click in the cell to edit the field. Press "Enter" to '+
        'Save, or "Esc" to Cancel. The fields cannot be empty.</p>');
    };

    PRESSEditTags.prototype = {
      constructor: PRESSEditTags,

      //Get Tag Field using typeahead.js and sortable.js
      getTagField: function() {  //Typeahead Field for searching Tags

        var $group = $('<div class="form-group" id="tag-bloodhound"></div>');
        var $label = $('<label class="col-sm-2 control-label" for="tag-input" style="float:left;padding: 4px 2px;">Tag:</label>');
        var $d = $('<div class="col-sm-9 scrollable-dropdown-menu" style="float:left; padding: 4px 8px;"></div>');
        var tooltip = 'Each word has to be at least 3 characters long to search.';
        var $input = $('<input id="tag-input" data-toggle="tooltip" data-placement="top" title="'+tooltip+'" class="typeahead form-text" type="text"/>');
        // $input.mouseover(function(e){$(this).tooltip();});

        $input.mouseover();

        $d.append($input);

        $group.append($label);
        $group.append($d);
        var bloodhound = new Bloodhound({
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tag'),
          sufficient: 500,
          remote: {
            url: this.dbURL,
            wildcard: '%QUERY',
            prepare: (function(prefix){
                  return function(query, settings){

              var queries = query.split(' ').join('* ')+'*';

              BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                        'prefix press: <'+prefix+'> \n' +
                        'SELECT ?tag (count(?pub) as ?Tag_Uses) WHERE { \n';

              BDSquery += '?tag bds:search "'+ queries +'". \n';

              BDSquery += '?pub press:tag ?tag. \n'+
              '}group by ?tag';

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
                    tag: results[i].tag.value,
                    Tag_Uses: results[i].Tag_Uses.value
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
          name: 'Tags',
          display: 'tag',
          templates: {
            header: '<h4 class="author-category">Tags</h4>',
            suggestion: function(data) {
              return '<p><strong>' + data.tag + '</strong> - ' + data.Tag_Uses + '</p>';
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
            if(!suggestion){
              that.searchTags();
              return;
            }
            var sug = {
              tag: {value: suggestion.tag},
              Tag_Uses: {value: suggestion.Tag_Uses}
            }
            that.getTagsTable([sug]);
            $(this).typeahead('val', '');
          };
        })(this));
        var $searchButton = $('<input type="button" class="form-submit" value="Search" style="float:left;"></input>');
        $searchButton.click($.proxy(this.searchTags, this));

        $group.append($searchButton);
        return $group;
      },

      searchTags: function(){
        console.log('pressed');
        var queries = $('#tag-input').val().split(' ').join('* ')+'*';

        BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n'+
                    'prefix press: <'+this.prefix+'> \n' +
                    'SELECT ?tag (count(?pub) as ?Tag_Uses) WHERE { \n';

        BDSquery += '?tag bds:search "'+ queries +'". \n';
        BDSquery += '?pub press:tag ?tag. \n'+
        '}group by ?tag';

        $.when(this.getQuery(BDSquery)).done((function(a){
          this.getTagsTable(a.results.bindings);
        }).bind(this));
      },
      getTagsTable: function(response){
        $('#myTable_wrapper').remove();
        $table = $('<table id="myTable" class="display"><thead><tr><th>Tag</th><th>Tag Uses</th>'+
          '</tr></thead></table>');
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
                text: 'Delete Selected Tags',
                className: 'removeButton',
                action: function(e, dt, button, config){
                  var items = '';
                  var i=0;
                  var tags = [];
                  selected = dt.rows('.selected');
                  for(i=0; i<selected.data().length; i++){
                    var row = selected.data()[i];
                    items += '  • '+row.tag.value+', '+row.Tag_Uses.value+'\n';
                    tags.push(row.tag.value);
                  }
                  if (tags.length === 0){
                    alert('No Tags Selected!');
                  }
                  else if(confirm('Are you sure you want to delete the selected tags?\n\n'+items)){
                      $.when(that.getUsingPubs(tags)).done(function(r){
                        $.when(that.deleteTags(tags)).done(function(a){
                          console.log(selected);
                          var uris = [];
                          for (var i = 0; i < r.results.bindings.length; i++) {
                            uris.push(r.results.bindings[i].pub.value);
                          }
                          $.ajax({
                            dataType: 'html',
                            method: 'POST',
                            url: '/ajax/update_pub_pages',
                            data: {
                              blazegraph_uris: uris
                            }
                          })
                          .done(function(sel){
                            return function(res){
                              sel.remove().draw();
                            }
                          }(selected))
                          .fail(function(res){
                            console.error(res);
                          });
                        });
                      });
                  }
                },
              }
            ],
            data:response,
            columns:[
              {
                data:'tag.value',
                createdCell: function(td, cellData, rowData, row, col) {
                  $(td).attr('original_value', cellData);
                }
              },
              {data:'Tag_Uses.value'}
            ],
            select: {
              items: 'row',
              style: 'multi',
            },
          }
        );

        $('#myTable tbody').on('dblclick', 'td:not(.input-open)', function(){
          var cell = table.cell(this);
          var prevVal = cell.data();
          if(cell.index().column < 1){
            $(this).addClass('input-open');
            $(this).html('<input class="form-text" type="text" value="'+cell.data()+'"></input>');
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
                  $.when(that.editTag($(cell.node()).attr('original_value'), newVal)
                  ).done(function(a){
                    that.loader.hide();
                    console.log('DONE');
                  });
                  $(cell.node()).removeClass('input-open');
                }
              }else if(ev.which == 27 || ev.keyCode == 27){
                $(cell.node()).text(prevVal);
                $(cell.node()).removeClass('input-open');
              }
            });
          }
        });
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

      getUsingPubs: function(tags) {
        prefix = this.prefix;
        var query = 'prefix press: <'+prefix+'> \n';

        query += 'SELECT ?pub WHERE{\n';
        query += '?pub press:tag ?tag.\n';
        query += 'FILTER('
        for (var i = 0; i < tags.length; i++) {
          if(i>0){
            query += ' || ';
          }
          query += '?tag = "'+tags[i]+'"';
        }
        query += ').\n';
        query += '}';

        return $.ajax({
          dataType: 'json',
          method: 'GET',
          url: this.dbURL,
          data: {
            query: query
          }
        })
        .done(function(response){
          return response;
        })
        .fail(function(response){
          alert("Oops! There was an error with getting query! See console for more info.");
          console.error(response);
        });
      },

      deleteTags: function(tags){
        prefix = this.prefix;
        var query = 'prefix press: <'+prefix+'> \n';

        query += 'DELETE { \n';
        query += '?pub press:tag ?tag. \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '?pub press:tag ?tag. \n';
        query += 'filter(';
        var i=0;
        for(i=0; i<tags.length; i++){
          if (i > 0){
            query += ' || '
          }
          query+= '?tag = "'+ tags[i] +'"';
        }
        query += '). \n';
        query += '}';

        console.log(query);

        return $.ajax({
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
      editTag: function(original_value, new_value){
        var prefix = this.prefix;

        var query = 'prefix press: <'+prefix+'> \n';
        query += 'DELETE { \n';
        query += '?publication  press:tag "'+original_value+'". \n';
        query += '}\n';
        query += 'INSERT { \n';
        query += '?publication  press:tag "'+new_value+'". \n';
        query += '}\n';
        query += 'WHERE{ \n';
        query += '?publication  press:tag "'+original_value+'". \n';
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

    $.fn.pressEditTags = function(options, callback) {
      this.each(function() {
        var el = $(this);
        if (el.data('pressEditTags'))
          el.data('pressEditTags').remove();
        el.data('pressEditTags', new PRESSEditTags(el, options, callback));
      });
      return this;
    };

    return PRESSEditTags;
  }));
