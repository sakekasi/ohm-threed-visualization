var reify = require("./reify.js"),
    language = require("./language.js"),
    layers = require("./layers.js");

let example = ["class Point with x, y;",
"",
'def Point.init(x, y) {',
'  this.x = x;',
'  this.y = y;',
'}',
'',
'def Point.toString() {',
'  return "Point(" + this.x + ", " + this.y + ")";',
'}',
'',
'class ThreeDeePoint extends Point with z;',
'',
'def ThreeDeePoint.init(x, y, z) {',
'  super.init(x, y);',
'  this.z = z;',
'}',
'',
'def ThreeDeePoint.toString() {',
'  return "ThreeDeePoint(" +',
'  this.x + ", " +',
'  this.y + ", " +',
'  this.z + ")";',
'}',
'',
'new Point(1, 2);'].join("\n");

document.addEventListener("DOMContentLoaded", function(){
  let grammar = language.grammar,
      semantics = language.semantics;

  reify.registerReifyActions(semantics);
  layers.registerLayersAction(semantics);

  let match;
  let semmatch;
  try {
    match = grammar.match(example);
    semmatch = semantics(match);
  } catch (e) {
    console.error(match.message);
  }

  let reified = reify.reify(semantics, match);
  let DOM = reified[0],
      domToOhm = reified[1],
      ohmToDom = reified[2];

  let pre = document.createElement("pre");
  pre.appendChild(DOM);
  document.body.appendChild(pre);

  let boundingRect = DOM.getBoundingClientRect();

  let layerNodes = semmatch.layers(ohmToDom, null, null);

  pre.style.display = "none";

  init(layerNodes, boundingRect.width, boundingRect.height);
  animate();
});

function init(layerNodes, width, height){
  console.log(width, height);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 500 );
  camera.position.z = 500;

  // let light = new THREE.AmbientLight( 0x404040 ); // soft white light
  // scene.add( light );

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = 0;

  document.body.appendChild( renderer.domElement );

  layerNodes.forEach((layer, i)=>{
    let object3d = new THREE.CSS3DObject(layer);
    object3d.position.set(-width/2, height/2, i*3);
    scene.add(object3d);
  })
  // scene.add( new CodeExample(example, -50, -50, 0) );

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
