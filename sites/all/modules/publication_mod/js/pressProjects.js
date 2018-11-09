/**
 * @fileOverview Creates the query based on the Project fields to add a new Project and makes
 * the requests
 */

/**
 * @param  {string} ontologyPrefix The prefix of the Ontology
 * @param  {string} dbURL The API url of Blazegraph
 */
function initProjects(ontologyPrefix, dbURL){
    jQuery(document).ready(function($) {
        $i = $("#startDate");
        $i.daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            "locale": {
                format: "YYYY-MM-DD",
            },
        });
        $i.val("");
        $i = $("#endDate");
        $i.daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            "locale": {
                format: "YYYY-MM-DD",
            },
        });
        $i.val("");

        function submitQuery() {
            if ($.trim($("#projectId").val()) === "" ||
                $.trim($("#projectName").val()) === "" ||
                $.trim($("#startDate").val()) === "" ||
                $.trim($("#endDate").val()) === "" ||
                $("input[name=\'optradio\']:checked").val() == null) {
                alert("All fields are required!");
                return;
            }
            var query = [
                "prefix press: <" + ontologyPrefix +">",
                "INSERT DATA {",
                "<"+ontologyPrefix + encodeURI($("#projectId").val()) + "> rdf:type press:Project ;",
                "press:projectDateStart \'" + $("#startDate").val() + "\';",
                "press:projectDateEnd \'" + $("#endDate").val() + "\';",
                "press:projectStatus \'" + $("input[name=\'optradio\']:checked").val() + "\';",
                "press:projectName \'" + $("#projectName").val() + "\';",
                "press:projectAcronym \'" + $("#projectAcronym").val() + "\';",
                "press:projectId \'" + $("#projectId").val() + "\'. ",
                "}"
            ].join("");
            $.ajax({
                    dataType: "html",
                    method: "POST",
                    url: dbURL,
                    data: {
                        update: query
                    }
                })
                .done(function(response) {
                    $('myModalLabel').text('Project Added');
                    $('#responseModal .modal-body').text('The Insertion of the Project named "'+$("#projectName").val()+'" is Completed!');
                    $('#responseModal').modal('show');
                    console.log(response);
                })
                .fail(function(response) {
                    $('myModalLabel').text('Project Insertion Failed!');
                    $('#responseModal .modal-body').text('The Insertion of the Project Failed! Please check the console for more info.');
                    $('#responseModal').modal('show');
                    console.error(response);
                });
        }
        $('#project-submit').click(submitQuery);
    });
}