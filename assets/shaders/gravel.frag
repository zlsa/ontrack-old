
varying float vD;
varying vec2 vUV;
varying vec3 vNormal;

uniform sampler2D gravel;
uniform float time;

$FOG_PARAMETERS

$UTILS

void main() {
  vec2 vp=vUV;
  vp.x*=2.0;
  vp.x+=1.25;
  vp.x*=2.0;
  vp.y*=0.08;

  vec4 color=texture2D(gravel, vp);

  // lighting

  //  vec3 vn=vec3(vNormal.x,vNormal.y,vNormal.z);

  //  float vs=30.0;

  //  vec3 light = vec3(0.0, 1.0, 0.0);
  //  light = normalize(light);
  //  vn = normalize(vn);
  //  float ls = max(0.0, dot(vn,light))*0.7;

  gl_FragColor = color;

  $FOG_COLOR
}
