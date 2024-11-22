class QbertGame {
  /**
   * 
   * @param {IsometricProjection} proj 
   */
  constructor(proj) {
    this.size = 7;
    this.#initMap();
  }

  #initMap() {
    const size = this.size;
    // this represents the map as a 2d array that includes 
    // the border empty spaces
    const heightMap = []
    this.zeroPlane = createVector(1,1) // actual coordinates of zero in the array
    // this represents the tile states / times pressed
    const stateMap = []
    const tiles = [];
    for (let i = -1; i < size + 1; i++) {
      const heightRow = [];
      const stateRow = [];
      for (let j = -1; j < size - i + 1; j++) {
        let height;
        if (i < 0 || i >= size || j < 0 || j >= size - i) {
          height = NaN;
        } else {
          height = size - i - j;
          tiles.push(createVector(i, j, height));
        }
        heightRow.push(height);
        stateRow.push(0);
      }
      heightMap.push(heightRow)
    }

    this.heightMap = heightMap;
    this.stateMap = stateMap;
    this.mapRender = new IsometricMap(tiles, proj);
  }

  draw() {
    this.mapRender.draw();
  }
}

let game;
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
  // map = new IsometricMap([
  //   createVector(0, 0, 0), 
  //   createVector(1, 1, 0), 
  //   createVector(1, 2, 0), 
  //   createVector(1, 0, 1), 
  //   createVector(1, -1, 0),
  //   createVector(1, -2, 0),
  //   createVector(1, 0, -1),
  // ], proj);
  game = new QbertGame(proj);
}

function draw() {
  background(220);
  game.draw();
  const n = 12
  if (count < n) {
    proj.zero.add(proj.xUnit);
  } else if (count == n) {
    count = -n - 1;
    proj.zero.sub(proj.xUnit.copy().mult(2 * n));
  }
  count++;
}
