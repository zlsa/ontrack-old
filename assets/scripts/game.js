
function game_init_pre() {
  prop.game={};

  prop.game.paused=true;

  prop.game.speedup=1;

  prop.game.time=time();
  prop.game.delta=0;

}

function game_time() {
  return prop.game.time;
}

function game_delta() {
  return prop.game.delta;
}

function game_update_pre() {
  prop.game.delta=delta()*prop.game.speedup;
  if(prop.game.paused) {
    prop.game.delta=0;
  }
  prop.game.time+=prop.game.delta;
}

function game_ready() {
  prop.game.paused=false;
}
