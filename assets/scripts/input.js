
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
    if(e.which >= 112 && e.which <= prop.input.keysym.f10)
      e.preventDefault();
  });

  $(window).keyup(function(e) {
    prop.input.keys[e.which]=false;
    console.log(e.which);
    if(e.which >= 112 && e.which <= 123)
      e.preventDefault();
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
    prop.ui.camera.mode="cab";
  } else if(keycode == prop.input.keysym.f2) {
    prop.ui.camera.mode="chase";
  } else if(keycode == prop.input.keysym.f3) {
    prop.ui.camera.mode="front";
  } else if(keycode == prop.input.keysym.f4) {
    prop.ui.camera.mode="front";
  } else if(keycode == prop.input.keysym.f5) {
    prop.ui.camera.mode="top";
  }
}

function input_update() {
  if(prop.input.keys[prop.input.keysym.shift]) {
    // okay, shift key is currently held down
  }
}
