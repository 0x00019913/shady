var width, height;
var container, camera, scene, renderer, controls;
var mesh, offset, offsetRateX, offsetRateY;
var gui;
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
  gui.add(this, "offsetRateX");
  gui.add(this, "offsetRateY");
  gui.add(this, "resetOffset");

  controls = new Controls(
    camera,
    container,
    {
      type: "FreeCam",
      phi: 0,
      theta: Math.PI/2,
      r: 2
    }
  );

  var planeGeo = new THREE.PlaneGeometry(1,1);
  mesh = new THREE.Mesh(planeGeo);
  mesh.rotateY(Math.PI/2);
  updateMaterial();
  scene.add(mesh);

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

function updateMaterial() {
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

document.getElementById("runButton").onclick = updateMaterial;
document.getElementById("saveVertButton").onclick = function() { saveShader("vertex"); }
document.getElementById("saveFragButton").onclick = function() { saveShader("fragment"); }

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
}
