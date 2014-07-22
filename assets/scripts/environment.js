
function environment_init_pre() {
  prop.environment={};

  prop.environment.sun_direction=new THREE.Vector3(0.2,1,0);
  prop.environment.sun_direction.normalize();

  prop.environment.gravity=-9.8;

  prop.environment.fog={};
  prop.environment.fog.near=5;
  prop.environment.fog.far=2000;
  prop.environment.fog.color=new THREE.Color(0xc5d5d0);
}
