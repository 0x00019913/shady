var width, height;
var container, camera, scene, renderer, controls;
var mesh;
container = document.getElementById('container');

init();
animate();

function init() {
  height = container.offsetHeight;
  width = container.offsetWidth;

  camera = new THREE.PerspectiveCamera(45, width/height, .1, 100000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0);

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
  updateMaterial();
  mesh.rotateY(Math.PI/2);
  scene.add(mesh);

  /* RENDER */
  renderer = new THREE.WebGLRenderer({ antialias: true });
  //renderer.toneMapping = THREE.ReinhardToneMapping;
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
  renderer.render(scene, camera);
}

function updateMaterial() {
  var material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById("vertShader").value,
    fragmentShader: document.getElementById("fragShader").value,
    side: THREE.DoubleSide
  });
  mesh.material = material;
}

document.getElementById("runButton").onclick = updateMaterial;
