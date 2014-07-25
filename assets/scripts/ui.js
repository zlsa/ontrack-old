
function ui_init_pre() {
  prop.ui={};

  prop.ui.camera={
    parent: "foo",
    anchor: "front",

    distance: 150,
    distance_offset: 0,
    distance_parent: 0,
    distance_target: 0,
    distance_velocity: 0,

    shift: 0,
    shift_offset: 0,
    shift_parent: 0,
    shift_target: 0,
    shift_velocity: 0,

    height: 0,
    height_parent: 0,
    height_offset: 0,
    height_target: 0,
    height_velocity: 0,

    rotation: 0,
    rotation_offset: 0,
    rotation_parent: 0,
    rotation_target: 0,
    rotation_velocity: 0,

    pitch: 0,
    pitch_offset: 0,
    pitch_parent: 0,
    pitch_target: 0,
    pitch_velocity: 0,

    roll: 0,
    roll_offset: 0,
    roll_parent: 0,
    roll_target: 0,
    roll_velocity: 0,
  };

  prop.ui.camera.mode=null;
}

function ui_ready_post() {
  ui_set_camera("cab");
}

function ui_set_camera(mode) {
  prop.ui.camera.distance_offset=0;
  prop.ui.camera.height_offset=0;
  prop.ui.camera.shift_offset=0;
  prop.ui.camera.rotation_offset=0;
  prop.ui.camera.pitch_offset=0;
  prop.ui.camera.tilt_offset=0;

  if(prop.ui.camera.parent == "train") {
    prop.ui.camera.distance_offset=prop.ui.camera.distance_parent;
    prop.ui.camera.shift_offset=prop.ui.camera.shift_parent;
    prop.ui.camera.height_offset=prop.ui.camera.height_parent;
  }
  prop.ui.camera.mode=mode;

//  prop.ui.camera.distance_target=0;
//  prop.ui.camera.height_target=0;
//  prop.ui.camera.shift_target=0;
//  prop.ui.camera.rotation_target=0;
//  prop.ui.camera.pitch_target=0;
//  prop.ui.camera.tilt_target=0;

  if(mode == "cab") {
    prop.ui.camera.parent="train";
    prop.ui.camera.anchor="front";
    prop.ui.camera.distance_offset=-1;
    prop.ui.camera.height_offset=2.7;
    prop.ui.camera.shift_offset=0;
  } else if(mode == "track") {
    prop.ui.camera.parent="track";
    prop.ui.camera.distance_offset=0;
    prop.ui.camera.height_offset=5;
    prop.ui.camera.shift_offset=5;
  } else if(mode == "chase") {
    prop.ui.camera.parent="train";
    prop.ui.camera.anchor="rear";
    prop.ui.camera.distance_offset=-20;
    prop.ui.camera.height_offset=10;
    prop.ui.camera.shift_offset=0;
    prop.ui.camera.pitch_offset=radians(-10);
  }
}

function ui_camera_move(axis, direction) {
  direction*=6;
  if(axis == "distance")
    prop.ui.camera.distance_velocity+=direction*game_delta();
  else if(axis == "shift")
    prop.ui.camera.shift_velocity-=direction*game_delta();
  else if(axis == "height")
    prop.ui.camera.height_velocity+=direction*game_delta();
}

function ui_camera_rotate(axis, direction) {
  if(axis == "rotation")
    prop.ui.camera.rotation_velocity+=direction*game_delta();
  else if(axis == "pitch")
    prop.ui.camera.pitch_velocity+=direction*game_delta();
  else if(axis == "roll")
    prop.ui.camera.roll_velocity+=direction*game_delta();
}

function ui_update_post() {
  var axes=["distance","shift","height","rotation","pitch","roll"];
  var mix=0.1;
  mix=0.9;
  for(var i in axes) {
    prop.ui.camera[axes[i]+"_target"]+=prop.ui.camera[axes[i]+"_velocity"]*game_delta();
    prop.ui.camera[axes[i]]=((prop.ui.camera[axes[i]+"_offset"]+prop.ui.camera[axes[i]+"_target"])*(1-mix))+prop.ui.camera[axes[i]]*mix;
  }
}
