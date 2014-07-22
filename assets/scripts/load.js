
function load_init_pre() {

  prop.load={};

  prop.load.total=0;
  prop.load.done=0;

  prop.load.loaded=false;

}

function load_init() {

}

function load_ready_post() {
  setTimeout(function() {
    $("#loading").fadeOut(1000);
    $("#loading").css("pointerEvents","none");
  },100);
}

function load_get_progress() {
  if(prop.load.total == 0) return 0;
  return prop.load.done/prop.load.total;
}

function load_item_add() {
  prop.load.total+=1;
  load_update_bar();
}

function load_item_done() {
  prop.load.done+=1;
  load_update_bar();
}

function load_update_bar() {
  $("#bar").width(load_get_progress()*58);
}

function load_complete() {
  prop.load.loaded=true;
}
