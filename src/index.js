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

new Point(1, 2);`;

let camera,
    cssScene, cssRenderer,
    glScene, glRenderer,
    controls;

document.addEventListener("DOMContentLoaded", function(){
  let grammar = language.grammar,
      semantics = language.semantics;

  reify.registerReifyActions(semantics);
  layers.registerLayersAction(semantics);

  let {cssScene, glScene} = createScenes();
  let {cssRenderer, glRenderer} = createRenderers();
  let camera = createCamera();

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

  let {width, height} = DOM.getBoundingClientRect();

  //TODO: hand off scene, more info
  let layerNodes = semmatch.layers(ohmToDom, null, glScene, null, width, height);

  pre.style.display = "none";

  //ADD OBJECTS TO CSS SCENE
  let layerDiff = 2;
  layerNodes.forEach((layer, i)=>{
    for(let j=0; j < layerDiff; j+=1){
      let object3d = new THREE.CSS3DObject(layer.cloneNode(true));
      object3d.position.set(-width/2, height/2, i*layerDiff + j);
      cssScene.add(object3d);
    }
  });

  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 4;

  window.addEventListener('resize', onWindowResize.bind(null, {camera, cssRenderer, glRenderer}), false);

  animate({cssScene, glScene, cssRenderer, glRenderer, camera});
});


function createScenes(){
  return {
    cssScene: new THREE.Scene(),
    glScene: new THREE.Scene()
  };
}

function createCamera(){
  let camera = new THREE.PerspectiveCamera( 85, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 500;
  return camera;
}

function createRenderers(){
  let cssRenderer = new THREE.CSS3DRenderer();
  cssRenderer.setSize( window.innerWidth, window.innerHeight );
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = 0;
  document.body.appendChild( cssRenderer.domElement );

  let glRenderer = new THREE.WebGLRenderer({alpha: true});
  glRenderer.setSize( window.innerWidth, window.innerHeight );
  glRenderer.setClearColor( 0x000000, 0 );
  glRenderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( glRenderer.domElement );

  return {
    cssRenderer,
    glRenderer
  };
}

function onWindowResize({camera, cssRenderer, glRenderer}) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  glRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate({
  cssScene, glScene,cssRenderer, glRenderer, camera
}){
  requestAnimationFrame(animate.bind(null, {
    cssScene, glScene, cssRenderer, glRenderer, camera
  }));
  controls.update();
  cssRenderer.render(cssScene, camera);
  glRenderer.render(glScene, camera);
}
