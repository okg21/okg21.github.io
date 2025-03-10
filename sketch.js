let points = [];
let delaunay, voronoi;
let cellStates = []; // 0 for dead, 1 for alive
let initialized = false;
let overpopulationLimit, underpopulationLimit, revivalCondition;
let pointCountInput, hideModeCheckbox;
let hideMode = false;
let relaxationFactorSlider; // Add relaxation factor slider
let startButton; // Make startButton a global variable
let relaxFactorValue; // To display slider value

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent(select('.canvas-container'));
  
  frameRate(10); // Lower the frame rate to 10 frames per second

  // Create controls panel
  let controls = createDiv();
  controls.addClass('controls-panel');
  controls.parent(select('main'));

  // Initialize section
  let initSection = createDiv();
  initSection.addClass('control-section');
  initSection.parent(controls);
  
  createElement('h3', 'Initialize').parent(initSection);
  
  createElement('p', 'Number of points:').parent(initSection);
  pointCountInput = createInput('500').parent(initSection);
  pointCountInput.attribute('type', 'number');
  pointCountInput.attribute('min', '100');
  pointCountInput.attribute('max', '2000');
  
  let randomFillButton = createButton('Randomly Fill Points');
  randomFillButton.parent(initSection);
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
    startButton.removeAttribute('disabled'); // Enable the start button when points exist
  });

  // Rules section
  let rulesSection = createDiv();
  rulesSection.addClass('control-section');
  rulesSection.parent(controls);
  
  createElement('h3', 'Game Rules').parent(rulesSection);
  
  createElement('p', 'Overpopulation limit:').parent(rulesSection);
  overpopulationLimit = createInput('5').parent(rulesSection);
  overpopulationLimit.attribute('type', 'number');
  overpopulationLimit.attribute('min', '1');
  overpopulationLimit.attribute('max', '8');
  
  createElement('p', 'Underpopulation limit:').parent(rulesSection);
  underpopulationLimit = createInput('2').parent(rulesSection);
  underpopulationLimit.attribute('type', 'number');
  underpopulationLimit.attribute('min', '0');
  underpopulationLimit.attribute('max', '8');
  
  createElement('p', 'Revival condition:').parent(rulesSection);
  revivalCondition = createInput('2').parent(rulesSection);
  revivalCondition.attribute('type', 'number');
  revivalCondition.attribute('min', '1');
  revivalCondition.attribute('max', '8');

  // Relaxation section
  let relaxSection = createDiv();
  relaxSection.addClass('control-section');
  relaxSection.parent(controls);
  
  createElement('h3', 'Visualization').parent(relaxSection);
  
  createElement('p', 'Lloyd\'s Relaxation Factor:').parent(relaxSection);
  
  let sliderContainer = createDiv();
  sliderContainer.addClass('slider-container');
  sliderContainer.parent(relaxSection);
  
  relaxationFactorSlider = createSlider(0, 1, 0.2, 0.01);
  relaxationFactorSlider.parent(sliderContainer);
  relaxationFactorSlider.style('width', '100%');
  
  relaxFactorValue = createDiv('0.20');
  relaxFactorValue.addClass('slider-value');
  relaxFactorValue.parent(sliderContainer);
  
  let hideLabel = createDiv();
  hideLabel.parent(relaxSection);
  hideLabel.addClass('label');
  
  hideModeCheckbox = createCheckbox('Hide Mode (no point removal)', false);
  hideModeCheckbox.parent(hideLabel);
  hideModeCheckbox.changed(() => {
    hideMode = hideModeCheckbox.checked();
  });

  // Simulation controls section
  let simControlSection = createDiv();
  simControlSection.addClass('control-section');
  simControlSection.parent(controls);
  
  createElement('h3', 'Simulation Controls').parent(simControlSection);
  
  startButton = createButton('Start Simulation');
  startButton.parent(simControlSection);
  startButton.mousePressed(() => {
    if (points.length > 0) {
      initialized = true; // Start the simulation when 'Start Simulation' is clicked
    }
  });
  
  // Disable the start button initially if no points exist
  if (points.length === 0) {
    startButton.attribute('disabled', '');
  }

  let resetButton = createButton('Reset Simulation');
  resetButton.parent(simControlSection);
  resetButton.mousePressed(() => {
    initialized = false; // Reset the simulation state
    // Keep the current points but allow editing the states again
  });

  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function draw() {
  background(255);

  // Update slider value display
  relaxFactorValue.html(relaxationFactorSlider.value().toFixed(2));

  // Draw Voronoi cells
  let polygons = voronoi.cellPolygons();
  let cells = Array.from(polygons);

  for (let poly of cells) {
    stroke(0);
    strokeWeight(1);
    fill(cellStates[poly.index] ? '#1a2b3b' : '#ffffff'); // Fill based on cell state
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

  // Get the current relaxation factor from the slider
  let relaxFactor = relaxationFactorSlider.value();
  
  for (let i = 0; i < points.length; i++) {
    points[i].lerp(centroids[i], relaxFactor); // Use the slider value for relaxation
  }

  // Recalculate Voronoi diagram after relaxation
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function mousePressed() {
  if (!initialized && mouseX < width && mouseY < height) {
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
