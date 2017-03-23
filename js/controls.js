// 0x00019913's camera controls
// To be used with the THREE.js camera.
// See setDefaults() for various settable properties like rates and limits.

// 1. FreeCam
// Characterized by:
//  origin
//  radial distance r (from origin)
//  angles theta (0-pi), phi (0-2pi)
// Angles signify rotation about origin.
// Origin can move by panning with MMB. Rotate w/ LMB. Camera always
// looks at origin.

// 2. CylCam - moves on the surface of a cylinder and pivots around that point
// Characterized by:
//  radius of cylinder r
//  angle around cylinder phi
//  z (vertical displacement along cylinder, may not use)
//  target pivot params tr, ttheta, tphi (around camera's location on cylinder)
// Camera's position on cylinder is set w/ MMB. Camera's rotation around pivot
// is set w/ LMB; this moves the origin and tells camera to look at it. Zooming
// adds a displacement vector to camera and origin, which rotates w/ phi.

// 3. PlayerCam - has an associated position; camera rotates around the position
// as it does in any first-person game
// Characterized by:
//  position (THREE.Vector3)
//  angles theta (0-pi), phi (0-2pi)
// Focus on the element is set with LMB, unset with RMB. With focus set, moving
// the mouse moves the camera. Detects WASD; responses to each of these are set
// by the physics engine.

// need to offset some default limits to prevent gimbal lock
epsilon = .01;

