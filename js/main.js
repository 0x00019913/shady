var width, height;
var container, camera, scene, renderer, controls;
var mesh, offset, offsetRateX, offsetRateY, offsetRateControls = [];
var gui;
var bgColor0, bgColor1;
container = document.getElementById('container');

init();
animate();

function init() {
  height = container.offsetHeight;
  width = container.offsetWidth;

  camera = new THREE.PerspectiveCamera(45, width/height, .1, 100000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0);

  offset = new THREE.Vector3();
  offsetRateX = 0.0, offsetRateY = 0.0, offsetRateZ = 0.0;
  gui = new dat.GUI();
  gui.add(this, "updateShader");
  gui.add(this, "saveVertShader");
  gui.add(this, "saveFragShader");
  gui.add(this, "resetCamera");
  var loadFolder = gui.addFolder("Load");
  loadFolder.add(this, "loadDefault");
  loadFolder.add(this, "loadSimplexNoise");
  loadFolder.add(this, "loadFBMNoise");
  loadFolder.add(this, "loadMovingClouds");
  var meshFolder = gui.addFolder("Mesh");
  meshFolder.add(this, "setMeshPlane");
  meshFolder.add(this, "setMeshSphere");
  var animationFolder = gui.addFolder("Animation");
  offsetRateControls[0] = animationFolder.add(this, "offsetRateX");
  offsetRateControls[1] = animationFolder.add(this, "offsetRateY");
  offsetRateControls[2] = animationFolder.add(this, "offsetRateZ");
  animationFolder.add(this, "resetOffset");
  animationFolder.add(this, "resetOffsetRates");
  var backgroundFolder = gui.addFolder("Background");
  bgColor0 = "#23272d";
  bgColor1 = "#64717a";
  var bgColor0Uni = new THREE.Color(bgColor0);
  var bgColor1Uni = new THREE.Color(bgColor1);
  backgroundFolder.addColor(this, "bgColor0").onChange(setColor0Uni);
  backgroundFolder.addColor(this, "bgColor1").onChange(setColor1Uni);
  function setColor0Uni() { bgColor0Uni.set(bgColor0); }
  function setColor1Uni() { bgColor1Uni.set(bgColor1); }

  controls = new Controls(
    camera,
    container,
    {
      type: "FreeCam",
      phi: Math.PI/2,
      theta: Math.PI/2,
      r: 2,
      rMax: 10,
      xPanRate: 0,
      yPanRate: 0
    }
  );


  loadDefault();
  setMeshPlane();

  var bgVert = "\
  varying vec2 vPos; \
  uniform float size; \
  void main() { \
    vPos = position.xy / (size*2.0)  + 0.5; \
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); \
  }";
  var bgFrag = "\
  varying vec2 vPos; \
  uniform vec3 color0; \
  uniform vec3 color1; \
  \
  void main() {\
    vec3 color = mix(color0, color1, vPos.y); \
    gl_FragColor = vec4(color, 1.0); \
  }";
  var bgSize = 12;
  var bgGeo = new THREE.SphereGeometry(bgSize, 32, 32);
  var bgMat = new THREE.ShaderMaterial({
    uniforms: {
      color0: { value: bgColor0Uni },
      color1: { value: bgColor1Uni },
      size: { value: bgSize }
    },
    vertexShader: bgVert,
    fragmentShader: bgFrag,
    side: THREE.DoubleSide
  });
  scene.add(new THREE.Mesh(bgGeo, bgMat));

  /* RENDER */
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  addEventListeners();
}

function addEventListeners() {
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  height = container.offsetHeight;
  width = container.offsetWidth;
  camera.aspect = width/height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}
function render() {
  if (!camera || !scene) return;
  controls.update();
  offset.x += offsetRateX;
  offset.y += offsetRateY;
  offset.z += offsetRateZ;
  renderer.render(scene, camera);
}

