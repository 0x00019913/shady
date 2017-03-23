var width, height;
var container, camera, scene, renderer, controls;
var mesh, offset, offsetRateX, offsetRateY;
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

  offset = new THREE.Vector2();
  offsetRateX = 0.0, offsetRateY = 0.0;
  gui = new dat.GUI();
  gui.add(this, "updateShader");
  gui.add(this, "saveShaderVert");
  gui.add(this, "saveShaderFrag");
  gui.add(this, "resetCamera");
  var animationFolder = gui.addFolder("Animation");
  animationFolder.add(this, "offsetRateX");
  animationFolder.add(this, "offsetRateY");
  animationFolder.add(this, "resetOffset");
  var backgroundFolder = gui.addFolder("Background");
  bgColor0 = "#2d3239";
  bgColor1 = "#c7dae8";
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
      phi: 0,
      theta: Math.PI/2,
      r: 2,
      rMax: 10
    }
  );

  var planeGeo = new THREE.PlaneGeometry(1,1);
  mesh = new THREE.Mesh(planeGeo);
  mesh.rotateY(Math.PI/2);
  updateShader();
  scene.add(mesh);


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
  renderer.render(scene, camera);
}

function updateShader() {
  var material = new THREE.ShaderMaterial({
    uniforms: {
      offset: { value: offset }
    },
    vertexShader: document.getElementById("vertShader").value,
    fragmentShader: document.getElementById("fragShader").value,
    side: THREE.DoubleSide
  });
  mesh.material = material;
}

function saveShaderVert() { saveShader("vertex"); }
function saveShaderFrag() { saveShader("fragment"); }
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
  controls.phi = 0;
  controls.theta = Math.PI/2;
}

function resetOffset() {
  offset.x = 0;
  offset.y = 0;
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
