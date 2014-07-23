
function controls_init() {
  prop.controls={};

  prop.controls.direction=1;

  prop.controls.lever=0;
  prop.controls.power=0;
  prop.controls.brake=0;
  prop.controls.emergency_brake=false;
  
  prop.controls.single_lever=true;

}

function controls_move(lever,direction) {
  if(prop.controls.single_lever) {
    if(lever == "power") {
      if(direction == 0) {
        if(prop.controls.lever > 0) direction=-1;
        else if(prop.controls.lever < 0) direction=1;
      }
      prop.controls.lever+=direction;
    }
    prop.controls.lever=clamp(-5,prop.controls.lever,5);
    if(prop.controls.lever > 0) {
      prop.controls.brake=0;
      prop.controls.power=prop.controls.lever;
    } else if(prop.controls.lever < 0) {
      prop.controls.brake=-prop.controls.lever;
      prop.controls.power=0;
    } else {
      prop.controls.brake=0;
      prop.controls.power=0;
    }
  }
  if(lever == "direction") {
    prop.controls.direction+=direction;
    prop.controls.direction=clamp(-1,prop.controls.direction,1);
  }
}

function controls_update_pre() {
  if(prop.controls.emergency_brake) {
    prop.controls.power=0;
  }
  var direction="N";
  var style="neutral";
  if(prop.controls.direction > 0) {
    direction="F";
    style="forwards";
  }
  if(prop.controls.direction < 0) {
    direction="R";
    style="reverse";
  }
  $("#direction-setting").text(direction);
  $("#direction-setting").removeClass("forwards reverse neutral");
  $("#direction-setting").addClass(style);

  var power="N";
  style="neutral";
  if(prop.controls.emergency_brake) {
    style="emergency-brake";
  } else if(prop.controls.brake > 0) {
    power=prop.controls.brake;
    style="brake";
  } else if(prop.controls.power > 0) {
    power=prop.controls.power;
    style="power";
  }

  $("#power-brake-setting").text(power);
  $("#power-brake-setting").removeClass("neutral power brake emergency-brake");
  $("#power-brake-setting").addClass(style);
}
