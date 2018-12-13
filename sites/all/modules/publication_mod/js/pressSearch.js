/**
 * @fileOverview Creates the Search Publication page
 */

/**
 * The main function to create the PRESSSearch Library
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Make globaly available as well
        define(['jquery'], function(jquery) {
            return (root.pressSearch = factory(jquery));
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
        root.press = factory(root.jQuery);
    }
}(this, function($) {

    /**
     * The init function of the library
     *
     * @param {string} element The name of the Element that the page is going to be created
     * @param {Object} options The options of the element
     * @param {Function} cb
     */
    var PRESSSearch = function(element, options, cb) {
        this.currentSearchMode = '';
        this.currentSearchFields = {};

        this.base_url = "../";
        this.dbURL = "";
        this.prefix = "";
        this.current_user = {};
        this.category_tree = {};
        this.category_labels = {};
        this.element = $(element);
        this.fieldElement = $('<div id="form-fields"></div>');
        this.filterFields = filterFields;
        this.orgs = {};
        this.authorGroups = {};
        this.personFields = personFields;
        this.cat;
        this.subcat;
        this.category_list;
        this.JSONfields = JSONfields;
        this.JSONrequiredFields = JSONrequiredFields;
        this.titleFields = titleFields;
        this.bloodhounds = {};
        this.loader;
        this.filterLoader;
        this.resultContainer = $('<div id="result-container" class="col-sm-9"></div>');
        this.results = $('<div id="results"></div>');
        this.resultContainer.append(this.results);
        this.filters = $('<div id="filters" class="col-sm-3"></div>');
        this.lastQueryWithoutFilters = [];
        this.lastQueryWithFilters = [];
        this.lastSearchLabel = '';
        this.contributorOrder = JSONContributorOrder;
        this.advanced_search = $('<div id="advanced_search" class="collapse col-sm-12"></div>');
        this.categoryColor = categoryColor;
        this.parameters = {};
        this.block_only = false;
        this.selected_lab = false;

        this.categoryDescendants = {};
        this.categoryAncestors = {};

        function findDescendants(object, descendantObject, depth) {
            for (var key in object) {
                if (typeof object[key] === 'object' && !($.isArray(object[key]))) {
                    descendantObject.push(key);
                    descendantObject = findDescendants(object[key], descendantObject, depth + 1);
                } else if ($.isArray(object[key])) {
                    descendantObject.push(key);

                }
            }
            return descendantObject;
        }


        for (var key in this.JSONfields) {
            this.categoryDescendants[key] = [];
            this.categoryDescendants[key] = findDescendants(this.JSONfields[key], this.categoryDescendants[key], 0);
        }



        for (key in this.categoryDescendants) {
            for (var i = 0; i < this.categoryDescendants[key].length; i++) {
                this.categoryAncestors[this.categoryDescendants[key][i]] = key;
            }
        }

        //custom options from user
        if (typeof options !== 'object' || options === null)
            options = {};

        //allow setting options with data attributes
        //data-api options will be overwritten with custom javascript options
        options = $.extend(this.element.data(), options);

        if (typeof options.base_url === 'string')
            this.base_url = options.base_url;

        if (typeof options.dbURL === 'string')
            this.dbURL = options.dbURL;

        if (typeof options.prefix === 'string')
            this.prefix = options.prefix;

        if (typeof options.organizations === 'object')
            this.orgs = options.organizations;

        if (typeof options.authorGroups === 'object')
            this.authorGroups = options.authorGroups;

        if (typeof options.current_user === 'object')
            this.current_user = options.current_user;

        if (typeof options.block_only === 'boolean')
            this.block_only = options.block_only;
        
        if (typeof options.selected_lab === 'string')
            this.selected_lab = options.selected_lab;

        if (typeof options.parameters === 'object')
            this.parameters = options.parameters;

        this.loader = $('<div id="loader">');
        this.filterLoader = $('<div class="filterLoader">');
        element.append(this.loader);

        window.onpopstate = (function(that) {
            return function(event) {
                if (!event.state) {
                    location.reload();
                } else {
                    var currentState = event.state;
                    that.fillFieldsByStateAndSearch(currentState, true);
                }
            };
        })(this);

        // Retreive from blazegraph the tags and categories. On success, 
        // Create the page
        $.when(this.getCategories()).always($.proxy(function(a1) {
            if (!a1) {
                console.error('GET was unsuccesfull');
                return;
            }

            this.loader.hide();

            $search_block = this.createSearchBlock(this.block_only, this.selected_lab);
            
            this.advanced_search = $('#advanced_search', $search_block);
            this.category_list = $('#Category-List', $search_block);
            this.element.append($search_block);

            if(this.block_only){
                return;
            }

            this.element.append('<p>&nbsp;</p>');
            this.element.append(this.resultContainer);
            this.element.append(this.filters);

            if (!$.isEmptyObject(this.parameters) && !window.location.hash.startsWith('#overlay=')) {
                var method = (!!this.parameters.type) ? this.parameters.type : this.parameters.method;
                if (method) {
                    $('#category_list_button', this.element).css('visibility', '');
                    $('#advanced_search_button', this.element).css('visibility', '');
                    
                    if (method === 'browse') {
                        this.searchByCategory(this.parameters.category, this.parameters.offset, true);
                    } else if (method === 'advanced') {
                        this.fillFieldsByStateAndSearch(this.parametersToFields(this.parameters), true, true);
                    }
                }
            }
        }, this));
    };

    PRESSSearch.prototype = {
        constructor: PRESSSearch,

        createSearchBlock: function($block_only_page, selected_lab){
            if(typeof $block_only_page === 'undefined'){
                $block_only_page = false;
            }

            var $search_block = $('<div id="press-search-block" style="display:flow-root"></div>');

            var $free_search = $('<div class="free-text-search-div col-sm-12 form-group">' +
                '<div class="col-sm-1"></div>' +
                '<div class="col-sm-10"><input id="free-text" class="form-control input-sm" ' +
                'type="text" placeholder="Enter text for free text search"></input></div>' +
                '<a id="searchByFields"  class="icon-search" ' +
                'style="font-size:30px; text-decoration:none; position:relative; top:-6px;"></a>&nbsp;' +
                '</div>');
            $search_block.append($free_search);
            $search_block.append($('<div class="advanced-search-div col-sm-6"><a id="advanced_search_button" data-toggle="collapse"' +
                ' href="#advanced_search">Advanced Search</a></div>'));
            if(!$block_only_page){
                $search_block.append($('<div class="browse-search-div col-sm-6"><a id="category_list_button" data-toggle="collapse"' +
                ' href="#Category-List" aria-expanded="true" aria-controls="Category-List"' +
                ' style="visibility:hidden; float:right">Browse By Category</a></div>'));
            }
            
            $('#free-text', $free_search).on('keypress', (function(e) {
                if (e.keyCode == 13){
                    if($block_only_page){
                        var fieldValues = this.getFieldValues();
                        window.location.assign(this.base_url + '/publication/search-pub' + this.createUrlQuery(fieldValues['stateObj']));
                    }else{
                        this.searchByFields();
                    }
                }
            }).bind(this));
            $('#searchByFields', $free_search).on('click', (function() {
                if($block_only_page){
                    var fieldValues = this.getFieldValues();
                    window.location.assign(this.base_url + '/publication/search-pub' + this.createUrlQuery(fieldValues['stateObj']));
                }else{
                    this.searchByFields();
                    $('#category_list_button', $search_block).css('visibility', '');
                    $('#advanced_search_button', $search_block).css('visibility', '');
                }
            }).bind(this));

            var field_container = $('<div class="col-sm-11" style="padding-right:0"></div>');
            field_container.append(this.getAuthorField());
            
            field_container.append(this.getOrgsField(this.orgs));

            if ($block_only_page && selected_lab && selected_lab !== '') {
                if(selected_lab in this.orgIDtoLocal){
                    $('#org-editable', field_container).append($('<li id="' + selected_lab + '"' +
                        ' class="extra-org-item org-item list-group-item" draggable="false" ' +
                        'style="float: left;" data-name="' + this.orgIDtoLocal[selected_lab] + '">' + this.orgIDtoLocal[selected_lab] + '<i class="js-remove">&nbsp;✖</i></li>'));
                    $('#org-editable', field_container).show();
                }
            }

            field_container.append(this.getYearField());
            field_container.append(this.getTagField());
            var categories = this.getCategoriesFields(this.category_tree);
            field_container.append(categories[0]);
            field_container.append(categories[1]);
            var last_line = $('<div class="form-group"></div>');
            last_line.append(this.getReviewedField().append($('<div class="col-sm-5"></div>').append(
                $('<button>', {
                    text: 'Search',
                    id: 'advanced_search_search_button',
                    class: 'btn btn-primary btn-sm advanced-search-btn',
                    click: (function() {
                        if($block_only_page){
                            var fieldValues = this.getFieldValues();
                            window.location.assign(this.base_url + '/publication/search-pub' + this.createUrlQuery(fieldValues['stateObj']));
                        }else{
                            this.searchByFields();
                            $('#category_list_button', $search_block).css('visibility', '');
                            $('#advanced_search_button', $search_block).css('visibility', '');
                        }
                    }).bind(this)
                }))
            .append(
                $('<button>', {
                    text: 'Clear Search',
                    id: 'searchClear',
                    type: 'button',
                    class: 'btn btn-default btn-sm advanced-search-btn',
                    click: (function(that) {
                        return function() {
                            that.clearSearchInput();
                            that.clearAdvancedSearch();
                        };
                    })(this)
                })
                ))
            );
            field_container.append(last_line);
            $advanced_search = $('<div id="advanced_search" class="collapse col-sm-12"></div>');
            $advanced_search.append(field_container);
            $search_block.append($advanced_search);
            if(!$block_only_page){
                $category_list = this.getCategoryList(this.category_tree, $search_block, true);
                $search_block.append($category_list);
            }
            
            var close_button = $('<h2 style="margin-top:0;float:left;"><button type="button" id="close_by_category" class="close custom-close"><span>&times;</span></button></h2>');
            close_button.on('click', (function(that) {
                return function() {
                    that.advanced_search.collapse('hide');
                    $('#category_list_button', $search_block).css('visibility', '');
                    $('#advanced_search_button', $search_block).css('visibility', '');
                };
            })(this));
            $advanced_search.append($('<div class="col-sm-1"></div>').append(close_button));

            if(!$block_only_page){
                $('#category_list_button', $search_block).on('click', function(that){
                    return function() {
                        $advanced_search.collapse('hide');
                        $('#advanced_search_button', $search_block).css('visibility', '');
                        $('#category_list_button', $search_block).css('visibility', 'hidden');
                    }
                }(this));
            }

            $('#advanced_search_button', $search_block).on('click', function(that) {
                return function() {
                    $category_list.collapse('hide');
                    $('#advanced_search_button', $search_block).css('visibility', 'hidden');
                    $('#category_list_button', $search_block).css('visibility', '');
                }
            }(this));

            
            

            return $search_block;
        },
        
        /**
         * 
         * 
         * @param  {Object} parameters
         * @return {Object} fields
         */
        parametersToFields: function(parameters) {
            var fields = {};
            //Single Value Fields
            console.log(parameters);
            if(!!parameters.type){
                fields.method = parameters.type;
            }else{
                fields.method = parameters.method;
            }
            fields.searchField = parameters.searchField;
            fields.yearFrom = parameters.yearFrom;
            fields.yearTo = parameters.yearTo;
            fields.category = parameters.category;
            fields.subcategory = parameters.subcategory;
            fields.offset = parameters.offset;
            if (parameters.reviewed && parameters.reviewed.toLowerCase() === 'true') {
                fields.reviewed = true;
            } else {
                fields.reviewed = false;
            }

            //Multiple Value Fields
            fields.tags = [];
            fields.orgs = [];
            fields.authors = [];
            $.each(parameters, (function(key, value) {
                if (key.startsWith('tags')) {
                    fields.tags.push(value);
                } else if (key.startsWith('orgs')) {
                    fields.orgs.push({
                        id: value,
                        name: this.orgIDtoLocal[value],
                    });
                } else if (key.startsWith('authors')) {
                    fields.authors.push(value);
                }
            }).bind(this));
            return fields;
        },
        
        /**
         * Gets categories from blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getCategories: function() {
            var base_url = this.base_url;
            return $.ajax({

                    dataType: 'json',
                    method: "GET",
                    url: base_url + '/ajax/publications/get_categories',
                    data: {
                        'counter': true
                    }
                })
                .done($.proxy(function(response) {
                    var category_tree = {};
                    var results = response.results.bindings;
                    category_labels = {};

                    function array_to_tree(array, father) {
                        var tree = {};
                        for (var i = 0; i < array.length; i++) {
                            if ('superclassid' in array[i] && array[i].superclassid.value === father) {
                                tree[array[i].lowid.value] = {};

                                if ('lowlabel' in array[i]) {
                                    category_labels[array[i].lowid.value] = array[i].lowlabel.value;
                                    tree[array[i].lowid.value].label = array[i].lowlabel.value;
                                }
                                if ('optgroup' in array[i]) {
                                    tree[array[i].lowid.value].optgroup = array[i].optgroup.value;
                                }
                                if ('pubCounter' in array[i]) {
                                    tree[array[i].lowid.value].pubCounter = array[i].pubCounter.value;
                                }
                                tree[array[i].lowid.value].children = array_to_tree(array, array[i].lowid.value);
                            }
                        }
                        return tree;
                    }
                    this.category_labels = category_labels;
                    category_tree = array_to_tree(results, 'Publication');
                    this.category_tree = category_tree;
                    return category_tree;
                }, this))
                .fail(function(response) {
                    alert('Oops! There was an error with getting Categories. See console for more info.');
                    console.error(response);
                });
        },

        /**
         * Creates a tag field using typeahead.js and sortable.js
         *
         * @param {object} response The blazegraph response containing the tags
         * @return {Object} A jQuery element object
         */
        getTagField: function() {
            $input = $('<input class="typeahead form-control input-sm press-field" ' +
                'id="tag-input" data-label="Tags" type="text" placeholder="Search..."/>');
            $ul = $('<ul id="tag-editable" class="list-group editable" style="display:none"></ul>');
            var $taggroup = $('<div id="tag-group" class="form-group"></div>');
            var $col_div = $('<div class="col-sm-10"></div>');
            $taggroup.append($('<label class="col-sm-2 control-label" for="tag-input">Tags:</label>'));
            $taggroup.append($col_div);
            $col_div.append($input);
            $col_div.append($ul);

            var base_url = this.base_url;
            var tagsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tag'),
                remote: {
                    url: base_url + '/ajax/publications/search_tag',
                    prepare: (function(prefix) {
                        return function(query, settings) {
                            var queries = query.split(' ');
                            settings.data = {
                                query: queries.toString(),
                            }
                            return settings;
                        }
                    })(this.prefix),
                    transform: function(response) {
                        if (typeof response !== 'object') return [];
                        var tr = [];
                        var results = response.results.bindings;
                        for (let i = 0; i < results.length; i++) {
                            tr[i] = {
                                tag: results[i].tag.value,
                            }
                        }
                        return tr;
                    }
                }
            });

            $input.typeahead({
                hint: false,
                highlight: true,
                minLength: 0
            }, {
                limit: 100,
                name: 'tags',
                source: tagsBlood,
                display: 'tag'
            });

            var sortable = Sortable.create($ul[0], {
                filter: '.js-remove',
                onFilter: function(evt) {
                    parent = evt.item.parentNode;
                    parent.removeChild(evt.item);

                    if (parent.children.length === 0) {
                        parent.style.display = "none";
                    }
                }
            });

            $input.bind('typeahead:select', function(ev, suggestion) {
                var $list = $('#tag-editable');
                var valid = true;
                $('.tag-item').each(function() {
                    if ($(this).attr('id') === suggestion.tag) {
                        return valid = false;
                    }
                });
                if (valid) {
                    var $li;
                    $li = $('<li id="' + suggestion.tag + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>');
                    $list.append($li);
                    $li.html(suggestion.tag);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                }
                $(this).typeahead('val', '');
            });
            return $taggroup;
        },
        /**
         * Creates an author/contributor field using typeahead.js and sortable.js
         * 
         * @return {Object} A jQuery element object
         */
        getAuthorField: function() { //Typeahead Field for searching Authors

            var $group = $('<div class="form-group" id="author-bloodhound"></div>');
            var $label = $('<label class="col-sm-2 control-label" for="author-input">Author:</label>');
            var $d = $('<div class="col-sm-10 scrollable-dropdown-menu"></div>');
            var tooltip = 'Each word has to be at least 3 characters long to search.';

            var $input = $('<input id="author-input" data-toggle="tooltip" data-placement="top" title="' + tooltip + '" class="typeahead form-control input-sm" type="text" placeholder="Search..."/>');
            $input.mouseover(function(e) { $(this).tooltip(); });
            $input.mouseover();

            $d.append($input);

            $group.append($label);
            $group.append($d);
            if (Object.keys(this.bloodhounds).length === 0) {
                for (var key in this.authorGroups) {
                    var groupKey = key;

                    this.bloodhounds[key] = new Bloodhound({
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('fullName'),
                        sufficient: 500,
                        remote: {
                            url: this.base_url + '/ajax/publications/search_author',
                            prepare: (function(groupKey, prefix) {
                                return function(query, settings) {
                                    var queries = query.split(' ');
                                    queries = queries.filter(function(value, index, arr){
                                        return value.length > 2;
                                    });

                                    settings.data = {
                                        terms: queries,
                                        groupKey: groupKey,
                                    }
                                    return settings;
                                };
                            })(key, this.prefix),
                            transform: (function(groupKey) {
                                return function(response) {
                                    if (typeof response !== 'object') return [];
                                    var tr = [];
                                    var results = response.results.bindings;
                                    for (var i = 0; i < results.length; i++) {
                                        tr[i] = {
                                            uuid: results[i].uuid.value,
                                            fullName: results[i].fullName.value,
                                            tokens: [results[i].familyName.value, results[i].givenName.value],
                                            group: groupKey
                                        };
                                        if ('mail' in results[i]) {
                                            tr[i].mail = results[i].mail.value;
                                        }
                                    }
                                    return tr;
                                };
                            })(key),
                            // cache: false    //NOTE: Sure about this?
                        }
                    });
                }
            }
            var datasets = [];
            var j = 0;
            for (var key in this.authorGroups) {

                datasets[j++] = {
                    source: this.bloodhounds[key],
                    name: key,
                    display: 'fullName',
                    templates: {
                        header: '<h4 class="author-category">' + this.authorGroups[key].label + '</h4>',
                        suggestion: function(data) {
                            var mail = '';
                            if ('mail' in data) {
                                mail = ' - ' + data.mail;
                            }
                            // return '<p><strong>' + data.fullName + '</strong></p>';
                            return '<p><strong>' + data.fullName + '</strong>' + mail + '</p>';
                        }
                    },
                    limit: 300

                };
            }
            var autocomplete = $input.typeahead({
                hint: false,
                highlight: false,
                minLength: 3
            }, datasets);

            var $ul = $('<ul id="author-editable" class="list-group editable" style="display:none"></ul>');
            $d.append($ul);

            var sortable = Sortable.create($ul[0], {
                filter: '.js-remove',
                group: 'contributors',
                onFilter: function(evt) {
                    parent = evt.item.parentNode;
                    parent.removeChild(evt.item);

                    if (parent.children.length === 0) {
                        parent.style.display = "none";
                    }
                },
                onRemove: function(evt) {
                    parent = evt.item.parentNode;
                    if (parent.children.length === 0) {
                        parent.style.display = "none";
                    }
                }
            });

            $input.bind('typeahead:select keypress', (function(that) {
                return function(ev, suggestion) {
                    if (ev.type === 'keypress' && ev.which != 13) {
                        return;
                    }

                    var valid = true;
                    $(ev.type !== 'keypress' && '.author-contributor-name').each(function() {
                        if ($(this).attr('data-uuid') === suggestion.uuid) {
                            valid = false;
                            return false;
                        }
                    });
                    if (valid) {
                        var $list = $('#author-editable');
                        var $li;
                        if (ev.type === 'typeahead:select') {
                            var mail = '';
                            if ('mail' in suggestion) {
                                mail = 'title="' + suggestion.mail + '"';
                            }
                            // $li = $('<li class="list-group-item" title="' + suggestion.mail + '" draggable="false" style="float:left"></li>');
                            $li = $('<li class="list-group-item" ' + mail + ' draggable="false" style="float:left"></li>');
                        }
                        $list.append($li);


                        if (ev.type === 'keypress') {
                            // $exAuthorsModal.modal();
                        } else {
                            var author_group = "";
                            for (key in that.authorGroups) {
                                if (suggestion.group === key && ('span' in that.authorGroups[key])) {
                                    author_group = that.authorGroups[key].span;
                                }
                            }

                            var mail = '';
                            if ('mail' in suggestion) {
                                mail = 'data-mail="' + suggestion.mail + '"';
                            }
                            $li.html(author_group + '<span class="author-contributor-name' +
                                ' contributor" data-uuid="' + suggestion.uuid + '" data-field="author" ' +
                                mail + ' data-group="'+suggestion.group+'">' + suggestion.fullName + '</span>');

                            $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                            $list.show();
                        }
                    }
                    $(this).typeahead('val', '');
                };
            })(this));

            return $group;
        },
        /**
         * Returns a number field for Year
         * 
         * @return {Object} A jQuery element object
         */
        getYearField: function() {
            return $('<div class="form-group"><div>' +
                '<label class="col-sm-2 control-label" for="year-from">Year From:</label>' +
                '<div class="col-sm-4"><input class="form-control input-sm" id="year-from" type="number"></input></div></div>' +
                '<div><label class="col-sm-2 control-label" for="year-to">Year To:</label>' +
                '<div class="col-sm-4"><input class="form-control input-sm" id="year-to" type="number"></input></div></div><div class="col-sm-1"></div>' +
                '</div>');
        },
        /**
         * Creates an organization field using typeahead.js and sortable.js
         * 
         * @return {Object} A jQuery element object
         */
        getOrgsField: function(organization) {
            $input = $('<input class="typeahead form-control input-sm" id="org-input" type="text" placeholder="Search..."/>');
            $ul = $('<ul id="org-editable" class="list-group editable" style="display:none"></ul>');
            var $orggroup = $('<div id="org-group" class="form-group"></div>');
            var $col_div = $('<div class="col-sm-10"></div>');
            $orggroup.append($('<label class="col-sm-2 control-label" for="org-input">' + organization.label + ':</label>'));
            $orggroup.append($col_div);
            $col_div.append($input);
            $col_div.append($ul);
            var label = organization.label;
            var org = organization.org;
            var orgKeys = Object.keys(org);
            var orgNames = Object.values(org);

            var dups = [];
            for(var i=0;i<orgKeys.length;i++){
                if(!dups.includes(orgKeys[i])){
                    for(var j=i+1;j<orgKeys.length;j++){
                        if(org[orgKeys[i]] === org[orgKeys[j]]){
                            if(!dups.includes(orgKeys[i])){
                                dups.push(orgKeys[i]);
                            }
                            if(!dups.includes(orgKeys[j])){
                                dups.push(orgKeys[j]);
                            }
                        }
                    }
                }
            }
            var local = [];
            var localToID = {};
            var idToLocal = {};
            for(var key in org){
                if(dups.includes(key)){
                    local.push(org[key] + ' - ' + key);
                    localToID[org[key] + ' - ' + key] = key;
                    idToLocal[key] = org[key] + ' - ' + key;
                }else{
                    local.push(org[key]);
                    localToID[org[key]] = key;
                    idToLocal[key] = org[key]
                }
            }
            this.orgLocalToID = localToID;
            this.orgIDtoLocal = idToLocal;
            var orgsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                local: local
            });

            function orgWithDefaults(q, sync) {
                if (q === '') {
                    sync(orgsBlood.index.all());
                } else {
                    orgsBlood.search(q, sync);
                }
            }

            $input.typeahead({
                highlight: true,
                hint: false,
                minLength: 0
            }, {
                limit: 100,
                name: 'org',
                source: orgWithDefaults
            });

            var sortable = Sortable.create($ul[0], {
                filter: '.js-remove',
                draggable: '.extra-org-item',
                onFilter: function(evt) {
                    parent = evt.item.parentNode;
                    parent.removeChild(evt.item);

                    if (parent.children.length === 0) {
                        parent.style.display = "none";
                    }
                }
            });

            $input.bind('typeahead:select', function(ev, suggestion) {
                var $list = $('#org-editable');
                var valid = true;
                $('.org-item').each(function() {
                    if ($(this).attr('id') === localToID[suggestion]) {
                        valid = false;
                        return false;
                    }
                });
                if (valid) {
                    var $li = $('<li id="' + localToID[suggestion] + '" data-name="'+suggestion+'" class="extra-org-item org-item list-group-item" draggable="false" style="float:left"></li>');
                    $list.append($li);
                    $li.html(suggestion);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                }
                $(this).blur();
                setTimeout(function() {
                    $('#org-input').typeahead('val', '');
                }, 10);
            });
            return $orggroup;
        },
        /**
         * Creates two select inputs for category and subcategory
         * 
         * @return {Array} An array of the two jQuery element objects
         */
        getCategoriesFields: function(category_tree) {
            this.cat = $('<select class="form-control input-sm" id="category"></select>');
            this.subcat = $('<select class="form-control input-sm" id="subcategory" disabled></select>');

            $catgroup = $('<div id="category-group" class="form-group"></div>');
            $col_div = $('<div class="col-sm-10"></div>');
            $catgroup.append($('<label class="col-sm-2 control-label" for="category">Category:</label>'));
            $catgroup.append($col_div);
            $col_div.append(this.cat);

            $subcatgroup = $('<div id="subcategory-group" class="form-group"></div>');
            $sub_col_div = $('<div class="col-sm-10"></div>');
            $subcatgroup.append($('<label class="col-sm-2 control-label" for="subcategory">Subcategory:</label>'));
            $subcatgroup.append($sub_col_div);
            $sub_col_div.append(this.subcat);

            this.cat.append($('<option value="">Select Category</option>'));
            this.subcat.append($('<option value="">Select Subcategory</option>'));
            for (var key in category_tree) {
                this.cat.append($('<option value="' + key + '">' + category_tree[key].label + '</option>'));
            }

            this.cat.change((function(subcat) { //TODO: Keep Old Fields
                subcat.empty();
                $('#form-fields').empty();
                if ($(this).val() === '') {
                    subcat.append($('<option value="">Select Subcategory</option>'));
                    subcat.prop('disabled', 'disabled');
                    return;
                }
                subcat.append($('<option value="">Select Subcategory</option>'));
                for (var key in category_tree[$(this).val()].children) {
                    if (category_tree[$(this).val()].children[key].optgroup) {
                        // var $opt = $('<optgroup id="' + key + '" label="' + category_tree[$(this).val()].children[key].label + '"></optgroup>');
                        var $opt = $('<optgroup label="' + category_tree[$(this).val()].children[key].label + '"></optgroup>');
                        subcat.append($opt);
                        for (var key2 in category_tree[$(this).val()].children[key].children) {
                            $opt.append($('<option value="' + key2 + '">' +
                                category_tree[$(this).val()].children[key].children[key2].label + '</option>'));
                        }
                    } else {
                        subcat.append($('<option value="' + key + '">' +
                            category_tree[$(this).val()].children[key].label + '</option>'));
                    }
                }
                subcat.prop('disabled', false);
            }).bind(this.cat, this.subcat));

            return [$catgroup, $subcatgroup];
        },
        /**
         * Creates a checkbox input for reviewed publications
         * 
         * @return {Object} A jQuery element object
         */
        getReviewedField: function() {
            var $div = $('<div class="form-group"></div>');
            $div.append('<label for="reviewed" class="col-sm-2 ' +
                'control-label">Peer Reviewed Only:</label><div class="col-sm-5">' +
                '<input class="checkbox" id="reviewed" type="checkbox" value="" style="width:18px; height: 18px;"></div>');

            return $div;
        },
        /**
         * Creates the browse by category list
         * 
         * @return {Object} A jQuery element object
         */
        getCategoryList: function(category_tree, $rootElement, $block_only_page) {
            if(typeof $block_only_page === 'undefined'){
                $block_only_page = false;
            }
            var container = $('<div class="col-md-1"></div>');

            var $listRoot = $('<div class="col-xs-12 col-sm-8" data-key="Publication"></div>');
            if($('div.main-container div.region.region-content').width() < 992 && window.innerWidth > 992){
                $listRoot.addClass('col-md-8');
            }else{
                $listRoot.addClass('col-md-6');
            }
            $listRoot.append($('<h2>Browse By Category <button type="button" id="close_by_category" class="close custom-close"><span>&times;</span></button></h2>'));
            $('#close_by_category', $listRoot).on('click', (function(that) {
                return function() {
                    that.category_list.collapse('hide');
                    $('#category_list_button', $rootElement).css('visibility', '');
                    $('#advanced_search_button', $rootElement).css('visibility', '');
                };
            })(this));

            function traverse_tree(tree, parent, depth) {
                for (var key in tree) {
                    if ('children' in tree[key] && Object.keys(tree[key].children).length !== 0) {
                        var badge = '<div class="col-xs-2 col-md-1"><h2 style="float:right">' + tree[key].pubCounter + '</h2></div>';
                        var $container = $('<div class="list-container col-xs-10 col-md-11" style="padding-top:30px; padding-right:0;"></div>');
                        var $next = $('<div class="row subcat-container collapse" id="' + key + '-collapse" data-key="' + key + '"></div>');

                        var colorCircle = '';
                        if (key in this.categoryColor)
                            colorCircle = '<span style="color:' + this.categoryColor[key] + '; font-size:135%;">&#9679;&nbsp;</span>';

                        var $category = $('<a id="' + key + '" data-parent="' + parent.attr('data-key') + '"' +
                            ' class="search-category" style="cursor:pointer;">' + tree[key].label + '</a>');

                        $container.append($(colorCircle));
                        $container.append($category);
                        $container.append($('<a href="#' + key + '-collapse" style="position:absolute; ' +
                            'right:0; top:20px; z-index:100" data-toggle="collapse" ' +
                            'class="collapse-btn btn btn-default icon-right-open"></a>'));
                        $container.append($next);
                        var $div = $('<div class="col-xs-12" style="padding-right:0"></div>');
                        $div.append(badge);
                        $div.append($container);

                        parent.append($div);
                        traverse_tree(tree[key].children, $next, depth + 1);
                    } else {
                        var category = '<a id="' + key + '" data-parent="' + parent.attr('data-key') + '" class="search-category" style="cursor:pointer;">' + tree[key].label + '</a>';
                        var badge = '<div class="col-xs-2 col-md-1"><h2 style="float:right">' + tree[key].pubCounter + '</h2></div>';
                        var $div = $('<div class="col-xs-12"></div>');
                        $div.append($(badge + '<div class="col-xs-10 col-md-11" style="padding-top:30px">' + category + '</div>'));
                        parent.append($div);

                    }
                }
            }

            traverse_tree(category_tree, $listRoot, 0);
            var $div = $('<div id="Category-List" class="row collapse in"></div>');
            $div.append(container);
            $div.append($listRoot);

            $listRoot.find('a.collapse-btn').on('click', function() {
                $(this)
                    .toggleClass('icon-right-open')
                    .toggleClass('icon-down-open');
            });

            $listRoot.find('a.search-category').on('click', (function(that) {
                return function() {
                    if($block_only_page){
                        window.location.assign(that.base_url + '/publication/search-pub?method=browse&category='+encodeURIComponent($(this).attr('id')));
                    }else{
                        // that.category_list.hide();
                        that.clearSearchInput();
                        that.clearAdvancedSearch();
                        $('#category_list_button', $rootElement).css('visibility', '');
                        $('#advanced_search_button', $rootElement).css('visibility', '');
                        that.searchByCategory($(this).attr('id'));
                    }
                };
            })(this));

            return $div;
        },
        getPredefinedAuthors: function(authoruuids){
            return $.ajax({
                datatype: 'text',
                method: 'GET',
                url: this.base_url + '/ajax/publications/get_author_info',
                data: {
                    authors: authoruuids
                },
            });
        },
        /**
         * Uses state of browser to implement back button & search with url params
         * @param  {Object} fields    The advanced search fields of the state
         * @param  {Object} filters   The selected filters of the state
         * @param  {boolean} fromPopState Passing variable to searchByFields
         * @return {[type]}           [description]
         */
        fillFieldsByStateAndSearch: function(fields, fromPopState, fromUrl) {
            this.clearSearchInput();
            this.clearAdvancedSearch();
            if (typeof fields !== 'object') {
                return;
            }
            console.log(fields);
            $('#free-text', this.element).val(fields.searchField);
            $('#year-from', this.element).val(fields.yearFrom);

            $('#year-to', this.element).val(fields.yearTo);

            if(fields.category !== ''){
                $('#category', this.element).val(fields.category);
                $('#category', this.element).change();
                if(fields.subcategory !== ''){
                    $('#subcategory', this.element).val(fields.subcategory);
                    $('#subcategory', this.element).change();
                }
            }
            $('#reviewed', this.element).prop('checked', fields.reviewed);

            if (fields.orgs && $.isArray(fields.orgs) && fields.orgs.length > 0) {
                for (var i = 0; i < fields.orgs.length; i++) {
                    $('#org-editable', this.element).append($('<li id="' + fields.orgs[i].id + '"' +
                        ' class="extra-org-item org-item list-group-item" draggable="false" ' +
                        'style="float: left;" data-name="' + fields.orgs[i].name + '">' + fields.orgs[i].name + '<i class="js-remove">&nbsp;✖</i></li>'));
                }
                $('#org-editable').show();
            }

            if (fields.tags && $.isArray(fields.tags) && fields.tags.length > 0) {
                for (var i = 0; i < fields.tags.length; i++) {
                    $('#tag-editable', this.element).append($('<li id="' + fields.tags[i] + '"' +
                        ' class="tag-item list-group-item" draggable="false" ' +
                        'style="float: left;">' + fields.tags[i] + '<i class="js-remove">&nbsp;✖</i></li>'));
                }
                $('#tag-editable').show();
            }

            if(fromUrl){
                if (fields.authors && $.isArray(fields.authors) && fields.authors.length > 0) {
                    $('#author-editable').show();
                    $.when(this.getPredefinedAuthors(fields.authors)).always($.proxy(function(response) {
                        results = response.results.bindings;
                        for (var i = 0; i < results.length; i++) {
                            var $li = $('<li class="list-group-item" draggable="false"' +
                                'style="float:left;"></li>');
                            var group = (this.authorGroups[results[i].group.value].span) ? this.authorGroups[results[i].group.value].span : '';
                            $li.append(group);
                            var $span = $('<span class="author-contributor-name contributor" ' +
                                'data-uuid="' + results[i].uuid.value + '" data-field="author" data-group="'+ results[i].group.value+'">' + results[i].fullName.value + '</span>');
                            if (results[i].mail) {
                                $li.attr('title', results[i].mail.value);
                                $span.attr('data-mail', results[i].mail.value);
                            }
                            $li.append($span);
                            $li.append($('<i class="js-remove">&nbsp;✖</i>'));
                            $('#author-editable').append($li);
                        }
                        this.searchByFields(fields.offset, fromPopState, fields);
                    }, this));
                } else {
                    $('#author-editable').hide();
                    this.searchByFields(fields.offset, fromPopState, fields);
                }
            }else{
                for(objKey in fields.authors){
                    $('#author-editable').show();
                    var $li = $('<li class="list-group-item" draggable="false"' +
                                'style="float:left;"></li>');
                    var group = (this.authorGroups[fields.authors[objKey].group].span) ? this.authorGroups[fields.authors[objKey].group].span : '';
                    $li.append(group);
                    var $span = $('<span class="author-contributor-name contributor" ' +
                        'data-uuid="' + fields.authors[objKey].uuid + '" data-field="author" data-group="'+ fields.authors[objKey].group+'">' + fields.authors[objKey].name + '</span>');
                    if (fields.authors[objKey].mail) {
                        $li.attr('title', fields.authors[objKey].group);
                        $span.attr('data-mail', fields.authors[objKey].group);
                    }
                    $li.append($span);
                    $li.append($('<i class="js-remove">&nbsp;✖</i>'));
                    $('#author-editable').append($li);
                }
                this.searchByFields(fields.offset, fromPopState, fields);
            }
            
        },
        
        createUrlQuery: function(stateObj){
            var search = '?';
            for (var key in stateObj) {
                if (key !== 'filters') {
                    if ((typeof stateObj[key] === 'string' || typeof stateObj[key] === 'boolean') && stateObj[key] !== '') {
                        search += key + '=' + encodeURIComponent(stateObj[key]) + '&';
                    } else {
                        if(key === 'tags'){
                            for (var j = 0; j < stateObj[key].length; j++) {
                                if (stateObj[key][j] !== '')
                                    search += key + j + '=' + encodeURIComponent(stateObj[key][j]) + '&';
                            }
                        }else if (key === 'authors'){
                            var j = 0;
                            for (var objKey in stateObj[key]) {
                                if(typeof stateObj[key][objKey] === 'object'){
                                    search += key + j + '=' + encodeURIComponent(stateObj[key][objKey].uuid) + '&';
                                    j++;
                                }
                            }
                        }else if (key === 'orgs'){
                            var j = 0;
                            for (var objKey in stateObj[key]) {
                                if(typeof stateObj[key][objKey] === 'object'){
                                    search += key + j + '=' + encodeURIComponent(stateObj[key][objKey].id) + '&';
                                    j++;
                                }
                            }
                        }
                    }
                } else {
                    // for (var filterKey in stateObj.filters) {
                    //     var index = 0;
                    //     for (var filterVal in stateObj.filters[filterKey]) {
                    //         if (filterVal !== 'filterIntro')
                    //             search += 'filter' + filterKey + index++ + '=' + encodeURIComponent(filterVal) + '&';
                    //     }
                    // }
                }
            }
            search = search.substring(0, search.length - 1);

            return search;
        },

        getFieldValues: function(){
            var values = {};

            values['searchField'] = $('#free-text', this.element).val();
            values['yearFrom'] = $('#year-from', this.element).val();
            values['yearTo'] = $('#year-to', this.element).val();
            values['category'] = $('#category', this.element).val();
            values['subcategory'] = $('#subcategory', this.element).val();
            values['reviewed'] = $('#reviewed', this.element).is(':checked');
            values['method'] = 'advanced';
            var tagIds = [];

            $('.tag-item').each(function(){
                tagIds.push($(this).attr('id'));
            });

            values['tags'] = tagIds;
            
            var authorInfo = {};
            var authorIds = [];
            $('.author-contributor-name').each(function(){
                var id = $(this).attr('data-uuid');
                var name = $(this).text();
                authorIds.push(id);
                authorInfo[id] = {
                    uuid: id,
                    name: name,
                    group: $(this).attr('data-group'),
                    mail: $(this).attr('data-mail'),
                }
            });
            
            var orgIds = [];
            var orgInfo = {};
            $('#org-editable li').each(function(){
                var name = $(this).attr('data-name');
                var id = $(this).attr('id');
                orgIds.push(id);
                orgInfo[id] = {
                    id: id,
                    name: name,
                }
            });

            return_obj = {
                'stateObj': values,
                'searchOptions': $.extend(true, {}, values),
            }

            return_obj.stateObj['authors'] = authorInfo;
            return_obj.searchOptions['authors'] = authorIds;

            return_obj.stateObj['orgs'] = orgInfo;
            return_obj.searchOptions['orgs'] = orgIds;

            return return_obj;
        },

        createSearchLabel: function(options){
            var searchLabel = '';

            if (options['searchField'] !== '')
                searchLabel += '"' + options['searchField'] + '"';
            
            var i;
            if(Object.keys(options['authors']).length > 0){
                if (searchLabel !== '')
                    searchLabel += ', ';
                if(Object.keys(options['authors']).length === 1){
                    searchLabel += 'Author: ';
                } else {
                    searchLabel += 'Authors: ';
                }
                i=0
                for (var key in options['authors']) {
                    if(i++ > 0){
                        searchLabel += ', ';
                    }
                    searchLabel += options['authors'][key].name;
                }
            }

            if(Object.keys(options['orgs']).length > 0){
                if (searchLabel !== '')
                    searchLabel += ', ';
                if(Object.keys(options['orgs']).length === 1){
                    searchLabel += 'Lab: ';
                } else {
                    searchLabel += 'Labs: ';
                }
                i=0;
                for (var key in options['orgs']) {
                    if(i > 0){
                        searchLabel += ', ';
                    }
                    searchLabel += options['orgs'][key].name;
                }
            }

            if(options['tags'].length > 0){
                if (searchLabel !== '')
                    searchLabel += ', ';
                if(options['orgs'].length === 1){
                    searchLabel += 'Tag: ';
                } else {
                    searchLabel += 'Tags: ';
                }
                i=0
                for (var key in options['tags']) {
                    if(i++ > 0){
                        searchLabel += ', ';
                    }
                    searchLabel += options['tags'][key];
                }
            }

            if (options['yearFrom'] !== '' || options['yearTo'] !== '') {
                if (searchLabel !== '')
                    searchLabel += ', ';

                searchLabel += 'Year: ';
                var sameYear = false;
                var yearRange = '';
                var toRange = '';
                var fromRange = '';
                if (options['yearFrom'] !== '' && options['yearTo'] !== '') {
                    yearRange = ' - ';
                    if (options['yearFrom'] === options['yearTo']) {
                        searchLabel += options['yearFrom'];
                        sameYear = true;
                    }
                } else {
                    if (options['yearFrom'] !== '') {
                        fromRange = ' &gt; ';
                    }
                    if (options['yearTo'] !== '') {
                        toRange = ' &lt; ';
                    }
                }
                if (options['yearFrom'] !== '') {
                    if (!sameYear) {
                        searchLabel += fromRange + options['yearFrom'];
                    }
                }

                if (options['yearTo'] !== '') {
                    if (!sameYear) {
                        searchLabel += toRange + yearRange + options['yearTo'];
                    }
                }
            }

            
            if (options['category'] === '' && options['reviewed']) {
                if (searchLabel !== '')
                    searchLabel += ', ';

                searchLabel += ' Peer Reviewed Only';
            } else if (options['category'] !== '') {
                if (searchLabel !== '')
                    searchLabel += ', ';
                if (!options['reviewed']) {
                    if (options['subcategory'] !== '') {
                        searchLabel += this.category_labels[options['subcategory']];
                    } else {
                        searchLabel += this.category_labels[options['category']];
                    }
                } else {
                    if (options['subcategory'] !== '') {
                        searchLabel += this.category_labels[options['subcategory']] + ', Peer Reviewed Only';
                    } else {
                        searchLabel += this.category_labels[options['category']] + ', Peer Reviewed Only';
                    }
                }
            }

            return searchLabel;
        },
        /**
         * Does the search by text & advanced search fields
         * @param  {number} offset    The offset of the search
         * @param  {Object} filters   The enabled filters
         * @param  {boolean} fromPopState If the search is performed by a pop state (back, forward button)
         * @param  {Object} stateObj  The state object
         */
        searchByFields: function(offset, fromPopState, stateObj) {
            //Getting the available fields
            if (this.currentSearchMode !== 'advanced') {
                this.clearFilters();
            }
            this.currentSearchMode = 'advanced';

            if (typeof fromPopState === 'undefined') {
                fromPopState = false;
            }

            // Clear the results
            this.resultContainer.find('*').not('#results').empty();

            var searchLabel = '';
            this.category_list.collapse("hide");
            this.advanced_search.collapse('hide');
            this.loader.show();


            if (typeof offset === 'undefined') {
                offset = 0;
            }

            
            // Return if every field is emepty
            // if (searchField === '' && yearFrom === '' && yearTo === '' && category === '' &&
            //     subcategory === '' && reviewed === false && orgs.length === 0 &&
            //     tags.length === 0 && authors.length === 0) {
            //     return;
            // }
            
            var fieldValues = this.getFieldValues()
            
            var searchLabel = this.createSearchLabel(fieldValues['stateObj']);
            this.lastSearchLabel = searchLabel;


            //Create new state for history
            if (!fromPopState) {
                var urlQuery = this.createUrlQuery(fieldValues['stateObj']);
                window.history.pushState(fieldValues['stateObj'], "", window.location.origin + window.location.pathname + urlQuery);
            }

            // console.log(field);
            // console.log(yearFrom);
            // console.log(yearTo);
            // console.log(category);
            // console.log(subcategory);
            // console.log(reviewed);

            var searchOptions = fieldValues['searchOptions'];
            searchOptions['filters'] = this.getFiltersValues(this.filters);

            $.ajax({
                datatype: 'text',
                method: 'GET',
                url: this.base_url + '/ajax/publications/search_publications',
                data: searchOptions,
            }).done(function(that){
                return function(response){
                    response = JSON.parse(response);

                    that.insertSearchResults(response, searchLabel);
                    that.resultContainer.append(that.getPagination(searchOptions, response.count, 0, searchLabel, stateObj));
                }
            }(this)).fail(function(response){
                console.error(response);
            })
            var filterSearchOptions = $.extend(true, {}, searchOptions);

            filterSearchOptions['filter_keys'] = 'all';
            filterSearchOptions['limit'] = 15;
            filterSearchOptions['offset'] = 0

            $.when(this.getFilters(filterSearchOptions, 15, offset)).done((function(response){
                this.insertFilters(JSON.parse(response), filterSearchOptions);
            }).bind(this))
            .fail(function(respone){
                console.error(response);
            });
        },
        
        /**
         * Does the search by category
         * @param  {string} category_id  The category ID
         * @param  {number} offset       The offset of the searc
         * @param  {Object} filterValues The enabled filters
         * @param  {boolean} fromPopState    If the search is performed by a pop state (back, forward button)
         */
        searchByCategory: function(category_id, offset, fromPopState) {
            if (this.currentSearchMode !== 'browse') {
                this.clearFilters();
            }
            this.currentSearchMode = 'browse';


            if (typeof category_id === 'undefined') {
                category_id = window.history.state.category;
            }

            if (typeof offset === 'undefined') {
                offset = 0;
            }

            if (typeof fromPopState === 'undefined') {
                fromPopState = false;
            }

            // var selectedFilters;


            this.resultContainer.find('*').not('#results').empty();
            var $element = $('#' + category_id, this.element);

            //Set state for history
            stateObj = { method: 'browse', category: category_id, offset: offset};
            var search = '?';
            for (var key in stateObj) {
                if (key !== 'filters') {
                    search += key + '=' + encodeURIComponent(stateObj[key]) + '&';
                } else {
                    // for (var filterKey in stateObj.filters) {
                    //     var index = 0;
                    //     for (var filterVal in stateObj.filters[filterKey]) {
                    //         if (filterVal !== 'filterIntro')
                    //             search += 'filter' + filterKey + index++ + '=' + encodeURIComponent(filterVal) + '&';
                    //     }
                    // }
                }
            }
            search = search.substring(0, search.length - 1);
            if (!fromPopState) {
                window.history.pushState(stateObj, "", window.location.origin + window.location.pathname + search);
            }else{
                window.history.replaceState(stateObj, "", window.location.origin + window.location.pathname + search);
            }

            this.category_list.collapse("hide");
            
            this.loader.show();
            var searchLabel = 'for ' + this.category_labels[category_id] + ' Category';
            this.lastSearchLabel = searchLabel;

            var searchOptions = {
                category: category_id,
                offset: offset,
                method: 'browse',
                filters: this.getFiltersValues(this.filters),
            };
            $.ajax({
                datatype: 'text',
                method: 'GET',
                url: this.base_url + '/ajax/publications/search_publications',
                data: searchOptions,
            }).done(function(that){
                return function(response){
                    response = JSON.parse(response);

                    that.insertSearchResults(response, searchLabel);
                    that.resultContainer.append(that.getPagination(searchOptions, response.count, offset, searchLabel, stateObj));
                }
            }(this)).fail(function(response){
                console.error(response);
            })
            var filterSearchOptions = {
                category: category_id,
                method: 'browse',
                filters: this.getFiltersValues(this.filters),
                filter_keys: 'all',
                limit: 15,
                offset: 0
            };
            $.when(this.getFilters(filterSearchOptions, 15, offset)).done((function(response){
                this.insertFilters(JSON.parse(response), filterSearchOptions);
            }).bind(this))
            .fail(function(respone){
                console.error(response);
            });
            
        },
        
        getPagination: function(options, count, offset, searchLabel, stateObj){
            var $pagination = $('<ul class="pagination"></ul>');
            var pages = Math.ceil(count / 10);
            var firstPageClick = true;
            if(count === 0){
                return;
            }
            $pagination.twbsPagination({
                totalPages: pages,
                startPage: Math.ceil(offset / 10) + 1,
                visiblePages: 7,
                onPageClick: (function(that) {
                    return function(event, page){
                        if (firstPageClick){
                            firstPageClick = false;
                            return;
                        }
                        that.results.empty();
                        $('html,body').animate({scrollTop:0}, 'fast');
                        that.loader.show();
                        options['limit'] = 10;
                        options['offset'] = (page-1)*10;
                        $.ajax({
                            datatype: 'text',
                            method: 'GET',
                            url: that.base_url + '/ajax/publications/search_publications',
                            data: options,
                        }).done((function(response){
                            this.insertSearchResults(JSON.parse(response), searchLabel);
                            stateObj.offset = (page - 1) * 10;
                            // var search = '?';
                            // for (var key in stateObj){

                            // }
                        }).bind(that));
                    }
                })(this),
            });

            return $pagination;
        },

        /**
         * Gets the sparql triples of the selected filters
         * @param  {Object} $elements A jQuery element object with the filter elements
         * @return {Object}           An object with the filter values
         */
        getFiltersValues: function($elements) {
            var values = {};
            $('.search-filter-year[data-selected="selected"]', $elements).each(function() {
                values['year'] = $(this).attr('data-oVal');
            });

            $('.search-filter-category[data-selected="selected"]', $elements).each(function() {
                values['category'] = $(this).attr('data-oVal');
            });

            values['tag'] = [];
            $('.search-filter-tag[data-selected="selected"]', $elements).each(function() {
                values['tag'].push($(this).attr('data-oVal'));
            });

            //TODO: CHANGE FOR MULTIPLE ORGS
            values['org'] = [];
            $('.search-filter-org[data-selected="selected"]', $elements).each(function() {
                values['org'].push($(this).attr('data-oVal'));
            });

            values['project'] = [];

            $('.search-filter-project[data-selected="selected"]', $elements).each(function(index){
                values['project'].push($(this).attr('data-oVal'));
            });
            values['contributor'] = [];
            $('.search-filter-contributor[data-selected="selected"]', $elements).each(function(index) { //NOTE: PRESS V3
                values['contributor'].push($(this).attr('data-oVal'));
            });

            // if ($('.search-filter-contributor[data-selected="selected"]', $elements).length > 0)
            //     values.contributors.filterIntro = '?filtercon rdfs:subPropertyOf* press:contributorType. \n';

            return values;
        },

        getFilters: function(options, limit, offset){
            // if(options['limit'] === undefined){
            //     if(limit === undefined){
            //         options['limit'] = 15;
            //     }else{
            //         options['limit'] = limit;
            //     }
            // }
            // if(options['offset'] === undefined){
            //     if(offset === undefined){
            //         options['offset'] = 15;
            //     }else{
            //         options['offset'] = offset;
            //     }
            // }
            return $.ajax({
                datatype: 'text',
                method: 'GET',
                url: this.base_url + '/ajax/publications/get_filters',
                data: options
            });
        },
        
        /**
         * Clears the search input
         */
        clearSearchInput: function() {
            $('#free-text', this.element).val('');
        },

        /**
         * Clears all the input fields of the advanced search
         */
        clearAdvancedSearch: function() {
            $('input', this.advanced_search).val('');
            $('select', this.advanced_search).val('');
            $('#subcategory', this.advanced_search).attr('disabled', true);
            $('input[type="checkbox"]').prop('checked', false);
            $('.editable', this.advanced_search).empty();
            $('.editable', this.advanced_search).hide();
        },

        /**
         * Removes the selected filters
         */
        clearFilters: function() {
            $('.search-filter[data-selected="selected"]', this.filters).removeAttr('data-selected');
        },
        
        /**
         * Inserts the search results based on the responses from Blazegraph
         * 
         * @param  {Object} searchResults
         * @param  {string} searchLabel
         */
        insertSearchResults: function(searchResults, searchLabel){
            this.results.empty();
            if(searchResults.count === 0){
                this.loader.hide();
                this.results.append('<h3 class="col-sm-12">No Results</h3>');
                this.results.append('<h4 class="col-xs-12">' + searchLabel + '</h4>');
                return;
            }else if(searchResults.count === 1){
                this.results.append('<h3 class="col-sm-12">1 Result</h3>');
            }else{
                this.results.append('<h3 class="col-sm-12">'+searchResults.count+' Results</h3>');
            }

            this.results.append('<h4 class="col-xs-12">'+searchLabel+'</h4><p>&nbsp;</p>');
            var $container = $('<div></div>');
            var current_pub = {};
            for(var i=0; i < searchResults.results.length; i++){
                current_pub = searchResults.results[i];

                var title = '';
                var titleField = this.titleFields[this.categoryAncestors[current_pub['typeID']]][current_pub['typeID']];
            

                if(current_pub[titleField]){
                    title = current_pub[titleField];
                }

                if(!title || title === ''){
                    if('englishTitle' in current_pub){
                        title = current_pub.englishTitle;
                    }else if('bookTitle' in current_pub){
                        title = current_pub.bookTitle;
                    }
                }

                var info_color = this.categoryColor[this.categoryAncestors[current_pub.typeID]];

                var $row = $('<div class="row"></div>');
                var $icons = $('<div class="col-sm-2" style="padding-top:8px"></div>');

                var $download_icon = $('<a target="_blank" class="result-icons" data-toggle="tooltip" ' +
                    'data-placement="top" data-container="body" title="Download the PDF of ' +
                    'this Publication" style="color:inherit; visibility:hidden">' +
                    '<i class="icon-download" style="font-size:17px;"></i></a>');
                if ('localLink' in current_pub && !this.current_user.anonymous) {
                    $download_icon.attr('href', this.base_url + current_pub.localLink);
                    $download_icon.mouseover(function(e) { $(this).tooltip(); });
                    $download_icon.mouseover();
                    // if (){

                    // $icons.append($download_icon);
                    // }
                    $download_icon.css('visibility', 'visible');
                }
                $icons.append($download_icon);

                var $info_icon = $('<a  class="result-icons" data-toggle="tooltip" ' +
                    'data-placement="top" data-container="body" title="' +
                    this.category_labels[current_pub.typeID] + '" style="color:inherit">' +
                    '<i class="icon-info-circled" style="font-size:17px;display:block;' +
                    'color:' + info_color + '"></i></a>');
                var $edit_icon = $('<a href="' + this.base_url + '/publication/edit?uuid=' +
                    encodeURIComponent(current_pub.pub) + '&category=' +
                    encodeURIComponent(current_pub.typeID) + '" target="_blank" ' +
                    'class="result-icons" style="color:inherit"><i class="icon-edit" ' +
                    'style="font-size:17px;font-weight:bold;"></i></a>');
                var $share_icon = $('<a  class="result-icons share-btn" style="visibility:hidden"><i class="icon-share" style="font-size:17px;"></i></a>');
                var $share_icon_div = this.createShareButton('', title + ' | PRESS Publication System');
                $share_icon_div.prepend($share_icon);
                if ('publicationUrl' in current_pub) {
                    var $share_icon_div = this.createShareButton(this.base_url + '/' + current_pub.publicationUrl, title + ' | PRESS Publication System');
                    $share_icon_div.prepend($share_icon);
                    $share_icon.css('visibility', 'visible');
                }
                var externalLink = '';
                if ('externalLink' in current_pub) {
                    $info_icon.attr('href', current_pub.externalLink);
                    $info_icon.attr('target', 'target="_blank"');
                }

                $icons.append($share_icon_div);
                $info_icon.mouseover(function(e) { $(this).tooltip(); });
                $info_icon.mouseover();

                $icons.append($info_icon);

                var addEdit = false;

                var pub_orgs = [];
                if(current_pub.org){
                    for(var j =0; j < current_pub.org.length; j++){
                        pub_orgs.push(current_pub.org[j].org);
                    }
                }
                if ($.inArray('administrator', this.current_user.roles) > -1 || 
                    (!this.current_user.anonymous && 
                        $.inArray('Publication Mod Power User', this.current_user.roles) > -1 &&
                        $.inArray('http://www.ics.forth.gr/Press#Organization/' + this.current_user['lab'], pub_orgs) > -1)
                    ) {
                    addEdit = true;
                }

                var $pub_info = $('<div class="col-sm-10"></div>');

                var url = '';
                var imported_pub_prefix = this.prefix + 'publication/';
                if(current_pub.pub.startsWith('urn:uuid')){
                    url = current_pub.pub;
                }else if(current_pub.pub.startsWith(this.prefix + 'publication/')){
                    url = current_pub.pub.substring(imported_pub_prefix.length);
                }
                if (url !== ''){
                    $pub_info.append($('<a href="' + this.base_url +'/pub/'+ url + '" target="_blank"><h4><strong>' + title + '</strong></h4></a>'));
                }
                // if('publicationUrl' in current_pub){
                //     $pub_info.append($('<a href="' + this.base_url +'/'+ current_pub.publicationUrl + '" target="_blank"><h4><strong>' + title + '</strong></h4></a>'));
                // }else{
                //     $pub_info.append($('<h4><strong>' + title + '</strong></h4>'));
                // }

                var firstCon = true;

                for (var j = 0; j < this.contributorOrder[current_pub.typeID].length; j++){
                    var current_contributor_type = this.contributorOrder[current_pub.typeID][j];
                    if(current_contributor_type in current_pub.contributors){
                        var length = current_pub.contributors[current_contributor_type].length;
                        keys = Object.keys(current_pub.contributors[current_contributor_type]).sort();
                        for(var conIndex = 0; conIndex < keys.length; conIndex++){
                            var current_contributor = current_pub.contributors[current_contributor_type][keys[conIndex]];
                            if(addEdit === false && !this.current_user.anonymous){
                                if(this.current_user.uuid === current_contributor.person){
                                    addEdit = true;
                                }
                            }

                            var givenName = '';
                            if('givenName' in current_contributor){
                                givenName = current_contributor['givenName'];
                            }
                            var fullName = givenName + ' ' + current_contributor['familyName'];
                            var $author_link = $('<a  data-uuid="' + current_contributor['person'] + '">' + fullName + '</a>');
                            $author_link.click((function(that) {
                                return function() {
                                    that.clearSearchInput();
                                    that.clearAdvancedSearch();
                                    $('#author-editable', that.advanced_search).
                                    append('<li class="list-group-item" draggable="false" ' +
                                        'style="float:left"><span class="author-contributor-name ' +
                                        'contributor" data-uuid="' + $(this).attr('data-uuid') + '" ' +
                                        'data-field="author">' + $(this).text() + '</span><i class="js-remove">&nbsp;✖</i></li>');
                                    $('#author-editable', that.advanced_search).show();
                                    that.searchByFields();
                                    // that.clearAdvancedSearch(); //TODO: Check for workaround
                                };
                            })(this));
                            if(!firstCon){
                                $pub_info.append(', ');
                            }
                            $pub_info.append($author_link);
                            firstCon = false;
                        }
                    }
                }
                if (addEdit){
                    $icons.append($edit_icon);
                }

                $pub_info.append("<br/>");
                $pub_info.append(current_pub.year);

                if('tag' in current_pub){
                    var $tagDiv = $('<div class="col-xs-12 pub-tags">Tags: </div>');
                    var $tagsMore = $('<div class="results-more-tags"></div>').hide();
                    for (var tagIndex = 0; tagIndex < current_pub.tag.length; tagIndex++) {
                        var $span = $('<span class="pub-tag-item">' + current_pub.tag[tagIndex] + '</span>');
                        $span.click((function(that) {
                            return function() {
                                that.clearSearchInput();
                                that.clearAdvancedSearch();
                                $('#tag-editable', that.advanced_search).append($('<li id="' + $(this).text() + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>'));
                                that.searchByFields();
                                that.clearAdvancedSearch();
                            };
                        })(this));
                        if(tagIndex<5){
                            $tagDiv.append($span);
                        }else{
                            $tagsMore.append($span);
                        }
                    }

                    $tagDiv.append($tagsMore);
                    $resultsShowMoreTags = $('<a class="results-show-more-tags">More</a>');
                    $resultsShowMoreTags.click(function(){
                        $(this).prev('.results-more-tags').toggle();
                        if($(this).text() === 'Less'){
                            $(this).text('More');
                        }else{
                            $(this).text('Less');
                        }
                    })
                    $tagDiv.append($resultsShowMoreTags);
                    $pub_info.append($tagDiv);
                }
                $row.append($icons);
                $row.append($pub_info);
                $container.append($row);
                $container.append('<br>');
            }

            this.results.append($container);
            this.loader.hide();
        },

        /**
         * Creates and inserts the filter column containing the filtering functionality
         * for the publication search
         * 
         * @param  {Object} results   The response from Blazegraph for the fields used
         * @param  {Object} searchOptions The current search options/fields
         */
        insertFilters: function(results, searchOptions){
            this.filters.empty();
            this.filters.append('<h3>FILTERS</h3><hr/>');
            this.filterLoader.hide();
            this.filters.append(this.filterLoader);
            var filterLoader = this.filterLoader;

            function onFilterClick(that) {
                return function() {
                    that.filterLoader.show();
                    if ($(this).attr('data-selected') === 'selected') {
                        $(this).removeAttr('data-selected');
                        $(this).siblings().show();
                    } else {
                        $(this).attr('data-selected', 'selected');
                    }

                    if (that.currentSearchMode === 'browse') {
                        that.searchByCategory();
                    } else if (that.currentSearchMode === 'advanced') {
                        that.searchByFields();
                    }
                };
            }

            var filter_order = ['contributor', 'tag', 'year', 'category', 'org', 'project'];
            for(var i =0; i<filter_order.length; i++){
                var key = filter_order[i];

                switch (key) {
                    case 'contributor':
                        this.filters.append('<h4 class="col-xs-12">Authors</h4>');
                        var contributorsDiv = $('<div class="col-xs-12"></div>');

                        function insertContributors(contributors, div){
                            var $contributorsMore = div.find("#show-more-contributors");
                            for(var i = 0; i < contributors.length; i++){
                                var contributorDiv = $('<div class="search-filter search-filter-contributor" '+
                                    'data-oVal="<'+contributors[i].contributoruuid+'>"></div>');
                                var name = '';
                                if('contributorgivenName' in contributors[i]){
                                    name = contributors[i].contributorgivenName + ' ';
                                }
                                name += contributors[i].contributorfamilyName;
                                var contributor = $('<a class="col-xs-12" style="display:block">'+
                                    name+' <i style="color:grey">['+contributors[i].pubcount+']</i></a>');
                                contributorDiv.append(contributor);
                                if($contributorsMore.length > 0){
                                    $contributorsMore.before(contributorDiv);
                                }else{
                                    div.append(contributorDiv);
                                }

                                if('filters' in searchOptions && 'contributor' in searchOptions['filters']){
                                    if(searchOptions.filters.contributor.indexOf(contributorDiv.attr('data-oVal')) > -1){
                                        contributorDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['contributor'].length === 15){
                            var $contributorsShowMore = $('<a id="show-more-contributors" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                            contributorsDiv.append($contributorsShowMore);
                            $contributorsShowMore.click(function(that, searchOptions){
                                return function(){
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'contributor';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options, 15, $this.attr('data-offset'))).done(function(response){
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertContributors(response['contributor'], contributorsDiv);
                                        if(response['contributor'].length < 15){
                                            contributorsDiv.find('#show-more-contributors').remove();
                                        }
                                        contributorsDiv.find('.search-filter').off('click');
                                        contributorsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    })
                                }
                            }(this, searchOptions));
                        }

                        insertContributors(results['contributor'], contributorsDiv);
                        this.filters.append(contributorsDiv);
                        break;
                    case 'tag':
                        this.filters.append('<h4 class="col-xs-12">Tags</h4>');
                        var tagsDiv = $('<div class="col-xs-12"></div>');
                        
                        function insertTags(tags, div) {
                            var $tagsMore = div.find('#filters-show-more-tags');
                            for (var i=0; i<tags.length; i++){
                                var tagDiv = $('<div class="search-filter search-filter-tag" ' +
                                    'data-oVal="' + tags[i].tag + '"></div>');
                                var tag = $('<a  class="col-xs-12" style="display:block">' + tags[i].tag + ' <i style="color:grey">[' + tags[i].Tagcount + ']</i></a>');
                                tagDiv.append(tag);
                                if ($tagsMore.length > 0) {
                                    $tagsMore.before(tagDiv);
                                } else {
                                    div.append(tagDiv);
                                }

                                if('filters' in searchOptions && 'tag' in searchOptions['filters']){
                                    if(searchOptions.filters.tag.indexOf(tagDiv.attr('data-oVal')) > -1){
                                        tagDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['tag'].length === 15){
                            var tagsShowMore = $('<a id="filters-show-more-tags" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                            tagsDiv.append(tagsShowMore);
                            tagsShowMore.click(function(that) {
                                return function() {
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'tag';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options)).done(function(response) {
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertTags(response['tag'], tagsDiv);
                                        if (response.tag.length < 15) {
                                            tagsDiv.find('#filters-show-more-tags').remove();
                                        }
                                        tagsDiv.find('.search-filter').off('click');
                                        tagsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    });
                                }
                            }(this));
                        }

                        insertTags(results['tag'], tagsDiv);
                        this.filters.append(tagsDiv);
                        break;
                    case 'year':
                        this.filters.append('<h4 class="col-xs-12">Year</h4>');
                        var yearsDiv = $('<div class="col-xs-12"></div>');
                        
                        function insertYears(years, div) {
                            var $yearsMore = div.find('#filters-show-more-years');
                            for (var i=0; i<years.length; i++){
                                var yearDiv = $('<div class="search-filter search-filter-year" ' +
                                    'data-oVal="' + years[i].year + '"></div>');
                                var year = $('<a  class="col-xs-12" style="display:block">' + years[i].year + ' <i style="color:grey">[' + years[i].pubcount + ']</i></a>');
                                yearDiv.append(year);
                                if ($yearsMore.length > 0) {
                                    $yearsMore.before(yearDiv);
                                } else {
                                    div.append(yearDiv);
                                }

                                if('filters' in searchOptions && 'year' in searchOptions['filters']){
                                    if(searchOptions.filters.year.indexOf(yearDiv.attr('data-oVal')) > -1){
                                        yearDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['year'].length === 15){
                            var yearsShowMore = $('<a id="filters-show-more-years" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                            yearsDiv.append(yearsShowMore);
                            yearsShowMore.click(function(that) {
                                return function() {
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'year';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options)).done(function(response) {
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertYears(response['year'], yearsDiv);
                                        if (response.year.length < 15) {
                                            yearsDiv.find('#filters-show-more-years').remove();
                                        }
                                        yearsDiv.find('.search-filter').off('click');
                                        yearsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    });
                                }
                            }(this));
                        }

                        insertYears(results['year'], yearsDiv);
                        this.filters.append(yearsDiv);
                        break;
                    case 'category':
                        this.filters.append('<h4 class="col-xs-12">Category</h4>');
                        var categoriesDiv = $('<div class="col-xs-12"></div>');
                        
                        function insertCategories(categories, div) {
                            var $categoriesMore = div.find('#filters-show-more-categories');
                            for (var i=0; i<categories.length; i++){
                                var categoryDiv = $('<div class="search-filter search-filter-category" ' +
                                    'data-oVal="<' + categories[i].type + '>"></div>');
                                var category = $('<a  class="col-xs-12" style="display:block">' + this.category_labels[categories[i].type.split('#')[1]] + ' <i style="color:grey">[' + categories[i].pubcount + ']</i></a>');
                                categoryDiv.append(category);
                                if ($categoriesMore.length > 0) {
                                    $categoriesMore.before(categoryDiv);
                                } else {
                                    div.append(categoryDiv);
                                }

                                if('filters' in searchOptions && 'category' in searchOptions['filters']){
                                    if(searchOptions.filters.category.indexOf(categoryDiv.attr('data-oVal')) > -1){
                                        categoryDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['category'].length === 15){
                            var categoriesShowMore = $('<a id="filters-show-more-categories" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                                categoriesDiv.append(categoriesShowMore);
                                categoriesShowMore.click(function(that) {
                                return function() {
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'category';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options)).done(function(response) {
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertCategories(response['category'], categoriesDiv).bind(that);
                                        if (response.category.length < 15) {
                                            categoriesDiv.find('#filters-show-more-categories').remove();
                                        }
                                        categoriesDiv.find('.search-filter').off('click');
                                        categoriesDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    });
                                }
                            }(this));
                        }

                        insertCategories(results['category'], categoriesDiv);
                        this.filters.append(categoriesDiv);
                        break;
                    case 'org':
                        this.filters.append('<h4 class="col-xs-12">Organization</h4>');
                        var orgsDiv = $('<div class="col-xs-12"></div>');
                        
                        function insertOrgs(orgs, div) {
                            var $orgsMore = div.find('#filters-show-more-orgs');
                            for (var i=0; i<orgs.length; i++){
                                var orgDiv = $('<div class="search-filter search-filter-org" ' +
                                    'data-oVal="<' + orgs[i].org + '>"></div>');
                                var org = $('<a  class="col-xs-12" style="display:block">' + orgs[i].organizationName + ' <i style="color:grey">[' + orgs[i].pubcount + ']</i></a>');
                                orgDiv.append(org);
                                if ($orgsMore.length > 0) {
                                    $orgsMore.before(orgDiv);
                                } else {
                                    div.append(orgDiv);
                                }

                                if('filters' in searchOptions && 'org' in searchOptions['filters']){
                                    if(searchOptions.filters.org.indexOf(orgDiv.attr('data-oVal')) > -1){
                                        orgDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['org'].length === 15){
                            var orgsShowMore = $('<a id="filters-show-more-orgs" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                                orgsDiv.append(orgsShowMore);
                                orgsShowMore.click(function(that) {
                                return function() {
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'org';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options)).done(function(response) {
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertTags(response['org'], orgsDiv).bind(that);
                                        if (response.org.length < 15) {
                                            orgsDiv.find('#filters-show-more-orgs').remove();
                                        }
                                        orgsDiv.find('.search-filter').off('click');
                                        orgsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    });
                                }
                            }(this));
                        }

                        insertOrgs(results['org'], orgsDiv);
                        this.filters.append(orgsDiv);
                        break;
                    case 'project':
                        this.filters.append('<h4 class="col-xs-12">Project</h4>');
                        var projectsDiv = $('<div class="col-xs-12"></div>');
                        
                        function insertProjects(projects, div) {
                            var $projectsMore = div.find('#filters-show-more-projects');
                            for (var i=0; i<projects.length; i++){
                                var projectDiv = $('<div class="search-filter search-filter-project" ' +
                                    'data-oVal="<' + projects[i].projectUUID + '>"></div>');
                                var project = $('<a  class="col-xs-12" style="display:block">' + projects[i].projectName + ' <i style="color:grey">[' + projects[i].pubcount + ']</i></a>');
                                projectDiv.append(project);
                                if ($projectsMore.length > 0) {
                                    $projectsMore.before(projectDiv);
                                } else {
                                    div.append(projectDiv);
                                }

                                if('filters' in searchOptions && 'project' in searchOptions['filters']){
                                    if(searchOptions.filters.project.indexOf(projectDiv.attr('data-oVal')) > -1){
                                        projectDiv.attr('data-selected', 'selected');
                                    }
                                }
                            }
                        }

                        if (results['project'].length === 15){
                            var projectsShowMore = $('<a id="filters-show-more-projects" class="search-filter-more" ' +
                                'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                                projectsDiv.append(projectsShowMore);
                                projectsShowMore.click(function(that) {
                                return function() {
                                    $this = $(this);
                                    $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                                    $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);

                                    var options = $.extend(true, {}, searchOptions);
                                    options['filter_keys'] = 'project';
                                    options['limit'] = 15;
                                    options['offset'] = parseInt($this.attr('data-offset'));

                                    $.when(that.getFilters(options)).done(function(response) {
                                        $this.siblings('.filterLoader').remove();
                                        response = JSON.parse(response);
                                        insertTags(response['project'], projectsDiv).bind(that);
                                        if (response.project.length < 15) {
                                            projectsDiv.find('#filters-show-more-projects').remove();
                                        }
                                        projectsDiv.find('.search-filter').off('click');
                                        projectsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                                    });
                                }
                            }(this));
                        }

                        insertProjects(results['project'], projectsDiv);
                        this.filters.append(projectsDiv);
                        break;
                    default:
                        break;
                }
            }

            
            this.filters.append($('<button>', {
                text: 'Clear Filters',
                id: 'filterClear',
                type: 'button',
                class: 'btn btn-default btn-sm',
                style: 'float:right;',
                click: (function(that) {
                    return function() {
                        $('.search-filter[data-selected="selected"]', that.filters).removeAttr('data-selected');
                        // that.getByFilters(that);
                        if (that.currentSearchMode === 'browse') {
                            that.searchByCategory();
                        } else if (that.currentSearchMode === 'advanced') {
                            that.searchByFields();
                        }
                    };
                })(this)
            }));

            $('.search-filter', this.filters).click(onFilterClick(this));
        },

        /**
         * Returns the HTML of a box containing the share buttons
         * 
         * @param  {string} url The url of the publication
         * @param  {string} title The title used for the share functionality
         * @return {string} The HTML of the share box
         */
        createShareButton: function(url, title) {
            var encodedUrl = encodeURIComponent(url);
            var encodedTitle = encodeURIComponent(title);
            var $shareHtml = $('<div class="share-button sharer" style="display: block;">' +
                '<div class="social top center networks-5 ">' +
                '<!-- Facebook Share Button -->' +
                '<a class="fbtn share facebook" href="https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '"><i class="icon-facebook"></i></a> ' +

                '<!-- Google Plus Share Button -->' +
                '<a class="fbtn share gplus" href="https://plus.google.com/share?url=' + encodedUrl + '"><i class="icon-gplus"></i></a> ' +

                '<!-- Twitter Share Button -->' +
                '<a class="fbtn share twitter" href="https://twitter.com/intent/tweet?text=' + encodedTitle + '&amp;url=' + encodedUrl + '"><i class="icon-twitter"></i></a> ' +

                '<!-- LinkedIn Share Button -->' +
                '<a class="fbtn share linkedin" href="http://www.linkedin.com/shareArticle?mini=true&amp;url=' + encodedUrl + '&amp;title=' + encodedTitle + '&amp;source=' + encodedUrl + '/"><i class="icon-linkedin"></i></a>' +
                '</div>' +
                '</div>');

            $('a.fbtn', $shareHtml).click(function(e) {
                e.preventDefault();
                window.open($(this).attr('href'), 'shareWindow', 'height=450, width=550,top=' +
                    ($(window).height() / 2 - 275) + ', left=' + ($(window).width() / 2 - 225) +
                    ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
                return false;
            });
            return $shareHtml;
        },
    };

    $.fn.pressSearch = function(options, callback) {
        this.each(function() {
            var el = $(this);
            if (el.data('pressSearch'))
                el.data('pressSearch').remove();
            el.data('pressSearch', new PRESSSearch(el, options, callback));
        });
        return this;
    };

    return PRESSSearch;
}));