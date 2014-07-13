
function draw_init_pre() {
  prop.draw={};

  prop.draw.fov=70;

  prop.draw.znear=0.1;
  prop.draw.zfar=5000;

  prop.draw.size={
    width:128,
    height:128
  };

  prop.draw.shaders={};

}

function draw_init() {

  draw_shader_get("asphalt","assets/shaders/asphalt.frag");

}

function draw_shader_get(name,url) {
  var shader=new Content({
    url: url,
    type: "string",
  });
  prop.draw.shaders[name]=shader;
}

function draw_ready() {

  // SCENE
  prop.draw.scene=new THREE.Scene();

  // CAMERA
  prop.draw.camera=new THREE.PerspectiveCamera(
    prop.draw.fov,
    prop.draw.size.width / prop.draw.size.height,
    prop.draw.znear,
    prop.draw.zfar);

  // RENDERER
  prop.draw.renderer=new THREE.WebGLRenderer({
    antialias:true,
  });

  prop.draw.renderer.setSize(prop.draw.size.width, prop.draw.size.height);

  $("body #view").append(prop.draw.renderer.domElement);

  // SUN
  prop.draw.sun=new THREE.DirectionalLight(0xffeedd, 2);
  prop.draw.sun.position.clone(prop.environment.sun_direction);
  prop.draw.scene.add(prop.draw.sun);

  // MOVE THE CAMERA... or something

  prop.draw.camera.position.z=10;
  prop.draw.camera.position.y=1;
  prop.draw.camera.lookAt(new THREE.Vector3(0,1,0));

  // SKYDOME
  var skydome_geometry=new THREE.SphereGeometry(3000, 60, 40);

  var uniforms={
    texture: {
      type: "t",
      value: THREE.ImageUtils.loadTexture("assets/tracks/devtrack/skydome.png")
    }
  };

  var skydome_material=new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: ""+
      "varying vec2 vUV;\n"+
      "void main() {\n"+
      "  vUV=uv;\n"+
      "  vec4 pos=vec4(position,1.0);\n"+
      "  gl_Position=projectionMatrix * modelViewMatrix * pos;\n"+
      "}",
    fragmentShader: ""+
      "uniform sampler2D texture;\n"+
      "varying vec2 vUV;\n"+
      "void main() {\n"+
      "  vec4 sample = texture2D(texture, vUV);\n"+
      "  gl_FragColor = vec4(sample.xyz, sample.w);\n"+
      "}",
    side:THREE.DoubleSide
  });

  prop.draw.skydome=new THREE.Mesh(skydome_geometry, skydome_material);
  prop.draw.skydome.scale.set(-1,1,1);
  prop.draw.skydome.renderDepth=1000.0;
  prop.draw.scene.add(prop.draw.skydome);

  // GROUND
  var ground_geometry=new THREE.PlaneGeometry(6000, 6000, 2, 2);

  var ground_material=new THREE.ShaderMaterial({
    vertexShader: ""+
      "varying vec2 vUV;\n"+
      "varying float vD;\n"+
      "void main() {\n"+
      "  vUV=uv;\n"+
      "  vec4 pos=vec4(position,1.0);\n"+
      "  gl_Position=projectionMatrix * modelViewMatrix * pos;\n"+
      "  vD=gl_Position.z;\n"+
      "}",
    fragmentShader: prop.draw.shaders.asphalt.data,
    side:THREE.DoubleSide
  });

  prop.draw.ground=new THREE.Mesh(ground_geometry, ground_material);
  prop.draw.ground.rotation.set(Math.PI/2,0,0);
  prop.draw.ground.renderDepth=1000.0;
  prop.draw.scene.add(prop.draw.ground);

}

function draw_resize() {
  prop.draw.size.width=$(window).width();
  prop.draw.size.height=$(window).height();
  var width=prop.draw.size.width;
  var height=prop.draw.size.height;
  prop.draw.camera.fov=prop.draw.fov;
  prop.draw.camera.width=width;
  prop.draw.camera.height=height;
  prop.draw.camera.aspect=width/height;

  prop.draw.renderer.setSize(width,height);

  prop.draw.camera.updateProjectionMatrix();
}

function draw_update() {

  prop.draw.renderer.render(prop.draw.scene, prop.draw.camera);

  prop.draw.camera.position.x=cos(time()*0.05)*10;
  prop.draw.camera.position.y=1.8;
  prop.draw.camera.position.z=sin(time()*0.05)*10;
  prop.draw.camera.lookAt(new THREE.Vector3(0,0,0));

  $("#fps").text(prop.time.fps.toFixed(0));
}
