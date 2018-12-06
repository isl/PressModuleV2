/**
 * @fileOverview Creates Add and Edit Publication pages
 */

/**
 * The main function to create the PRESS Library
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Make globaly available as well
        define(['jquery'], function(jquery) {
            return (root.press = factory(jquery));
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
    var PRESS = function(element, options, cb) {

        this.base_url = "../";
        this.dbURL = "";
        this.prefix = "";
        this.category_tree = {};
        this.element = $(element);
        this.fieldElement = $('<div id="form-fields"></div>');
        this.fields = {};
        this.project_ids = {};
        this.project_names = [];
        this.projects = [];
        this.labs = {};
        this.authorGroups = {};
        this.current_user = {};
        this.JSONfields = JSONfields;
        this.contributorOrder = JSONContributorOrder;
        this.personFields = personFields;
        this.titleFields = titleFields;
        this.requiredFields = JSONrequiredFields;
        this.bloodhounds = {};
        this.leftButtonArea = $('<div class="col-sm-6" id="leftButtonArea"></div>');
        this.rightButtonArea = $('<div class="col-sm-6" id="rightButtonArea" style="float:right"></div>');
        this.buttonArea = $('<div id="buttonArea"></div>');
        this.buttonArea.append(this.leftButtonArea);
        this.buttonArea.append(this.rightButtonArea);
        this.cat;
        this.subcat;
        this.doiCategoriesToPRESS = doiCategoriesToPRESS;
        this.doiModal;
        this.doiFieldsToPRESS = doiFieldsToPRESS;
        this.oldFields = {};
        this.organization_label = 'Organization';
        this.externalAuthorModal;
        this.tags = [];

        this.creationDate = '';

        this.editMode = false;
        this.editPublication = {};
        this.deleteModal;

        this.categoryAncestors = {};
        this.categoryDescendants = {};

        function findDescendants(object, descendantObject, depth) {
            for (key in object) {
                if (typeof object[key] === 'object' && !($.isArray(object[key]))) {
                    descendantObject.push(key);
                    descendantObject = findDescendants(object[key], descendantObject, depth + 1);
                } else if ($.isArray(object[key])) {
                    descendantObject.push(key);

                }
            }
            return descendantObject;
        }

        for (key in this.JSONfields) {
            this.categoryDescendants[key] = [];
            this.categoryDescendants[key] = findDescendants(this.JSONfields[key], this.categoryDescendants[key], 0);
        }


        for (key in this.categoryDescendants) {
            for (var i = 0; i < this.categoryDescendants[key].length; i++) {
                this.categoryAncestors[this.categoryDescendants[key][i]] = key;
            }
        }

        String.prototype.escapeHtml = function() {
            var entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;',
                '`': '&#x60;',
                '=': '&#x3D;'
            };
            return this.replace(/[&<>"'`=\/]/g, function(s) {
                return entityMap[s];
            });
        }

        String.prototype.escapeSpecialChars = function() {
            return this.replace(/\n/g, "\\n");
        };



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

        if (typeof options.organization_label === 'string')
            this.organization_label = options.organization_label;

        if (typeof options.labs === 'object')
            this.labs = options.labs;

        if (typeof options.current_user === 'object')
            this.current_user = options.current_user;

        if (typeof options.authorGroups === 'object')
            this.authorGroups = options.authorGroups;

        if (typeof options.editMode === 'boolean')
            this.editMode = options.editMode;

        if (typeof options.editPublication === 'object')
            this.editPublication = options.editPublication;

        if (typeof options.max_file_size === 'string')
            this.max_file_size = options.max_file_size;

        // console.log(this.current_user);

        this.loader = $('<div id="loader"></div>');
        this.loader.hide();
        
        this.loader.show();
        this.element.append(this.loader);
        
        //Retreive from blazegraph the tags, categories, data properties(fields)
        // On success, start inserting the fields
        // $.when(this.getTags(), this.getCategories(), this.getDataProperties()).always($.proxy(function(a1, a2, a3) {
        $.when(this.getCategories(), this.getDataProperties()).always($.proxy(function(a1, a2) {
            if (!(a1[1] === "success" && a2[1] === "success")) {
                console.error('GET was unsuccesfull');
                return;
            }

            this.loader.hide();

            this.insertLabs(this.labs);

            this.insertCategories(this.category_tree);

            this.element.append(this.fieldElement);

            this.element.append($('<p>&nbsp;</p>'));

            this.element.append(this.buttonArea);
            this.insertButtons();

            var symbolExplaination = $('<small id="symbol-explaination" class="col-sm-6" style="color:red; margin-top: 10px;">(*) Required Field<br>(**) Fill at least one of these fields</small>');
            this.element.append(symbolExplaination);
            
            this.doiModal = this.createDOImodal();
            this.element.append(this.doiModal);

            this.copyrightModal = this.createCopyrightModal();
            this.element.append(this.copyrightModal);

            var non_existing = [];
            var my_fields = this.fields;

            function checkExistance(fields) {
                if (typeof fields === 'object' && !Array.isArray(fields)) {
                    for (key in fields) {
                        checkExistance(fields[key]);
                    }
                } else if (Array.isArray(fields)) {
                    for (var i = 0; i < fields.length; i++) {
                        checkExistance(fields[i]);
                    }
                } else if (typeof fields === 'string') {
                    if ($.inArray(fields, my_fields) === -1 && $.inArray(fields, non_existing) === -1) {
                        non_existing[non_existing.length] = fields;
                    }
                }
            }
            checkExistance(JSONfields);

            if (this.editMode) { //Edit Mode
                var categories = this.JSONfields;

                function findFields(object, id) { //Get Fields of Certain Category
                    if (id in object && $.isArray(object[id])) {
                        return object[id];
                    }
                    if (!$.isArray(object)) {
                        for (key in object) {
                            var result = findFields(object[key], id);
                            if ($.isArray(result)) return result;
                        }
                    }
                }


                var pubFields = [].concat.apply([], findFields(categories, this.editPublication.category));

                pubFields = pubFields.filter(function(value, index, arr){
                    return value !== 'project' && value !== 'tag';
                });

                this.getPublicationInfo(this.editPublication.uuid, pubFields);
            }

        }, this));
    };

    PRESS.prototype = {
        constructor: PRESS,

        /**
         * Queries blazegraph for the publication info and calls insertData() to
         * fill the fields
         * 
         * @param {string} query The query to be requested 
         */
        getPublicationInfo: function(uuid, pubFields) {
            $.ajax({
                    dataType: 'json',
                    method: 'GET',
                    url: '/ajax/publications/get_publication_info',
                    data: {
                        uuid: uuid,
                        pubFields: pubFields,
                    }
                }).done($.proxy(function(response) {
                    this.insertData(response);
                }, this))
                .fail(function(response) {
                    alert('Oops! There was an Error with retrieving publication info. See console for more info.');
                    console.error(response);
                })
        },


        /**
         * Fills the fields of the from based on a response from the Blazegraph Server.
         *  
         * @param {Object} response The response of Blazegraph API
         */
        insertData: function(response) {
            results = response.results.bindings;

            var category = this.categoryAncestors[this.editPublication.category];
            var subcategory = this.editPublication.category;

            //Select the category & trigger the change to show the fields
            this.cat.val(category);
            this.cat.change();
            this.subcat.val(subcategory);
            this.subcat.change();

            var contributors = {};


            for (var i = 0; i < results.length; i++) {
                if ('org' in results[i]) { //Fill organization values
                    var $ul = $('#lab-editable', this.element);
                    var splited_lab = results[i].org.value.split('/');
                    if ($.inArray('administrator', this.current_user.roles) === -1 &&
                        splited_lab[splited_lab.length -1] === this.labs[this.current_user.lab]) {
                        var valid = true;
                        $('.lab-item').each($.proxy(function(index, element) {
                            if ($(element).attr('id') === this.labs[this.current_user.lab]) {
                                return valid = false;
                            }
                        }, this));
                        if (valid) {
                            $ul.append($('<li id="' + this.labs[this.current_user.lab] + '" class="lab-item list-group-item" draggable="false" style="float:left">' + this.labs[this.current_user.lab] + '</li>'));
                            $ul.show();
                        }
                    } else {
                        var $li = $('<li id="' + results[i].org.value.split('#Organization/')[1] + '" class="lab-item list-group-item" draggable="false" style="float:left"></li>');
                        $ul.append($li);
                        $li.text(results[i].orgName.value);
                        $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                        $ul.show();
                    }
                } else if ('con' in results[i]) { // Fill contributor values
                    var conType = results[i].con.value.split('#')[1];
                    if (!(conType in contributors)) {
                        contributors[conType] = [];
                    }
                    var $li = $('<li class="list-group-item" draggable="false" style="float:left;"></li>');
                    var mail = '';
                    if ('mbox' in results[i]) {
                        mail = 'data-mail="' + results[i].mbox.value.substring(7) + '"';
                        $li.attr('title', results[i].mbox.value.substring(7));
                    }
                    var author_group = "";
                    for (key in this.authorGroups) {
                        if (results[i].group.value === key && ('span' in this.authorGroups[key])) {
                            author_group = this.authorGroups[key].span;
                        }
                    }

                    var fullName = '';
                    if ('givenName' in results[i]) {
                        fullName = results[i].givenName.value + ' ';
                    }
                    fullName += results[i].familyName.value;

                    $li.html(author_group + '<span class="' + conType + '-contributor-name' +
                        ' contributor" data-uuid="' + results[i].person.value + '" data-field="' + conType +
                        '" ' + mail + '>' + fullName + '</span>');

                    $('<i class="js-remove">✖</i>').appendTo($li);
                    contributors[conType].push({
                        element: $li,
                        index: parseInt(results[i].personIndex.value)
                    });
                } else if ('project' in results[i]) {       //Fill project values
                    var $list = $('#project-editable', this.element);
                    var $li = $('<li id="' + results[i].project.value + '" class="project-item list-group-item" draggable="false" style="float:left" title="' + results[i].projectName.value + '"></li>');

                    $list.append($li);
                    $li.html(results[i].projectName.value);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                } else if ('tag' in results[i]) {           // Fill tag values
                    var $list = $('#tag-editable', this.element);
                    var $li = $('<li id="' + results[i].tag.value + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>');

                    $list.append($li);
                    $li.html(results[i].tag.value);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                } else {                        // Fill the rest of the values
                    for (key in results[i]) {
                        if ('creationDate' === key) {
                            this.creationDate = results[i].creationDate.value;
                        } else if ('modifiedDate' !== key && key.indexOf('Date') > -1) {
                            $('#' + key, this.element).data('daterangepicker').setStartDate(results[i][key].value);
                            $('#' + key, this.element).data('daterangepicker').setEndDate(results[i][key].value);
                        } else if (key === 'localLink') {
                            $('#' + key, this.element).parent().parent().append('<div><div class="col-sm-2"></div>' +
                                '<small class="col-sm-10"><a href="' + this.base_url + '/' + results[i][key].value + '" target="_blank">Current File</a>' +
                                '. Leave blank to keep the same file</small></div>');
                            this.localLink = results[i][key].value;
                        } else {
                            $('#' + key, this.element).val(results[i][key].value); //TODO: FIX localLink, pdf edit
                        }
                    }
                }
                // Sort the contributors based on the order
                for (key in contributors) {
                    var $conEditable = $('#' + key + '-editable', this.element);
                    contributors[key].sort(function(a, b) { return a.index - b.index });
                    for (var j = 0; j < contributors[key].length; j++) {
                        $conEditable.append(contributors[key][j].element);
                    }
                    $conEditable.show();
                }
            }
        },
        
        /**
         * Makes a request to retrieve the categories from Blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getCategories: function() {
            return $.ajax({

                    dataType: 'json',
                    method: "GET",
                    url: '/ajax/publications/get_categories',
                })
                .done($.proxy(function(response) {
                    var category_tree = {};
                    results = response.results.bindings;

                    // Transforms the array return to a tree based on subclasses
                    function array_to_tree(array, father) {
                        var tree = {};
                        for (let i = 0; i < array.length; i++) {
                            if ('superclassid' in array[i] && array[i]['superclassid'].value === father) {
                                tree[array[i]['lowid'].value] = {};
                                if ('lowlabel' in array[i]) {
                                    tree[array[i]['lowid'].value].label = array[i]['lowlabel'].value;
                                }
                                if ('optgroup' in array[i]) {
                                    tree[array[i]['lowid'].value].optgroup = array[i]['optgroup'].value;
                                }
                                tree[array[i]['lowid'].value]['children'] = array_to_tree(array, array[i]['lowid'].value);
                            }
                        }
                        return tree;
                    }

                    category_tree = array_to_tree(results, 'Publication');
                    return this.category_tree = category_tree;
                }, this))
                .fail(function(response) {
                    alert("Oops! There was an error with getting categories! See console for more info.");
                    console.error(response);
                });
        },
        /**
         * Makes a request to retrieve the tags from Blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getTags: function() {
            tags = [];
            return $.ajax({
                    dataType: 'json',
                    method: "GET",
                    url: '/ajax/publications/get_tags',
                })
                .done($.proxy(function(response) {
                    for (var i = 0; i < response.results.bindings.length; i++) {
                        tags[i] = response.results.bindings[i].tag.value;
                    }
                    this.tags = tags;
                }, this))
                .fail(function(response) {
                    alert("Oops! There was an error with getting the tags! See console for more info.");
                    console.error(response);
                });
        },
        /**
         * Makes a request to retrieve the data properties from Blazegraph
         * 
         * @return {Object} A jqXHR object
         */
        getDataProperties: function() { //NOTE: PRESS V3
            return $.ajax({
                    dataType: 'json',
                    method: "GET",
                    url: '/ajax/publications/get_data_properties',
                })
                .done($.proxy(function(response) {
                    results = response.results.bindings;
                    console.log("getDataProperties");
                    console.log(results);
                    var fields = {};
                    for (let i = 0; i < results.length; i++) {
                        fields[results[i].pid.value] = {
                            id: results[i].pid.value,
                            type: results[i].ptype.value,
                            range: results[i].range.value,
                        };
                        if ('label' in results[i]) {
                            fields[results[i].pid.value].label = results[i].label.value;
                        }
                    }
                    this.fields = fields;
                }, this))
                .fail(function(response) {
                    alert('Oops! There was an error with getting data properties! See console for more info.');
                    console.error(response);
                });
            // this.fields = fields;
        },
        /**
         * Adds the Organization Field using typeahead and sortable.js
         * 
         * @param  {Object} labs The available organiations/labs
         */
        insertLabs: function(labs) {
            $input = $('<input class="typeahead form-control input-sm press-field" ' +
                'id="lab-input" data-label="' + this.organization_label + '" type="text" placeholder="Search..."/>');
            $ul = $('<ul id="lab-editable" class="list-group editable" style="display:none"></ul>');
            var $labgroup = $('<div id="lab-group" class="form-group"></div>');
            var $div = $('<div class="required"></div>');
            var $col_div = $('<div class="col-sm-10"></div>');
            $div.append($('<label class="col-sm-2 control-label" for="lab-input">' + this.organization_label + ':</label>'));
            $labgroup.append($div);
            $div.append($col_div)
            $col_div.append($input);
            $col_div.append($ul);

            this.element.append($labgroup);

            var labValues = Object.keys(labs);
            var labValueToKey = {};
            for (key in labs) {
                labValueToKey[labs[key]] = key;
            }
            var labsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                local: labValues
            });

            function labWithDefaults(q, sync) {
                if (q === '') {
                    sync(labsBlood.index.all());
                    // console.log(labsBlood.index.all());
                } else {
                    labsBlood.search(q, sync);
                }
            }

            $input.typeahead({
                highlight: true,
                minLength: 0
            }, {
                limit: 100,
                name: 'labs',
                source: labWithDefaults
            });

            var sortable = Sortable.create($('#lab-editable')[0], {
                filter: '.js-remove',
                draggable: '.lab-item',
                onFilter: function(evt) {
                    console.log('removed');
                    parent = evt.item.parentNode;
                    parent.removeChild(evt.item);

                    if (parent.children.length === 0) {
                        parent.style.display = "none";
                    }
                }
            });
            if (!this.editMode) {
                if ($.inArray('administrator', this.current_user.roles) === -1) {
                    $ul.append($('<li id="' + this.current_user.lab + '" class="lab-item list-group-item" draggable="false" style="float:left">' + labValueToKey[this.current_user.lab] + '</li>'));
                    $ul.show();
                } else {
                    $ul.append($('<li id="' + this.current_user.lab + '" class="lab-item list-group-item" draggable="false" style="float:left">' + labValueToKey[this.current_user.lab] + '<i class="js-remove">&nbsp;✖</i></li>'));
                    $ul.show();
                }
            }

            $input.bind('typeahead:select', function(ev, suggestion) {
                var $list = $('#lab-editable');
                var valid = true;
                $('.lab-item').each(function() {
                    if ($(this).attr('id') === suggestion) {
                        return valid = false;
                    }
                });
                if (valid) {
                    var $li = $('<li id="' + labs[suggestion] + '" class="lab-item list-group-item" draggable="false" style="float:left"></li>');
                    $list.append($li);
                    $li.html(suggestion);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                }
                $(this).blur();
                setTimeout(function() {
                    $('#lab-input').typeahead('val', '');
                }, 10);
            });
        },
        /**
         * Creates the Category and Subcategory fields and adds trigger events
         * to display their fields on change
         * 
         * @param  {Object} category_tree An object that contains categories and
         * subcategories as subclasses
         */
        insertCategories: function(category_tree) {
            this.cat = $('<select class="form-control input-sm" id="category"></select>');
            this.subcat = $('<select class="form-control input-sm" id="subcategory" disabled></select>');

            $catgroup = $('<div id="category-group" class="form-group"></div>');
            $div = $('<div class="required"></div>');
            $col_div = $('<div class="col-sm-10"></div>');
            $div.append($('<label class="col-sm-2 control-label" for="category">Category:</label>'));
            $catgroup.append($div);
            $div.append($col_div);
            $col_div.append(this.cat);


            this.element.append($catgroup);

            $subcatgroup = $('<div id="subcategory-group" class="form-group"></div>');
            $sdiv = $('<div class="required"></div>');
            $sub_col_div = $('<div class="col-sm-10"></div>');
            $sdiv.append($('<label class="col-sm-2 control-label required" for="subcategory">Subcategory:</label>'));
            $subcatgroup.append($sdiv);
            $sdiv.append($sub_col_div);
            $sub_col_div.append(this.subcat);

            this.element.append($subcatgroup);

            this.cat.append($('<option value="">Select Category</option>'));
            this.subcat.append($('<option value="">Select Subcategory</option>'));
            for (key in category_tree) {
                this.cat.append($('<option value="' + key + '">' + category_tree[key].label + '</option>'));
            }

            this.cat.change((function(subcat) { //TODO: Keep Old Fields
                subcat.empty();

                $('#form-fields').hide();
                if ($(this).val() === '') {
                    subcat.append($('<option value="">Select Subcategory</option>'));
                    subcat.prop('disabled', 'disabled');
                    return;
                }
                subcat.append($('<option value="">Select Subcategory</option>'));
                for (key in category_tree[$(this).val()].children) {
                    if (category_tree[$(this).val()].children[key].optgroup) {
                        var $opt = $('<optgroup id="' + key + '" label="' + category_tree[$(this).val()].children[key].label + '"></optgroup>');
                        subcat.append($opt);
                        for (key2 in category_tree[$(this).val()].children[key].children) {
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

            this.subcat.change($.proxy(function() { //TODO: Keep Old Fields
                var oldFields = {};

                $('input[type!=file], textarea', '#form-fields').each(function() {
                    if ($(this).val() !== '')
                        oldFields[$(this).attr('id')] = $(this).val();
                });
                $('.list-group', '#form-fields').each(function(){
                    if ($(this).children().length > 0){
                        oldFields[$(this).attr('id')] = $(this).children();
                    }
                });
                this.oldFields = oldFields;
                $('#form-fields').empty();
                $('#form-fields').show();
                if (this.subcat.val() !== '') {
                    var $selected = $(':selected', this.subcat);
                    if ($selected.parent().prop('tagName') === 'OPTGROUP') {
                        this.insertFields(this.JSONfields[this.cat.val()][$selected.parent().attr('id')][this.subcat.val()],
                            this.requiredFields[this.cat.val()][$selected.parent().attr('id')][this.subcat.val()]);
                    } else {
                        this.insertFields(this.JSONfields[this.cat.val()][this.subcat.val()],
                            this.requiredFields[this.cat.val()][this.subcat.val()]);
                    }
                }

            }, this));
        },

        /**
         * Adds a contributor field using typeahead and sortable.js
         * 
         * @param  {Object} field An object with the field id and label. {id: 'author', label: 'Authors'}
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertPersonField: function(field, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $group = $('<div class="form-group '+ required +'"></div>')
            $group.attr('id', field.id + '-bloodhound');
            var $label = $('<label class="col-sm-2 control-label"></label>');
            $label.attr('for', field.id + '-input');
            // $label.append(required);
            $label.append(field.label + ':');
            var $d = $('<div class="col-sm-10 scrollable-dropdown-menu"></div>');
            var tooltip = 'Each word has to be at least 3 characters long to search.\nPress Enter to add a new External Contributor.';
            var $input = $('<input class="person-input typeahead form-control input-sm ' +
                'press-field" data-toggle="tooltip" type="text" placeholder="Search..."/>');
            $input.attr('id', field.id + '-input');
            $input.attr('title', tooltip);
            $input.attr('data-label', field.label);
            $input.mouseover(function(e) { $(this).tooltip() });
            $input.mouseover();
            $d.append($input);

            $group.append($label);
            $group.append($d);
            if (Object.keys(this.bloodhounds).length === 0) {   // Multiple bloodhounds, one for each author group (internal, external)
                for (key in this.authorGroups) {
                    this.bloodhounds[key] = new Bloodhound({
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tokens'),
                        sufficient: 500,
                        remote: {
                            url: '/ajax/publications/search_author',
                            wildcard: '%QUERY',
                            // rateLimitBy: 'throttle',
                            // rateLimitWait: 0,
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
                                }
                            })(key, this.prefix),
                            transform: (function(groupKey) {
                                return function(response) {
                                    if (typeof response !== 'object') return [];
                                    var tr = [];
                                    var results = response.results.bindings;
                                    for (let i = 0; i < results.length; i++) {
                                        tr[i] = {
                                            uuid: results[i].uuid.value,
                                            fullName: results[i].fullName.value,
                                            familyName: results[i].familyName.value,
                                            tokens: [results[i].familyName.value, results[i].givenName.value],
                                            group: groupKey
                                        }
                                        if ('mail' in results[i]) {
                                            tr[i].mail = results[i].mail.value;
                                        }
                                        if ('givenName' in results[i]) {
                                            tr[i].givenName = results[i].givenName.value;
                                        }
                                    }
                                    return tr;
                                }
                            })(key),
                            cache: false
                        }
                    });
                }
            }
            var datasets = [];
            var j = 0;
            for (key in this.authorGroups) { // One dataset per group

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
                }
            }
            var autocomplete = $input.typeahead({
                hint: false,
                highlight: false,
                minLength: 3
            }, datasets);

            // Create sortable

            var $ul = $('<ul id="' + field.id + '-editable" class="list-group editable" style="display:none"></ul>');
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
            if(this.oldFields[$ul.attr('id')]){
                $ul.append(this.oldFields[$ul.attr('id')]);
                $ul.show();
            }
            
            //Add External Author Modal
            var $exAuthorsModal = $('#externalAuthorModal');
            if ($exAuthorsModal.length === 0) {
                var $exAuthorsModal = $('<div id="externalAuthorModal" class="modal fade" role="dialog"></div>');
                var $divmod = $('<div class="modal-dialog modal-lg"></div>');
                var $modcont = $('<div class="modal-content"></div>');
                $modcont.append($('<div class="modal-header">' +
                    '<button type="button btn-md" class="close" data-dismiss="modal">&times;</button>' +
                    '<h4 class="modal-title">Add External Author</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<form id="abstractForm" class="form-horizontal" role="form">' +
                    '<div class="form-group">' +
                    '<div>' +
                    '<label class="col-sm-2 control-label" for="externalFirstName">First Name:</label>' +
                    '<div class="col-sm-4">' +
                    '<input class="form-control input-sm" id="externalFirstName" type="text" />' +
                    '</div>' +
                    '</div>' +
                    '<div>' +
                    '<label class="col-sm-2 control-label" for="externalLastName">Last Name:</label>' +
                    '<div class="col-sm-4">' +
                    '<input class="form-control input-sm" id="externalLastName" type="text" />' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                    '<label class="col-sm-2 control-label" for="externalAuthorMail">Author E-mail:</label>' +
                    '<div class="col-sm-10">' +
                    '<input class="form-control input-sm" id="externalAuthorMail" type="text" />' +
                    '</div>' +
                    '</div>' +
                    '</form>' +
                    '</div>'));
                var $modfooter = $('<div class="modal-footer"><button type="button" class="btn btn-default btn-md" data-dismiss="modal">Close</button></div>');
                var $submitButton = $('<button>', {
                    text: 'Apply',
                    id: 'exAuthorSubmit',
                    type: 'button',
                    class: 'btn btn-primary btn-md',
                    click: (function() {

                        $.get('/ajax/publications/get_uuid')
                            .done($.proxy(function(response) {
                                var uuid = 'urn:uuid:' + response;
                                var query = 'prefix foaf: <http://xmlns.com/foaf/0.1/>\n';
                                var firstName = $('#externalFirstName').val();
                                var lastName = $('#externalLastName').val();
                                var mail = $('#externalAuthorMail').val();
                                // query += 'INSERT{ \n';
                                // query += '?uuid rdf:type foaf:Person; \n';
                                // query += '<' + this.prefix + 'personGroup> "External_Author"; \n';
                                // query += 'foaf:familyName "' + lastName + '"; \n';
                                // query += 'foaf:givenName "' + firstName + '"; \n';
                                // query += 'foaf:mbox "mailto:' + $('#externalAuthorMail').val() + '"; \n';
                                // query += '<' + this.prefix + 'personUuid> ?struuid . \n';
                                // query += '}WHERE{\n';
                                // query += 'SELECT ?uuid ?struuid WHERE {BIND(<' + uuid + '> as ?uuid). BIND(str(?uuid) as ?struuid)} \n';
                                // query += '}';

                                this.loader.show();
                                $.when(this.insertExternalAuthor(uuid, firstName, lastName, mail)).done($.proxy(function(a) {
                                        this.loader.hide();
                                        var $alert = $('<div class="alert alert-success alert-dismissable fade in">' +
                                            '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                                            '<strong>Success!</strong> New External Author "' + firstName + ' ' + lastName + '" was added.' +
                                            '</div>');
                                        this.element.prepend($alert);
                                        $alert.fadeTo(2000, 500).slideUp(500, function() {
                                            $alert.slideUp(500);
                                        });
                                        var fullName = $('#externalFirstName').val() + ' ' + $('#externalLastName').val();
                                        var $list = $('#' + field.id + '-editable');
                                        var $li = $('<li class="list-group-item" title="' + $('#externalAuthorMail').val() +
                                            '" draggable="false" style="float:left"><span class="' + field.id + '-contributor-name' +
                                            ' contributor" data-uuid="' + uuid + '" data-field="' + field.id +
                                            '" data-mail="' + $('#externalAuthorMail').val() + '">' + fullName + '</span></li>');
                                        $('<i class="js-remove">✖</i>').appendTo($li);
                                        // $li.html('<span class="' + field.id + '-contributor-name'+
                                        //   ' contributor" data-uuid="'+uuid+'" data-field="'+field.id+
                                        //   '" ' +$('#externalAuthorMail').val() + '>' + fullName + '</span>');
                                        $list.append($li);
                                        $list.show();
                                        $('#externalAuthorModal').modal('hide');
                                        $('#externalAuthorModal input').val('');
                                    }, this))
                                    .fail($.proxy(function(a) {
                                        this.loader.hide();
                                        $('#externalAuthorModal').modal('hide');
                                        $('#externalAuthorModal input').val('');
                                        var $alert = $('<div class="alert alert-danger alert-dismissable fade in">' +
                                            '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                                            '<strong>Warning!</strong> New External Author addition Failed!' +
                                            '</div>');
                                        this.element.prepend($alert);
                                    }, this));
                            }, this))
                    }).bind(this)
                });
                $exAuthorsModal.append($divmod);
                $divmod.append($modcont);

                $exAuthorsModal.on('shown.bs.modal', function() {
                    $('#externalFirstName').focus();
                })

                $modfooter.append($submitButton);
                $modcont.append($modfooter);
            }

            $input.bind('typeahead:select keypress', (function(that) {
                return function(ev, suggestion) {
                    if (ev.type === 'keypress' && ev.which != 13) {
                        return;
                    }

                    var valid = true;
                    $(ev.type !== 'keypress' && '.' + field.id + '-contributor-name').each(function() {
                        if ($(this).attr('data-uuid') === suggestion.uuid) {
                            return valid = false;
                        }
                    });
                    if (valid) {
                        var $list = $('#' + field.id + '-editable');
                        var $li;
                        if (ev.type === 'typeahead:select') {
                            var mail = '';
                            if ('mail' in suggestion) {
                                mail = 'title="' + suggestion.mail + '"';
                            }
                            $li = $('<li class="list-group-item" ' + mail + '" draggable="false" style="float:left"></li>');
                        }
                        $list.append($li);


                        if (ev.type === 'keypress') {   //On empty enter
                            $exAuthorsModal.modal();
                        } else {    //Add author
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
                            $li.html(author_group + '<span class="' + field.id + '-contributor-name' +
                                ' contributor" data-uuid="' + suggestion.uuid + '" data-field="' + field.id +
                                '" ' + mail + '>' + suggestion.fullName + '</span>');

                            $('<i class="js-remove">✖</i>').appendTo($li);
                            $list.show();
                        }
                    }
                    $(this).typeahead('val', '');
                }
            })(this));

            return $group;
        },
        
        /**
         * Adds a literal text field
         * 
         * @param  {Object} field An object with the field id and label. {id: 'book', label: 'Book'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertLiteralField: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $d = $('<div class="'+required+'"></div>').append($('<label for="' +
                field.id + '"class="col-sm-2 control-label">' + field.label + ':</label>'));
            var $d1 = $('<div class="col-sm-' + size + '"></div>');
            var $input = $('<input class="form-control input-sm press-field" ' +
                'id="' + field.id + '" data-label="' + field.label + '" type="text"></input>');
            if (this.oldFields[field.id])
                $input.val(this.oldFields[field.id]);
            $d1.append($input);
            $d.append($d1);
            return $d;
        },
        
        /**
         * Adds a number field
         * 
         * @param  {Object} field An object with the field id and label. e.g. {id: 'year', label: 'Year'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertNumberField: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $d = $('<div class="'+required+'"></div>').append($('<label for="' +
                field.id + '"class="col-sm-2 control-label">' + field.label + ':</label>'));
            var $d1 = $('<div class="col-sm-' + size + '"></div>');
            var $input = $('<input class="form-control input-sm press-field" ' +
                'id="' + field.id + '" type="number" data-label="' + field.label + '"></input>');
            if (this.oldFields[field.id])
                $input.val(this.oldFields[field.id]);
            $d1.append($input);
            $d.append($d1);
            return $d;
        },

        /**
         * Adds a file input field
         * 
         * @param  {Object} field An object with the field id and label. {id: 'pdf, label: 'File'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertLocalField: function(field, size, isRequired = false) {
            function return_bytes(val) {        //Get the bytes of the max size
                val = val.trim();
                var last = val.toLowerCase().substring(val.length-1);
                val = parseInt(val);
                switch(last) {
                    // The 'G' modifier is available since PHP 5.1.0
                    case 'g':
                        val *= 1024;
                    case 'm':
                        val *= 1024;
                    case 'k':
                        val *= 1024;
                }

                return val;
            }
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $d = $('<div class="'+required+'"></div>').append($('<label for="' +
                field.id + '"class="col-sm-2 control-label">' + 'Upload File:</label>'));
            var $d1 = $('<div class="col-sm-' + size + '"></div>');
            var $input = $('<input class="form-control input-sm press-field" ' +
                'id="' + field.id + '" type="file" data-label="Upload File"></input>');
            $input.change(function(that) {
                return function(){
                    that.copyrightModal.modal();
                }
            }(this));
            if (this.oldFields[field.id])
                $input.val(this.oldFields[field.id]);
            $d1.append($input);
            $d1.append('<div style="font-size: 0.7em;">Max file size: ' + this.max_file_size +' (' + return_bytes(this.max_file_size) + ' bytes)</div>');
            $d.append($d1);
            return $d;
        },
        /**
         * Adds a project field using typeahead and sortable.js
         * 
         * @param  {Object} field An object with the field id and label. {id: 'prj', label: 'Project'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertProjectField: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $group = $('<div class="'+required+'" id="' + field.id + '-bloodhound"></div>')

            var $label = $('<label class="col-sm-2 control-label" for="' + field.id + '-input">' + field.label + ':</label>');
            var $d = $('<div class="col-sm-10"></div>');
            var $input = $('<input id="' + field.id + '-input" class="typeahead ' +
                'form-control input-sm press-field" type="text" data-label="' + field.label + '" placeholder="Search..."/>');

            $d.append($input);

            $group.append($label);
            $group.append($d);
            var project_bloodhound = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('projectID name'),
                remote: {
                    url: '/ajax/publications/search_project',
                    wildcard: '%QUERY',
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
                                projectID: results[i].projectID.value,
                                name: results[i].name.value
                            }
                        }
                        return tr;
                    }
                }
            });

            var dataset = {
                name: 'projects',
                source: project_bloodhound,
                display: 'name'
            }
            $input.typeahead({
                hint: false,
                highlight: true,
                minLength: 3
            }, dataset);

            var $ul = $('<ul id="' + field.id + '-editable" class="list-group editable" style="display:none"></ul>');
            $d.append($ul);

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

            if(this.oldFields[$ul.attr('id')]){
                $ul.append(this.oldFields[$ul.attr('id')]);
                $ul.show();
            }

            $input.bind('typeahead:select', function(ev, suggestion) {
                if (ev.type === 'keypress' && ev.which != 13) {
                    return;
                }
                var $list = $('#' + field.id + '-editable');

                var $li = $('<li class="project-item list-group-item" draggable="false" style="float:left"></li>');
                $li.attr('id', suggestion.projectID);
                $li.attr('title', suggestion.name);
                $list.append($li);
                $li.text(suggestion.name);
                $('<i class="js-remove">✖</i>').appendTo($li);
                $list.show();
                $(this).typeahead('val', '');
            });

            return $group;
        },
        /**
         * Adds a project field using typeahead and sortable.js
         * 
         * @param  {Object} field An object with the field id and label. {id: 'prj', label: 'Project'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertTagField: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            $input = $('<input class="typeahead form-control input-sm press-field tag-input" ' +
                'id="tag-input" data-label="Tags" data-toggle="tooltip" type="text" placeholder="Search..."/>');

            var tooltip = 'Select from autocomplete to use already added tags.\n' +
                'Type your tag and press Enter to add a new tag.';
            $input.attr('title', tooltip);
            $input.mouseover(function(e) { $(this).tooltip() });
            $input.mouseover();

            $ul = $('<ul id="tag-editable" class="list-group editable" style="display:none"></ul>');
            var $taggroup = $('<div id="tag-group" class="form-group '+required+'"></div>');
            var $col_div = $('<div class="col-sm-10"></div>');
            $taggroup.append($('<label class="col-sm-2 control-label" for="tag-input">' + 'Tags:</label>'));
            $taggroup.append($col_div);
            $col_div.append($input);
            $col_div.append($ul);

            var tagsBlood = new Bloodhound({
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tag'),
                remote: {
                    url: '/ajax/publications/search_tag',
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

            if(this.oldFields[$ul.attr('id')]){
                $ul.append(this.oldFields[$ul.attr('id')]);
                $ul.show();
            }

            $input.bind('typeahead:select keypress', function(ev, suggestion) {
                var $list = $('#tag-editable');
                if (ev.type === 'keypress' && ev.which != 13) {
                    return;
                }
                if(typeof suggestion === 'object'){
                    suggestion = suggestion.tag;
                }

                var valid = true;
                $('.tag-item').each(function() {
                    if ($(this).attr('id') === suggestion) {
                        return valid = false;
                    }
                });

                if (valid) {
                    var $li;
                    if (ev.type === 'keypress') {
                        suggestion = $(this).typeahead('val');
                        $li = $('<li id="' + suggestion + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>');
                    } else {
                        $li = $('<li id="' + suggestion + '" class="tag-item list-group-item" draggable="false" style="float:left"></li>');
                    }
                    $list.append($li);
                    $li.text(suggestion);
                    $('<i class="js-remove">&nbsp;✖</i>').appendTo($li);
                    $list.show();
                }
                $(this).typeahead('val', '');
            });
            return $taggroup;
        },

        /**
         * Adds a date field using daterangepicker.js
         * 
         * @param  {Object} field An object with the field id and label. {id: 'prj', label: 'Project'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertDate: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $d = $('<div class="'+required+'"></div>').append($('<label for="' +
                field.id + '"class="col-sm-2 control-label">' + field.label + ':</label>'));


            var $i = $('<input class="form-control input-sm press-field" id="' +
                field.id + '" type="text" value="" data-label="' + field.label + '" ></input>');
            $i.daterangepicker({
                singleDatePicker: true,
                autoApply: false,
                "locale": {
                    format: "YYYY-MM-DD",
                    cancelLabel: 'Clear'
                },
            });
            $i.on('cancel.daterangepicker', function(ev, picker) {
                $(this).val('');
            });

            $i.on('apply.daterangepicker', onApply = function(ev, picker) {
                if ($(this).attr('id').indexOf('Start') !== -1) {
                    var $end = $('#' + $(this).attr('id').replace('Start', 'End'));
                    $end.daterangepicker({
                        singleDatePicker: true,
                        minDate: $(this).val(),
                        autoApply: false,
                        "locale": {
                            format: "YYYY-MM-DD",
                            cancelLabel: 'Clear'
                        },
                    });
                    $end.on('apply.daterangepicker', onApply);
                    $end.on('cancel.daterangepicker', function(ev, picker) {
                        $(this).val('');
                    });
                } else if ($(this).attr('id').indexOf('End') !== -1) {
                    var $start = $('#' + $(this).attr('id').replace('End', 'Start'));
                    $start.daterangepicker({
                        singleDatePicker: true,
                        maxDate: $(this).val(),
                        autoApply: false,
                        "locale": {
                            format: "YYYY-MM-DD",
                            cancelLabel: 'Clear'
                        },
                    });
                    $start.on('apply.daterangepicker', onApply);
                    $start.on('cancel.daterangepicker', function(ev, picker) {
                        $(this).val('');
                    });
                }
            });
            $i.val('');
            var $d1 = $('<div class="col-sm-' + size + '"></div>');
            $d1.append($i);
            var $clear = $('<span class="searchclear icon-cancel-circled2"></span>');
            $clear.on('click', function() {
                $i.val('');
            })
            if (this.oldFields[field.id]) {
                $i.data('daterangepicker').setStartDate(this.oldFields[field.id]);
                $i.data('daterangepicker').setEndDate(this.oldFields[field.id]);
            }
            $d1.append($clear);
            $d.append($d1);
            return $d;
        },
        /**
         * Adds a literal textarea field
         * 
         * @param  {Object} field An object with the field id and label. {id: 'abstr', label: 'Abstract'}
         * @param {number} size A number indicatiing the bootstrap column size
         * @param {boolean} isRequired A boolean indicating if the field is a 
         * required field
         *
         * @return {Object} A jQuery element object containing the new field
         */
        insertLongField: function(field, size, isRequired = false) {
            var required = '';
            if (isRequired) {
                required = 'required';
            }
            var $d = $('<div class="'+required+'"></div>').append($('<label for="' +
                field.id + '"class="col-sm-2 control-label">' + field.label + ':</label>'));
            var $d1 = $('<div class="col-sm-' + size + '"></div>');
            var $input = $('<textarea rows="1" class="form-control input-sm" id="' + field.id + '" style="resize:none"></textarea>');
            if (this.oldFields[field.id])
                $input.val(this.oldFields[field.id]);
            $input.focus(function() {       // Resize on focus
                $(this).animate({
                    height: '+=120'
                }, 'slow');
            }).blur(function() {
                $(this).animate({
                    height: '-=120'
                }, 'slow');
            });
            $d1.append($input);
            $d.append($d1);
            return $d;
        },
        
        /**
         * Adds all the fields based on the ontology data properties
         * 
         * @param  {[type]}
         * @param  {[type]}
         * @return {[type]}
         */
        insertFields: function(fields, requiredFields) { //NOTE: PRESS V3
            var hasDoi = false;
            function printFields(field, depth, fieldGroup) {

                for (let i = 0; i < field.length; i++) {
                    var required = false;
                    var size = 4;
                    if (depth === 1) {
                        fieldGroup = $('<div class="form-group"></div>');
                        size = 10;
                    }

                    if (!Array.isArray(field[i])) {
                        if ($.inArray(field[i], requiredFields) !== -1)
                            required = true;
                        var fieldDiv;
                        if (field[i] in this.personFields) {
                            fieldDiv = this.insertPersonField(this.fields[field[i]], required);
                        } else if (field[i].indexOf('Abstract') !== -1) {
                            fieldDiv = this.insertLongField(this.fields[field[i]], size, required);
                        } else if (field[i] === 'tag') {
                            fieldDiv = this.insertTagField(field[i], size, required);
                        } else if (field[i] !== 'project' && field[i].indexOf('Date') === -1) {
                            switch (this.fields[field[i]].range) {
                                case 'http://xmlns.com/foaf/0.1/Person':
                                    fieldDiv = this.insertPersonField(this.fields[field[i]], required);
                                    break;
                                case 'http://www.w3.org/2000/01/rdf-schema#Literal':
                                    if (this.fields[field[i]].id === 'localLink') {
                                        fieldDiv = this.insertLocalField(this.fields[field[i]], size, required);
                                    } else {
                                        if(this.fields[field[i]].id === 'doi')
                                            hasDoi = true;
                                        fieldDiv = this.insertLiteralField(this.fields[field[i]], size, required);
                                    }
                                    break;
                                case 'http://www.w3.org/2001/XMLSchema#int':
                                    fieldDiv = this.insertNumberField(this.fields[field[i]], size, required);
                                    break;
                                default:
                                    console.warn(this.fields[field[i]].range);
                            }
                        } else if (field[i] === 'project') {
                            fieldDiv = this.insertProjectField({
                                id: 'project',
                                label: 'Project'
                            }, size, required);
                        } else if (field[i].indexOf('Date') !== -1) {
                            fieldDiv = this.insertDate(this.fields[field[i]], size, required);
                        }
                        var $group = (depth === 1) ? fieldGroup : 4;
                        this.fieldElement.append(fieldGroup.append(fieldDiv));
                    } else {
                        printFields.call(this, field[i], depth + 1, fieldGroup);
                    }

                }
            }
            printFields.call(this, fields, 1, $('<div class="form-group"></div>'));
            if ($.inArray('localLink', requiredFields) !== -1 && hasDoi){
                this.fieldElement.find('label[for="localLink"]').parent().removeClass('required').addClass('required-pair');
                this.fieldElement.find('label[for="doi"]').parent().removeClass('required').addClass('required-pair');
            }
        },
        /**
         * Clears the form input values
         */
        clearForm: function() {
            $('.has-error').removeClass('has-error');
            $('[data-original-title]').popover('destroy');
            $('#form-fields input').val('');
            $('#form-fields textarea').val('');
            $('.editable').not('#lab-editable').empty()
            $('.editable').not('#lab-editable').hide()
            this.oldFields = {};
        },
        /**
         * Validates the form for the required fields and if the user is not a Power
         * User, checks if their name is a contributor
         * 
         * @return {boolean} Returns True if the fields are filled correctly, False otherwise
         */
        validateForm: function() {
            $('.has-error').removeClass('has-error');
            $('[data-original-title]').popover('destroy');

            var correct = true;
            if (!$('#lab-editable').children().length) {

                $('#lab-group').addClass('has-error');
                correct = false;
                console.error('Lab validation Error!');
            }

            if (!this.cat.val()) {
                $('#category-group').addClass('has-error');
                console.error('Cat validation Error!');
                return false;
            }
            if (!this.subcat.val()) {
                $('#subcategory-group').addClass('has-error');
                console.error('Subcat validation Error!');
                return false;
            }

            var required;
            var $selected = $(':selected', this.subcat);
            if ($selected.parent().prop('tagName') === 'OPTGROUP') {
                required = this.requiredFields[this.cat.val()][$selected.parent().attr('id')][this.subcat.val()];
            } else {
                required = this.requiredFields[this.cat.val()][this.subcat.val()];
            }

            //Validate if current user is contributor or if Power User
            var power_user = false;
            if ($.inArray('Publication Mod Power User', this.current_user.roles) >= 0) {
                power_user = true;
            }
            var current_user_added = false
            var contributors = ['hasAuthors', 'hasBookEditors', 'hasChapterAuthors', 'hasSupervisors']; //Remove hardcoded

            $('.contributor').each($.proxy(function(index, element) {
                if ($(element).attr('data-uuid') === this.current_user.uuid) {
                    current_user_added = true;
                    return false
                }
            }, this));

            if (!power_user && !current_user_added) {
                for (var i = 0; i < contributors.length; i++) {
                    $('#' + contributors[i] + '-bloodhound').popover({
                        'placement': 'top',
                        'content': 'You have to include your name as a contributor!'
                    }).popover('show');
                    $('#' + contributors[i] + '-bloodhound').addClass('has-error');
                    correct = false;
                    console.error('Current User Permission validation Error!');
                }
            }

            for (var i = 0; i < required.length; i++) { //TODO: Remove hardcoded author types????
                switch (required[i]) {
                    case 'hasAuthors':
                    case 'hasBookEditors':
                    case 'hasChapterAuthors':
                    case 'hasSupervisors':
                        if (!$('#' + required[i] + '-editable').children().length) {
                            $('#' + required[i] + '-bloodhound').addClass('has-error');
                            correct = false;
                            console.error('Person validation Error!');
                        }
                        break;
                    case 'localLink':
                        if (!this.editMode) {
                            if (!$('#' + required[i]).val() && !$('#doi').val()) {      //One of two required
                                $('#' + required[i]).parent().parent().addClass('has-error');
                                $('#doi').parent().parent().addClass('has-error');
                                correct = false;
                                console.error('File Upload & DOI validation Error!');
                            }
                        }else{
                            if(!this.localLink && !$('#' + required[i]).val() && !$('#doi').val()){
                                $('#' + required[i]).parent().parent().addClass('has-error');
                                $('#doi').parent().parent().addClass('has-error');
                                correct = false;
                                console.error('File Upload & DOI validation Error!');
                            }
                        }
                        break;
                    default:
                        if (!$('#' + required[i]).val()) {
                            $('#' + required[i]).parent().parent().addClass('has-error');
                            correct = false;
                            console.error('Default validation Error:' + required[i]);
                        }
                }
            }
            return correct;
        },

        /**
         * Creates the query and makes the request to Blazegraph to add/edit/delete
         * the publication
         * 
         * @param  {boolean} del Indicates if the publication is going to be deleted
         */
        submitPublication: function(del = false) {
            if (!del) {
                if (!this.validateForm.call(this)) {
                    console.error('Validation Error!');
                    return;
                }
            }
            var pkg = new FormData();

            function constructOptions(del){
                var options = {};
                if(this.editMode){
                    options['uuid'] = this.editPublication.uuid;
                    options['creationDate'] = this.creationDate;
                }else{
                    // options['uuid'] = response.uuid;
                }
                options['delete'] = !!del;
                if(options['delete']) return options;

                // options['publicationUrl'] = response.path;
                options['belongsTo'] = [];
                $('#lab-editable li').each(function() {
                    options['belongsTo'].push($(this).attr('id'));
                });
                
                options['contributors'] = {};

                function traverseFields(field) {
                    for (let i = 0; i < field.length; i++) {
                        if (!Array.isArray(field[i])) {
                            if (field[i] in this.personFields) {
                                options['contributors'][field[i]] = [];
                                $('.' + field[i] + '-contributor-name').each(function() {
                                    options['contributors'][field[i]].push({
                                        name: $(this).text(),
                                        uri: $(this).attr('data-uuid')
                                    });
                                });
                            } else if (field[i] === 'project') {
                                options['project'] = [];
                                $('.project-item').each(function() {
                                    options['project'].push($(this).attr('id'));
                                });
                            } else if (field[i] === 'localLink'){
                                if($('#' + field[i]).val().trim() !== '') {
                                    pkg.append('myfile', $('#localLink', this.element)[0].files[0]);
                                }else if(this.editMode && !!this.localLink){
                                    options['localLink'] = this.localLink;
                                }
                            } else if (field[i] === 'tag') {
                                options['tag'] = [];
                                $('.tag-item').each(function() {
                                    options['tag'].push($(this).attr('id'));
                                });
                            } else if ($('#' + field[i]).val().trim() !== '') {
                                options[field[i]] = $('#' + field[i]).val();
                            }
                        } else {
                            traverseFields.call(this, field[i]);
                        }
                    }
                }

                var fields;
                if ($(':selected', this.subcat).parent().prop('tagName') === 'OPTGROUP') {
                    fields = this.JSONfields[this.cat.val()][$(':selected', this.subcat).parent().attr('id')][this.subcat.val()];
                } else {
                    fields = this.JSONfields[this.cat.val()][this.subcat.val()];
                }
                traverseFields(fields);

                options['category'] = this.subcat.val();
                
                return options;
            }
            var base_url = this.base_url;
            if(del){
                $.ajax({
                    dataType: 'text',
                    method: "POST",
                    url: base_url + '/ajax/publications/delete_publication',
                    data: {
                        'uuid': this.editPublication.uuid,
                    }
                })
                .done(function(response) {
                    window.location.href = base_url + '/publication/search-pub';
                })
                .fail(function(response) {
                    console.error(response);
                });
                return;
            }

            var submitOptions = constructOptions.call(this, del);
            console.log(submitOptions);
            pkg.append('options', JSON.stringify(submitOptions));

            var remote_url = '/ajax/publications/add_publication';
            if(this.editMode){
                remote_url = '/ajax/publications/edit_publication';
            }
            
            $.ajax({
                dataType: 'text',
                method: "POST",
                url: base_url + remote_url,
                data: pkg,
                processData: false,
                contentType: false,
                cache: false,
            })
            .done(function(response) {
                console.log(response);
                // window.location.href = base_url + '/' + href;
            })
            .fail(function(response) {
                console.error(response);
            });

            return;

            /**
             * Gets called after the addition of the Publication in Drupal and
             * constructs the query based on the uuid provided
             * 
             * @param  {Object} response The response from drupal containing the
             * new uuid and url of the publication, the url of the uploaded file
             * @param  {boolean} del Indicates if the publication is going to be deleted
             * @return {string} The sparql query
             */
            function constructQuery(response, del) {
                prefix = this.prefix;
                var query = "prefix foaf: <http://xmlns.com/foaf/0.1/> \n";

                if (this.editMode) {
                    query += 'DELETE { \n';
                    query += '?pub ?p ?o. \n';
                    query += '?pub <' + this.prefix + 'hasContributor> ?conSlot. \n';
                    query += '?conSlot ?y ?z. \n';
                    query += '}\n';
                    query += 'WHERE{ \n';
                    query += '?pub <' + this.prefix + 'publicationUuid> "' + this.editPublication.uuid + '". \n';
                    query += '?pub ?p ?o. \n';
                    query += 'OPTIONAL{?pub <' + this.prefix + 'hasContributor> ?conSlot. \n';
                    query += 'OPTIONAL{?conSlot ?y ?z.}} \n';
                    query += '}';
                    if (!del)
                        query += '; \n';
                }
                if (!del) {
                    var currentDate = new Date();
                    var formattedDate = currentDate.toISOString();
                    query += "INSERT DATA { \n";
                    query += "<" + response.uuid + "> rdf:type <" + this.prefix + this.subcat.val() + ">; \n";
                    if (this.editMode) {
                        query += '<' + prefix + 'creationDate> "' + this.creationDate + '"^^xsd:dateTime; \n';
                    } else {
                        query += '<' + prefix + 'creationDate> "' + formattedDate + '"^^xsd:dateTime; \n';
                    }
                    query += '<' + prefix + 'modifiedDate> "' + formattedDate + '"^^xsd:dateTime; \n';
                    query += '<' + prefix + 'publicationUuid> "' + response.uuid + '"; \n';
                    query += '<' + prefix + 'publicationUrl> "' + response.path + '"; \n';


                    $('#lab-editable li').each(function() {
                        query = query + "<" + prefix + "belongsTo> <" + prefix + 'Organization/' + $(this).attr('id') + ">; \n";
                    })

                    // Traverse the fields of the page to add the sparql triples
                    function traverseFields(field) {
                        var prefix = this.prefix;
                        for (let i = 0; i < field.length; i++) {
                            if (!Array.isArray(field[i])) {
                                if (field[i] in this.personFields) {
                                    var length = 0;
                                    $('.' + field[i] + '-contributor-name').each(function() {
                                        query += '<' + prefix + 'hasContributor> [ rdf:type <' + prefix + 'Contributor_Slot>; \n';
                                        query += '<' + prefix + field[i] + '> <' + $(this).attr('data-uuid') + '>; \n' +
                                            '<' + prefix + 'listIndex> ' + ++length + '; \n' +
                                            ']; \n';
                                    });
                                } else if (field[i] === 'project') {
                                    $('.project-item').each(function() {
                                        query = query + '<' + prefix + 'appearsIn> <' + $(this).attr('id') + '>; \n';
                                    });
                                } else if (field[i] === 'localLink'){
                                    if($('#' + field[i]).val().trim() !== '' && response.file_url !== '') {
                                        query += '<' + this.prefix + 'localLink> "' + response.file_url + '"; \n';
                                    }else if(this.editMode && !!this.localLink){
                                        query += '<' + this.prefix + 'localLink> "' + this.localLink + '"; \n';
                                    }
                                } else if (field[i] === 'tag') {
                                    $('.tag-item').each(function() {
                                        query = query + '<' + prefix + 'tag> "' + $(this).attr('id') + '"; \n';
                                    });
                                } else if ($('#' + field[i]).val().trim() !== '') {
                                    query = query + '<' + prefix + field[i] + '> "' + $('#' + field[i]).val().escapeSpecialChars() + '"; \n';
                                }

                            } else {
                                traverseFields.call(this, field[i]);
                            }
                        }
                    }

                    var fields;
                    if ($(':selected', this.subcat).parent().prop('tagName') === 'OPTGROUP') {
                        fields = this.JSONfields[this.cat.val()][$(':selected', this.subcat).parent().attr('id')][this.subcat.val()];
                    } else {
                        fields = this.JSONfields[this.cat.val()][this.subcat.val()];
                    }
                    traverseFields(fields);

                    query += '.}\n';
                }
                return query;
            }



            /**
             * An ajax request wrapper
             * 
             * @param  {Object} options The AJAX options
             * @return {[type]}
             */
            function ajax(options) {
                var settings = {
                    method: 'POST',
                    data: null,
                    done: function() {},
                    fail: function() {},
                    complete: function() {}
                };

                if (options)
                    for (option in options) settings[option] = options[option];

                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState == 4) {
                        if (xhttp.status == 200) {
                            settings.done(xhttp.responseText);
                        } else {
                            settings.fail(xhttp.responseText);
                        };
                        settings.complete(xhttp.responseText);
                    };
                };
                xhttp.open(settings.method, settings.url, true);
                xhttp.send(settings.data);
            };

            /**
             * Creates the static page of the publication and calls the PRESS API
             * to add the publication to drupal. If it succeeds, it calls the 
             * constructQuery() function to upload the publication to Blazegraph
             * 
             * @param  {boolean} del Indicates if the publication is goind to be deleted
             */
            function beginUpload(del) {
                // console.log($('#'+this.titleFields[$('#category').val()][$('#subcategory').val()]).val());
                var pkg = new FormData();
                if (!del) {
                    var $body = $('<div></div>');
                    var $contributors = $('<div class="col-sm-12"></div>');
                    var $summary = $('<div></div>');
                    var contributors = {};
                    $('.contributor').each(function() {
                        if (!Array.isArray(contributors[$(this).attr('data-field')]))
                            contributors[$(this).attr('data-field')] = [];
                        contributors[$(this).attr('data-field')].push($(this));
                    });
                    var length = Object.keys(contributors).length;
                    var j = 0;
                    var contributors_all_pubs = {};
                    for (key in contributors) {
                        console.log(this.fields);
                        console.log(key);
                        var $concat = $('<div class="col-sm-3"><h3>' + this.fields[key].label + '</h3></div>');
                        contributors_all_pubs[this.fields[key].label] = [];
                        for (let i = 0; i < contributors[key].length; i++) {
                            $contributor = '<a href="' + this.base_url + '/publication/search-pub?type=advanced' +
                                '&reviewed=false' +
                                '&authors0=' + encodeURIComponent(contributors[key][i].attr('data-uuid')) +
                                '">' + contributors[key][i].text() + '</a>';
                            $concat.append($contributor + '<br/>');
                            // console.log(contributors[key][i]);
                            $summary.append(contributors[key][i].text());

                            contributors_all_pubs[this.fields[key].label].push({
                                uri: contributors[key][i].attr('data-uuid'),
                                name: contributors[key][i].text()
                            });
                            if (j !== length - 1 || i !== contributors[key].length - 1) {
                                $summary.append(', ');
                            }
                        }
                        $contributors.append($concat);
                        j++;
                    }
                    $body.append($contributors);
                    // console.log(this.fields);
                    fields = this.fields;
                    var $abstracts = $('<div class="col-sm-12"></div>');
                    var abstractExists = false;
                    $('[id$=Abstract]').each(function() {
                        if ($(this).val().trim() !== '') {
                            abstractExists = true;
                            var abstract = $('<div class="col-sm-12"><h3>' + fields[$(this).attr('id')].label + '</h3></div>');
                            abstract.append('<p>' + $(this).val().trim() + '</p>');
                            $abstracts.append(abstract);
                            if ($(this).attr('id') === 'englishAbstract') {
                                $summary.append('<br/>');
                                var abstractSummary = $(this).val().trim().split(' ', 40);
                                $summary.append('<br/>' + abstractSummary.join(' ') + '...');
                            }
                        }
                    });
                    if (abstractExists)
                        $body.append($abstracts);

                    var $restOfFields = $('<div class="col-xs-12"><p>&nbsp;</p></div>');
                    var fieldLabel = $('<table class="table table-hover"></table>')
                    $('input.press-field:not(.typeahead, [id$=Abstract], #englishTitle, #localLink)').each((function(that) {
                        return function() {
                            if ($(this).val() !== '') {
                                var val = $(this).val();
                                if($(this).attr('id') === 'doi'){
                                    val = '<a href="https://doi.org/'+val+'" target="_blank">'+val+'</a>';
                                }
                                fieldLabel.append('<tr><td>' + $(this).attr('data-label') + '</td><td>' + val + '</td>');
                                // $restOfFields.append('<h4>'+$(this).attr('data-label')+'</h4>');
                                // $restOfFields.append('<p>'+$(this).val()+'</p><br/>');
                            }
                        }
                    })(this));
                    var tagsField = '';
                    var foundTags = false;
                    $('li.tag-item.list-group-item').each((function(that){
                        return function(){
                            if ($(this).attr('id') !== '') {
                                var val = $(this).attr('id');
                                if(foundTags){
                                    tagsField += ', ';
                                }else{
                                    foundTags = true;
                                }
                                val = '<a href="/publication/search-pub?type=advanced&reviewed=false&tags0=' + val +'" target="_blank">'+ val + '</a>';
                                tagsField += val;                                
                                // $restOfFields.append('<h4>'+$(this).attr('data-label')+'</h4>');
                                // $restOfFields.append('<p>'+$(this).val()+'</p><br/>');
                            }   
                        }
                    }))
                    if(foundTags){
                        fieldLabel.append('<tr><td>Tags</td><td>' + tagsField + '</td>');
                    }
                    $restOfFields.append(fieldLabel);
                    var div = $('<div class="col-xs-12"></div>');
                    div.append($restOfFields);
                    $body.append(div);


                    if ($('#localLink', this.element)[0].files[0]) {
                        pkg.append('myfile', $('#localLink', this.element)[0].files[0]);
                    }

                    pkg.append('title', $('#' + this.titleFields[$('#category').val()][$('#subcategory').val()]).val());
                    pkg.append('body', $body.html());
                    pkg.append('summary', $summary.html());
                    pkg.append('category', $('#subcategory').val());
                    pkg.append('contributors', JSON.stringify(contributors_all_pubs));
                    pkg.append('delete', false);
                } else {
                    pkg.append('delete', true);
                }

                var ajax_url = this.base_url + '/ajax/add_publication_page'; //TODO: Remove Hardcoded URL
                if (this.editMode) {
                    var uuid = this.editPublication.uuid
                    // if (this.editPublication.uuid.startsWith('urn:uuid:')) {
                    //     uuid = uuid.substring(9);
                    // }
                    pkg.append('uuid', uuid);
                    ajax_url = this.base_url + '/ajax/edit_publication_page';
                }

                ajax({
                    url: ajax_url,
                    data: pkg,
                    done: (function(res) {
                        // console.log(res);
                        response = JSON.parse(res);
                        // console.log(response);
                        
                        var updateQuery = constructQuery.call(this, response, del);
                        var serviceOptions = constructOptions.call(this, response, del);
                        console.log(serviceOptions);
                        var href = '/publication/search-pub';
                        if (!del) {
                            href = response.path;
                        }

                        base_url = this.base_url;
                        $.ajax({
                                dataType: 'text',
                                method: "POST",
                                url: base_url + '/ajax/publications/add_publication',
                                data: serviceOptions
                            })
                            .done(function(response) {
                                console.log(response);
                                // window.location.href = base_url + '/' + href;
                            })
                            .fail(function(response) {
                                console.error(response);
                            });
                    }).bind(this),
                    fail: (function(res){
                        console.error(res);
                    })
                });
            };
            this.loader.show();
            beginUpload.call(this, del);
        },
        /**
         * Makes a POST request to Blazegraph with the query param to insert a
         * new external author
         * 
         * @param  {string} updateQuery The query to be POSTed
         * @return {Object} A jqXHR object
         */
        insertExternalAuthor: function(uuid, firstName, lastName, mail) {
            return $.ajax({
                    dataType: 'html',
                    method: "POST",
                    url: '/ajax/publications/add_external_author',
                    data: {
                        uuid: uuid,
                        firstName: firstName,
                        lastName: lastName,
                        mail: mail, 
                    }
                })
                .done(function(response) {
                    // console.log(response);
                })
                .fail(function(response) {
                    console.error(response);
                });
        },
        /**
         * Inserts the buttons of the form, Clear, DOI and submit button
         */
        insertButtons: function() {
            var $doiButton = $('<button>', {
                text: 'Add By DOI',
                id: 'doiButon',
                type: 'button',
                class: 'btn btn-default btn-md',
                click: (function() {
                    this.doiModal.modal();
                }).bind(this)
            });

            if (!this.editMode) {
                this.leftButtonArea.append($doiButton);
                this.leftButtonArea.append('&nbsp;&nbsp;');
            }

            var $clearButton = $('<button>', {
                text: 'Clear',
                id: 'clearButton',
                type: 'button',
                class: 'btn btn-default btn-md',
                click: this.clearForm
            });

            this.leftButtonArea.append($clearButton);
            this.leftButtonArea.append('&nbsp;&nbsp;');

            var submitText = 'Submit';
            if (this.editMode) {
                var $deleteModal = $('<div id="deleteModal" class="modal fade" role="dialog"></div>');
                var $divmod = $('<div class="modal-dialog modal-lg"></div>');
                var $modcont = $('<div class="modal-content"></div>');
                $modcont.append($('<div class="modal-header">' +
                    '<button type="button btn-md" class="close" data-dismiss="modal">&times;</button>' +
                    '<h4 class="modal-title">Delete Publication</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<p>Are you sure you want to delete this Publication?</p>' +
                    '</div>'));
                var $modfooter = $('<div class="modal-footer"><button type="button" class="btn btn-default btn-md" data-dismiss="modal">Cancel</button></div>');
                $modcont.append($modfooter);
                $divmod.append($modcont);
                $deleteModal.append($divmod);
                var $modalDeleteButton = $('<button>', {
                    html: '<i class="fa fa-trash" ' +
                        'aria-hidden="true"></i>&nbsp;Delete Publication',
                    id: 'modalDeleteButton',
                    type: 'button',
                    class: 'btn btn-default btn-md',
                    click: (function() {
                        this.submitPublication(true);
                    }).bind(this)
                });
                $modfooter.append($modalDeleteButton);
                this.deleteModal = $deleteModal;
                this.element.append($deleteModal);
                var $deleteButton = $('<button>', {
                    html: '<i class="fa fa-trash" ' +
                        'aria-hidden="true"></i>&nbsp;Delete Publication',
                    id: 'deleteButton',
                    type: 'button',
                    class: 'btn btn-default btn-md',
                    click: (function() {
                        this.deleteModal.modal();
                    }).bind(this)
                });

                this.leftButtonArea.append($deleteButton);
                submitText = 'Submit Changes';
            }
            var $submitButton = $('<button>', {
                text: submitText,
                id: 'submitButton',
                type: 'button',
                style: 'float:right',
                class: 'btn btn-primary btn-md',
                click: (function() {
                    this.submitPublication(false);
                }).bind(this)
            });

            this.rightButtonArea.append($submitButton);
        },

        /**
         * Fills the fields of the form based on the DOI API response
         * 
         * @param  {Object} response The response from the DOI API
         */
        fillFieldsByDOI: function(response) {
            var item = response.message;
            //Category Selection
            var categories = this.doiCategoriesToPRESS[item.type];

            //console.log(item);

            if (categories) {
                this.cat.val(categories[0]);
                this.cat.change();
                this.subcat.val(categories[1]);
                this.subcat.change();
            } else {
                this.cat.val('Other');
                this.cat.change();
                this.subcat.val('Miscellaneous');
                this.subcat.change();
            }


            //Author Selection
            var contributorField = this.contributorOrder[this.subcat.val()][0];
            var $list = $('#' + contributorField + '-editable');

            var authors = item.author;
            var i;

            var $input = $('#' + contributorField + '-input');
            authorGroups = [];
            for (var key in this.authorGroups) {
                authorGroups.push(key);
            }
            authorGroups.sort(function(that) {
                return function(a, b) {
                    return that.authorGroups[a].priority - that.authorGroups[b].priority;
                };
            }(this));
            var bloodhounds = this.bloodhounds;
            var authorResponse = [];
            var authorResponseCount = 0;

            function getEachAuthor(query, j) {
                if (j >= authorGroups.length) {
                    authorResponseCount++;
                    return;
                }

                function fsync(datums) {
                    return;
                }

                function fasync(datums) {
                    if (datums.length === 0) {
                        getEachAuthor(query, j + 1);
                    } else {
                        authorResponseCount++;
                        authorResponse.push(datums[0]);
                    }
                }
                bloodhounds[authorGroups[j]].search(query, fsync, fasync);
            }

            var query = 'prefix bds: <http://www.bigdata.com/rdf/search#> \n' +
                'prefix press: <' + this.prefix + '> \n';
            query += 'SELECT * WHERE { \n';
            // var optionals = '';
            for (i = 0; i < authors.length; i++) { //TODO: IS it efficient? (rateLimitWait: 0)
                query += '{\n';
                query += '?oGivenName' + i + ' bds:search "' + authors[i].given + '*". \n';
                query += '?oGivenName' + i + ' bds:relevance ?score' + i + '. \n';
                query += '?oGivenName' + i + ' bds:maxRank "20". \n';
                query += '?uuid' + i + ' foaf:givenName ?oGivenName' + i + '. \n';
                query += '?oFamilyName' + i + ' bds:search "' + authors[i].family + '*". \n';
                query += '?uuid' + i + ' foaf:familyName ?oFamilyName' + i + '. \n';
                query += '?uuid' + i + ' press:personGroup ?group' + i + '. \n';
                query += 'BIND ("' + i + '" AS ?index)\n';
                query += 'BIND (CONCAT(?oGivenName' + i + ', \" \", ?oFamilyName' + i + ') AS ?fullName' + i + '). \n';
                query += 'OPTIONAL{?uuid' + i + ' foaf:mbox ?mbox' + i + '}. \n';
                query += '}';
                if (i !== authors.length - 1) {
                    query += 'UNION\n';
                }
                // getEachAuthor(authors[i].given +' '+authors[i].family, 0);
            }
            // query += optionals;
            query += '}';

            //Find DOI authors in Database
            $.when(this.getQuery(query)).done((function(that) {
                return function(response) {
                    // console.log(response);
                    var results = response.results.bindings;
                    var response_authors = [];
                    for (i = 0; i < results.length; i++) {
                        var current_author = results[i];
                        var index = parseInt(current_author.index.value);
                        if (!response_authors[index]) {
                            response_authors[index] = { External_Author: [], FORTH_ICS_Author: [] };
                        }
                        response_authors[index][current_author['group' + current_author.index.value].value].push({});

                        for (key in current_author) {
                            response_authors[index][current_author['group' + current_author.index.value].value][response_authors[index][current_author['group' + current_author.index.value].value].length - 1][key.replace('' + index, '')] = current_author[key].value;
                        }
                    }

                    var added = false;
                    for (i = 0; i < response_authors.length; i++) {
                        current_author = response_authors[i];
                        for (var j = 0; current_author && j < authorGroups.length; j++) {
                            if (current_author[authorGroups[j]].length > 0) {
                                current_author[authorGroups[j]].sort(function(a, b) {
                                    return a.score - b.score;
                                });
                                var $li = $('<li class="list-group-item" draggable="false"' +
                                    'style="float:left;"></li>');
                                var group = (that.authorGroups[current_author[authorGroups[j]][0].group].span) ? that.authorGroups[current_author[authorGroups[j]][0].group].span : '';
                                $li.append(group);
                                var $span = $('<span class="hasAuthors-contributor-name contributor" ' +
                                    'data-uuid="' + current_author[authorGroups[j]][0].uuid + '" data-field="hasAuthors">' + current_author[authorGroups[j]][0].fullName + '</span>');
                                if (current_author[authorGroups[j]][0].mail) {
                                    $li.attr('title', current_author[authorGroups[j]][0].mail);
                                    $span.attr('data-mail', current_author[authorGroups[j]][0].mail);
                                }
                                $li.append($span);
                                $li.append($('<i class="js-remove">&nbsp;✖</i>'));
                                $list.append($li);
                                added = true;
                                authors[parseInt(current_author[authorGroups[j]][0].index)].added = true;
                                break;
                            }
                        }
                    }

                    if (added) {
                        $list.show();
                        var $alert = $('<div class="alert alert-info alert-dismissable fade in">' +
                            '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                            '<strong>Authors from DOI Added!</strong> Please make sure the author group is correct and the author has the correct name.' +
                            '</div>');
                        that.element.prepend($alert);
                    }


                    var authorList = '<ul>';
                    var missing = false;
                    for (i = 0; i < authors.length; i++) {
                        if (!authors[i].added) {
                            authorList += '<li>' + authors[i].given + ' ' + authors[i].family + '</li>';
                            missing = true;
                        }
                    }
                    authorList += '</ul>';
                    //Show authors that where not found
                    if (missing) {
                        var $modal = $('<div id="doiMissingAuthors" class="modal fade" role="dialog">' +
                            '<div class="modal-dialog">' +
                            '<!-- Modal content-->' +
                            '<div class="modal-content">' +
                            '<div class="modal-header">' +
                            '<button type="button btn-md" class="close" data-dismiss="modal">&times;</button>' +
                            '<h4 class="modal-title">Missing Authors</h4>' +
                            '</div>' +
                            '<div class="modal-body">' +
                            '<div class="form-horizontal" role="form">' +
                            '<div class="form-group">' +
                            '<div class="col-sm-12">' +
                            '<p>The following authors were not found in our Database. ' +
                            'Please search the authors manualy, or add them in the Database' +
                            authorList +
                            '</p></div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-default btn-md" data-dismiss="modal">Close</button>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>');
                        that.element.append($modal);
                        $modal.modal();
                    }
                }
            })(this));

            //Title Field
            var i;
            var titles = item.title;
            var title = titles[0];
            for (i = 1; i < titles.length; i++) {
                title = title + '-' + titles[i];
            }

            $('#' + this.titleFields[categories[0]][categories[1]]).val(title);

            //year Field
            $('#year').val(item.issued['date-parts'][0][0]);

            //Event Fields
            if (item.event) {
                $('#conferenceTitle').val(item.event.name);
                $('#conferenceLocation').val(item.event.location);
                var start = item.event.start['date-parts'][0];
                start = start[0] + '-' + start[1] + '-' + start[2]
                var end = item.event.end['date-parts'][0];
                end = end[0] + '-' + end[1] + '-' + end[2];
                $('#conferenceDateStart').data('daterangepicker').setStartDate(start);
                $('#conferenceDateStart').data('daterangepicker').setEndDate(start);
                $('#conferenceDateEnd').data('daterangepicker').setStartDate(end);
                $('#conferenceDateEnd').data('daterangepicker').setEndDate(end);
            }

            //Journal Title
            if (item.type.includes('journal')) {
                $('#journalTitle').val(item['container-title'][0]);
            }

            //URL
            var jqxhr = $.ajax("https://doi.org/api/handles/" + item['DOI'])
                .done(function(data) {
                    // $('#external').val()
                    for (var i = 0; i < data.values.length; i++) {
                        if (data.values[i].type === "URL") {
                            $('#externalLink').val(data.values[i].data.value);
                        }
                    }
                })
                .fail(function(data) {
                    alert("There was a problem with doi.org/api request! See console for more info.");
                    console.error(data);
                });

            //Rest of fields depending to doiTypesToPRESS dictionary
            $.each(this.doiFieldsToPRESS, function(key, value) {
                $('#' + value).val(item[key]);
            })
        },

        /**
         * Makes a request to the DOI API and on success calls the fillFieldsByDOI()
         * function to fill the fields
         */
        getDOI: function() {
            var doi = document.getElementById('doi-input').value;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://api.crossref.org/works/' + doi);
            xhr.onload = (function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    this.fillFieldsByDOI(response);
                    console.log(response);
                } else if (xhr.status !== 200) {
                    alert('Request from "api.crossref.org" Failed. Returned status of ' + xhr.status + '. See console for more info.');
                    console.error(xhr.responseText);
                }
            }).bind(this);
            xhr.send();
        },
        /**
         * Creates and returns a jQuery element object of the Add by DOI modal
         * 
         * @return {Object} A jQuery element object
         */
        createDOImodal() {
            var $modal = $('<div id="doiModal" class="modal fade" role="dialog">' +
                '<div class="modal-dialog">' +
                '<!-- Modal content-->' +
                '<div class="modal-content">' +
                '<div class="modal-header">' +
                '<button type="button btn-md" class="close" data-dismiss="modal">&times;</button>' +
                '<h4 class="modal-title">Add Publication By DOI</h4>' +
                '</div>' +
                '<div class="modal-body">' +
                '<div class="form-horizontal" role="form">' +
                '<div class="form-group">' +
                '<label class="col-sm-2 control-label" for="doi-input">DOI:</label>' +
                '<div class="col-sm-10">' +
                '<input class="form-control input-sm" id="doi-input" type="text" />' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-default btn-md" data-dismiss="modal">Close</button>' +
                '<button id="getDOIbutton" type="button" class="btn btn-default btn-md" data-dismiss="modal">Apply</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>');
            $modal.find('#getDOIbutton').on('click', (this.getDOI).bind(this));
            $modal.find('#doi-input').on('keypress', (function(that) {
                return function(e) {
                    if (e.keyCode == 13) {
                        $('#doiModal', that.element).modal('toggle');
                        that.getDOI();
                    }
                }
            })(this));
            return $modal;
        },

        /**
         * Creates a modal to show a warning about copyrights, when selecting a 
         * file
         * @return {Object} A jQuery element object of the modal
         */
        createCopyrightModal: function() {
            var $copyrightModal = $('<div id="copyrightModal" class="modal fade" role="dialog"></div>');
            var $divmod = $('<div class="modal-dialog modal-lg"></div>');
            var $modcont = $('<div class="modal-content"></div>');
            $modcont.append($('<div class="modal-header">' +
                '<button type="button btn-md" class="close" data-dismiss="modal">&times;</button>' +
                '<h4 class="modal-title">Copyright warning</h4>' +
                '</div>' +
                '<div class="modal-body">' +
                '<p>Please be certain that you have the proper permissions to upload this file based on its Copyright</p>' +
                '</div>'));
            var $modfooter = $('<div class="modal-footer"><button type="button" class="btn btn-default btn-md" data-dismiss="modal">Close</button></div>');
            $modcont.append($modfooter);
            $divmod.append($modcont);
            $copyrightModal.append($divmod);

            return $copyrightModal;
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
                    alert("Oops! There was a problem with getting the Query! See console for more info.");
                    console.error(response);
                });
        },
    };

    // We add the library to jQuery functions
    $.fn.press = function(options, callback) {
        this.each(function() {
            var el = $(this);
            if (el.data('press'))
                el.data('press').remove();
            el.data('press', new PRESS(el, options, callback));
        });
        return this;
    };

    return PRESS;
}));