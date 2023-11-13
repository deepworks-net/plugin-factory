;if (jQuery.validator) {

	$.validator.setDefaults({
		errorElement: 'span',
		errorClass: 'help-block help-block-error',
		focusInvalid: false,
		ignore: ":hidden",
		errorPlacement: function (error, element) { // render error placement for each input type
			var parent = element.parent(".input-group");
			if ($(element).is('select')) {
				parent = element.parent(".btn-group");
			}
			if (parent.size() > 0) {
				error.insertAfter(parent);
			} else {
				error.insertAfter(element); // for other inputs, just perform default behavior
			}
		},
		highlight: function (element) {
			$(element).closest('.form-group').addClass('has-error');
		},
		unhighlight: function (element) {
			$(element).closest('.form-group').removeClass('has-error');
		},
		success: function (label) {
			label.closest('.form-group').removeClass('has-error');
		}
	});
	
	$.validator.addMethod("currency", function (value, element) {
	  return this.optional(element) || /(\d{1,3}(\,\d{3})*|(\d+))(\.\d{2})?$/.test(value);
	}, "Please specify a valid dollar amount.");
	
	$.validator.addMethod("ipv4-url", function(value, element) {
		return this.optional(element) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value ) || /^(?:(?:(?:https?|ftp):)?\/\/)(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(value);
	}, "Please enter a valid URL or IP v4 address.");
	
	$('form').validate();
	
};
