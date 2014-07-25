
function input_init() {
  prop.input={};

  prop.input.button={
    none:0,
    left:1,
    middle:2,
    right:3
  };

  prop.input.keys={};

  prop.input.keysym={
    shift:16,
    control:17,
    num_divide: 111,
    num_multiply: 106,
    num_subtract: 109,
    num_add: 107,
    num_del: 46,
    num_insert: 45,
    num_end: 35,
    num_down: 40,
    num_pgdn: 34,
    num_left: 37,
    num_begin: 12,
    num_right: 39,
    num_home: 36,
    num_up: 38,
    num_pgup: 33,

    num_0: 96,
    num_1: 97,
    num_2: 98,
    num_3: 99,
    num_4: 100,
    num_5: 101,
    num_6: 102,
    num_7: 103,
    num_8: 104,
    num_9: 105,
    num_dot: 110,

    num_lock: 144,

    a:65,
    b:66,
    c:67,
    d:68,
    e:69,
    f:70,
    g:71,
    h:72,
    i:73,
    j:74,
    k:75,
    l:76,
    m:77,
    n:78,
    o:79,
    p:80,
    q:81,
    r:82,
    s:83,
    t:84,
    u:85,
    v:86,
    w:87,
    x:88,
    y:89,
    z:90,
    left:37,
    up:38,
    right:39,
    down:40,
    f1:112,
    f2:113,
    f3:114,
    f4:115,
    f5:116,
    f6:117,
    f7:118,
    f8:119,
    f9:120,
    f10:121,
    f11:122,
    f12:123,
  };
}

function input_done() {
  $(window).keydown(function(e) {
    prop.input.keys[e.which]=true;
    input_keydown(e.which);
    if(e.which >= prop.input.keysym.f1 && e.which <=  prop.input.keysym.f10) {
      e.preventDefault();
      return false;
    }
  });

  $(window).keyup(function(e) {
    prop.input.keys[e.which]=false;
    console.log(e.which);
    if(e.which >= prop.input.keysym.f1 && e.which <=  prop.input.keysym.f10) {
      e.preventDefault();
      return false;
    }
  });

}

function input_keydown(keycode) {
  if(keycode == prop.input.keysym.a) {
    controls_move("power",0);
  } else if(keycode == prop.input.keysym.z) {
    controls_move("power",1);
  } else if(keycode == prop.input.keysym.q) {
    controls_move("power",-1);
  } else if(keycode == prop.input.keysym.f) {
    controls_move("direction",1);
  } else if(keycode == prop.input.keysym.v) {
    controls_move("direction",-1);
  } else if(keycode == prop.input.keysym.p) {
    prop.game.paused=!prop.game.paused;
  } else if(keycode == prop.input.keysym.f1) {
    ui_set_camera("cab");
  } else if(keycode == prop.input.keysym.f2) {
    ui_set_camera("track");
  } else if(keycode == prop.input.keysym.f3) {
    ui_set_camera("chase");
  } else if(keycode == prop.input.keysym.f4) {
    ui_set_camera("flyby");
  } else if(keycode == prop.input.keysym.f5) {
    ui_set_camera("track");
  }
}

function input_update() {
  var damping=3;
  if(prop.input.keys[prop.input.keysym.num_up]) {
    ui_camera_move("distance",1);
  } else if(prop.input.keys[prop.input.keysym.num_down]) {
    ui_camera_move("distance",-1);
  } else {
    prop.ui.camera.distance_velocity*=1-game_delta()*damping;
  }
  if(prop.input.keys[prop.input.keysym.num_home]) {
    ui_camera_move("height",1);
  } else if(prop.input.keys[prop.input.keysym.num_end]) {
    ui_camera_move("height",-1);
  } else {
    prop.ui.camera.height_velocity*=1-game_delta()*damping;
  }
  if(prop.input.keys[prop.input.keysym.num_left]) {
    ui_camera_move("shift",-1);
  } else if(prop.input.keys[prop.input.keysym.num_right]) {
    ui_camera_move("shift",1);
  } else {
    prop.ui.camera.shift_velocity*=1-game_delta()*damping;
  }
}
