//create scenes for css and gl
//create webgl objects
//create dom objects

var reify = require("./reify.js"),
    language = require("./language.js"),
    layers = require("./layers.js");

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

new Point(1, 2);`

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

let camera,
    cssScene, cssRenderer,
    glScene, glRenderer,
    controls;

function init(layerNodes, width, height){
  //CREATE SCENES
  cssScene = new THREE.Scene();
  glScene = new THREE.Scene();

  //CREATE CAMERA
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 500 );
  camera.position.z = 500;

  // let light = new THREE.AmbientLight( 0x404040 ); // soft white light
  // cssScene.add( light );

  //CREATE RENDERERS
  cssRenderer = new THREE.CSS3DRenderer();
  cssRenderer.setSize( window.innerWidth, window.innerHeight );
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = 0;
  document.body.appendChild( cssRenderer.domElement );

  glRenderer = new THREE.WebGLRenderer({alpha: true});
  glRenderer.setSize( window.innerWidth, window.innerHeight );
  glRenderer.setClearColor( 0x000000, 0 );
  glRenderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( glRenderer.domElement );



  //ADD OBJECTS TO CSS SCENE
  let layerDiff = 2;
  layerNodes.forEach((layer, i)=>{
    for(let j=0; j < layerDiff; j+=1){
      let object3d = new THREE.CSS3DObject(layer.cloneNode(true));
      object3d.position.set(-width/2, height/2, i*layerDiff + j);
      cssScene.add(object3d);
    }
  })

  //ADD OBJECTS TO GL SCENE
  let geometry = new THREE.BoxGeometry( width, height, 2*layerNodes.length);

  let hex = Math.random() * 0xffffff;
  for ( let i = 0; i < geometry.faces.length; i += 2 ) {
    geometry.faces[ i ].color.setHex( hex );
    geometry.faces[ i + 1 ].color.setHex( hex );
  }

  let material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
  material.opacity = 0.7;
  // material.blending = THREE.AdditiveBlending;

  let cube = new THREE.Mesh( geometry, material );
  cube.position.z = layerNodes.length;
  cube.position.y = 15;
  glScene.add( cube );

  //SETUP CONTROLS
  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 4;

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  glRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  cssRenderer.render(cssScene, camera);
  glRenderer.render(glScene, camera);
}
