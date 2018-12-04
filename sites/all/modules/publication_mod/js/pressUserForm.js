jQuery(document).ready(function($){
	var add_to_blzg_init_value = $('#edit-pub-mod-field-add-to-blzg-und')[0].checked

	$('#edit-pub-mod-field-add-to-blzg-und').change(function(){
		if(!this.checked && add_to_blzg_init_value){
			$('#edit-pub-mod-field-add-to-blzg-und').parent().append('<span id="edit-pub-mod-field-add-to-blzg-und-warning" style="color:red;">Warning! The user will be deleted from Blazegraph and from any Publications they Contributed!</span>');
		}else{
			$('#edit-pub-mod-field-add-to-blzg-und-warning').remove();
		}
	});
});