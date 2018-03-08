$(document).ready(function () {
  //For sliding the tools section in bookPage.pug
  $("#slideToggle").click(function () {
    $("#expandable-div").slideToggle('fast');
  });
});