'use strict';

var util = require("./util.js");

var getWithInit = util.getWithInit,
    mapObject = util.mapObject,
    mergeObjects = util.mergeObjects;

var toExport = {
  registerReifyActions,
  reify
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}

function closeTag(tagName){
  return `</${tagName}>`;
}

function openTag(tagName){
  return `<${tagName}>`;
}

function registerReifyActions(semantics){
  semantics.addOperation("reifyAST(tagPositions)", {
    _nonterminal(children){
      let start = this.interval.startIdx,
          end = this.interval.endIdx;
      let tagName = this._node.ctorName;

      getWithInit(this.args.tagPositions, start, []).push(openTag(tagName));

      for(let i=0; i < children.length; i++){
        let child = children[i];
        if(child._node.ctorName === "_iter"){
          let iters = [child];
          while(children[i+1] && children[i+1]._node.ctorName === "_iter"){
            if(children[i+1].interval.contents === iters[0].interval.contents){
              iters.push(children[++i]);
            } else {
              break;
            }
          }

          let iterChildren = iters.map((iter)=>Array.prototype.slice.call(iter.children));
          let interleavedChildren = [];
          while(iterChildren[0].length > 0){
            iterChildren.forEach((iterC)=>{
              interleavedChildren.push(iterC.shift());
            });
          }

          interleavedChildren.forEach(child=> child.reifyAST(this.args.tagPositions));
        } else {
          child.reifyAST(this.args.tagPositions);
        }
      }

      // children.forEach(child=> child.reifyAST(this.args.tagPositions));
      getWithInit(this.args.tagPositions, end, []).push(closeTag(tagName));
    },
    _terminal(){
      let start = this.interval.startIdx,
          end = this.interval.endIdx;
      let tagName = "terminal";

      getWithInit(this.args.tagPositions, start, []).push(openTag(tagName));
      getWithInit(this.args.tagPositions, end, []).push(closeTag(tagName));
    }
  });

  semantics.addOperation("mapDOM(DOMNode, domToOhm, ohmToDom)", {
    _nonterminal(children){
      this.args.domToOhm.set(this.args.DOMNode, this._node);
      this.args.ohmToDom.set(this._node, this.args.DOMNode);

      let DOMChildren = Array.prototype.slice.apply(this.args.DOMNode.children);
      for(let i=0; i < children.length; i++){
        let child = children[i];
        if(child._node.ctorName === "_iter"){
          let iters = [child];
          while(children[i+1] && children[i+1]._node.ctorName === "_iter"){
            if(children[i+1].interval.contents === iters[0].interval.contents){
              iters.push(children[++i]);
            } else {
              break;
            }
          }

          let numDOMChildrenCovered = iters.reduce((agg, b)=>agg + b.children.length, 0);
          let DOMChildrenCovered = DOMChildren.slice(0, numDOMChildrenCovered);
          DOMChildren = DOMChildren.slice(numDOMChildrenCovered);

          let iterDOMChildren = iters.map(()=>[]);
          DOMChildrenCovered.forEach((domChild, i)=>{
            iterDOMChildren[i % iterDOMChildren.length].push(domChild);
          });

          iterDOMChildren.forEach((domChildren, i)=>{
            iters[i].mapDOM(domChildren, this.args.domToOhm, this.args.ohmToDom);
          });
        } else {
          child.mapDOM(DOMChildren.shift(), this.args.domToOhm, this.args.ohmToDom);
        }
      }
    },
    _iter(children){
      let DOMNodes = this.args.DOMNode;
      if(children.length !== DOMNodes.length){
        throw new Error(`ERROR: iterator node got a different number of dom nodes(${DOMNodes.length}) than children(${children.length})`);
        return;
      }

      children.forEach((child, i)=> child.mapDOM(DOMNodes[i], this.args.domToOhm, this.args.ohmToDom));
    },
    _terminal(){
      this.args.domToOhm.set(this.args.DOMNode, this._node);
      this.args.ohmToDom.set(this._node, this.args.DOMNode);
    }
  });
}

function reify(semantics, match){
  let tagPositions = {};
  let domToOhm = new Map(),
      ohmToDom = new Map();
  let example = match._cst.interval.contents;

  let semmatch = semantics(match);

  semmatch.reifyAST(tagPositions);

  tagPositions = mapObject(tagPositions, function(tags){
    return tags.join("");
  });

  var positionsToInsert = Object.keys(tagPositions);
  var stringsToInsert = Object.keys(tagPositions).map((key)=>tagPositions[key]);

  var start = 0,
      end;
  var splitExampleString = [];
  while(positionsToInsert.length > 0){
    end = positionsToInsert.shift();
    splitExampleString.push(
      example.substring(start, end)
    );

    start = end;
  }
  splitExampleString.push(
    example.substring(start)
  );

  var annotatedExamplePieces = [];
  annotatedExamplePieces.push(splitExampleString.shift());
  while(stringsToInsert.length > 0){
    annotatedExamplePieces.push(stringsToInsert.shift());
    annotatedExamplePieces.push(splitExampleString.shift());
  }
  annotatedExamplePieces.push(splitExampleString.shift());

  let annotatedExample = annotatedExamplePieces.join("");
  let parser = new DOMParser();
  let DOM = parser.parseFromString(annotatedExample, "text/html");
  DOM = DOM.querySelector('body').children[0];

  semmatch.mapDOM(DOM, domToOhm, ohmToDom);

  return [DOM, domToOhm, ohmToDom];
}
