$(document).ready(function() {
  // SideNav Button Initialization
  $(".button-collapse").sideNav2({
    slim: true
  });
  // SideNav Scrollbar Initialization
  var sideNavScrollbar = document.querySelector('.custom-scrollbar');
  var ps = new PerfectScrollbar(sideNavScrollbar);
})
