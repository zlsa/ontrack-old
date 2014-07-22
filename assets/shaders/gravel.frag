
varying float vD;
varying vec2 vUV;
varying vec3 vNormal;

uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform float time;

$PARAMETERS
$UTILS

void main() {
  vec2 vp=vUV*0.8;
  
  float tt=time*0.8;

  float s=10.0;
  float v=0.00001;

  vec4 color=texture2D(tColor, vp)*1.3;

  color*=trange(-1.0,snoise(vp*0.08),1.0,0.95,1.05);
  color*=trange(-1.0,snoise(vp*2.0),1.0,0.95,1.05);
  color*=1.5;

  // lighting

  vec3 vn=vec3(vNormal.x,vNormal.y,vNormal.z);

  vec4 normalColor=texture2D(tNormal, vp);
  float vs=30.0;
  vn.x*=normalColor.r*vs;
  vn.y*=normalColor.g*vs;
  vn.z*=normalColor.b*vs;

  vec3 light = vec3(0.0, 1.0, 0.0);
  light = normalize(light);
  vn = normalize(vn);
  float ls = max(0.0, dot(vn,light))*0.7;

  gl_FragColor = vec4(color.rgb*ls, color.w);

  $COLOR
}
