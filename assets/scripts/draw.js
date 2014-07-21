
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

function draw_fragment_shader_get(name,url) {
  var shader=new Content({
    url: url,
    type: "string",
    payload: name,
    callback: function(status,data,payload) {
      console.log(arguments);
      prop.draw.shaders[payload]=data
        .replace("$PARAMETERS","")
        .replace("$COLOR","");
//        .replace("$PARAMETERS",THREE.ShaderChunk["shadowmap_pars_fragment"])
//        .replace("$COLOR",THREE.ShaderChunk["shadowmap_fragment"]);
    }
  });
}

function draw_init() {

  draw_fragment_shader_get("grass","assets/shaders/grass-fast.frag");
//  draw_fragment_shader_get("grass","assets/shaders/water.frag");

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

}

function draw_ready() {

  // SKYDOME

  var skydome_geometry=new THREE.SphereGeometry(3000, 20, 10);

  var texture=new THREE.Texture(prop.railway.current.skydome.data);
  texture.needsUpdate=true;

  var uniforms={
    texture: {
      type: "t",
      value: texture
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
  var ground_geometry=new THREE.PlaneGeometry(6000, 6000, 1, 1);
  
  var grass=THREE.ImageUtils.loadTexture("assets/textures/grass.png");
//  var grass=THREE.ImageUtils.loadTexture("assets/textures/water.png");
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(2,2);

  window.ground_uniforms={
    texture: {
      type: "t",
      value: grass
    },
    time: {
      type: "f",
      value: 1.0
    }
  };

  var ground_material=new THREE.ShaderMaterial({
    uniforms:window.ground_uniforms,
    vertexShader: ""+
      "varying vec2 vUV;\n"+
      "varying float vD;\n"+
      "varying vec3 vNormal;\n"+
      "void main() {\n"+
      "  vUV=uv;\n"+
      "  vNormal=normal;\n"+
      "  vec4 pos=vec4(position,1.0);\n"+
      "  gl_Position=projectionMatrix * modelViewMatrix * pos;\n"+
      "  vD=gl_Position.z;\n"+
      "}",
    fragmentShader: prop.draw.shaders.grass,
    side:THREE.DoubleSide
  });

  prop.draw.ground=new THREE.Mesh(ground_geometry, ground_material);
  prop.draw.ground.rotation.set(-Math.PI/2,0,0);
  prop.draw.scene.add(prop.draw.ground);

  var gauge=prop.railway.current.getRoot("master").getGauge();
  var geometry=new THREE.BoxGeometry(gauge,1,gauge*2);
  var color=0xdddddd;
  var material=new THREE.MeshPhongMaterial( { color: color } );
  prop.draw.train=new THREE.Mesh(geometry, material);
  prop.draw.train.position.y=0.5;

  prop.draw.train_position=0;
  prop.draw.train_direction=1;

  prop.draw.train.add(prop.draw.camera);
  prop.draw.scene.add(prop.draw.train);

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

  var t=time()*0.5;

  prop.draw.camera.position.x=10;
  prop.draw.camera.position.y=100;
  prop.draw.camera.position.z=-1;

  // prop.draw.camera.position.y=10;
  // prop.draw.camera.position.x=sin(t)*30;
  // prop.draw.camera.position.z=cos(t)*30;

  prop.draw.camera.position.set(0,1,2);
  
  prop.draw.camera.lookAt(new THREE.Vector3(0,1,4));

  window.ground_uniforms.time.value+=delta();

  prop.draw.renderer.render(prop.draw.scene, prop.draw.camera);

  var track=prop.railway.current.getRoot("master");

  prop.draw.train_position+=10*delta()*prop.draw.train_direction;
  if(prop.draw.train_position >= track.getLength()) {
    prop.draw.train_position=0.02;
  } else if(prop.draw.train_position <= 0.01) {
    prop.draw.train_direction*=-1;
    prop.draw.train_position=0.1;
  }

  var position=track.getPosition(prop.draw.train_position);
  var rotation=track.getRotation(prop.draw.train_position);
  var cant=track.getCant(prop.draw.train_position);
  var pitch=track.getPitch(prop.draw.train_position);
  var elevation=track.getElevation(prop.draw.train_position);

  prop.draw.train.position.x=-position[0];
  prop.draw.train.position.y=elevation;
  prop.draw.train.position.z=position[1];
  prop.draw.train.rotation.order="YZX";
  prop.draw.train.rotation.y=rotation;
  prop.draw.train.rotation.x=pitch;
  prop.draw.train.rotation.z=cant;

  $("#fps").text(prop.time.fps.toFixed(0));
}