//  constructor
//  arguments:
//    camera: THREE.Camera
//    domElement: dom element on which to listen for user input
//    params (optional): object containing initialization params,
//                       e.g., { r: 15, theta: Math.PI/2 }
Controls = function(camera, domElement, params) {
  this.objects = [];
  this.camera = camera;
  this.domElement = (domElement!==undefined) ? domElement : document;

  this.responses = {};

  if (!params) params = { type: "FreeCam" };
  if (!params.type) params.type = "FreeCam";

  this.setDefaults(params.type);

  for (var key in params) {
    this[key] = params[key];
  }

  // EVENT HANDLING

  // for use inside the event handlers
  var _this = this;
  var mouseX = 0, mouseY = 0;
  var mouseXprev, mouseYprev;
  var touchX = 0, touchY = 0;
  var touchXprev, touchYprev;
  var dX, dY;
  var mouseButton = -1;
  var focus = false;

  // add event listeners
  this.domElement.addEventListener('mousemove', onMouseMove, false);
  this.domElement.addEventListener('mousedown', onMouseDown, false);
  this.domElement.addEventListener('mouseup', onMouseUp, false);
  this.domElement.addEventListener('mouseenter', onMouseEnter, false);
  this.domElement.addEventListener('mousewheel', onMousewheel, false);
  this.domElement.addEventListener('DOMMouseScroll', onMousewheel, false); //Firefox

  this.domElement.addEventListener('keydown', onKeyDown, true);

  if ("onpointerlockchange" in document) {
    document.addEventListener('pointerlockchange', onLockChange, false);
  }
  else if ("onmozpointerlockchange" in document) {
    document.addEventListener('mozpointerlockchange', onLockChange, false);
  }

  function onMouseMove(e) {
    // calculate difference in mouse position between this and the previous events
    /*if ("movementX" in e) {
      dX = e.movementX;
      if (Math.abs(dX)>100) dX = 0;
      dY = e.movementY;
      if (Math.abs(dY)>100) dY = 0;
    }
    else {*/
    mouseXprev = mouseX;
    mouseYprev = mouseY;
    mouseX = (e.clientX / _this.domElement.offsetWidth) * 2 - 1;
    mouseY = (e.clientY / _this.domElement.offsetHeight) * 2 - 1;
    dX = mouseX-mouseXprev;
    dY = mouseY-mouseYprev;

    handleMousemove();

    if (mouseButton==0) { // LMB
      handleMoveLMB();
    }

    if (mouseButton==1) { // MMB
      handleMoveMMB();
    }

    if (mouseButton==2) { // RMB
      handleMoveRMB();
    }
  }

  function onMousewheel(e) {
    var d = ((typeof e.wheelDelta !== "undefined")?(-e.wheelDelta):(e.detail));
    handleWheel(d);
  }

  function onMouseDown(e) {
    mouseButton = e.button;
    handleMouseButton();
  };
  function onMouseUp(e) {
    mouseButton = -1;
  };
  function onMouseEnter(e) {
    mouseButton = -1;
  };
  function onKeyDown(e) {
    var resp = _this.responses[e.code];
    if (resp) resp();
  }

  function onLockChange(e) {
    if (document.pointerLockElement===_this.domElement ||
      document.mozPointerLockElement===_this.domElement) {
      _this.focus = true;
    }
    else {
      _this.focus = false;
    }
  }

  function handleMousemove() {
    if (_this.type=="PlayerCam" && _this.focus) {
      _this.theta += _this.thetaRate * dY;
      if (_this.theta < _this.thetaMin) _this.theta = _this.thetaMin;
      if (_this.theta > _this.thetaMax) _this.theta = _this.thetaMax;
      _this.phi += _this.phiRate * dX;
      if (_this.phi < _this.phiMin) _this.phi = _this.phiMin;
      if (_this.phi > _this.phiMax) _this.phi = _this.phiMax;
    }
  }

  function handleMoveLMB() {
    if (_this.type=="FreeCam") {
      _this.theta += _this.thetaRate * dY;
      if (_this.theta < _this.thetaMin) _this.theta = _this.thetaMin;
      if (_this.theta > _this.thetaMax) _this.theta = _this.thetaMax;
      _this.phi += _this.phiRate * dX;
      if (_this.phi < _this.phiMin) _this.phi = _this.phiMin;
      if (_this.phi > _this.phiMax) _this.phi = _this.phiMax;
    }
    else if (_this.type=="CylCam") {
      _this.otheta -= _this.othetaRate * dY;
      if (_this.otheta < _this.othetaMin) _this.otheta = _this.othetaMin;
      if (_this.otheta > _this.othetaMax) _this.otheta = _this.othetaMax;
      _this.phi += _this.phiRate * dX;
      if (_this.phi < _this.phiMin) _this.phi = _this.phiMin;
      if (_this.phi > _this.phiMax) _this.phi = _this.phiMax;
    }
  }

  function handleMoveMMB() {
    if (_this.type=="FreeCam") {
      // Not obvious:
      // default plane (theta=phi=0) is Y up, Z right, so put displacement
      // vector in that plane (larger for larger r), rotate around Z to adjust
      // for theta, then rotate around Y to adjust for phi
      var displacement = new THREE.Vector3(
        0,
        dY*_this.yPanRate*_this.r,
        dX*_this.xPanRate*_this.r
      );
      displacement.applyAxisAngle(new THREE.Vector3(0,0,-1),Math.PI/2-_this.theta);
      displacement.applyAxisAngle(new THREE.Vector3(0,1,0),_this.phi);
      // minus is necessary; I think it's because we're in a left-handed coord system
      displacement.x *= -1;
      _this.origin.add(displacement);
    }
    if (_this.type=="CylCam") {
      _this.z += dY*_this.zRate*_this.r;
      if (_this.z < _this.zMin) _this.z = _this.zMin;
      if (_this.z > _this.zMax) _this.z = _this.zMax;
    }
  }

  function handleMoveRMB() { //stub
  }

  function handleMouseButton() {
    if (mouseButton==0) {
      if (_this.type=="PlayerCam") {
        _this.domElement.requestPointerLock = _this.domElement.requestPointerLock ||
          _this.domElement.mozRequestPointerLock;
        _this.domElement.requestPointerLock();
      }
    }
    else if (mouseButton==1) {

    }
    else if (mouseButton==2) {
      if (_this.type=="PlayerCam") {
        document.exitPointerLock = document.exitPointerLock ||
          document.mozExitPointerLock;
        document.exitPointerLock();
      }
    }
  }

  function handleWheel(d) {
    if (_this.type=="FreeCam") {
      _this.r += _this.r * ((d>0)?_this.rRate:(-1*_this.rRate));
      if (_this.r<_this.rMin) _this.r = _this.rMin;
      if (_this.r>_this.rMax) _this.r = _this.rMax;
    }
    if (_this.type=="CylCam") {
      _this.r += _this.r * ((d>0)?_this.rRate:(-1*_this.rRate));
      if (_this.r<_this.rMin) _this.r = _this.rMin;
      if (_this.r>_this.rMax) _this.r = _this.rMax;
    }
  }
}

