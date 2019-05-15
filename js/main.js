"use strict";

function intro() {
  createSpirograph("vis", 60, 5, 12, 40, "rgba(255,255,255,1)", 1, "none");
}

window.onload = intro;

function createSpirograph(id, R, r, p, reps, stroke, strokeWidth, fill) {
  var s = document.createElementNS(d3.namespaces.svg, "svg");
  s.id = id;
  document.querySelector("[data-content]").appendChild(s);
  s = d3
    .select("#" + id)
    .attr("width", "100%")
    .attr("height", "100%");

  var t = 0; // increment
  var w = document.getElementById(id).clientWidth;
  var h = document.getElementById(id).clientHeight;
  console.log(w, h);
  var increment = -1;
  var v;

  var lineFunction = d3
    .line()
    .x(function(d) {
      return x(d) + w / 2;
    })
    .y(function(d) {
      return y(d) + h / 2;
    })
    .curve(d3.curveCatmullRom.alpha(0.5));

  s.append("path")
    .attr("d", lineFunction(d3.range(0, reps, 0.1)))
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .attr("fill", fill)
    .each(pulse);

  function pulse() {
    var pa = s.select("path");
    (function repeat() {
      pa = pa
        .transition()
        .duration(20000)
        .delay(1000)
        .attr("d", function() {
          var count = 1000;
          v = r;
          if (v + increment > count) increment = -0.5;
          if (v + increment < 0) increment = 0.5;
          v = v + increment;
          r = v;
          return lineFunction(d3.range(0, reps, 0.1));
        })
        .ease(d3.easeLinear)
        .on("end", repeat);
    })();
  }

  // parametric equations
  //x(t)=(R+r)cos(t) + p*cos((R+r)t/r)
  function x(t) {
    return (R + r) * Math.cos(t) + p * Math.cos((R + r) * (t / r));
  }

  //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
  function y(t) {
    return (R + r) * Math.sin(t) + p * Math.sin((R + r) * (t / r));
  }

  function xAstroid(t) {
    return R * Math.pow(Math.cos(t), 3);
  }

  //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
  function yAstroid(t) {
    return R * Math.pow(Math.sin(t), 3);
  }
}
