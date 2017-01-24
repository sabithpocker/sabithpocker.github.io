function intro() {
    var width = window.innerWidth,
        height = window.innerHeight,
        count = Math.max(window.innerWidth, window.innerHeight) / 10;
    svg = createSVG();
    $(document).on("click touchstart", explode);
    lessPoly(svg, count, width / 2, height / 2);
    //createFloor(setup.vertices);
}
window.onload = intro;

var setup = {};

function lessPoly(svg, count, width, height) {
    var vertices = getRandomVertices(count, width, height);

    var triangles = getTrianglesFromVertices(vertices);

    var polygons = getPolygonsFromVertices(vertices, [[0,0],[width, height]]);



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
            return d[0]; })
        .attr("cy", function(d) {
            return d[1]; })
        .attr("r", function(d) {
            return 5; })
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