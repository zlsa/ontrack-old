
function environment_init_pre() {
  prop.environment={};

  prop.environment.sun_direction=new THREE.Vector3(0,1,0);

  prop.environment.gravity=-9.8;

  prop.environment.fog={};
  prop.environment.fog.near=10;
  prop.environment.fog.far=1000;
  prop.environment.fog.color=new THREE.Color(0xccbbbb);
}
