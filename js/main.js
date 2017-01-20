function intro() {
    var width = window.innerWidth,
        height = window.innerHeight - 200;
    svg = createSVG('lessPoly', width, height);
    palette = ['#c59fc9', '#cfbae1', '#c1e0f7', '#a4def9', '#97f9f9'];
    document.body.appendChild(svg);
    lessPoly(svg, 500, palette, width, height);
}
window.onload = intro;
var svg, palette;
function lessPoly(svg, count, palette, width, height) {
    triangleNodesAsPoints(count, width, height).forEach(function(points, index) {
    	setTimeout(function(){
    		svg.appendChild(drawPoly(points, getRandomColor(palette), 'white'));
    	}, (count * 20) - index * 10);
    });
}

function getRandomColor(palette) {
    return palette[Math.floor(Math.random() * palette.length)];
}

function animateHeadings() {
    TweenLite.fromTo($('h1'), 2, { scale: 0, opacity: 0 }, { scale: 1.5, opacity: 1, ease: Circ.easeIn });
    TweenLite.fromTo($('.content > h5'), 1, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: Circ.easeIn, delay: 1 });
}


function createSVG(id, width, height) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('version', '1.1');
    svg.setAttribute('id', id);
    svg.setAttribute('viewBox', '0 0 ' + width + " " + height);
    svg.setAttribute('preserveAspectRatio', 'none');
    return svg;
}


function drawPoly(points, fill, stroke) {
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", points);
    poly.setAttribute("stroke", stroke);
    poly.setAttribute('fill', fill);
    return poly;
}

function getRandomVertices(count, width, height) {
    var vertices = new Array(count);
    for (i = vertices.length; i--;) {
        do {
            x = Math.random() - 0.5;
            y = Math.random() - 0.5;
        } while (x * x + y * y > 0.25);

        x = (x * 0.96875 + 0.5) * width;
        y = (y * 0.96875 + 0.5) * height;

        vertices[i] = [x, y];
    }
    return vertices;
}

function getTrianglesFromVertices(vertices) {
    return Delaunay.triangulate(vertices);
}

function triangleNodesToPoints(triangleNodes, vertices) {
    return triangleNodes.map(function(triplet) {
        return triplet.map(function(nodeIndex) {
            return vertices[nodeIndex];
        });
    }).map(function(triplet) {
        return triplet.reduce(function(acc, point) {
            return acc + " " + point.join(',');
        }, '');
    });
}

function triangleNodesAsPoints(count, width, height) {
    var vertices = getRandomVertices(count, width, height);
    return triangleNodesToPoints(getTrianglesFromVertices(vertices), vertices);
}