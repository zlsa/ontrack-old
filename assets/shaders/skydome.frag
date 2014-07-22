
uniform sampler2D skydome;
varying vec2 vUV;

void main() {
  vec4 sample = texture2D(skydome, vUV);
  gl_FragColor = vec4(sample.xyz, sample.w);

}
