//TODO: Only run if on relevant page.

$(document).ready(function () {
  //For sliding the tools section in bookPage.pug
  $("#slideToggle").click(function () {
    $("#expandable-div").slideToggle('fast');
    $("#slideToggle").button('toggle')
  });

  var confInput = document.getElementById('confirm-delete-input');
  confInput.onpaste = function (e) {
    e.preventDefault();
  }
});

