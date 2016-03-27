'use strict';

var Block3D = require("./block3d.js").Block3D;

var toExport = {
  registerLayersAction
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}

function registerLayersAction(semantics){
  semantics.addOperation("layers(ohmToDom, layers, scene, depth, width, height)", {
    _nonterminal(children){
      let layers = this.args.layers || [];
      let depth = this.args.depth || 0;

      let width  = this.args.width,
          height = this.args.height;

      if(layers[depth] === undefined){
        let layerNode = document.createElement('pre');
        layers[depth] = layerNode;
      }

      let domNode = this.args.ohmToDom.get(this._node),
          layerNode = domNode.cloneNode(true),
          container = document.createElement('span');

      let boundingRect = domNode.getBoundingClientRect(),
          parentBoundingRect = domNode.closest("program").getBoundingClientRect();

      let top = boundingRect.top - parentBoundingRect.top,
          left = boundingRect.left - parentBoundingRect.left,
          nw = boundingRect.width,
          nh = boundingRect.height;

      container.appendChild(layerNode);
      layers[depth].appendChild(container);
      container.style.position = 'absolute';
      container.style.top =  top;
      container.style.left = left;
      container.style.textIndent = domNode.offsetLeft - boundingRect.left;

      console.log(this.ctorName, top, left);
      new Block3D(this.args.scene,
        0 + nw/2  - width/2 + left , 15 - nh/2 + height/2 - top, depth*2,
        nw, nh, 2
      );

      children.forEach((child)=>{
        child.layers(
          this.args.ohmToDom,
          layers, this.args.scene,
          depth + 1, width, height
        )
      });

      return layers;
    },
    _terminal(){
      let layers = this.args.layers || [];
      let depth = this.args.depth || 0;

      let width  = this.args.width,
          height = this.args.height;

      if(layers[depth] === undefined){
        let layerNode = document.createElement('pre');
        layers[depth] = layerNode;
      }

      let domNode = this.args.ohmToDom.get(this._node),
          layerNode = domNode.cloneNode(true),
          container = document.createElement('span');

      let boundingRect = domNode.getBoundingClientRect(),
          parentBoundingRect = domNode.closest("program").getBoundingClientRect();

      let top = boundingRect.top - parentBoundingRect.top,
          left = boundingRect.left - parentBoundingRect.left,
          nw = boundingRect.width,
          nh = boundingRect.height;

      container.appendChild(layerNode);
      layers[depth].appendChild(container);
      container.style.position = 'absolute';
      container.style.top =  top;
      container.style.left = left;
      container.style.textIndent = domNode.offsetLeft - boundingRect.left;

      console.log(this.ctorName, top, left);
      new Block3D(this.args.scene,
        0 + nw/2  - width/2 + left , 15 - nh/2 + height/2 - top, depth*2,
        nw, nh, 2
      );

      return layers;
    }
  });
}
