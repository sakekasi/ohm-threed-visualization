'use strict';

var textures = require("textures"),
     chroma = require("chroma-js");

var treeUtils = require("./treeUtils.js"),
    utils = require("../util.js");

var duration = 100;
var curId = 0;

var gray = chroma.hsl(0, 0, 0.55).darken(0.5),
    red = chroma.hsl(6, 0.98, 0.69).brighten(0.5),
    green = chroma.hsl(156, 0.88, 0.37).brighten(0.5);

var inactiveRed = chroma(red).darken(1),//.desaturate(),
    inactiveGreen = chroma(green).darken(1)//.desaturate();


function fillColor(n){
  if( n.landmark ){
    return gray;
  } else if( n.cstNodes[0].result instanceof Error ){
    return n.leaf? inactiveRed.css(): red.css();
  } else {
    return n.leaf? inactiveGreen.css(): green.css();
  }
}

function radius(n){
  if(n.landmark || n.keyword){
    return 5;
  } else {
    return 4;
  }
}

class TreeViz {
  constructor(svg, root, ohmToDom, actions){
    this.ohmToDom = ohmToDom;
    this.actions = actions;

    this.svg = d3.select(svg);

    // this.svg.call(redTexture);
    // this.svg.call(greenTexture);

    this.svg = this.svg.append("g")
       .attr("transform", "translate(10, 10)");


    let boundingRect = svg.getBoundingClientRect();
    this.width = boundingRect.width - 50;
    this.height = boundingRect.height - 10;

    this.tree = d3.layout.tree()
      .children(function(n){
        if(n.children && !n.hasOwnProperty('_children') ){
          n._children = n.children;
        }

        if(n._children
           && n._children.length > 0){
          let descendants = treeUtils.descendants(n, function(child){
            if(child.children && !child._children){
              child._children = child.children;
            }

            return child._children;
          });

          let condition = (n) =>{
            return n.current;
          }

          if(descendants.reduce((a,b)=> condition(b) || a, false)){
            return n._children;
          }
        }

        return null;
      })
      .size([this.height, this.width]);

    this.diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

    this.voronoi = d3.geom.voronoi()
    	.x(function(d) { return d.y; })
    	.y(function(d) { return d.x; })
    	.clipExtent([[-10, -10], [this.width, this.height]]);

    this.root = root;
    this.root.x0 = this.height/2;
    this.root.y0 = 0;

    this.update(root);
  }

  update(parent){
    let nodes = this.tree.nodes(this.root),//.reverse(),
        links = this.tree.links(nodes);
    let treeviz = this;

    //simple manipulations of position to produce outward expansion behaviour
    let maxDepth = nodes.reduce((md, n)=> n.depth > md? n.depth: md, -1);
    if(20*maxDepth < this.width){
      nodes.forEach(function(d) { d.y = d.depth * 20; });
    }
    //left to right behaviour
    nodes.forEach((n)=>{ n.y =  Math.min(this.width, 20*maxDepth) - n.y});

    //process nodes
    let svgNode = this.svg.selectAll("g.node")
      .data(nodes, function(d){ //assign each object an id since d3 can't do object equality apparently :/
        if(d.id){
          return d.id;
        } else {
          d.id = curId++;
          return d.id;
        }
      });

      //TODO: this section makes no sense. rework
    let svgNodeEnter = svgNode.enter().append("g")
      .attr("class", "node")
      .attr("transform", `translate(${parent.y0}, ${parent.x0})`)
      .attr("id", (d)=>d.id)
      .each(function(d){
        var group = d3.select(this);

        group.append("svg:title")
          .text(function(d) { return d.ctorName; });

        let highlight = group.append("circle")
          .attr("class", "highlight")
          .style("stroke", fillColor(d))
          .style("stroke-width", 1)
          .style("fill", "none")
          .style("opacity", 0)
          .attr("r", radius(d) + 2);

        let main = group.append("circle")
          .attr("class", "mainCircle")
          .attr("r", radius);
      });

    let svgNodeUpdate = svgNode
      .on("mouseover", function(datum){
        treeviz.actions.highlightNode(datum);
      }, false)
      .on("mouseout",  function(datum){
        treeviz.actions.unHighlightNode(datum);
      }, false)
      .on("click", function(datum){
        if(d3.event.altKey || d3.event.ctrlKey){
          treeviz.actions.joinNode(datum);
        } else if(datum.current){
          treeviz.actions.splitNode(datum);
        }
      }, true)
    .transition().duration(duration)
      .attr("transform", (n)=> `translate(${n.y}, ${n.x})`)
      .style("fill", fillColor);
      // .style("fill", "none");

    svgNode.select("title")
      .text(function(d) { return d.ctorName; });
    svgNode.select("circle.mainCircle")
      .attr("fill", fillColor);
      // .each(function(n){
      //   if(n.landmark || n.keyword){
      //     d3.select(this)
      //       .style("stroke", fillColor)
      //       .style("stroke-width", 2);
      //   } else {
      //     d3.select(this)
      //   }
      // });


    let svgNodeExit = svgNode.exit().transition()
      .duration(duration)
      .attr("transform", (n)=> `translate(${parent.y0}, ${parent.x0})`)
      .remove();


    //handle the links
    var link = this.svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    let polygon = function(d) {
      return "M" + d.join("L") + "Z";
    };

    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", (d)=>{
          var o = {x: parent.x0, y: parent.y0};
          return this.diagonal({source: o, target: o});
        })
        .style("stroke", "hsla(0, 0%, 0%, 0.07)")
        .style("fill", "none");

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", this.diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", (d)=>{
          var o = {x: parent.x, y: parent.y};
          return this.diagonal({source: o, target: o});
        })
        .remove();

    //handle the Voronoi overlay
    let paths = this.svg.selectAll("path.voronoi")
      .data(this.voronoi(nodes));

    paths.enter()
      .append("path")
        .attr("class", "voronoi")
      .append("svg:title")
        .text(function(d) { return d.ctorName; });
    paths.exit().remove();

    paths.attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
      .datum(function(d, i) { return d.point; })
      // .style("stroke", "#2074A0") //If you want to look at the cells
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function(datum){
        treeviz.actions.highlightNode(datum);
      }, false)
      .on("mouseout",  function(datum){
        treeviz.actions.unHighlightNode(datum);
      }, false)
      .on("click", function(datum){
        if(d3.event.altKey || d3.event.ctrlKey){
          treeviz.actions.joinNode(datum);
        } else if(datum.current){
          treeviz.actions.splitNode(datum);
        }
      }, true)
      .select("title")
        .text(function(d) { return d.ctorName; });

    nodes.forEach((n)=>{
      n.x0 = n.x;
      n.y0 = n.y;
    });
  }

  refresh(){
    this.update(this.root);
  }

  split(node){
    //TODO: simulate mouseout behaviour
    this.update(node);
  }

  join(node){
    this.update(node);
  }

  highlight(node){
    d3.select(`g.node[id="${node.id}"]`).selectAll("circle.highlight").transition().duration(duration)
      .style("opacity", 1);
  }

  unHighlight(node){
    d3.select(`g.node[id="${node.id}"]`).selectAll("circle.highlight").transition().duration(duration)
      .style("opacity", 0);
  }
}

var toExport = {
  TreeViz
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}