function removeCurrentMesh() {
  var children = this.scene.children;
  for (var i=children.length-1; i>=0; i--) {
    var child = children[i];
    if (child.name=="main_mesh") {
      scene.remove(child);
    }
  }
}
function setMeshPlane() {
  removeCurrentMesh();
  var geo = new THREE.PlaneGeometry(1,1);
  mesh = new THREE.Mesh(geo);
  mesh.name = "main_mesh";
  updateShader();
  scene.add(mesh);
}
function setMeshSphere() {
  removeCurrentMesh();
  var geo = new THREE.SphereGeometry(0.5,64,64);
  mesh = new THREE.Mesh(geo);
  mesh.name = "main_mesh";
  updateShader();
  scene.add(mesh);
}

function updateShader() {
  if (!mesh) return;
  var vert = document.getElementById("vertShader").value;
  var frag = document.getElementById("fragShader").value;
  var material = new THREE.ShaderMaterial({
    uniforms: {
      offset: { value: offset }
    },
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.DoubleSide
  });
  mesh.material = material;
}

function saveVertShader() { saveShader("vertex"); }
function saveFragShader() { saveShader("fragment"); }
function saveShader(type) {
  var fname = type+"Shader.txt";
  var source = document.getElementById(type=="vertex" ? "vertShader" : "fragShader");
  var blob = new Blob([source.value], { type: 'text/plain' });

  var a = document.createElement("a");
  if (window.navigator.msSaveOrOpenBlob) { // IE :(
    window.navigator.msSaveOrOpenBlob(blob, fname);
  }
  else {
    var url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }
}
function resetCamera() {
  controls.r = 2;
  controls.phi = Math.PI/2;
  controls.theta = Math.PI/2;
}

function resetOffset() {
  offset.x = 0;
  offset.y = 0;
  offset.z = 0;
}
function resetOffsetRates() {
  offsetRateX = 0;
  offsetRateY = 0;
  offsetRateZ = 0;
  for (var i=0; i<offsetRateControls.length; i++) offsetRateControls[i].updateDisplay();
}

function resetAnimation() {
  resetOffsetRates();
  resetOffset();
}

document.getElementById("vertShader").addEventListener("keydown", handleKeyDownVert, false);
document.getElementById("fragShader").addEventListener("keydown", handleKeyDownFrag, false);
function handleKeyDownVert(e) { handleKeyDown("vertex", e); }
function handleKeyDownFrag(e) { handleKeyDown("fragment", e); }
function handleKeyDown(type, e) {
  var source = document.getElementById(type=="vertex" ? "vertShader" : "fragShader");

  // handle tab; insert two spaces
  if (e.key=="Tab" || e.keyCode==9) {
    e.preventDefault();
    var ss = source.selectionStart, se = source.selectionEnd;
    source.value = source.value.substring(0, ss) + "  " + source.value.substring(se);
    source.selectionStart = ss+2;
    source.selectionEnd = ss+2;
  }
  if (e.key=="Enter" && e.shiftKey) {
    e.preventDefault();
    updateShader();
  }
}

function loadDefault() {
  resetAnimation();

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
  document.getElementById("vertShader").value = default_vert;
  document.getElementById("fragShader").value = default_frag;
  updateShader();
}

function loadSimplexNoise() {
  resetAnimation();

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
  document.getElementById("vertShader").value = simplex_noise_vert;
  document.getElementById("fragShader").value = simplex_noise_frag;
  updateShader();
}

function loadFBMNoise() {
  resetAnimation();

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
  document.getElementById("vertShader").value = FBM_noise_vert;
  document.getElementById("fragShader").value = FBM_noise_frag;
  updateShader();
}

function loadMovingClouds() {
  resetAnimation();
  offsetRateY = 0.001;

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
    pos.y /= 2.0;\n\
    float intensity = 0.70*fbm((pos + offset).xy * 4.0, 2.0, 0.5);\n\
    float noiseSub = 0.2*fbm((pos + offset*0.81).xy * 24.0, 2.0, 0.5);\n\
    vec3 level = clamp(vec3(intensity-noiseSub), 0.0, 1.0);\n\
    gl_FragColor = vec4(level, 1.0);\n\
  }";
  document.getElementById("vertShader").value = clouds_vert;
  document.getElementById("fragShader").value = clouds_frag;
  updateShader();
}
