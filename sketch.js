
class SpriteSheet {
  constructor(baseImage) {
    this.baseImage = baseImage;
    this.spec = {};
  }

  addSpec(name, x, y, w, h) {
    this.spec[name] = {
      x, y, w, h
    }
  }

  getSprite(name) {
    if (!Object.hasOwn(this.spec, name)) {
      throw `no sprite registered with name "${name}"`
    }

    const spec = this.spec[name];

    // lazy load sprite
    if (!Object.hasOwn(spec, "sprite")) {
      spec.sprite = this.baseImage.get(spec.x, spec.y, spec.w, spec.h);
    }

    return spec.sprite;
  }
}

class Qbert {
  static sprites = {};
  static spritesLoaded = false;
  constructor(spriteSheet) {
    if (!spritesLoaded) {
      this.#loadSprites(spriteSheet);
    }
  }

  #loadSprites(spriteSheet) {


  }


  draw() { }
}

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
    this.zeroPlane = createVector(1, 1) // actual coordinates of zero in the array
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

  draw(cnv) {
    this.mapRender.draw(cnv);
  }
}

let spriteSheetImg;
function preload() {
  const spriteSheetPath = "sprites.png"
  spriteSheetImg = loadImage(spriteSheetPath);
}

let game;
let ss;
let proj;
let count = 0;
let buffer;
let screenSize;
let scale;
let scaledScreenSize;
function setup() {
  const TILE_SIDE = 16 // px
  const ANGLE = 25; // the angle between the axis (x or y) and the horizontal
  screenSize = createVector(400, 400);
  const CENTER = p5.Vector.mult(screenSize, 0.5);
  scale = 4;
  scaledScreenSize = screenSize.copy().mult(scale);

  createCanvas(scaledScreenSize.x, scaledScreenSize.y);
  frameRate(7);
  angleMode(DEGREES);

  buffer = createGraphics(screenSize.x, screenSize.y)
  buffer.pixelDensity(1);

  ss = new SpriteSheet(spriteSheetImg);
  ss.addSpec("qbert1", 0, 0, 16, 16)
  noSmooth();


  proj = new IsometricProjection(CENTER, ANGLE, TILE_SIDE);
  game = new QbertGame(proj);;

}

function draw() {
  // const n = 12
  // if (count < n) {
  //   proj.zero.add(proj.xUnit);
  // } else if (count == n) {
  //   count = -n - 1;
  //   proj.zero.sub(proj.xUnit.copy().mult(2 * n));
  // }

  buffer.background(1);
  game.draw(buffer);
  buffer.imageMode(CENTER);
  let pos = createVector(0, 0, 8)
  pos = proj.projectTo2D(pos);
  // quad(pos.x, pos.y, pos.x+10, pos.y, pos.x+10, pos.y + 10, pos.x, pos.y+10)

  let size = createVector(16, 16);
  console.log(size.toString(), proj.zUnit.toString());
  buffer.image(ss.getSprite("qbert1"), pos.x, pos.y, size.x, size.y);
  count++;

  image(buffer, 0, 0, scaledScreenSize.x, scaledScreenSize.y);
}
