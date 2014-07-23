
function ui_init_pre() {
  prop.ui={};

  prop.ui.camera={

  };

  prop.ui.camera.mode=null;
}

function ui_ready_post() {
  ui_set_camera("cab");
}

function ui_set_camera(mode) {
  if(prop.ui.camera.mode) draw_unset_camera(prop.ui.camera.mode);
  prop.ui.camera.mode=mode;
  draw_set_camera(prop.ui.camera.mode);
}
