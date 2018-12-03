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

        if (typeof options.parameters === 'object')
            this.parameters = options.parameters;

        console.log(this.parameters);

        this.loader = $('<div id="loader">');
        this.filterLoader = $('<div class="filterLoader">');
        element.append(this.loader);

        // Retreive from blazegraph the tags and categories. On success, 
        // Create the page
        $.when(this.getCategories(), this.getTags()).always($.proxy(function(a1, a2) {
            if (!(a1) || !a2) {
                console.error('GET was unsuccesfull');
                return;
            }

            this.loader.hide();

            var $free_search = $('<div class="free-text-search-div col-sm-12 form-group">' +
                '<div class="col-sm-1"></div>' +
                '<div class="col-sm-10"><input id="free-text" class="form-control input-sm" ' +
                'type="text" placeholder="Enter text for free text search"></input></div>' +
                '<a id="searchByFields"  class="icon-search" ' +
                'style="font-size:30px; text-decoration:none; position:relative; top:-6px;"></a>&nbsp;' +
                '</div>' +
                '<div class="advanced-search-div col-sm-6"><a id="advanced_search_button" data-toggle="collapse"' +
                ' href="#advanced_search">Advanced Search</a></div>' +
                '<div class="browse-search-div col-sm-6"><a id="category_list_button" data-toggle="collapse"' +
                ' href="#Category-List" aria-expanded="true" aria-controls="Category-List"' +
                ' style="visibility:hidden; float:right">Browse By Category</a></div>' +
                '</div>');
            this.element.append($free_search);
            $('#free-text', this.element).on('keypress', (function(e) {
                if (e.keyCode == 13)
                    this.searchByFields();
            }).bind(this));
            $('#searchByFields', this.element).on('click', (function() {
                this.searchByFields();
                $('#category_list_button', this.element).css('visibility', '');
                $('#advanced_search_button', this.element).css('visibility', '');
            }).bind(this));

            var field_container = $('<div class="col-sm-11" style="padding-right:0"></div>');
            field_container.append(this.getAuthorField());

            field_container.append(this.getOrgsField(this.orgs));

            field_container.append(this.getYearField());
            field_container.append(this.getTagField(a2[0]));
            var categories = this.getCategoriesFields(this.category_tree);
            field_container.append(categories[0]);
            field_container.append(categories[1]);
            var last_line = $('<div class="form-group"></div>');

            last_line.append(this.getReviewedField().append($('<div class="col-sm-5"></div>').append(
                $('<button>', {
                    text: 'Search',
                    id: 'advanced_search_search_button',
                    class: 'btn btn-primary btn-sm advanced-search-btn',
                    click: (function(that) {
                        return function() {
                            that.searchByFields();
                            $('#category_list_button', that.element).css('visibility', '');
                            $('#advanced_search_button', that.element).css('visibility', '');
                        };
                    })(this)
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
                )));
            field_container.append(last_line);
            this.advanced_search.append(field_container);
            var close_button = $('<h2 style="margin-top:0;float:left;"><button type="button" id="close_by_category" class="close custom-close"><span>&times;</span></button></h2>');
            close_button.on('click', (function(that) {
                return function() {
                    that.advanced_search.collapse('hide');
                    $('#category_list_button', that.element).css('visibility', '');
                    $('#advanced_search_button', that.element).css('visibility', '');
                };
            })(this));
            this.advanced_search.append($('<div class="col-sm-1"></div>').append(close_button));
            this.element.append(this.advanced_search);

            this.category_list = this.getCategoryList();

            $('#category_list_button').on('click', function(that) {
                return function() {
                    that.advanced_search.collapse('hide');
                    $('#advanced_search_button', that.element).css('visibility', '');
                    $('#category_list_button', that.element).css('visibility', 'hidden');
                }
            }(this));
            $('#advanced_search_button').on('click', function(that) {
                return function() {
                    that.category_list.collapse('hide');
                    $('#advanced_search_button', that.element).css('visibility', 'hidden');
                    $('#category_list_button', that.element).css('visibility', '');
                }
            }(this));

            this.element.append(this.category_list);
            this.element.append('<p>&nbsp;</p>');
            this.element.append(this.resultContainer);
            this.element.append(this.filters);

            if (!$.isEmptyObject(this.parameters) && !window.location.hash.startsWith('#overlay=')) {
                if (this.parameters.type) {
                    $('#category_list_button', this.element).css('visibility', '');
                    $('#advanced_search_button', this.element).css('visibility', '');
                    if (this.parameters.type === 'browse') {
                        this.searchByCategory(this.parameters.category, this.parameters.offset);
                    } else if (this.parameters.type === 'advanced') {
                        this.fillFieldsByStateAndSearch(this.parametersToFields(this.parameters));
                    }
                }
            }
        }, this));
    };

    PRESSSearch.prototype = {
        constructor: PRESSSearch,

        /**
         * 
         * 
         * @param  {Object} parameters
         * @return {Object} fields
         */
        parametersToFields: function(parameters) {
            var fields = {};
            //Single Value Fields
            fields.type = parameters.type;
            fields.field = parameters.field;
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
            $.each(parameters, function(key, value) {
                if (key.startsWith('tags')) {
                    fields.tags.push(value);
                } else if (key.startsWith('orgs')) {
                    fields.orgs.push(value);
                } else if (key.startsWith('authors')) {
                    fields.authors.push(value);
                }
            });
            return fields;
        },
        
        /**
         * Gets categories from blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getCategories: function() {
            return $.ajax({

                    dataType: 'json',
                    method: "GET",
                    url: this.dbURL,
                    data: {
                        query: "prefix press: <" + this.prefix + "> " +
                            'SELECT (strafter(str(?low), "#") AS ?lowid) ?lowlabel ?optgroup ?pubCounter' +
                            '(strafter(str(?superclass), "#") AS ?superclassid) ?superlabel ' +
                            "WHERE { " +
                            '{' +
                            'SELECT (COUNT(?pub) as ?pubCounter) ?low ' +
                            'WHERE { ' +
                            '?low rdfs:subClassOf* press:Publication. ' +
                            'OPTIONAL {?pub rdf:type [rdfs:subClassOf* ?low]}. ' +
                            '} GROUP BY ?low ' +
                            '}' +
                            'OPTIONAL {?low rdfs:label ?lowlabel}. ' +
                            'OPTIONAL {?low press:optgroup ?optgroup}. ' +
                            'OPTIONAL {?low rdfs:subClassOf ?superclass} ' +
                            '}'
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
         * Gets tags from blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getTags: function() {
            tags = [];
            return $.ajax({
                    dataType: 'json',
                    method: "GET",
                    url: this.dbURL,
                    data: {
                        query: 'prefix press: <' + this.prefix + '> ' +
                            'SELECT distinct ?tag WHERE { ' +
                            '?pub press:tag ?tag} '
                    }
                })
                .done($.proxy(function(response) {

                }, this))
                .fail(function(response) {
                    alert("Oops! There was an error with getting tags! See console for more info.");
                    console.error(response);
                });
        },

        /**
         * Creates a tag field using typeahead.js and sortable.js
         *
         * @param {object} response The blazegraph response containing the tags
         * @return {Object} A jQuery element object
         */
        getTagField: function(response) {
            var tags = [];
            for (var i = 0; i < response.results.bindings.length; i++) {
                tags[i] = response.results.bindings[i].tag.value;
            }

            var required = '';
            $input = $('<input class="typeahead form-control input-sm press-field" ' +
                'id="tag-input" data-label="Tags" type="text" placeholder="Search..."/>');
            $ul = $('<ul id="tag-editable" class="list-group editable" style="display:none"></ul>');
            var $taggroup = $('<div id="tag-group" class="form-group"></div>');
            var $col_div = $('<div class="col-sm-10"></div>');
            $taggroup.append($('<label class="col-sm-2 control-label" for="tag-input">Tags:</label>'));
            $taggroup.append($col_div);
            $col_div.append($input);
            $col_div.append($ul);

            var tagsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                local: tags
            });

            $input.typeahead({
                hint: false,
                highlight: true,
                minLength: 0
            }, {
                limit: 100,
                name: 'tags',
                source: tagsBlood
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
                    if ($(this).attr('id') === suggestion) {
                        return valid = false;
                    }
                });
                if (valid) {
                    var $li;
                    $li = $('<li id="' + suggestion + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>');
                    $list.append($li);
                    $li.html(suggestion);
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
                            url: this.dbURL, //+"?query="+query,
                            wildcard: '%QUERY',
                            prepare: (function(groupKey, prefix) {
                                return function(query, settings) {

                                    var queries = query.split(' ');

                                    BDSquery = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n' +
                                        'prefix press: <' + prefix + '> \n' +
                                        'SELECT ?uuid (CONCAT(?givenName, \" \", ?familyName) ' +
                                        'AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) WHERE { \n';
                                    for (var i = 0; i < queries.length; i++) {
                                        if (queries[i].length < 3) return false;
                                        BDSquery += '?o' + i + ' bds:search "' + queries[i] + '*". \n' +
                                            '?uuid ?p' + i + ' ?o' + i + ' . \n' +
                                            'filter(?p' + i + ' = foaf:familyName || ?p' + i + ' = foaf:givenName). \n';
                                    }

                                    BDSquery += '?uuid foaf:familyName ?familyName. \n' +
                                        '?uuid foaf:givenName ?givenName. \n' +
                                        'optional{?uuid foaf:mbox ?mbox}. \n' +
                                        '?uuid press:personGroup "' + groupKey + '". }';

                                    settings.data = {
                                        query: BDSquery,
                                    };
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
                                mail + '>' + suggestion.fullName + '</span>');

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
            var orgsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                local: orgKeys
            });

            function orgWithDefaults(q, sync) {
                if (q === '') {
                    sync(orgsBlood.index.all());
                    // console.log(orgsBlood.index.all());
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
                    if ($(this).attr('id') === suggestion) {
                        valid = false;
                        return false;
                    }
                });
                if (valid) {
                    var $li = $('<li id="' + org[suggestion] + '" class="extra-org-item org-item list-group-item" draggable="false" style="float:left"></li>');
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
        getCategoryList: function() {
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
                    $('#category_list_button', that.element).css('visibility', '');
                    $('#advanced_search_button', that.element).css('visibility', '');
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

            traverse_tree(this.category_tree, $listRoot, 0);
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
                    // that.category_list.hide();
                    that.clearSearchInput();
                    that.clearAdvancedSearch();
                    $('#category_list_button', that.element).css('visibility', '');
                    $('#advanced_search_button', that.element).css('visibility', '');
                    that.searchByCategory($(this).attr('id'));
                };
            })(this));

            return $div;
        },
        /**
         * Gets the info of authors based on their uuids
         * 
         * @param  {Array} authoruuids An array containing the author uuids to be retreived
         * @return {Object} A jqXHR object
         */
        getPredefinedAuthors: function(authoruuids) {
            var query = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n';
            query += 'prefix press: <' + this.prefix + '> \n';
            query += 'SELECT ?uuid (CONCAT(?givenName, \" \", ?familyName) ';
            query += 'AS ?fullName) ?givenName ?familyName (substr(?mbox, 8) as ?mail) ?group WHERE { \n';
            query += '?uuid rdf:type foaf:Person. \n';
            query += 'FILTER('
            for (var i = 0; i < authoruuids.length; i++) {
                if (i > 0) query += ' || ';
                query += '?uuid = <' + authoruuids[i] + '>';
            }
            query += '). \n';
            query += '?uuid foaf:familyName ?familyName. \n';
            query += 'optional{?uuid foaf:givenName ?givenName.} \n';
            query += 'optional{?uuid foaf:mbox ?mbox}. \n';
            query += '?uuid press:personGroup ?group. }';
            return this.getQuery(query);
        },
        /**
         * Uses state of browser to implement back button & search with url params
         * @param  {Object} fields    The advanced search fields of the state
         * @param  {Object} filters   The selected filters of the state
         * @param  {boolean} pushState Passing variable to searchByField
         * @return {[type]}           [description]
         */
        fillFieldsByStateAndSearch: function(fields, filters, pushState) {
            this.clearSearchInput();
            this.clearAdvancedSearch();
            if (typeof fields !== 'object') {
                return;
            }

            $('#free-text', this.element).val(fields.field);
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
                    $('#org-editable', this.element).append($('<li id="' + fields.orgs[i] + '"' +
                        ' class="extra-org-item org-item list-group-item" draggable="false" ' +
                        'style="float: left;">' + fields.orgs[i] + '<i class="js-remove">&nbsp;✖</i></li>'));
                }
                $('#org-editable').show();
            }

            if (fields.tags && $.isArray(fields.tags) && fields.tags.length > 0) {
                for (var i = 0; i < fields.tags.length; i++) {
                    console.log(fields.tags[i]);
                    $('#tag-editable', this.element).append($('<li id="' + fields.tags[i] + '"' +
                        ' class="tag-item list-group-item" draggable="false" ' +
                        'style="float: left;">' + fields.tags[i] + '<i class="js-remove">&nbsp;✖</i></li>'));
                }
                $('#tag-editable').show();
            }

            if (fields.authors && $.isArray(fields.authors) && fields.authors.length > 0) {
                $('#author-editable').show();
                console.log(fields.authors);
                $.when(this.getPredefinedAuthors(fields.authors)).always($.proxy(function(response) {
                    results = response.results.bindings;
                    for (var i = 0; i < results.length; i++) {
                        var $li = $('<li class="list-group-item" draggable="false"' +
                            'style="float:left;"></li>');
                        var group = (this.authorGroups[results[i].group.value].span) ? this.authorGroups[results[i].group.value].span : '';
                        $li.append(group);
                        var $span = $('<span class="author-contributor-name contributor" ' +
                            'data-uuid="' + results[i].uuid.value + '" data-field="author">' + results[i].fullName.value + '</span>');
                        if (results[i].mail) {
                            $li.attr('title', results[i].mail.value);
                            $span.attr('data-mail', results[i].mail.value);
                        }
                        $li.append($span);
                        $li.append($('<i class="js-remove">&nbsp;✖</i>'));
                        $('#author-editable').append($li);
                    }
                    this.searchByFields(fields.offset, filters, pushState, fields);
                }, this));
            } else {
                $('#author-editable').hide();
                this.searchByFields(fields.offset, filters, pushState, fields);
            }
        },
        /**
         * Does the search by text & advanced search fields
         * @param  {number} offset    The offset of the search
         * @param  {Object} filters   The enabled filters
         * @param  {boolean} pushState If the search is performed by pushState (back, forward button)
         * @param  {Object} stateObj  The state object
         */
        searchByFields: function(offset, filters, pushState, stateObj) {
            var prefixes = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n' + //Constructing Query
                'prefix press: <' + this.prefix + '> \n';
            var select = 'SELECT ?pub (SUM(?score) as ?sumScore) ?year ?englishTitle ' +
                '?order ?type ?externalLink ?bookTitle ?chapterTitle ' +
                '?typeID ?publicationUrl ?localLink WHERE{ \n';

            //Getting the available fields
            var field = $('#free-text', this.element).val();
            var yearFrom = $('#year-from', this.element).val();

            var yearTo = $('#year-to', this.element).val();

            var category = $('#category', this.element).val();
            var subcategory = $('#subcategory', this.element).val();
            var reviewed = $('#reviewed', this.element).is(':checked');

            var orgs = []; //Get orgs
            var orgIds = [];
            orgs = $('#org-editable li');

            var tags = $('.tag-item');
            var tagIds = [];

            var authors = $('.author-contributor-name');

            // Return if every field is emepty
            if (field === '' && yearFrom === '' && yearTo === '' && category === '' &&
                subcategory === '' && reviewed === false && orgs.length === 0 &&
                tags.length === 0 && authors.length === 0) {
                return;
            }

            if (this.currentSearchMode !== 'advanced') {
                this.clearFilters();
            }
            this.currentSearchMode = 'advanced';

            if (typeof pushState === 'undefined') {
                pushState = false;
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

            if (typeof filters === 'undefined') {
                filters = this.getFiltersValues(this.filters);
            }

            // Create the search label to be displayed
            if (field !== '')
                searchLabel += '"' + field + '"';

            // Add authors to query
            var authorQuery = '';
            var authorIds = [];
            if (authors.length === 0) {

            } else {
                if (searchLabel !== '')
                    searchLabel += ', ';

                if (authors.length === 1) {
                    searchLabel += 'Author: ';
                } else {
                    searchLabel += 'Authors: ';
                }

                for (var i = 0; i < authors.length; i++) {
                    authorQuery += '?con' + i + ' rdfs:subPropertyOf* press:contributorType. \n'; //NOTE: PRESS V3
                    authorQuery += '?slot' + i + ' ?con' + i + ' <' + $(authors[i]).attr('data-uuid') + '>. \n';
                    authorQuery += '?pub press:hasContributor ?slot' + i + '. \n';

                    authorIds.push($(authors[i]).attr('data-uuid'));
                    searchLabel += $(authors[i]).text();
                    if (i < authors.length - 1)
                        searchLabel += ', ';
                }
            }

            // Add orgs to query
            var orgQuery = '';
            if (orgs.length === 0) {

            } else if (orgs.length === 1) {
                if (searchLabel !== '')
                    searchLabel += ', ';

                orgQuery = '?pub press:belongsTo <' + this.prefix + 'Organization/' + orgs.attr('id') + '>. \n';
                searchLabel += 'Organization: ' + orgs.contents().not(orgs.children()).text() + ', ';
                orgIds.push(orgs.attr('id'));
            } else {
                if (searchLabel !== '')
                    searchLabel += ', ';

                searchLabel += 'Organizations: ' + $(orgs[0]).contents().not($(orgs[0]).children()).text();
                orgQuery = '?pub press:belongsTo ?org. \n' +
                    'FILTER(?org = press:' + $(orgs[0]).attr('id');
                orgIds.push($(orgs[0]).attr('id'));
                for (var i = 1; i < orgs.length; i++) {
                    orgQuery += ' || ?org = press:' + $(orgs[i]).attr('id');
                    var text = $(orgs[i]).contents().not($(orgs[i]).children()).text();
                    searchLabel += text;
                    orgIds.push($(orgs[i]).attr('id'));
                    if (i < orgs.length - 1)
                        searchLabel += ', ';
                }
                orgQuery += '). \n';
            }

            // Add tags to query
            var tagQuery = '';

            if (tags.length > 0) {
                if (searchLabel !== '') {
                    searchLabel += ', ';
                }

                if (tags.length === 1) {
                    searchLabel += 'tag: ';
                } else {
                    searchLabel += 'Tags: ';
                }

                for (var i = 0; i < tags.length; i++) {
                    tagQuery += '?pub press:tag "' + $(tags[i]).attr('id') + '". \n';
                    tagIds.push($(tags[i]).attr('id'));
                    searchLabel += $(tags[i]).attr('id');
                    if (i < tags.length - 1)
                        searchLabel += ', ';
                }

            }

            //Create new state for history
            if (!pushState) {
                stateObj = {
                    type: 'advanced',
                    field: field,
                    yearFrom: yearFrom,
                    yearTo: yearTo,
                    category: category,
                    subcategory: subcategory,
                    reviewed: reviewed,
                    authors: authorIds,
                    orgs: orgIds,
                    tags: tagIds,
                    offset: offset,
                    filters: filters
                };
                var search = '?';
                for (var key in stateObj) {
                    if (key !== 'filters') {
                        if ((typeof stateObj[key] === 'string' || typeof stateObj[key] === 'boolean') && stateObj[key] !== '') {
                            search += key + '=' + encodeURIComponent(stateObj[key]) + '&';
                        } else {
                            for (var j = 0; j < stateObj[key].length; j++) {
                                if (stateObj[key][j] !== '')
                                    search += key + j + '=' + encodeURIComponent(stateObj[key][j]) + '&';
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
                window.history.pushState(stateObj, "", window.location.origin + window.location.pathname + search);
            }

            window.onpopstate = (function(that) {
                return function(event) {
                    if (!event.state) {
                        location.reload();
                    } else {
                        var currentState = event.state;
                        that.fillFieldsByStateAndSearch(currentState, currentState.filters, true);
                    }
                };
            })(this);

            // Add year to query
            var yearQuery = '';
            if (yearFrom !== '' || yearTo !== '') {
                if (searchLabel !== '')
                    searchLabel += ', ';

                searchLabel += 'Year: ';
                yearQuery = '?pub press:year ?year. \n';
                yearQuery += 'FILTER (';
                var yearAnd = '';
                var sameYear = false;
                var yearRange = '';
                var toRange = '';
                var fromRange = '';
                if (yearFrom !== '' && yearTo !== '') {
                    yearAnd = ' && ';
                    yearRange = ' - ';
                    if (yearFrom === yearTo) {
                        searchLabel += yearFrom;
                        sameYear = true;
                    }
                } else {
                    if (yearFrom !== '') {
                        fromRange = ' &gt; ';
                    }
                    if (yearTo !== '') {
                        toRange = ' &lt; ';
                    }
                }
                if (yearFrom !== '') {
                    yearQuery += '?year >= str(' + yearFrom + ')';
                    if (!sameYear) {
                        searchLabel += fromRange + yearFrom;
                    }
                }

                if (yearTo !== '') {
                    yearQuery += yearAnd + '?year <= str(' + yearTo + ')';
                    if (!sameYear) {
                        searchLabel += toRange + yearRange + yearTo;
                    }
                }
                yearQuery += '). \n';
            }

            // Add if reviewed to query
            var reviewedQuery = '';
            if (category === '' && reviewed) {
                if (searchLabel !== '')
                    searchLabel += ', ';

                reviewedQuery = '?pub rdf:type ?type. \n';
                reviewedQuery += '?type rdfs:subClassOf* ?ancClass. \n';
                reviewedQuery += 'FILTER (?ancClass = press:Journal_Peer_Reviewed || ?ancClass = press:Conf_Peer_Reviewed). \n';
                searchLabel += ' Peer Reviewed Only';
            } else if (category !== '') {
                if (searchLabel !== '')
                    searchLabel += ', ';
                if (!reviewed) {
                    if (subcategory !== '') {
                        reviewedQuery += '?pub rdf:type ?type. \n';
                        reviewedQuery += '?type rdfs:subClassOf* press:' + subcategory + '. \n';
                        searchLabel += this.category_labels[subcategory];
                    } else {
                        reviewedQuery += '?pub rdf:type ?type. \n';
                        reviewedQuery += '?type rdfs:subClassOf* press:' + category + '. \n';
                        searchLabel += this.category_labels[category];
                    }
                } else {
                    if (subcategory !== '') {
                        reviewedQuery += '?pub rdf:type ?type. \n';
                        reviewedQuery += '?type rdfs:subClassOf* press:' + subcategory + '. \n';
                        searchLabel += this.category_labels[subcategory] + ', Peer Reviewed Only';
                    } else {
                        reviewedQuery += '?pub rdf:type ?type. \n';
                        reviewedQuery += '?type rdfs:subClassOf* press:' + category + '. \n';
                        reviewedQuery += '?type rdfs:subClassOf* ?ancClass. \n';
                        reviewedQuery += 'FILTER (?ancClass = press:Journal_Peer_Reviewed || ?ancClass = press:Conf_Peer_Reviewed). \n';
                        searchLabel += this.category_labels[category] + ', Peer Reviewed Only';
                    }
                }
            }

            // Add text field to query
            var fieldQuery = '';

            if (field !== '') {

                fieldQuery += '    { \n' + //NOTE: PRESS V3
                    '       ?searchField bds:search "' + field + '". \n' +
                    '       ?searchField bds:relevance ?score. \n' +
                    '       ?pub ?predicate ?searchField. \n' +
                    '       ?pub rdf:type [rdfs:subClassOf* press:Publication]. \n' +
                    '       MINUS {?pub press:englishAbstract ?searchField}. \n' +
                    '       MINUS {?pub press:publicationUrl ?searchField}. \n' +
                    '     }UNION{\n' +
                    '       ?personSearchField bds:search "' + field + '". \n' +
                    '       ?personSearchField bds:relevance ?score. \n' +
                    '       ?person ?s ?personSearchField. \n' +
                    '       ?person rdf:type foaf:Person. \n' +
                    '       ?con rdfs:subPropertyOf* press:contributorType. \n' +
                    '       ?slot ?con ?person. \n' +
                    '       ?pub press:hasContributor ?slot. \n' +
                    '    } \n';
                multipleFieldsQuery = '{ \n' +
                    '?searchField bds:search "' + field + '". \n' +
                    '?searchField bds:relevance ?score. \n' +
                    '?pub ?predicate ?searchField. \n' +
                    '?pub rdf:type [rdfs:subClassOf* press:Publication]. \n' +
                    'MINUS {?pub press:englishAbstract ?searchField}. \n' +
                    'MINUS {?pub press:publicationUrl ?searchField}. \n';
                authorFieldsQuery = '     }UNION{\n' +
                    '       ?personSearchField bds:search "' + field + '". \n' +
                    '       ?personSearchField bds:relevance ?score. \n' +
                    '       ?person ?s ?personSearchField. \n' +
                    '       ?person rdf:type foaf:Person. \n' +
                    '       ?con rdfs:subPropertyOf* press:contributorType. \n' +
                    '       ?slot ?con ?person. \n' +
                    '       ?pub press:hasContributor ?slot. \n';
            }

            // Add the rest of the fields that we need to be returned to the query
            var restFields = '';
            if (reviewedQuery === '') {
                restFields += '?pub rdf:type ?type. \n';
            }
            if (yearQuery === '') {
                restFields += '?pub press:year ?year. \n';
            }
            if (field === '') {
                restFields += 'BIND(concat(str(?year), str(?pub)) as ?order). \n';
            }
            restFields += '?type rdfs:subClassOf* press:Publication. \n' +
                'BIND(strafter(str(?type), "#") AS ?typeID). \n' +
                'OPTIONAL{?pub press:externalLink ?externalLink}. \n' +
                'OPTIONAL{?pub press:bookTitle ?bookTitle}. \n' +
                'OPTIONAL{?pub press:chapterTitle ?chapterTitle}. \n' +
                'OPTIONAL{?pub press:englishTitle ?englishTitle}. \n' +
                'OPTIONAL{?pub press:localLink ?localLink}. \n' +
                'OPTIONAL{?pub press:publicationUrl ?publicationUrl}. \n';

            var closure = '';
            if (field !== '') {
                closure += '}group by ?pub ?year ?englishTitle ?order ?type ' +
                    '?externalLink ?bookTitle ?chapterTitle ?typeID ?publicationUrl ' +
                    '?localLink order by desc(?sumScore)';
            } else {
                closure += '}group by ?pub ?year ?englishTitle ?order ?type ' +
                    '?externalLink ?bookTitle ?chapterTitle ?typeID ?publicationUrl ' +
                    '?localLink order by desc(?order)';
            }

            // concat the queries
            var searchQuery = '';
            if (field !== '') {
                multipleFieldsQuery += authorQuery + orgQuery + yearQuery + reviewedQuery + tagQuery;
                authorFieldsQuery += authorQuery + orgQuery + yearQuery + reviewedQuery + tagQuery;
            } else {
                query = authorQuery + orgQuery + yearQuery + reviewedQuery + tagQuery;
            }

            for (key in filters) {
                if (key !== 'contributors') {
                    for (var filterVal in filters[key]) {
                        if (field !== '') {
                            multipleFieldsQuery += filters[key][filterVal];
                            authorFieldsQuery += filters[key][filterVal];
                        } else {
                            query += filters[key][filterVal];
                        }
                    }
                } else {
                    if (filters.contributors.filterIntro) {
                        if (field !== '') {
                            multipleFieldsQuery += filters.contributors.filterIntro;
                            authorFieldsQuery += filters.contributors.filterIntro;
                        } else {
                            query += filters.contributors.filterIntro;
                        }
                    }
                    for (var filterVal in filters[key]) {
                        if (field !== '') {
                            multipleFieldsQuery += filters[key][filterVal];
                            authorFieldsQuery += filters[key][filterVal];
                        } else {
                            query += filters[key][filterVal];
                        }
                    }
                }
            }




            if (field !== '') {
                var completeQuery = prefixes + select + multipleFieldsQuery + restFields +
                    authorFieldsQuery + restFields + '} \n' + closure;
                var countQuery = select + multipleFieldsQuery + restFields +
                    authorFieldsQuery + restFields + '} \n' + closure;
            } else {
                completeQuery = prefixes + select + query + restFields + closure;
                countQuery = select + query + restFields + closure;
            }

            // console.log (query);
            // console.log(yearQuery);
            //
            // console.log(orgQuery);
            //
            // console.log(field);
            // console.log(yearFrom);
            // console.log(yearTo);
            // console.log(category);
            // console.log(subcategory);
            // console.log(reviewed);
            this.lastSearchLabel = searchLabel;

            // Make the query and call the displaying results function & filter function on success
            $.when(this.getQuery(completeQuery, 10, offset),
                this.getCount(prefixes, countQuery)).done((function(a1, a2) {
                var response = a1[0].results.bindings;
                var pubs = [];
                for (var i = 0; i < response.length; i++) {
                    pubs[i] = response[i].pub.value;
                }

                var count = 0;
                if (a2[0].results.bindings.length === 1 && 'count' in a2[0].results.bindings[0]) {
                    var count = parseInt(a2[0].results.bindings[0].count.value);
                }
                if (count > 0) {
                    $.when(this.getPublicationsContributors(pubs, this.personFields), this.getPublicationsMultipleFields(pubs)).done((function(a3, a4) {
                        this.insertSearchResults(a1[0], a3[0], a4[0], this.personFields, searchLabel, 0, count);
                        this.resultContainer.append(this.getPagination(completeQuery, count, offset, this.personFields, searchLabel, stateObj));
                    }).bind(this));
                } else {
                    this.insertSearchResults(null, null, null, this.personFields, searchLabel, 0, 0);
                }
            }).bind(this));

            $.when(this.getFilters(prefixes, countQuery),
                this.getAuthorFilters(prefixes, countQuery), this.getProjectFilters(prefixes, countQuery), this.getTagFilters(prefixes, countQuery)).done((function(a1, a2, a3, a4) {
                this.insertFilters(a1[0], a2[0], a3[0], a4[0], filters, prefixes, countQuery);
            }).bind(this));
        },
        
        /**
         * Does the search by category
         * @param  {string} category_id  The category ID
         * @param  {number} offset       The offset of the searc
         * @param  {Object} filterValues The enabled filters
         * @param  {boolean} pushState    If the search is performed by pushState (back, forward button)
         */
        searchByCategory: function(category_id, offset, filterValues, pushState) {
            if (this.currentSearchMode !== 'browse') {
                this.clearFilters();
            }
            this.currentSearchMode = 'browse';


            if (typeof category_id === 'undefined') {
                category_id = window.history.state.category;
            }
            console.log(category_id);
            if (typeof offset === 'undefined') {
                offset = 0;
            }

            if (typeof pushState === 'undefined') {
                pushState = false;
            }

            var selectedFilters;

            if (typeof filterValues === 'undefined') {
                selectedFilters = $('.search-filter[data-selected="selected"]', this.filters);
                filterValues = this.getFiltersValues(this.filters);
            }
            this.resultContainer.find('*').not('#results').empty();
            var $element = $('#' + category_id, this.element);

            //Set state for history
            if (!pushState) {
                stateObj = { type: 'browse', category: category_id, offset: offset, filters: filterValues };
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
                window.history.pushState(stateObj, "", window.location.origin + window.location.pathname + search);
            }



            window.onpopstate = (function(that) {
                return function(event) {
                    if (!event.state) {
                        location.reload();
                    } else {
                        var currentState = event.state;
                        that.searchByCategory(currentState.category, currentState.offset, currentState.filters, true);
                    }
                };
            })(this);
            this.category_list.collapse("hide");
            var $temp = $element;
            var catpath = [$element.attr('id')];

            while ($temp.attr('data-parent') !== 'Publication') { //Find Category Ancestors
                catpath.unshift($temp.attr('data-parent'));
                $temp = $('#' + $temp.attr('data-parent'));
            }
            var i = 0;
            var fields = [];
            var fieldObject = this.JSONfields;
            var requiredFields = [];
            var requiredObject = this.JSONrequiredFields;
            while (i < catpath.length) {
                fieldObject = fieldObject[catpath[i]];
                requiredObject = requiredObject[catpath[i]];
                i++;
            }

            //Get same required  fields for all categories & subcategories
            var allRequired = {};

            function getRequired(obj, array) {
                if ($.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        if (!(obj[i] in array)) {
                            array[obj[i]] = 0;
                        }
                        array[obj[i]]++;
                    }
                } else {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            array = getRequired(obj[key], array);
                        }
                    }
                }
                return array;
            }
            allRequired = getRequired(requiredObject, allRequired);

            var prefixes = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n' + //Constructing Query
                'prefix press: <' + this.prefix + '> \n';
            var select = 'SELECT * WHERE { \n';
            var selectorQuery = '?pub rdf:type [rdfs:subClassOf* press:' + $element.attr('id') + ']. \n';
            selectorQuery += '?pub rdf:type ?type. \n' +
                'BIND(strafter(str(?type), "#") AS ?typeID). \n';
            for (key in filterValues) {
                if (key !== 'contributors') {
                    for (var filterVal in filterValues[key]) {
                        selectorQuery += filterValues[key][filterVal];
                    }
                } else {
                    if (filterValues.contributors.filterIntro)
                        selectorQuery += filterValues.contributors.filterIntro;
                    for (var filterVal in filterValues[key]) {
                        selectorQuery += filterValues[key][filterVal];
                    }
                }
            }
            var fieldQuery = '?pub press:year ?year. \n' +
                'BIND(concat(str(?year), str(?pub)) as ?order). \n' +
                //  '?pub press:belongsTo ?org. \n'+
                //  '?org press:organizationName ?orgName. \n'+
                'OPTIONAL{?pub press:externalLink ?externalLink}. \n' +
                'OPTIONAL{?pub press:bookTitle ?bookTitle}. \n' +
                'OPTIONAL{?pub press:chapterTitle ?chapterTitle}. \n' +
                'OPTIONAL{?pub press:englishTitle ?englishTitle}. \n' +
                'OPTIONAL{?pub press:localLink ?localLink}. \n' +
                'OPTIONAL{?pub press:publicationUrl ?publicationUrl}. \n';

            var closure = '} order by desc(?order)';

            var query = selectorQuery + fieldQuery;
            var completeQuery = prefixes + select + query + closure;
            var countQuery = select + query + closure;
            this.loader.show();
            this.lastSearchLabel = 'for ' + this.category_labels[$element.attr('id')] + ' Category';

            $.when(this.getQuery(completeQuery, 10, offset),
                this.getCount(prefixes, countQuery)).done((function(a1, a2) {
                var response = a1[0].results.bindings;
                var pubs = [];
                for (var i = 0; i < response.length; i++) {
                    pubs[i] = response[i].pub.value;
                }
                var count = 0;
                if (a2[0].results.bindings.length === 1 && 'count' in a2[0].results.bindings[0]) {
                    var count = parseInt(a2[0].results.bindings[0].count.value);
                }
                if (count > 0) {
                    $.when(this.getPublicationsContributors(pubs, allRequired), this.getPublicationsMultipleFields(pubs)).done((function(a3, a4) {
                        this.insertSearchResults(a1[0], a3[0], a4[0], allRequired, 'for ' + this.category_labels[$element.attr('id')] + ' Category', offset, count);
                        this.resultContainer.append(this.getPagination(completeQuery, count, offset, allRequired, 'for ' + this.category_labels[$element.attr('id')] + ' Category', stateObj));
                    }).bind(this));
                } else {
                    this.insertSearchResults(null, null, null, this.personFields, 'for ' + this.category_labels[$element.attr('id')] + ' Category', 0, 0);
                }
            }).bind(this));

            $.when(this.getFilters(prefixes, countQuery),
                this.getAuthorFilters(prefixes, countQuery), this.getProjectFilters(prefixes, countQuery), this.getTagFilters(prefixes, countQuery)).done((function(a1, a2, a3, a4) {
                this.insertFilters(a1[0], a2[0], a3[0], a4[0], filterValues, prefixes, countQuery);
            }).bind(this));
        },
        
        /**
         * Creates the pagination for the search results
         * @param  {string} query          The sparql query
         * @param  {number} count          The number of the results
         * @param  {number} offset         The offset of the search
         * @param  {Object} requiredFields The required fields based on the category
         * @param  {string} searchLabel    The search label to be displayed
         * @param  {Object} stateObj       The state object
         * @return {Object}                A jQuery element object
         */
        getPagination: function(query, count, offset, requiredFields, searchLabel, stateObj) {
            var $pagination = $('<ul class="pagination"></ul>');
            var pages = Math.ceil(count / 10);
            var firstPageClick = true;


            $pagination.twbsPagination({
                totalPages: pages,
                startPage: Math.ceil(offset / 10) + 1,
                visiblePages: 7,
                onPageClick: (function(that) {
                    return function(event, page) {
                        if (firstPageClick) {
                            firstPageClick = false;
                            return;
                        }
                        that.results.empty();
                        $('html,body').animate({ scrollTop: 0 }, 'fast');
                        that.loader.show();
                        $.when(that.getQuery(query, 10, (page - 1) * 10)).done((function(a1) {
                            var response = a1.results.bindings;
                            var pubs = [];
                            for (var i = 0; i < response.length; i++) {
                                pubs[i] = response[i].pub.value;
                            }
                            if (count > 0) {
                                $.when(that.getPublicationsContributors(pubs, requiredFields), that.getPublicationsMultipleFields(pubs)).done((function(a2, a3) {
                                    this.insertSearchResults(a1, a2[0], a3[0], requiredFields, searchLabel, (page - 1) * 10, count);
                                }).bind(this));
                            } else {
                                this.insertSearchResults(null, null, null, requiredFields, searchLabel, 0, 0);
                            }
                            stateObj.offset = (page - 1) * 10;
                            var search = '?';
                            for (var key in stateObj) {
                                if (key !== 'filters') {
                                    search += key + '=' + encodeURIComponent(stateObj[key]) + '&';
                                } else {
                                    for (var filterKey in stateObj.filters) {
                                        var index = 0;
                                        for (var filterVal in stateObj.filters[filterKey]) {
                                            if (filterVal !== 'filterIntro')
                                                search += 'filter' + filterKey + index++ + '=' + encodeURIComponent(filterVal) + '&';
                                        }
                                    }
                                }
                            }
                            search = search.substring(0, search.length - 1);
                            window.history.pushState(stateObj, "", window.location.origin + window.location.pathname + search);
                        }).bind(that));
                    };
                })(this)
            });
            return $pagination;
        },
        
        /**
         * Gets the contributors of an array of Publications from Blazegraph
         * @param  {Array} publications      An array of the publications' uuids
         * @param  {Array} contributorTypes The contributor types to be retreived
         * @return {Object}                 A jqXHR object
         */
        getPublicationsContributors: function(publications, contributorTypes) { //NOTE: PRESS V3
            var query = 'prefix press: <' + this.prefix + '> \n';
            query += 'SELECT * WHERE { \n';
            if (!$.isArray(publications) || publications.length === 0) return;
            var i = 0;

            query += '?pub press:hasContributor ?slot. \n';
            query += 'FILTER(';
            for (var i = 0; i < publications.length; i++) {
                if (i > 0) query += '||';
                query += '?pub = <' + publications[i] + '> ';
            }
            query += '). \n';
            query += '?pub press:year ?year. \n';
            query += 'BIND(concat(str(?year), str(?pub)) as ?order). \n';
            query += '?con rdfs:subPropertyOf* press:contributorType. \n';
            query += '?slot ?con ?person. \n';
            query += 'BIND(strafter(str(?con), "#") AS ?type). \n';
            query += '?slot press:listIndex ?personIndex. \n';
            query += 'OPTIONAL{?person foaf:givenName ?givenName}. \n';
            query += '?person foaf:familyName ?familyName. \n';

            query += '}order by desc(?order)';

            return this.getQuery(query, 0, 0);
        },
        //Get properties with multiple values of publications based on pub uuid
        /**
         * Gets the fields of the publications that might have multiple values (orgs, tags etc.)
         * @param  {Object} publications The publications' uuids
         * @return {Object}              A jqXHR object
         */
        getPublicationsMultipleFields: function(publications) {
            if (!$.isArray(publications) || publications.length === 0) return;
            var query = 'prefix press: <' + this.prefix + '> \n';
            query += 'SELECT * WHERE { \n';
            query += '{\n';
            query += '?pub press:belongsTo ?org. \n';
            query += 'FILTER (';
            for (var i=0; i<publications.length; i++){
              if (i>0) query += '||';
              query += '?pub = <'+ publications[i] + '> ';
            }
            query += '). \n';
            query += '?org press:organizationName ?orgName. \n';
            query += '}UNION{ \n';
            query += '?pub press:tag ?tag. \n';
            query += 'FILTER (';
            for (var i = 0; i < publications.length; i++) {
                if (i > 0) query += '||';
                query += '?pub = <' + publications[i] + '> ';
            }
            query += '). \n';
            query += '} \n';
            query += '}\n';

            return this.getQuery(query, 0, 0);
        },
        
        /**
         * Gets the sparql triples of the selected filters
         * @param  {Object} $elements A jQuery element object with the filter elements
         * @return {Object}           An object with the filter values
         */
        getFiltersValues: function($elements) {
            values = {
                year: {},
                category: {},
                tags: {},
                org: {},
                contributors: {},
                projects: {}
            }
            $('.search-filter-year[data-selected="selected"]', $elements).each(function() {
                // values.year[$(this).attr('data-oVal')] = [];
                values.year[$(this).attr('data-oVal')] = '?pub ' + $(this).attr('data-p') + ' ' + $(this).attr('data-oVal') + '. \n';
                // values.year[$(this).attr('data-oVal')].push('?pub '+$(this).attr('data-p')+' '+$(this).attr('data-oVal')+'. \n');
            });

            $('.search-filter-category[data-selected="selected"]', $elements).each(function() {
                // values.category[$(this).attr('data-oVal')] = [];
                // values.category[$(this).attr('data-oVal')].push('?pub '+$(this).attr('data-p')+' '+$(this).attr('data-oVal')+'. \n');
                values.category[$(this).attr('data-oVal')] = '?pub ' + $(this).attr('data-p') + ' ' + $(this).attr('data-oVal') + '. \n';
            });

            $('.search-filter-tags[data-selected="selected"]', $elements).each(function() {
                // values.tags[$(this).attr('data-oVal')] = [];
                // values.tags[$(this).attr('data-oVal')].push('?pub '+$(this).attr('data-p')+' '+$(this).attr('data-oVal')+'. \n');
                values.tags[$(this).attr('data-oVal')] = '?pub ' + $(this).attr('data-p') + ' ' + $(this).attr('data-oVal') + '. \n';
            });

            //TODO: CHANGE FOR MULTIPLE ORGS
            $('.search-filter-org[data-selected="selected"]', $elements).each(function() {
                // values.org[$(this).attr('data-oVal')] = [];
                // values.org[$(this).attr('data-oVal')].push('?pub '+$(this).attr('data-p')+' '+$(this).attr('data-oVal')+'. \n');
                values.org[$(this).attr('data-oVal')] = '?pub ' + $(this).attr('data-p') + ' ' + $(this).attr('data-oVal') + '. \n';
            });

            $('.search-filter-project[data-selected="selected"]', $elements).each(function(index){
                values.projects[$(this).attr('data-oVal')] = '?pub ' + $(this).attr('data-p') + ' ' + $(this).attr('data-oVal') + '. \n';
            });

            $('.search-filter-contributor[data-selected="selected"]', $elements).each(function(index) { //NOTE: PRESS V3
                var contributorQuery = '';
                contributorQuery += '?filterSlot' + index + ' ?filtercon ' + $(this).attr('data-oVal') + '. \n';
                contributorQuery += '?pub press:hasContributor ?filterSlot' + index + '. \n';
                // values.contributors[$(this).attr('data-oVal')] = [];
                // values.contributors[$(this).attr('data-oVal')].push(contributorQuery);
                values.contributors[$(this).attr('data-oVal')] = contributorQuery;
            });

            if ($('.search-filter-contributor[data-selected="selected"]', $elements).length > 0)
                values.contributors.filterIntro = '?filtercon rdfs:subPropertyOf* press:contributorType. \n';

            return values;
        },
        /**
         * Creates and makes a call to Blazegraph to get the available years,
         * organizations and categories for the filters
         * 
         * @param  {string} prefixQuery The prefix of the sparql query
         * @param  {string} searchQuery The sparql Query
         * @return {Object} A jqXHR object
         */
        getFilters: function(prefixQuery, searchQuery) {
            var completeQuery = prefixQuery +
                'select ?p ?o (count(?o) as ?oCount) WITH { \n' +
                searchQuery +
                '} as %filterSet \n' +
                'WHERE {\n' +
                'INCLUDE %filterSet. \n' +
                '?pub ?p ?o. \n' +
                'FILTER (?p = press:year || ?p = press:belongsTo || ?p = rdf:type)\n' +
                '}group by ?p ?o order by desc(?oCount)';
            return this.getQuery(completeQuery);
        },

        /**
         * Creates and makes a call to Blazegraph to get the available authors for
         * the filters
         * 
         * @param  {string} prefixQuery The prefix of the sparql query
         * @param  {string} searchQuery The sparql Query
         * @param  {number} offset The offset of the results
         * @return {Object} A jqXHR object
         */
        getAuthorFilters: function(prefixQuery, searchQuery, offset) {
            if (offset === undefined) {
                offset = 0;
            }
            var completeQuery = prefixQuery;
            if (prefixQuery.indexOf('bds') === -1) {
                completeQuery += 'prefix bds: <http://www.bigdata.com/rdf/search#> \n';
            }

            completeQuery += 'SELECT ?contributoruuid ?contributorgivenName ' +
                '?contributorfamilyName (count(?contributoruuid) as ?pubcount) WITH { \n' +
                searchQuery +
                '} as %authorFilterSet WHERE{ \n' +
                'INCLUDE %authorFilterSet. \n' +
                '?con rdfs:subPropertyOf* press:contributorType. \n' +
                '?pub press:hasContributor ?slot. \n' +
                '?slot ?con ?contributoruuid. \n' +
                'OPTIONAL{?contributoruuid foaf:givenName ?contributorgivenName}. \n' +
                '?contributoruuid foaf:familyName ?contributorfamilyName. \n' +
                '}group by ?contributoruuid ?contributorgivenName ?contributorfamilyName order by desc(?pubcount) limit 15';
            if (offset > 0) {
                completeQuery += ' offset ' + offset;
            }
            return this.getQuery(completeQuery);
        },

        /**
         * Creates and makes a call to Blazegraph to get the available projects
         * for the filters
         * 
         * @param  {string} prefixQuery The prefix of the sparql query
         * @param  {string} searchQuery The sparql Query
         * @param  {number} offset The offset of the results
         * @return {Object} A jqXHR object
         */
        getProjectFilters: function(prefixQuery, searchQuery, offset){
            if(offset === undefined){
                offset = 0;
            }
            var completeQuery = prefixQuery;

            if(prefixQuery.indexOf('bds') === -1){
                completeQuery += 'prefix bds: <http://www.bigdata.com/rdf/search#> \n';
            }

            completeQuery += 'SELECT ?projectUUID ?projectName ' +
                '(count(?projectUUID) as ?pubcount) WITH { \n' +
                searchQuery +
                '} as %projectFilterSet WHERE{ \n' +
                'INCLUDE %projectFilterSet. \n' +
                '?pub press:appearsIn ?projectUUID. \n' +
                '?projectUUID press:projectName ?projectName. \n'+
                '}group by ?projectUUID ?projectName order by desc(?pubcount) limit 15';

            if (offset > 0) {
                completeQuery += ' offset ' + offset;
            }
            return this.getQuery(completeQuery);
        },

        /**
         * Creates and makes a call to Blazegraph to get the available tags for
         * the filters
         * 
         * @param  {string} prefixQuery The prefix of the sparql query
         * @param  {string} searchQuery The sparql Query
         * @param  {number} offset The offset of the results
         * @return {Object} A jqXHR object
         */
        getTagFilters: function(prefixQuery, searchQuery, offset){
            if(offset === undefined){
                offset = 0;
            }

            var completeQuery = prefixQuery;

            if(prefixQuery.indexOf('bds') === -1){
                completeQuery += 'prefix bds: <http://www.bigdata.com/rdf/search#> \n';
            }

            completeQuery += 'SELECT ?tag (count(?tag) as ?Tagcount) WITH {\n'+
                searchQuery +
                '} as %tagFilterSet WHERE{ \n' +
                'INCLUDE %tagFilterSet. \n'+
                '?pub press:tag ?tag. \n'+
                '} group by ?tag order by desc(?Tagcount) limit 15';

            if (offset >0){
                completeQuery += ' offset ' + offset;
            }

            return this.getQuery(completeQuery);
        },
        /**
         * Creates a query to get the number of results of another search query
         * and makes the request
         * 
         * @param  {string} prefixQuery The prefixes of the sparql query
         * @param  {string} searchQuery The sparqlQuery
         * @return {Object} A jqXHR object
         */
        getCount: function(prefixQuery, searchQuery) {

            var completeQuery = prefixQuery +
                'select (count(?pub) as ?count) WITH { \n' +
                searchQuery +
                '} as %countSet \n' +
                'WHERE {\n' +
                'INCLUDE %countSet. \n' +
                '}';
            return this.getQuery(completeQuery);
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
         * @param  {Object} responsePublications
         * @param  {Object} responseContributors
         * @param  {Object} responseMultipleFields
         * @param  {[type]} requiredFields
         * @param  {string} searchLabel
         * @param  {number} offset
         * @param  {number} count
         */
        insertSearchResults: function(responsePublications, responseContributors, responseMultipleFields, requiredFields, searchLabel, offset, count) {

            var limit = 10;
            this.results.empty();
            if (count === 0) {
                this.loader.hide();
                this.results.append('<h3 class="col-sm-12">No Results</h3>');
                this.results.append('<h4 class="col-xs-12">' + searchLabel + '</h4>');
                return;
            } else if (count === 1) {
                this.results.append('<h3 class="col-sm-12">1 Result</h3>');
            } else {
                this.results.append('<h3 class="col-sm-12">' + count + ' Results</h3>');
            }
            if (searchLabel === '') {
                searchLabel = this.lastSearchLabel;
            }
            this.results.append('<h4 class="col-xs-12">' + searchLabel + '</h4><p>&nbsp;</p>');

            var results = $.extend(true, [], responsePublications.results.bindings);
            var contributorResults = $.extend(true, [], responseContributors.results.bindings);
            var contributors = {};

            for (var i = 0; i < contributorResults.length; i++) {
                if (!(contributorResults[i].pub.value in contributors)) {
                    contributors[contributorResults[i].pub.value] = {};
                }
                var conType = contributorResults[i].type.value;
                if (!($.isArray(contributors[contributorResults[i].pub.value][conType]))) {
                    contributors[contributorResults[i].pub.value][conType] = [];
                }
                contributors[contributorResults[i].pub.value][conType].push(contributorResults[i]);
            }
            // console.log(contributors);
            for (var key in contributors) {
                for (var typeKey in contributors[key]) {
                    contributors[key][typeKey].sort(function(a, b) {
                        return a['personIndex'].value - b['personIndex'].value;
                    });
                }
            }
            var resultsMultipleFields = responseMultipleFields.results.bindings;
            var multipleFields = {};
            for (var i = 0; i < resultsMultipleFields.length; i++) {
                var field = resultsMultipleFields[i];
                if (!(field.pub.value in multipleFields)) {
                    multipleFields[field.pub.value] = {};
                }
                var type = '';
                if ('org' in field) {
                    type = 'org';
                } else if ('tag' in field) {
                    type = 'tag';
                }
                if (!($.isArray(multipleFields[field.pub.value][type]))) {
                    multipleFields[field.pub.value][type] = [];
                }

                if(type === 'org'){
                    var res = field[type].value.split('/');
                    multipleFields[field.pub.value][type].push(res[res.length-1]);
                }else{
                    multipleFields[field.pub.value][type].push(field[type].value);
                }
            }
            // console.log(multipleFields);
            var $container = $('<div></div>');
            //Start inserting results
            for (var i = 0; i < results.length; i++) {

                var title = '';
                var titleField = this.titleFields[this.categoryAncestors[results[i].typeID.value]][results[i].typeID.value];

                if (results[i][titleField]) {
                    title = results[i][titleField].value;
                }
                if (!title || title === '') {
                    if ('englishTitle' in results[i]) {
                        title = results[i].englishTitle.value;
                    } else if ('bookTitle' in results[i]) {
                        title = results[i].bookTitle.value;
                    }
                }

                var info_color = this.categoryColor[this.categoryAncestors[results[i].typeID.value]];
                var current_pub = results[i];
                var $row = $('<div class="row"></div>');
                var $icons = $('<div class="col-sm-2" style="padding-top:3px"></div>');

                var $download_icon = $('<a target="_blank" class="result-icons" data-toggle="tooltip" ' +
                    'data-placement="top" data-container="body" title="Download the PDF of ' +
                    'this Publication" style="color:inherit; visibility:hidden">' +
                    '<i class="icon-download" style="font-size:17px;"></i></a>');
                if ('localLink' in current_pub && !this.current_user.anonymous) {
                    $download_icon.attr('href', '../' + current_pub.localLink.value);
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
                    this.category_labels[results[i].typeID.value] + '" style="color:inherit">' +
                    '<i class="icon-info-circled" style="font-size:17px;display:block;' +
                    'color:' + info_color + '"></i></a>');
                var $edit_icon = $('<a href="' + this.base_url + '/publication/edit?uuid=' +
                    encodeURIComponent(current_pub.pub.value) + '&category=' +
                    encodeURIComponent(current_pub.typeID.value) + '" target="_blank" ' +
                    'class="result-icons" style="color:inherit"><i class="icon-edit" ' +
                    'style="font-size:17px;font-weight:bold;"></i></a>');

                var $share_icon = $('<a  class="result-icons share-btn" style="visibility:hidden"><i class="icon-share" style="font-size:17px;"></i></a>');
                var $share_icon_div = this.createShareButton('', title + ' | PRESS Publication System');
                $share_icon_div.prepend($share_icon);
                if ('publicationUrl' in current_pub) {
                    var $share_icon_div = this.createShareButton(window.location.origin + '/' + current_pub.publicationUrl.value, title + ' | PRESS Publication System');
                    $share_icon_div.prepend($share_icon);
                    $share_icon.css('visibility', 'visible');
                }
                var externalLink = '';
                if ('externalLink' in current_pub) {
                    $info_icon.attr('href', current_pub.externalLink.value);
                    $info_icon.attr('target', 'target="_blank"');
                }
                $icons.append($share_icon_div);
                $info_icon.mouseover(function(e) { $(this).tooltip(); });
                $info_icon.mouseover();



                $icons.append($info_icon);

                var addEdit = false;
                if ($.inArray('administrator', this.current_user.roles) > -1 || 
                    (!this.current_user.anonymous && 
                        $.inArray('Publication Mod Power User', this.current_user.roles) > -1 &&
                        (multipleFields[current_pub.pub.value] &&
                            'org' in multipleFields[current_pub.pub.value] && 
                            $.inArray(this.current_user['lab'], multipleFields[current_pub.pub.value]['org']) > -1)
                        )
                    ) {
                    addEdit = true;
                }

                var $pub_info = $('<div class="col-sm-10"></div>');

                if (current_pub.pub.value in contributors) { //NOTE: PRESS V3
                    jlength = this.contributorOrder[current_pub.typeID.value].length;
                    for (var j = 0; j < jlength; j++) {
                        current_contributor_type = this.contributorOrder[current_pub.typeID.value][j];
                        if (current_contributor_type in contributors[current_pub.pub.value]) {

                            length = contributors[current_pub.pub.value][current_contributor_type].length;
                            for (var x = 0; x < length; x++) {
                                var current_contributor = contributors[current_pub.pub.value][current_contributor_type][x];

                                if (!this.current_user.anonymous && addEdit === false) {
                                    // console.log(current_contributor);
                                    if (this.current_user.uuid === current_contributor.person.value) {
                                        addEdit = true;
                                    }
                                }

                                var givenName = '';
                                if ('givenName' in current_contributor) {
                                    givenName = current_contributor['givenName'].value;
                                }
                                var fullName = givenName + ' ' + current_contributor['familyName'].value;
                                var $author_link = $('<a  data-uuid="' + current_contributor['person'].value + '">' + fullName + '</a>');
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
                                $pub_info.append($author_link);
                                if ((x < length - 1) || (j < jlength - 1)) {
                                    $pub_info.append(', ');
                                }
                            }
                        }
                    }
                }
                if (addEdit) {
                    $icons.append($edit_icon);
                }

                if ('publicationUrl' in current_pub) {
                    $pub_info.append($('<a href="' + this.base_url +'/'+ current_pub.publicationUrl.value + '" target="_blank"><h5><strong>' + title + '</strong></h5></a>'));
                } else {
                    $pub_info.append($('<h5><strong>' + title + '</strong></h5>'));
                }
                // if ('orgName' in multipleFields[current_pub.pub.value]){
                //   for (var r=0; r<multipleFields[current_pub.pub.value].orgName.length; r++){
                //     $pub_info.append(multipleFields[current_pub.pub.value].orgName[r]);
                //     $pub_info.append(', ');
                //   }
                // }
                $pub_info.append(results[i].year.value);

                if (multipleFields[current_pub.pub.value] && 'tag' in multipleFields[current_pub.pub.value]) {
                    var $tagDiv = $('<div class="col-xs-12 pub-tags">Tags: </div>');
                    var $tagsMore = $('<div class="results-more-tags"></div>').hide();
                    for (var r = 0; r < multipleFields[current_pub.pub.value].tag.length; r++) {
                        var $span = $('<span class="pub-tag-item">' + multipleFields[current_pub.pub.value].tag[r] + '</span>');
                        $span.click((function(that) {
                            return function() {
                                that.clearSearchInput();
                                that.clearAdvancedSearch();
                                $('#tag-editable', that.advanced_search).append($('<li id="' + $(this).text() + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>'));
                                that.searchByFields();
                                that.clearAdvancedSearch();
                            };
                        })(this));
                        if(r<5){
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
            // this.results.empty();
            this.results.append($container);

            this.loader.hide();
        },

        /**
         * Creates and inserts the filter column containing the filtering functionality
         * for the publication search
         * 
         * @param  {Object} fieldResponse   The response from Blazegraph for the fields used
         * @param  {Object} contributorResponse The response from Blazegraph for the contributors used
         * @param  {Object} projectResponse The response from Blazegraph for the projects used
         * @param  {Object} tagResponse The response from Blazegraph for the tags used
         * @param  {Object} selected The user selected values used for filtering
         * @param  {string} prefixes The query prefixes
         * @param  {string} query The sparql query
         */
        insertFilters: function(fieldResponse, contributorResponse, projectResponse, tagResponse, selected, prefixes, query) {
            console.log(projectResponse);
            this.filters.empty();

            this.filters.append('<h3>FILTERS</h3><hr/>');
            this.filterLoader.hide();
            this.filters.append(this.filterLoader);
            var filterLoader = this.filterLoader;

            var contributorResults = contributorResponse.results.bindings;

            // var contributors = [];

            this.filters.append('<h4 class="col-xs-12">Authors</h4>');
            var contributorsDiv = $('<div class="col-xs-12"></div>');

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

            // Insert author filters
            function insertAuthors(contributors, div) {
                var $authorsMore = div.find('#show-more-authors');
                for (var i = 0; i < contributors.length; i++) {
                    var contributorDiv = $('<div class="search-filter search-filter-contributor" data-p="contributor" ' +
                        'data-o="?contributor" data-oVal="<' + contributors[i].contributoruuid.value + '>"></div>');
                    var name = '';
                    if ('contributorgivenName' in contributors[i]) {
                        name = contributors[i].contributorgivenName.value + ' ';
                    }
                    name += contributors[i].contributorfamilyName.value;
                    var contributor = $('<a  class="col-xs-12" style="display:block">' + name + ' <i style="color:grey">[' + contributors[i].pubcount.value + ']</i></a>');
                    contributorDiv.append(contributor);
                    if ($authorsMore.length > 0) {
                        $authorsMore.before(contributorDiv);
                    } else {
                        div.append(contributorDiv);
                    }

                    if (selected !== undefined) {
                        if (selected.contributors[contributorDiv.attr('data-oval')]) {
                            contributorDiv.attr('data-selected', 'selected');
                        }
                    }
                }
                
            }
            if (contributorResults.length === 15) {
                var authorsShowMore = $('<a id="show-more-authors" class="search-filter-more" ' +
                    'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                contributorsDiv.append(authorsShowMore);
                authorsShowMore.click(function(that) {
                    return function() {
                        $this = $(this);
                        $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                        $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);
                        $.when(that.getAuthorFilters(prefixes, query, $this.attr('data-offset'))).done(function(a) {
                            insertAuthors(a.results.bindings, contributorsDiv);
                            if (a.results.bindings.length < 15) {
                                contributorsDiv.find('#show-more-authors').remove();
                            }
                            contributorsDiv.find('.search-filter').off('click');
                            contributorsDiv.find('.search-filter').off('click').click(onFilterClick(that));
                            $this.siblings('.filterLoader').remove();
                        });
                    }
                }(this));
            }

            insertAuthors(contributorResults, contributorsDiv);

            this.filters.append(contributorsDiv);

            //Insert field filters (year, org, categories)
            var results = fieldResponse.results.bindings;

            var years = [];
            var orgs = [];
            var categories = [];
            // var tags = [];

            for (var i = 0; i < results.length; i++) {
                switch (results[i].p.value) {
                    case this.prefix + 'year':
                        years.push({ val: parseInt(results[i].o.value), count: parseInt(results[i].oCount.value) });
                        break;
                    case this.prefix + 'belongsTo':
                        orgs.push({ val: results[i].o.value, count: parseInt(results[i].oCount.value) });
                        break;
                    case 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type':
                        categories.push({ val: results[i].o.value, count: parseInt(results[i].oCount.value) });
                        break;
                    default:
                        console.error('Insert Filter Error. Unknown value type ' + results[i].p.value);
                }
            }
            years = years.sort(function(a, b) { return b.val - a.val; });
            orgs = orgs.sort(function(a, b) { return b.count - a.count; });
            categories = categories.sort(function(a, b) { return b.count - a.count; });
            // tags = tags.sort(function(a, b) { return b.count - a.count; });
            // console.log(years);
            // console.log(orgs);
            // console.log(categories);
            // console.log(tags);

            // Insert tag filters
            this.filters.append('<h4 class="col-xs-12">Tags</h4>');
            var tagsDiv = $('<div class="col-xs-12"></div>');

            var tagResults = tagResponse.results.bindings;

            function insertTags(tags, div) {
                var $tagsMore = div.find('#filters-show-more-tags');
                for (var i = 0; i < tags.length; i++) {
                    var tagDiv = $('<div class="search-filter search-filter-tags" data-p="press:tag" ' +
                        'data-o="?tag" data-oVal="&quot;' + tags[i].tag.value + '&quot;"></div>');
                    var tag = $('<a  class="col-xs-12" style="display:block">' + tags[i].tag.value + ' <i style="color:grey">[' + tags[i].Tagcount.value + ']</i></a>');
                    tagDiv.append(tag);
                    if ($tagsMore.length > 0) {
                        $tagsMore.before(tagDiv);
                    } else {
                        div.append(tagDiv);
                    }

                    if (selected !== undefined) {
                        if (selected.tags[tagDiv.attr('data-oval')]) {
                            tagDiv.attr('data-selected', 'selected');
                        }
                    }
                }
            }
            if (tagResults.length === 15) {
                var tagsShowMore = $('<a id="filters-show-more-tags" class="search-filter-more" ' +
                    'class="col-xs-12" style="display:block;" data-offset="0">Show More</a>');
                tagsDiv.append(tagsShowMore);
                tagsShowMore.click(function(that) {
                    return function() {
                        $this = $(this);
                        $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                        $this.attr('data-offset', parseInt($this.attr('data-offset')) + 15);
                        $.when(that.getTagFilters(prefixes, query, $this.attr('data-offset'))).done(function(a) {
                            insertTags(a.results.bindings, tagsDiv);
                            if (a.results.bindings.length < 15) {
                                tagsDiv.find('#filters-show-more-tags').remove();
                            }
                            $this.before(that.filterLoader.clone().css('position', 'absolute').show());
                            $this.siblings('.filterLoader').remove();
                        });
                    }
                }(this));
            }

            insertTags(tagResults, tagsDiv);

            this.filters.append(tagsDiv);

            // Insert Year filters
            this.filters.append('<h4 class="col-xs-12">Year</h4>');
            var yearsDiv = $('<div class="col-xs-12"></div>');
            for (var i = 0; i < years.length; i++) {
                var yearDiv = $('<div class="search-filter search-filter-year" data-p="press:year" ' +
                    'data-o="?year" data-oVal="&quot;' + years[i].val + '&quot;" style="width:40%"></div>');

                var year = $('<a >' + years[i].val + ' <i style="color:grey">[' + years[i].count + ']</i></a>');
                yearDiv.append(year);
                yearsDiv.append(yearDiv);
                if (selected !== undefined) {
                    if (selected.year[yearDiv.attr('data-oval')]) {
                        yearDiv.attr('data-selected', 'selected');
                    }
                }
                yearsDiv.append(' ');
            }
            this.filters.append(yearsDiv);

            // Insert category filters
            this.filters.append('<h4 class="col-xs-12">Category</h4>');
            var categoriesDiv = $('<div class="col-xs-12"></div>');
            for (var i = 0; i < categories.length; i++) {
                var categoryDiv = $('<div class="search-filter search-filter-category" data-p="rdf:type" ' +
                    'data-o="?type" data-oVal ="<' + categories[i].val + '>"></div>');
                var category = $('<a  class="col-xs-12" style="display:block;">' +
                    this.category_labels[categories[i].val.split('#')[1]] + ' <i style="color:grey">[' + categories[i].count + ']</i></a>');
                categoryDiv.append(category);
                categoriesDiv.append(categoryDiv);

                if (selected !== undefined) {
                    if (selected.category[categoryDiv.attr('data-oval')]) {
                        categoryDiv.attr('data-selected', 'selected');
                    }
                }
            }
            this.filters.append(categoriesDiv);

            // Insert organization filters
            this.filters.append('<h4 class="col-xs-12">Organization</h4>');
            var orgsDiv = $('<div class="col-xs-12"></div>');
            for (var i = 0; i < orgs.length; i++) {
                var orgDiv = $('<div class="search-filter search-filter-org" data-p="press:belongsTo" ' +
                    'data-o="?org" data-oVal ="<' + orgs[i].val + '>"></div>');
                var org = $('<a  class="col-xs-12" style="display:block;">' +
                    orgs[i].val.split('#Organization/')[1] + ' <i style="color:grey">[' + orgs[i].count + ']</i></a>');
                orgDiv.append(org);
                orgsDiv.append(orgDiv);

                if (selected !== undefined) {
                    if (selected.org[orgDiv.attr('data-oval')]) {
                        orgDiv.attr('data-selected', 'selected');
                    }
                }
            }
            this.filters.append(orgsDiv);

            // Insert project filters
            this.filters.append('<h4 class="col-xs-12">Projects</h4>');
            var projectsDiv = $('<div class="col-xs-12"></div>');
            var projects = projectResponse.results.bindings;


            for (var i = 0; i < projects.length; i++) {
                var projectDiv = $('<div class="search-filter search-filter-project" data-p="press:appearsIn" ' +
                    'data-o="?project" data-oVal="<' + projects[i].projectUUID.value + '>"></div>');
                var projectName = projects[i].projectName.value;
                var project = $('<a  class="col-xs-12" style="display:block">' + projectName + ' <i style="color:grey">[' + projects[i].pubcount.value + ']</i></a>');
                projectDiv.append(project);
                projectsDiv.append(projectDiv);

                if (selected !== undefined) {
                    if (selected.projects[projectDiv.attr('data-oval')]) {
                        projectDiv.attr('data-selected', 'selected');
                    }
                }
            }

            this.filters.append(projectsDiv);

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

            // console.log(this.lastQueryWithoutFilters[0]);
        },

        /**
         * Adds limit and offset to a query and makes the request to Blazegraph.
         * 
         * @param  {string} q The Query 
         * @param  {number} limit The limit of the query
         * @param  {number} offset The offset of the query
         * @return {Object} A jqXHR object
         */
        getQuery: function(q, limit, offset) {
            if (typeof limit === 'undefined') {
                limit = 0;
            }
            if (typeof offset === 'undefined') {
                offset = 0;
            }
            if (limit > 0) {
                q += ' limit ' + limit;
            }
            if (offset > 0) {
                q += ' offset ' + offset;
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