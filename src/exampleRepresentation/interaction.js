//maybe we want to do this using WebComponents
'use strict';

var $ = require("jquery");
var reify = require("./reify.js"),
    mapSemantics = require("./mapSemantics.js"),
    simplifyCST = require("./simplifyCST.js"),
    language = require ("../language.js"),
    TreeViz = require("./treeVisualization.js").TreeViz,
    treeUtils = require("./treeUtils.js"),
    utils = require("../util.js"),

    toAST = require("../oo/toAST.js"); //TODO: make this language agnostic

var _ = function(x){ return Array.prototype.slice.call(x)};

var domToOhm, ohmToDom, nodeToSimplified, nodeToResults, treeVisualization;

var keywordTags = [
  "keyword",
  "class",
  "def",
  "extends",
  "falseK",
  "new",
  "nullK",
  "return",
  "super",
  "this",
  "trueK",
  "var",
  "with",
];

document.addEventListener("DOMContentLoaded", function(event) {
  let grammar = language.grammar,
      semantics = language.semantics;

  //register semantic actions
  reify.registerReifyActions(semantics);
  mapSemantics.registerMapSemantics(grammar, semantics);
  simplifyCST.registerSimplifyAction(semantics);

  toAST.registerToAST(semantics);

  //generates a pass 3 parallel structures:
  //1. the CST
  let exampleNode = document.querySelector('pre#example');
  let example = exampleNode.textContent;
  let match;
  let semmatch;
  try {
    match = grammar.match(example);
    semmatch = semantics(match);
  } catch (e) {
    console.error(match.message);
  }

  //2. the reified form of the CST
  let reified = reify.reify(semantics, match);
  let DOM = reified[0];
  domToOhm = reified[1];
  ohmToDom = reified[2];

  exampleNode.textContent = "";
  exampleNode.appendChild(DOM);

  //3. the simplified cst
  nodeToSimplified = new Map();
  let simplifiedCST = semmatch.simplifyCST(null, nodeToSimplified);
  nodeToResults = mapSemantics.mapSemantics(semantics, "toAST", match);


  //sets relevant flags/adds relevant attributes to the right structure(s)
  for(let key of ohmToDom.keys()){
    let domNode = ohmToDom.get(key);
    let simplifiedNode = nodeToSimplified.get(key);
    let parent = domNode.parentNode;

    ohmToDom.get(simplifiedNode.cstNodes[0]).setAttribute("possibleCurrent", "true");
    if(key.constructor.name === "TerminalNode"){
      if( Array.prototype.slice.call(parent.children).find(
            child=> child.tagName.toLowerCase() !== "terminal")){
        parallelToggle("landmark",
          domNode, simplifiedNode
        );
      }
    } else {
      if(nodeToResults.has(key)){
        let result = nodeToResults.get(key);
        key.result = result;
        domNode.setAttribute("result", result instanceof Error? "error": "success");
      }

      if (keywordTags.find(tag=> tag.toLowerCase() === domNode.tagName.toLowerCase())){
        parallelToggle("keyword",
          domNode, simplifiedNode
        );
      }

      if (key === simplifiedNode.cstNodes[0]
          && simplifiedNode.children.reduce((agg, b)=> agg && utils.isLexical(b.cstNodes[0].ctorName), true)){
        parallelToggle("leaf",
          domNode, simplifiedNode
        );
      }
    }
  }

  parallelToggle("current",
    DOM, nodeToSimplified.get(domToOhm.get(DOM))
  );


  treeVisualization = new TreeViz(
    document.querySelector("svg"),
    simplifiedCST,
    ohmToDom,
    {
      splitNode,
      joinNode,
      highlightNode,
      unHighlightNode
    }
  );

  DOM.addEventListener("click", memobind1(onClick, DOM));
  DOM.addEventListener("mouseover", memobind1(onMouseover, DOM));
  DOM.addEventListener("mouseout", memobind1(onMouseout, DOM));
});



//EVENT LISTENERS
function onClick(currentNode, event){
  let currentSimplified = nodeToSimplified.get(domToOhm.get(currentNode));
  if(event.altKey || event.ctrlKey){
    currentSimplified = currentSimplified.parent || currentSimplified;
    joinNode(currentSimplified);
  } else {
    splitNode(currentSimplified);
  }
  event.stopPropagation();
}

