
function load_init_pre() {

  prop.load={};

  prop.load.total=0;
  prop.load.done=0;

}

function load_init() {
  
}

function load_done() {
  $("#loading").fadeOut(1000);
  $("#loading").css("pointerEvents","none");
}

function load_item_add() {
  prop.load.total+=1;
}

function load_item_done() {
  prop.load.done+=1;
}
