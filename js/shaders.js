var default_vert = "\
/* vertex shader */\n\
varying vec3 vPos;\n\
\n\
void main() {\n\
  vPos = position;\n\
  vPos += 0.5; /* positions in unit plane go from -0.5 to 0.5 */\n\
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\
}";
var default_frag = "\
/* fragment shader */\n\
uniform vec3 offset;\n\
\n\
varying vec3 vPos;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(vPos.xy+offset.xy, 1.0, 1.0);\n\
}";

var simplex_noise_vert = "\
/* vertex shader */\n\
varying vec3 vPos;\n\
\n\
void main() {\n\
  vPos = position;\n\
  vPos += 0.5;\n\
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\
}";
var simplex_noise_frag = "\
/* fragment shader */\n\
varying vec3 vPos;\n\
\n\
vec3 mod289(vec3 x) {\
  return x - floor(x * (1.0/289.0)) * 289.0;\n\
}\n\
\n\
vec3 permute(vec3 x) {\n\
  return mod289(((x*34.0) + 1.0) * x);\n\
}\n\
\n\
const float F2 = 0.5*(sqrt(3.0)-1.0);\n\
const float G2 = (3.0-sqrt(3.0))/6.0;\n\
\n\
/* simplex noise shaders combine some of the code in the Gustavson paper,\n\
   http://weber.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf,\n\
   and the code in his repo,\n\
   https://github.com/stegu/webgl-noise/ */\n\
float simplex(vec2 v) {\n\
\n\
  /* base corner */\n\
  vec2 i = floor(v + (v.x+v.y)*F2);\n\
  vec2 x0 = v - i + (i.x+i.y)*G2;\n\
\n\
  /* middle and far corners */\n\
  vec2 i1;\n\
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
  vec2 x1 = x0 - i1 + G2;\n\
  vec2 x2 = x0 - 1.0 + 2.0*G2;\n\
\n\
  i = mod289(vec3(i, 0.0)).xy;\n\
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n\
\n\
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
  m = m*m;\n\
  m = m*m;\n\
\n\
  vec3 x = 2.0 * fract(p / 41.0) - 1.0;\n\
  vec3 h = abs(x) - 0.5;\n\
  vec3 ox = floor(x + 0.5);\n\
  vec3 a0 = x-ox;\n\
\n\
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);\n\
\n\
  vec3 g;\n\
  g.x = a0.x*x0.x + h.x*x0.y;\n\
  g.y = a0.y*x1.x + h.y*x1.y;\n\
  g.z = a0.z*x2.x + h.z*x2.y;\n\
\n\
  float intensity = 130.0 * dot(m,g);\n\
  return intensity;\n\
}\n\
\n\
void main() {\n\
  float intensity = simplex(vPos.xy*2.5);\n\
  vec3 level = clamp(vec3(intensity), 0.0, 1.0);\n\
  gl_FragColor = vec4(level, 1.0);\n\
}";

var FBM_noise_vert = "\
/* vertex shader */\n\
varying vec3 vPos;\n\
\n\
void main() {\n\
  vPos = position;\n\
  vPos += 0.5;\n\
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\
}";
var FBM_noise_frag = "\
/* fragment shader */\n\
varying vec3 vPos;\n\
\n\
vec3 mod289(vec3 x) {\
  return x - floor(x * (1.0/289.0)) * 289.0;\n\
}\n\
\n\
vec3 permute(vec3 x) {\n\
  return mod289(((x*34.0) + 1.0) * x);\n\
}\n\
\n\
const float F2 = 0.5*(sqrt(3.0)-1.0);\n\
const float G2 = (3.0-sqrt(3.0))/6.0;\n\
\n\
/* simplex noise shaders combine some of the code in the Gustavson paper,\n\
   http://weber.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf,\n\
   and the code in his repo,\n\
   https://github.com/stegu/webgl-noise/ */\n\
float simplex(vec2 v) {\n\
\n\
  /* base corner */\n\
  vec2 i = floor(v + (v.x+v.y)*F2);\n\
  vec2 x0 = v - i + (i.x+i.y)*G2;\n\
\n\
  /* middle and far corners */\n\
  vec2 i1;\n\
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
  vec2 x1 = x0 - i1 + G2;\n\
  vec2 x2 = x0 - 1.0 + 2.0*G2;\n\
\n\
  i = mod289(vec3(i, 0.0)).xy;\n\
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n\
\n\
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
  m = m*m;\n\
  m = m*m;\n\
\n\
  vec3 x = 2.0 * fract(p / 41.0) - 1.0;\n\
  vec3 h = abs(x) - 0.5;\n\
  vec3 ox = floor(x + 0.5);\n\
  vec3 a0 = x-ox;\n\
