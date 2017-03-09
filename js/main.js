function intro() {
    var width = window.innerWidth,
        height = window.innerHeight,
        count = Math.max(window.innerWidth, window.innerHeight) / 10;
    svg = createSVG();
    //$(document).on("click touchstart",':not("#controls *")', explode);
    $('#controls input').on("input", updateSpirograph);
    lessPoly(svg, count, width / 2, height / 2);
    //createFloor(setup.vertices);
    updateValues();
    updateSpirograph();
    //createSpirograph('vis', 60,59,58, 500, "rgba(255,255,255,1)", 0.5, "none");
    //createSpirograph('vis', 60,5,2, 10, "rgba(255,0,255,1)", 0.3, "rgba(25,255,255,.8)");
    //createSpirograph('vis', 60,25,12, 40, "rgba(255,255,255,1)", 1, "rgba(25,25,255,.4)");

}
window.onload = intro;

function updateSpirograph() {
    var r = +$('#innerR').val();
    var R = +$('#outerR').val();
    var p = +$('#locus').val();
    var red = +$('#red').val();
    var green = +$('#green').val();
    var blue = +$('#blue').val();
    var alpha = +$('#alpha').val();
    var count = +$('#count').val();
    updateValues();
    createSpirograph('vis', r, R, p, count, "rgba(" + [red, green, blue, alpha].join(',') + ")", 1, "none");
}

function animateSpirograph() {}

function updateValues() {
    $('#innerRVal').text($('#innerR').val());
    $('#outerRVal').text($('#outerR').val());
    $('#locusVal').text($('#locus').val());
    $('#countVal').text($('#count').val());
    $('#redVal').text($('#red').val());
    $('#greenVal').text($('#green').val());
    $('#blueVal').text($('#blue').val());
    $('#alphaVal').text($('#alpha').val());
}


var setup = {};

function lessPoly(svg, count, width, height) {
    var vertices = getRandomVertices(count, width, height);

    var triangles = getTrianglesFromVertices(vertices);

    var polygons = getPolygonsFromVertices(vertices, [
        [0, 0],
        [width, height]
    ]);



    console.log(triangles);
    var delauney = svg.append('g').selectAll("polygon")
        .data(triangles)
        .enter().append("polygon")
        .attr("class", "delauney")
        .attr("points", function(d) {
            return d.map(function(d) {
                return [d[0] + width / 2, d[1] + height / 2].join(",");
            }).join(" ");
        })
        .attr("stroke", "#222222")
        .attr("fill", function() {
            return getRandomColor()
        })
        .attr("stroke-width", 0.1);

    var voronoi = svg.append('g').selectAll("polygon")
        .data(polygons)
        .enter().append("polygon")
        .attr("points", function(d) {
            return d.map(function(d) {
                return [d[0] + width / 2, d[1] + height / 2].join(",");
            }).join(" ");
        })
        .attr("stroke", "white")
        .attr("class", "voronoi")
        .attr("fill", "transparent")
        .attr("stroke-width", 0.5);

    var dots = svg.selectAll('circle')
        .data(vertices.map(function(d) {
            return [d[0] + width / 2, d[1] + height / 2];
        }))
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return d[0];
        })
        .attr("cy", function(d) {
            return d[1];
        })
        .attr("r", function(d) {
            return 5;
        })
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("fill", "transparent");
}

function getRandomColor() {
    var palette = ['#c59fc9', '#cfbae1', '#c1e0f7', '#a4def9', '#97f9f9'];
    return palette[Math.floor(Math.random() * palette.length)];
}

function createSVG() {
    var svg = d3.select("svg")
        .attr("width", '100%')
        .attr("height", '100%');
    return svg;
}

function getRandomVertices(count, width, height) {
    return d3.range(count)
        .map(function(d) {
            return [Math.random() * (width), Math.random() * (height)];
        });
}

function getTrianglesFromVertices(vertices) {
    var voronoi = d3.voronoi();
    return voronoi(vertices).triangles();
}

function getPolygonsFromVertices(vertices, extent) {
    var voronoi = d3.voronoi();
    voronoi.extent(extent);
    return voronoi(vertices).polygons();
}

function rndPosNeg() {
    return (Math.random() * 2) - 1;
}

function explode() {
    var tl = new TimelineMax({ repeat: 1, yoyo: true });

    $("polygon, circle").each(function(index, el) {
        tl.to(el, 5, {
            x: (rndPosNeg() * (index * 0.5)),
            y: (rndPosNeg() * (index * 0.5)),
            rotation: (rndPosNeg() * 720),
            scale: (rndPosNeg() * 2),
            ease: SlowMo.ease.config(1, 1, false),
            opacity: 0.3,
            transformOrigin: "center center"
        }, .5);
    });
}

function createSpirograph(id, R, r, p, reps, stroke, strokeWidth, fill) {
    $('#' + id).remove();
    var s = document.createElementNS(d3.namespaces.svg, 'svg');
    s.id = id;
    $('.content').append(s);
    s = d3.select('#' + id)
        .attr('width', '100%')
        .attr('height', '100%');

    var t = 0; // increment
    var w = $('#' + id).width();
    var h = $('#' + id).height();
    var increment = -1;
    var v;

    var lineFunction = d3.line()
        .x(function(d) {
            return x(d) + w / 2
        })
        .y(function(d) {
            return y(d) + h / 2
        })
        .curve(d3.curveCatmullRom.alpha(.5));;

    s.append("path")
        .attr("d", lineFunction(d3.range(0, reps, .1)))
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("fill", fill)
        .each(pulse);

    /*s.select('path')
        .transition()
          .duration(20000)
          .delay(1500)
          .ease(d3.easeLinear)
          .attr("d", function(){
            count= 800;
            if(r + increment > 1000) increment = -1;
            if(r + increment < 0) increment = 1;
            r = r + increment;
            return lineFunction(d3.range(0, reps, .1));
          });*/

    function pulse() {
        var pa = s.select("path");
        (function repeat() {
            pa = pa
                .transition()
                .duration(20000)
                .delay(1000)
                .attr("d", function() {
                    count = 1000;
                    v = r;
                    if (v + increment > 1000) increment = -0.5;
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
        return ((R + r) * Math.cos(t)) + (p * Math.cos((R + r) * (t / r)))
    }

    //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
    function y(t) {
        return ((R + r) * Math.sin(t)) + (p * Math.sin((R + r) * (t / r)))
    }

    function xAstroid(t) {
        return R * Math.pow(Math.cos(t), 3);
    }

    //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
    function yAstroid(t) {
        return R * Math.pow(Math.sin(t), 3);
    }
}