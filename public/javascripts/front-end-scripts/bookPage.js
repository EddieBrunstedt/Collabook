$(document).ready(function () {
	$("#slideToggle").click(function () {
		$("#expandable-div").slideToggle('fast');
	});
	$('[data-toggle="popover"]').on('click', function(e) {e.preventDefault(); return true;}).popover();
});
