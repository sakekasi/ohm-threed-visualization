'use strict';

var toExport = {
  registerLayersAction
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}

function registerLayersAction(semantics){
  semantics.addOperation("layers(ohmToDom, layers, depth)", {
    _nonterminal(children){
      let layers = this.args.layers || [];
      let depth = this.args.depth || 0;

      if(layers[depth] === undefined){
        let layerNode = document.createElement('pre');
        layers[depth] = layerNode;
      }

      let domNode = this.args.ohmToDom.get(this._node),
          layerNode = domNode.cloneNode(true);
      let boundingRect = domNode.getBoundingClientRect(),
          parentBoundingRect = domNode.closest("program").getBoundingClientRect();

      layers[depth].appendChild(layerNode);
      layerNode.style.position = "absolute";
      layerNode.style.top =  boundingRect.top - parentBoundingRect.top;
      layerNode.style.left = boundingRect.left - parentBoundingRect.left;
      layerNode.style.textIndent = domNode.offsetLeft - boundingRect.left;

      children.forEach((child)=>{
        child.layers(
          this.args.ohmToDom,
          layers,
          depth + 1
        )
      });

      return layers;
    },
    _terminal(){
      let layers = this.args.layers || [];
      let depth = this.args.depth || 0;

      if(layers[depth] === undefined){
        layers[depth] = document.createElement('pre');
      }

      let domNode = this.args.ohmToDom.get(this._node),
          layerNode = domNode.cloneNode(true);
          let boundingRect = domNode.getBoundingClientRect(),
              parentBoundingRect = domNode.closest("program").getBoundingClientRect();

      layers[depth].appendChild(layerNode);
      layerNode.style.position = "absolute";
      layerNode.style.top =  boundingRect.top - parentBoundingRect.top;
      layerNode.style.left = boundingRect.left - parentBoundingRect.left;

      return layers;
    }
  });
}
