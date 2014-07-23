
function draw_init_pre() {
  prop.draw={};

  prop.draw.fov=60;

  prop.draw.znear=1;
  prop.draw.zfar=50000;

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
  prop.draw.shaders["fog-color"]=[
    "float fog=scrange(fogNear,vD,fogFar,0.0,1.0);",
    "gl_FragColor=mix(gl_FragColor,vec4(fogColor.rgb,1.0),fog);",
  ].join("\n");

}

function draw_init() {

  // SCENE
  prop.draw.scene=new THREE.Scene();

  // CAMERA
  prop.draw.camera=new THREE.PerspectiveCamera(
    prop.draw.fov,
    prop.draw.size.width / prop.draw.size.height,
    prop.draw.znear,
    prop.draw.zfar);
  prop.draw.camera.name="camera";

  // RENDERER
  prop.draw.renderer=new THREE.WebGLRenderer({
    antialias:true,
  });

  prop.draw.renderer.setSize(prop.draw.size.width, prop.draw.size.height);

  $("body #view").append(prop.draw.renderer.domElement);

  // SUN
  prop.draw.sun=new THREE.DirectionalLight(0xffeedd, 1.1);
  prop.draw.sun.position=prop.environment.sun_direction;
  prop.draw.scene.add(prop.draw.sun);
  
  prop.draw.fog=new THREE.Fog(prop.environment.fog.color,
                             prop.environment.fog.near,
                              prop.environment.fog.far);

  prop.draw.scene.fog=prop.draw.fog;

}

function draw_ready() {

  // SKYDOME

  var skydome_geometry=new THREE.SphereGeometry(prop.draw.zfar*0.7, 20, 10);

  prop.draw.skydome=new THREE.Mesh(skydome_geometry, shader_get_material("skydome"));
  prop.draw.skydome.scale.set(-1,1,1);
  prop.draw.skydome.renderDepth=1000.0;
  prop.draw.scene.add(prop.draw.skydome);

  // GROUND
  var ground_geometry=new THREE.PlaneGeometry(6000, 6000, 3, 3);
  prop.draw.ground=new THREE.Mesh(ground_geometry, shader_get_material("grass"));
  prop.draw.ground.rotation.set(-Math.PI/2,0,0);
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

function draw_unset_camera(mode) {
  if(mode == "cab" || mode == "front") {
    prop.train.current.cars[0].model.remove(prop.draw.camera);
  }
  if(mode == "front") {
    prop.draw.camera.fov=prop.draw.fov;
    prop.draw.camera.updateProjectionMatrix();
  }
}

function draw_set_camera(mode) {
  if(mode == "cab" || mode == "front") {
    prop.train.current.cars[0].model.add(prop.draw.camera);
  }
  if(mode == "cab") {
    prop.draw.camera.position.set(0,0.5,10.1);
    prop.draw.camera.rotation.set(0,Math.PI,0);
  } else if(mode == "front") {
    prop.draw.camera.position.set(0,2,50);
    prop.draw.camera.lookAt(new THREE.Vector3(0,1,0));
    prop.draw.camera.fov=prop.draw.fov*0.4;
    prop.draw.camera.updateProjectionMatrix();
  }
}

function draw_update_post() {

  var track=prop.railway.current.getRoot("master");

  prop.draw.renderer.render(prop.draw.scene, prop.draw.camera);

  $("#fps").text(prop.time.fps.toFixed(0));
}
