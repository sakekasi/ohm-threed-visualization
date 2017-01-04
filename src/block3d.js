let topMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5, side: THREE.DoubleSide, opacity: 0.1 } ),
sideMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5, side: THREE.DoubleSide, opacity: 0.8 } );
let material = new THREE.MeshFaceMaterial([
  sideMaterial, //right
  sideMaterial, //left
  sideMaterial, //north
  sideMaterial, //south
  topMaterial, //top
  topMaterial //bottom
]);

let colorHex = 0x000000; //black //TODO: use chroma js here

class Block3D {
  constructor(scene, x, y, z, width, height, depth){
    console.log(x, y, z, width, height, depth);

    this.x = x;
    this.y = y;
    this.z = z;

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.geometry = new THREE.BoxGeometry( width, height, depth);

    for ( var i = 0; i < this.geometry.faces.length; i += 2 ) {
      this.geometry.faces[ i ].color.setHex( colorHex );
      this.geometry.faces[ i + 1 ].color.setHex( colorHex );
    }

    this.cube = new THREE.Mesh( this.geometry, material );

    this.cube.position.set(x, y, z);

    scene.add(this.cube);
  }
}

var toExport = {
  Block3D
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}
