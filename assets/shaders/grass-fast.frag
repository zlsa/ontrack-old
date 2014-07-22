
varying float vD;
varying vec2 vUV;
varying vec3 vNormal;

uniform sampler2D texture;
uniform float time;

$PARAMETERS
$UTILS

void main() {
  vec2 vp=vUV*800.0;
  
  float tt=time*0.8;

  float s=10.0;
  float v=0.00001;
  vp.x*=crange(-1.0,sin(tt+vp.y*s),1.0,1.0-v,1.0+v);
  vp.y*=crange(-1.0,sin(tt+vp.x*s),1.0,1.0-v,1.0+v);

  vec4 color=texture2D(texture, vp*1.3);
  color+=texture2D(texture, vp*0.3)*2.0;
  color+=texture2D(texture, vp*10.8)*1.0;
  color*=0.25;

  s=1.0;
  float d=0.05;
  float t=trange(-1.0,snoise(vp*s),1.0,1.0-d,1.0+d);
  color.r*=t*1.1;
  color.g*=t*1.3;
  color.r*=1.1;
  color.g*=1.3;
  color.b*=trange(-1.0,snoise(vp*s+10000.0),1.0,1.0-d,1.0+d);

  s=0.3;
  d=0.1;
  color.rgb*=trange(-1.0,snoise(vp*s-1000.0),1.0,1.0-d,1.0+d);

  s=300.0;
  d=0.1;
  color.rgb*=trange(-1.0,snoise(vp*s-1000.0),1.0,1.0-d,1.0+d);

  // lighting

  vec3 vn=vec3(vNormal.x,vNormal.y,vNormal.z);
  vec3 light = vec3(0.0, 0.1, 0.1);
  light = normalize(light);
  float ls = max(0.0, dot(vn,light));

  gl_FragColor = vec4(color.rgb*ls, color.w);

  /* vec4 fog_color=vec4(0.807,0.88,0.88,1.0); */
  /* float fog=crange(10.0,vD,100.0,1.0,0.0); */

  /* gl_FragColor = vec4(gl_FragColor.rgb,fog); */

  $COLOR
}
