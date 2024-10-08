let points = [];
let delaunay, voronoi;
let cellStates = []; // 0 for dead, 1 for alive
let initialized = false;
let overpopulationLimit, underpopulationLimit, revivalCondition;
let pointCountInput, hideModeCheckbox;
let hideMode = false;

function setup() {
  let canvas = createCanvas(1000, 1000);
  canvas.position(0, 0);
  frameRate(10); // Lower the frame rate to 10 frames per second

  // Create input elements for rules
  let controls = createDiv();
  controls.position(1020, 10);

  createElement('p', 'Number of points:').parent(controls);
  pointCountInput = createInput('1000').parent(controls);

  createElement('p', 'Overpopulation limit (cells die if neighbors > limit):').parent(controls);
  overpopulationLimit = createInput('3').parent(controls);

  createElement('p', 'Underpopulation limit (cells die if neighbors < limit):').parent(controls);
  underpopulationLimit = createInput('2').parent(controls);

  createElement('p', 'Revival condition (cells become alive if neighbors == condition):').parent(controls);
  revivalCondition = createInput('3').parent(controls);

  hideModeCheckbox = createCheckbox('Hide Mode (no point removal)', false);
  hideModeCheckbox.parent(controls);
  hideModeCheckbox.changed(() => {
    hideMode = hideModeCheckbox.checked();
  });

  let randomFillButton = createButton('Randomly Fill Points');
  randomFillButton.parent(controls);
  randomFillButton.mousePressed(() => {
    let pointCount = int(pointCountInput.value());
    points = [];
    cellStates = [];
    for (let i = 0; i < pointCount; i++) {
      let x = random(width);
      let y = random(height);
      points.push(createVector(x, y));
      cellStates.push(random() > 0.5 ? 1 : 0); // Randomly set initial state
    }
    delaunay = calculateDelaunay(points);
    voronoi = delaunay.voronoi([0, 0, width, height]);
  });

  let startButton = createButton('Start Simulation');
  startButton.parent(controls);
  startButton.mousePressed(() => {
    initialized = true; // Start the simulation when 'Start Simulation' is clicked
  });

  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function draw() {
  background(255);

  // Draw Voronoi cells
  let polygons = voronoi.cellPolygons();
  let cells = Array.from(polygons);

  for (let poly of cells) {
    stroke(0);
    strokeWeight(1);
    fill(cellStates[poly.index] ? 'black' : 'white'); // Fill based on cell state
    beginShape();
    for (let i = 0; i < poly.length; i++) {
      vertex(poly[i][0], poly[i][1]);
    }
    endShape(CLOSE);
  }

  if (!initialized) {
    return; // Only draw the initial state until the user finalizes initialization
  }

  // Read user-specified rules
  let overpopLimit = int(overpopulationLimit.value());
  let underpopLimit = int(underpopulationLimit.value());
  let revivalCond = int(revivalCondition.value());

  // Update cell states based on user-specified Game of Life rules
  let newStates = new Array(cellStates.length).fill(0);
  for (let i = 0; i < cells.length; i++) {
    let poly = cells[i];
    let neighbors = voronoi.neighbors(i);
    let liveNeighbors = 0;
    for (let neighbor of neighbors) {
      if (neighbor !== -1 && cellStates[neighbor]) {
        liveNeighbors++;
      }
    }

    // Apply modified Game of Life rules based on user input
    if (cellStates[i] && (liveNeighbors > underpopLimit && liveNeighbors <= overpopLimit)) {
      newStates[i] = 1; // Cell survives
    } else if (!cellStates[i] && liveNeighbors === revivalCond) {
      newStates[i] = 1; // Cell becomes alive
    } else {
      newStates[i] = 0; // Cell dies or hides
    }
  }

  // Update points and states based on the new states
  let newPoints = [];
  let newCellStates = [];
  for (let i = 0; i < cellStates.length; i++) {
    if (cellStates[i] !== newStates[i]) {
      if (newStates[i] === 1) {
        // Cell becomes alive, restore the point
        newPoints.push(points[i]);
        newCellStates.push(1);
      } else {
        // Cell dies or hides
        if (hideMode) {
          newPoints.push(points[i]);
          newCellStates.push(0);
        }
      }
    } else {
      newPoints.push(points[i]);
      newCellStates.push(cellStates[i]);
    }
  }

  points = newPoints;
  cellStates = newCellStates;

  // Recalculate Voronoi diagram
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);

  // Apply Lloyd's relaxation
  let centroids = [];
  for (let poly of voronoi.cellPolygons()) {
    let area = 0;
    let centroid = createVector(0, 0);
    for (let i = 0; i < poly.length; i++) {
      let v0 = poly[i];
      let v1 = poly[(i + 1) % poly.length];
      let crossValue = v0[0] * v1[1] - v1[0] * v0[1];
      area += crossValue;
      centroid.x += (v0[0] + v1[0]) * crossValue;
      centroid.y += (v0[1] + v1[1]) * crossValue;
    }
    area /= 2;
    centroid.div(6 * area);
    centroids.push(centroid);
  }

  for (let i = 0; i < points.length; i++) {
    points[i].lerp(centroids[i], 0.2); // Move points to centroid with relaxation factor 0.2
  }

  // Recalculate Voronoi diagram after relaxation
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function mousePressed() {
  if (!initialized) {
    let closestIndex = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < points.length; i++) {
      let d = dist(mouseX, mouseY, points[i].x, points[i].y);
      if (d < closestDistance) {
        closestDistance = d;
        closestIndex = i;
      }
    }

    if (closestIndex !== -1) {
      cellStates[closestIndex] = 1 - cellStates[closestIndex]; // Toggle the state
    }
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    initialized = true; // Start the simulation when 'S' is pressed
  }
}

function calculateDelaunay(points) {
  let pointsArray = [];
  for (let v of points) {
    pointsArray.push(v.x, v.y);
  }
  return new d3.Delaunay(pointsArray);
}