function onMouseover(currentNode, event){
  let currentSimplified = nodeToSimplified.get(domToOhm.get(currentNode));
  highlightNode(currentSimplified);
}

function onMouseout(currentNode, event){
  let currentSimplified = nodeToSimplified.get(domToOhm.get(currentNode));
  unHighlightNode(currentSimplified);
}

//VISUALIZATION OPERATIONS
function splitNode(simplifiedCSTNode){
  let children = simplifiedCSTNode._children? simplifiedCSTNode._children: simplifiedCSTNode.children;

  // console.log(children.reduce((agg, b)=> agg && utils.isLexical(b.ctorName), true));

  if(children && children.length > 0 && !children.reduce((agg, b)=> agg && utils.isLexical(b.ctorName), true)){
    //make cst node's children current
    simplifiedCSTNode.current = false;
    makeNonCurrent(simplifiedCSTNode);

    //make corresponding dom node's children current
    children.forEach(child=> child.current = true);
    children.forEach(makeCurrent);

    //split tree visualization
    treeVisualization.split(simplifiedCSTNode);
  } else {
    simplifiedCSTNode.leaf = true;
    treeVisualization.refresh();
  }
}

function joinNode(simplifiedCSTNode){
  let descendants = treeUtils.descendants(simplifiedCSTNode, (child)=>
    child._children? child._children: child.children);

  //remove cst node's children's noncurrent
  descendants.forEach(child=> child.current = false);
  descendants.forEach(makeNonCurrent);

  //make corresponding dom node current
  simplifiedCSTNode.current = true;
  makeCurrent(simplifiedCSTNode);

  //join tree visualization
  treeVisualization.join(simplifiedCSTNode);
}

function highlightNode(simplifiedCSTNode){
  //highlight corresponding dom node
  let domNode = ohmToDom.get(simplifiedCSTNode.cstNodes[0]);
  domNode.classList.add("active");

  //highlight tree visualization
  treeVisualization.highlight(simplifiedCSTNode);
}

function unHighlightNode(simplifiedCSTNode){
  //unhighlight corresponding dom node
  let domNode = ohmToDom.get(simplifiedCSTNode.cstNodes[0]);
  domNode.classList.remove("active");

  //unhighlight tree viz
  treeVisualization.unHighlight(simplifiedCSTNode);
}


//OPERATION HELPERS
function makeCurrent(simplifiedCSTNode){
  let domNode = ohmToDom.get(simplifiedCSTNode.cstNodes[0]);
  domNode.classList.add("current");

  domNode.addEventListener("click", memobind1(onClick, domNode));
  domNode.addEventListener("mouseover", memobind1(onMouseover, domNode));
  domNode.addEventListener("mouseout", memobind1(onMouseout, domNode));
}

function makeNonCurrent(simplifiedCSTNode){
  let domNode = ohmToDom.get(simplifiedCSTNode.cstNodes[0]);
  domNode.classList.remove("current");

  domNode.removeEventListener("click", memobind1(onClick, domNode));
  domNode.removeEventListener("mouseover", memobind1(onMouseover, domNode));
  domNode.removeEventListener("mouseout", memobind1(onMouseout, domNode));

  onMouseout(domNode);
}


//HELPER FUNCTIONS

//sets/removes a flag in several objects/DOM nodes
function parallelToggle(property, ...objects){
  objects.forEach((object)=>{
    if(object instanceof Node){
      if(object.classList.contains(property)){
        object.classList.remove(property);
      } else {
        object.classList.add(property);
      }
    } else {
      if(object[property]){
        object[property] = false;
      } else {
        object[property] = true;
      }
    }
  });
}

//returns a function bound to an arg, and remembers return values, so comparison
// using '===' works
let memo = new Map();
function memobind1(fn, arg){
  if(memo.has(fn) && memo.get(fn).has(arg)){
    return memo.get(fn).get(arg);
  } else {
    let bound = fn.bind(null, arg);
    if( !memo.has(fn) ){
      memo.set(fn, new Map());
    }

    memo.get(fn).set(arg, bound);
    return bound;
  }
}
