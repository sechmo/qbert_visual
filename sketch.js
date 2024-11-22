class Projection {
  /**
   * 
   * @param {Vector} zero  2d projection of (0,0,0)
   * @param {Vector} xUnit 2d projection of (1,0,0) - zero
   * @param {Vector} yUnit 2d projection of (0,1,0) - zero
   * @param {Vector} zUnit 2d projection of (0,0,1) - zero
   */
  constructor(zero, xUnit, yUnit, zUnit) {
    this.zero = zero;
    this.xUnit = xUnit;
    this.yUnit = yUnit;
    this.zUnit = zUnit;
  }

  projectTo2D(vec) {
    const x = this.xUnit.copy().mult(vec.x);
    const y = this.yUnit.copy().mult(vec.y);
    const z = this.zUnit.copy().mult(vec.z);
    return this.zero.copy().add(x).add(y).add(z);
  }
}

class IsometricProjection extends Projection {
  constructor(zero, angle, unitLength) {
    ;
    // to achieve an isometric "3/4 view" of the tiles we will skew the plane
    // to do this we calculate the unit x and y vectors as rotated by the angle 
    // with respect to the screen horizon
    const xUnit = createVector(
      round(cos(angle) * unitLength),
      round(sin(angle) * unitLength),
    )

    const yUnit = createVector(
      -round(cos(angle) * unitLength),
      round(sin(angle) * unitLength),
    )

    const zUnit = createVector(0, -unitLength)
    super(zero, xUnit, yUnit, zUnit)
  }
}

class Tile {
  /**
   * 
   * @param {Vector} pos the position of the tile corner towards (-inf,-inf,-inf)
   * @param {Projection} proj frame of reference used for 2D projection
   */
  constructor(pos, proj) {
    this.pos = pos;
    this.proj = proj;
  }

  draw() {
    const vecQuad = (v1, v2, v3, v4) => {
      quad(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, v4.x, v4.y);
    }


    // each face it's drawn starting
    // from its uppermost corner (in the projection)

    // notice you can reuse each to draw back faces (if needed)
    const pos = this.pos;

    // top face
    fill("red");
    const topCorners = [
      pos.copy().add([0, 0, 1]),                     // ·
      pos.copy().add([1, 0, 1]), // ·, ↘
      pos.copy().add([1, 1, 1]), // ·, ↘, ↙
      pos.copy().add([0, 1, 1]), // ·, ↙
    ]
    vecQuad(...topCorners.map(v => this.proj.projectTo2D(v)));

    // Y face
    fill("green");
    const yCorners = [
      pos.copy().add([0, 1, 0]),
      pos.copy().add([1, 1, 0]),
      pos.copy().add([1, 1, 1]),
      pos.copy().add([0, 1, 1]),
    ]
    vecQuad(...yCorners.map(v => this.proj.projectTo2D(v)));

    // X face
    fill("blue");
    const xCorners = [
      pos.copy().add([1, 0, 0]),
      pos.copy().add([1, 1, 0]),
      pos.copy().add([1, 1, 1]),
      pos.copy().add([1, 0, 1]),
    ]
    vecQuad(...xCorners.map(v => this.proj.projectTo2D(v)));

  }
}

class IsometricMap {
  /**
   * 
   * @param {Array<Vector>} tilePos 
   * @param {IsometricProjection} proj 
   */
  constructor(tilePos, proj) {
    this.tiles = tilePos.map((p) => new Tile(p, proj));
    this.#sortTiles();
  }

  #sortTiles() {
    this.tiles.sort((t1, t2) => {
      /*
       for appropiate rendering of the tiles 
       lets order them first by height, lower first,
       then x and y, also lower first
      */
      const dz = t1.pos.z - t2.pos.z;
      if (dz != 0) {
        return dz;
      }

      const dx = t1.pos.x - t2.pos.x;
      if (dx != 0) {
        return dx;
      }

      const dy = t1.pos.y - t2.pos.y;
      if (dy != 0) {
        return dy;
      }

    })
  }

  draw() {
    for (const tile of this.tiles) {
      tile.draw();
    }
  }
}

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
