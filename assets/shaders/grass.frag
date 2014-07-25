
varying float vD;
varying vec2 vUV;
varying vec3 vNormal;

uniform sampler2D grass;
uniform float time;

$UTILS

$FOG_PARAMETERS

void main() {
  vec2 vp=vUV*50.0;
  
  vec4 color=texture2D(grass, vp*0.7);
  color+=texture2D(grass, vp*0.3)*2.0;
  color+=texture2D(grass, vp*5.8)*3.0;
  color*=0.3;

  color.g*=1.2;

  // lighting

  vec3 vn=vec3(vNormal.x,vNormal.y,vNormal.z);
  vec3 light = vec3(0.0, 0.1, 0.1);
  light = normalize(light);
  float ls = max(0.0, dot(vn,light));

  gl_FragColor = vec4(color.rgb*ls, color.w);

  /* vec4 fog_color=vec4(0.807,0.88,0.88,1.0); */
  /* float fog=crange(10.0,vD,100.0,1.0,0.0); */

  /* gl_FragColor = vec4(gl_FragColor.rgb,fog); */

  $FOG_COLOR
}
