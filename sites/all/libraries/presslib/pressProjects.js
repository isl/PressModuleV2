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

        // $.ajax({ 
        //  
        // dataType: "json", 
        // method: "GET", 
        // url: "'. $dbURL .'", 
        // data: { 
        // query: "prefix press: <'. $ontologyPrefix .'>"+ 
        // " SELECT ?s ?p WHERE {"+ 
        // " ?s press:Project_Name ?p}" 
        // } 
        // }) 
        // .done(function(response){ 
        // console.log(response); 
        // var arr = []; 
        // for(var i =0; i<response.results.bindings.length; i++){ 
        // arr[i] = response.results.bindings[i].p.value; 
        // } 
        // }) 
        // .fail(function(response){ 
        // alert(response); 
        // }); 
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
                "press:Project_Date_Start \'" + $("#startDate").val() + "\';",
                "press:Project_Date_End \'" + $("#endDate").val() + "\';",
                "press:Project_Status \'" + $("input[name=\'optradio\']:checked").val() + "\';",
                "press:Project_Name \'" + $("#projectName").val() + "\';",
                "press:Project_ID \'" + $("#projectId").val() + "\'. ",
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