Controls.prototype.setResponse = function(action, response) {
  this.responses[action] = response;
}

Controls.prototype.setDefaults = function(type) {
  // init to default values that work well
  if (type == "FreeCam") {
    this.r = 5;
    this.theta = Math.PI/2;
    this.phi = 0;
    this.rRate = 0.1;

    this.thetaRate = -4.0;
    this.phiRate = 4.0;
    this.xPanRate = 0.01;
    this.yPanRate = 0.01;

    this.rMin = epsilon;
    this.rMax = Infinity;
    this.thetaMin = epsilon;
    this.thetaMax = Math.PI-epsilon;

    this.origin = new THREE.Vector3(0,0,0);
  }
  else if (type == "CylCam") {
    // cylindrical coordinates of camera
    this.r = 15;
    this.phi = 0;
    this.z = 0;
    // spherical coordinates of target around camera
    this.tr = 1;
    this.ttheta = Math.PI/2;
    this.tphi = 0;

    this.rRate = 0.1;
    this.phiRate = 5;
    this.zRate = 1.5;
    this.tthetaRate = -1;
    this.tphiRate = -0.5;

    this.rMin = epsilon;
    this.rMax = Infinity;
    this.phiMin = -Infinity;
    this.phiMax = Infinity;
    this.zMin = -Infinity;
    this.zMax = Infinity;
    this.tthetaMin = epsilon;
    this.tthetaMax = Math.PI-epsilon;
    this.target = new THREE.Vector3(0,0,0);
  }
  else if (type == "PlayerCam") {
    // position of camera
    this.position = new THREE.Vector3();
    // spherical coordimates of target around camera (always 1 away)
    this.theta = Math.PI/2;
    this.phi = 0;

    this.thetaRate = 0.005;
    this.phiRate = 0.001;

    this.thetaMin = epsilon;
    this.thetaMax = Math.PI-epsilon;
    this.target = new THREE.Vector3(0,0,0);
  }
  else {
    console.log("ERROR: Unknown camera type: ", type);
  }
}

Controls.prototype.update = function(params) {
  // update can be used to set the params
  if (params) {
    for (var key in params) {
      this[key] = params[key];
    }
  }

  var camPos = new THREE.Vector3();

  if (this.type=="FreeCam") {
    camPos.x = this.r * Math.cos(this.phi) * Math.sin(this.theta) + this.origin.x;
    camPos.z = this.r * Math.sin(this.phi) * Math.sin(this.theta) + this.origin.z;
    camPos.y = this.r * Math.cos(this.theta) + this.origin.y;
    this.camera.position.copy(camPos);
    this.camera.lookAt(this.origin);
  }
  else if (this.type=="CylCam") {
    // todo: I appear to have broken this at some point; don't need it now, but
    // fix eventually
    camPos.x = this.r * Math.cos(this.phi);
    camPos.z = this.r * Math.sin(this.phi);
    camPos.y = this.z;
    this.camera.position.copy(camPos);
    this.target.x = this.tr * Math.cos(this.tphi) * Math.sin(this.ttheta);
    this.target.z = this.tr * Math.sin(this.tphi) * Math.sin(this.ttheta);
    this.target.y = this.tr * Math.cos(this.ttheta);
    this.target.applyAxisAngle(new THREE.Vector3(0,1,0),-this.phi);
    this.target.add(this.camera.position);
    this.camera.lookAt(this.target);
  }
  else if (this.type=="PlayerCam") {
    this.camera.position.copy(this.position);
    this.target.x = Math.cos(this.phi) * Math.sin(this.theta);
    this.target.z = Math.sin(this.phi) * Math.sin(this.theta);
    this.target.y = Math.cos(this.theta);
    this.target.applyAxisAngle(new THREE.Vector3(0,1,0),-this.phi);
    this.target.add(this.camera.position);
    this.camera.lookAt(this.target);
  }

  for (var i=0; i<this.objects.length; i++) {
    this.objects[i].position.copy(camPos);
  }
}

// adds more objects whose position will coincide with the camera's;
// e.g., for making a light that follows the camera
Controls.prototype.addObject = function(object) {
  this.objects.push(object);
}
