
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

  prop.draw.shaders["utils"]=[
    "//",
    "// Description : Array and textureless GLSL 2D simplex noise function.",
    "//      Author : Ian McEwan, Ashima Arts.",
    "//  Maintainer : ijm",
    "//     Lastmod : 20110822 (ijm)",
    "//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.",
    "//               Distributed under the MIT License. See LICENSE file.",
    "//               https://github.com/ashima/webgl-noise",
    "// ",
    "",
    "vec3 mod289(vec3 x) {",
    "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
    "}",
    "",
    "vec2 mod289(vec2 x) {",
    "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
    "}",
    "",
    "vec3 permute(vec3 x) {",
    "  return mod289(((x*34.0)+1.0)*x);",
    "}",
    "",
    "float snoise(vec2 v)",
    "{",
    "  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0",
    "                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)",
    "                      -0.577350269189626,  // -1.0 + 2.0 * C.x",
    "                      0.024390243902439); // 1.0 / 41.0",
    "  // First corner",
    "  vec2 i  = floor(v + dot(v, C.yy) );",
    "  vec2 x0 = v -   i + dot(i, C.xx);",
    "",
    "  // Other corners",
    "  vec2 i1;",
    "  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0",
    "  //i1.y = 1.0 - i1.x;",
    "  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);",
    "  // x0 = x0 - 0.0 + 0.0 * C.xx ;",
    "  // x1 = x0 - i1 + 1.0 * C.xx ;",
    "  // x2 = x0 - 1.0 + 2.0 * C.xx ;",
    "  vec4 x12 = x0.xyxy + C.xxzz;",
    "  x12.xy -= i1;",
    "",
    "  // Permutations",
    "  i = mod289(i); // Avoid truncation effects in permutation",
    "  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))",
    "                    + i.x + vec3(0.0, i1.x, 1.0 ));",
    "",
    "  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);",
    "  m = m*m ;",
    "  m = m*m ;",
    "",
    "  // Gradients: 41 points uniformly over a line, mapped onto a diamond.",
    "  // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)",
    "",
    "  vec3 x = 2.0 * fract(p * C.www) - 1.0;",
    "  vec3 h = abs(x) - 0.5;",
    "  vec3 ox = floor(x + 0.5);",
    "  vec3 a0 = x - ox;",
    "",
    "  // Normalise gradients implicitly by scaling m",
    "  // Approximation of: m *= inversesqrt( a0*a0 + h*h );",
    "  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );",
    "",
    "  // Compute final noise value at P",
    "  vec3 g;",
    "  g.x  = a0.x  * x0.x  + h.x  * x0.y;",
    "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
    "  return 130.0 * dot(m, g);",
    "}",
    "",
    "float trange(float il, float i, float ih, float ol, float oh) {",
    "  return ((i-il)/(ih-il)*(oh-ol))+ol;",
    "}",
    "",
    "float crange(float il, float i, float ih, float ol, float oh) {",
    "  return clamp(trange(il,i,ih,ol,oh),ol,oh);",
    "}",
    "float srange(float il, float i,float ih,float ol,float oh) {",
    "  return trange(-1.0,sin(trange(il,i,ih,-3.14159265358/2.0,3.14159265358/2.0)),1.0,ol,oh);",
    "}",
    "float scrange(float il, float i,float ih,float ol,float oh) {",
    "  return trange(-1.0,sin(crange(il,i,ih,-3.14159265358/2.0,3.14159265358/2.0)),1.0,ol,oh);",
    "}",
  ].join("\n");
  prop.draw.shaders["fog-parameters"]=[
    "uniform vec3 fogColor;",
    "uniform float fogNear;",
    "uniform float fogFar;",
  ].join("\n");
  prop.draw.shaders["fog-fragment"]=[
    "float fog=scrange(fogNear,vD,fogFar,0.0,1.0);",
    "gl_FragColor=mix(gl_FragColor,vec4(fogColor.rgb,1.0),fog);",
  ].join("\n");

}

function draw_fragment_shader_get(name,url) {
  var shader=new Content({
    url: url,
    type: "string",
    payload: name,
    callback: function(status,data,payload) {
      prop.draw.shaders[payload]=data
//        .replace("$PARAMETERS","")
//        .replace("$COLOR","");
//        .replace("$PARAMETERS",THREE.ShaderChunk["fog_pars_fragment"])
//        .replace("$COLOR",THREE.ShaderChunk["fog_fragment"]);
        .replace("$UTILS",prop.draw.shaders["utils"])
        .replace("$PARAMETERS",prop.draw.shaders["fog-parameters"])
        .replace("$COLOR",prop.draw.shaders["fog-fragment"]);
      console.log(prop.draw.shaders[payload])
    }
  });
}

