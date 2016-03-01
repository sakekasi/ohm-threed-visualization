// var THREE = require("three"),
// var THREE = require("three");

let example = `class Point with x, y;

def Point.init(x, y) {
  this.x = x;
  this.y = y;
}

def Point.toString() {
  return "Point(" + this.x + ", " + this.y + ")";
}


class ThreeDeePoint extends Point with z;

def ThreeDeePoint.init(x, y, z) {
  super.init(x, y);
  this.z = z;
}

def ThreeDeePoint.toString() {
  return "ThreeDeePoint(" +
  this.x + ", " +
  this.y + ", " +
  this.z + ")";
}

new Point(1, 2);`;


init();
animate();

function CodeExample(code, x, y, z){
  let div = document.createElement("div");
  div.classList.add("codeExample");

  let pre = document.createElement("pre");
  pre.textContent = code;
  div.appendChild(pre);

  let object3d = new THREE.CSS3DObject( div );
  object3d.position.set(x, y, z);

  return object3d;
}

function init(){
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 500 );
  camera.position.z = 1000;

  // let light = new THREE.AmbientLight( 0x404040 ); // soft white light
  // scene.add( light );


  renderer = new THREE.CSS3DRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = 0;

  document.body.appendChild( renderer.domElement );

  scene.add( new CodeExample(example, -50, -50, 0) );

  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 4;

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
