
function environment_init_pre() {
  prop.environment={};

  prop.environment.sun_direction=new THREE.Vector3(-0.3,1,0);
  prop.environment.sun_direction.normalize();

  prop.environment.gravity=-9.8;

  prop.environment.fog={};
  prop.environment.fog.near=5;
  prop.environment.fog.far=200;
  prop.environment.fog.color=new THREE.Color(0xcccdd9);
}