function draw_init() {

  draw_fragment_shader_get("grass","assets/shaders/grass-fast.frag");
  draw_fragment_shader_get("gravel","assets/shaders/gravel.frag");
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
    },
    fogColor:    { type: "c", value: prop.environment.fog.color },
    fogNear:     { type: "f", value: prop.environment.fog.near },
    fogFar:      { type: "f", value: prop.environment.fog.far }
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
  var geometry=new THREE.BoxGeometry(gauge*1.5,2.0,20);
  var color=0xdddddd;
  var material=new THREE.MeshPhongMaterial( { color: color } );
  prop.draw.train=new THREE.Mesh(geometry, material);
  prop.draw.train.position.y=0.5;

  var track=prop.railway.current.getRoot("master");

  prop.draw.train.add(prop.draw.camera);
  prop.draw.scene.add(prop.draw.train);

  var gravel=THREE.ImageUtils.loadTexture("assets/textures/gravel.png");
  gravel.wrapS = gravel.wrapT = THREE.RepeatWrapping;
  gravel.repeat.set(2,2);
  var gravel_normal=THREE.ImageUtils.loadTexture("assets/textures/gravel-normal.png");
  gravel_normal.wrapS = gravel_normal.wrapT = THREE.RepeatWrapping;
  gravel_normal.repeat.set(2,2);

  var uniforms={
    tColor: {
      type: "t",
      value: gravel
    },
    tNormal: {
      type: "t",
      value: gravel_normal
    },
    time: {
      type: "f",
      value: 1.0
    },
    fogColor:    { type: "c", value: prop.environment.fog.color },
    fogNear:     { type: "f", value: prop.environment.fog.near },
    fogFar:      { type: "f", value: prop.environment.fog.far }
  };

  var material=new THREE.ShaderMaterial({
    uniforms:uniforms,
    vertexShader: ""+
      "varying vec2 vUV;\n"+
      "varying float vD;\n"+
      "varying vec3 vNormal;\n"+
      "void main() {\n"+
      "  vUV=position.xz;\n"+
      "  vNormal=normal;\n"+
      "  vec4 pos=vec4(position,1.0);\n"+
      "  gl_Position=projectionMatrix * modelViewMatrix * pos;\n"+
      "  vD=gl_Position.z;\n"+
      "}",
    fragmentShader: prop.draw.shaders.gravel,
    side:THREE.DoubleSide
  });

  prop.railway.current.getRoot("master").mesh.material=material;

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

  prop.draw.camera.position.set(0,0.4,9.5);
  
  prop.draw.camera.lookAt(new THREE.Vector3(0,-0.5,20));

  window.ground_uniforms.time.value+=delta();

  var track=prop.railway.current.getRoot("master");

  var train_distance=prop.train.current.distance;

  var position= track.getPosition( train_distance);
  var rotation= track.getRotation( train_distance);
//  var cant=     track.getCant(     train_distance);
  var pitch=    track.getPitch(    train_distance);
  var elevation=track.getElevation(train_distance);

  prop.draw.train.position.x=-position[0]
  prop.draw.train.position.y=elevation+1.1;
  prop.draw.train.position.z=position[1];

  prop.draw.train.rotation.order="YXZ";

  var cant=prop.train.current.cars[0].tilt;
  prop.draw.train.rotation.y=rotation;
  prop.draw.train.rotation.x=pitch;
  prop.draw.train.rotation.z=cant;

//
//  var cp=new THREE.Vector3(-100,250,-1);
//  var cp=new THREE.Vector3(50,3,300);
//  prop.draw.camera.position=cp;
//  prop.draw.camera.lookAt(prop.draw.train.position);
//  prop.draw.camera.lookAt(new THREE.Vector3(-100,0,0));

//  prop.draw.camera.fov=srange(0,prop.draw.train.position.distanceTo(cp),500,40,0.5);
//  prop.draw.camera.updateProjectionMatrix();

  prop.draw.renderer.render(prop.draw.scene, prop.draw.camera);

  $("#fps").text(prop.time.fps.toFixed(0));
}
