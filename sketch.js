let map;
let proj;
let count = 0;
function setup() {
  const TILE_SIDE = 20 // px
  const ANGLE = 25; // the angle between the axis (x or y) and the horizontal
  const SCREEN_SIZE = createVector(400, 400);
  const CENTER = p5.Vector.mult(SCREEN_SIZE, 0.5);

  createCanvas(SCREEN_SIZE.x, SCREEN_SIZE.y);
  frameRate(7);
  angleMode(DEGREES);
  proj = new IsometricProjection(CENTER, ANGLE, TILE_SIDE)
  map = new IsometricMap([
    createVector(0, 0, 0), 
    createVector(1, 1, 0), 
    createVector(1, 2, 0), 
    createVector(1, 0, 1), 
    createVector(1, -1, 0),
    createVector(1, -2, 0),
    createVector(1, 0, -1),
  ], proj);
}

function draw() {
  background(220);
  map.draw();
  const n = 12
  if (count < n) {
    proj.zero.add(proj.xUnit);
  } else if (count == n) {
    count = -n - 1;
    proj.zero.sub(proj.xUnit.copy().mult(2 * n));
  }
  count++;
}