\n\
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);\n\
\n\
  vec3 g;\n\
  g.x = a0.x*x0.x + h.x*x0.y;\n\
  g.y = a0.y*x1.x + h.y*x1.y;\n\
  g.z = a0.z*x2.x + h.z*x2.y;\n\
\n\
  float intensity = 130.0 * dot(m,g);\n\
  return intensity;\n\
}\n\
float fbm(vec2 v, float lacunarity, float gain) {\n\
  const int octaves = 5;\n\
  float sum = 0.0;\n\
  float amp = 1.0;\n\
  float freq = 1.0;\n\
  /* Fun story. In my Ubuntu VM, putting the simplex() call in a loop causes\n\
     the shader to render black every time. Works fine on Windows. Why, GLSL,\n\
     why? So I unwrapped it to 7 octaves. */\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  return sum;\n\
}\n\
\n\
void main() {\n\
  float intensity = 0.70*fbm(vPos.xy*2.5, 2.0, 0.5);\n\
  vec3 level = clamp(vec3(intensity), 0.0, 1.0);\n\
  gl_FragColor = vec4(level, 1.0);\n\
}";

var clouds_vert = "\
/* vertex shader */\n\
varying vec3 vPos;\n\
\n\
void main() {\n\
  vPos = position;\n\
  vPos += 0.5;\n\
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\
}";
var clouds_frag = "\
/* fragment shader */\n\
uniform vec3 offset;\n\
\n\
varying vec3 vPos;\n\
\n\
vec3 mod289(vec3 x) {\
  return x - floor(x * (1.0/289.0)) * 289.0;\n\
}\n\
\n\
vec3 permute(vec3 x) {\n\
  return mod289(((x*34.0) + 1.0) * x);\n\
}\n\
\n\
const float F2 = 0.5*(sqrt(3.0)-1.0);\n\
const float G2 = (3.0-sqrt(3.0))/6.0;\n\
\n\
/* simplex noise shaders combine some of the code in the Gustavson paper,\n\
   http://weber.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf,\n\
   and the code in his repo,\n\
   https://github.com/stegu/webgl-noise/ */\n\
float simplex(vec2 v) {\n\
\n\
  /* base corner */\n\
  vec2 i = floor(v + (v.x+v.y)*F2);\n\
  vec2 x0 = v - i + (i.x+i.y)*G2;\n\
\n\
  /* middle and far corners */\n\
  vec2 i1;\n\
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
  vec2 x1 = x0 - i1 + G2;\n\
  vec2 x2 = x0 - 1.0 + 2.0*G2;\n\
\n\
  i = mod289(vec3(i, 0.0)).xy;\n\
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n\
\n\
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
  m = m*m;\n\
  m = m*m;\n\
\n\
  vec3 x = 2.0 * fract(p / 41.0) - 1.0;\n\
  vec3 h = abs(x) - 0.5;\n\
  vec3 ox = floor(x + 0.5);\n\
  vec3 a0 = x-ox;\n\
\n\
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);\n\
\n\
  vec3 g;\n\
  g.x = a0.x*x0.x + h.x*x0.y;\n\
  g.y = a0.y*x1.x + h.y*x1.y;\n\
  g.z = a0.z*x2.x + h.z*x2.y;\n\
\n\
  float intensity = 130.0 * dot(m,g);\n\
  return intensity;\n\
}\n\
float fbm(vec2 v, float lacunarity, float gain) {\n\
  const int octaves = 5;\n\
  float sum = 0.0;\n\
  float amp = 1.0;\n\
  float freq = 1.0;\n\
  /* Fun story. In my Ubuntu VM, putting the simplex() call in a loop causes\n\
     the shader to render black every time. Works fine on Windows. Why, GLSL,\n\
     why? So I unwrapped it to 7 octaves. */\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  sum += amp * simplex(v * freq);\n\
  freq *= lacunarity;\n\
  amp *= gain;\n\
  return sum;\n\
}\n\
\n\
void main() {\n\
  vec3 pos = vPos;\n\
  /* stretch clouds vertically */\n\
  pos.y /= 2.0;\n\
  \n\
  /* get primary noise and secondary noise, then subtract */\n\
  float intensity = 0.70*fbm((pos + offset).xy * 4.0, 2.0, 0.5);\n\
  float noiseSub = 0.2*fbm((pos + offset*0.81).xy * 24.0, 2.0, 0.5);\n\
  intensity -= noiseSub;\n\
  \n\
  /* make sure everything's in the right range */\n\
  intensity = clamp(intensity, 0.0, 1.0);\n\
  \n\
  /* use the currently greyscale noise value to interpolate */\n\
  vec3 color1 = vec3(0.137, 0.152, 0.176);\n\
  vec3 color2 = vec3(1.0, 1.0, 1.0);\n\
  vec3 color = mix(color1, color2, intensity);\n\
  \n\
  /* output */\n\
  gl_FragColor = vec4(color, 1.0);\n\
}";
