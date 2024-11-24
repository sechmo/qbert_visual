
const DIRECTION = Object.freeze({
  POS_X: "POS_X",
  NEG_X: "NEG_X",
  POS_Y: "POS_Y",
  NEG_Y: "NEG_Y",
})

function dirToVec(dir) {
  switch (dir) {
    case DIRECTION.POS_X:
      return createVector(1, 0);
    case DIRECTION.NEG_X:
      return createVector(-1, 0);
    case DIRECTION.POS_Y:
      return createVector(0, 1);
    case DIRECTION.NEG_Y:
      return createVector(0, -1);
    default:
      throw `invalid DIRECTION "${dir}"`
  }
}

const POSE = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
})

const STATE = Object.freeze({
  IDLE: "IDLE",
  JUMPING: "JUMPING",
})
class Qbert {
  static sprites = {};
  static spritesLoaded = false;
  constructor(spriteSheet) {
    Qbert.#loadSprites(spriteSheet);

    this.frameCount = 0;
    this.direction = DIRECTION.POS_X;
    this.state = STATE.IDLE;
  }

  static #loadSprites(spriteSheet) {
    if (Qbert.spritesLoaded) {
      return;
    }
    spriteSheet.addSpec("qbert_down_neg_x", 0, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_neg_x", 16, 0, 16, 16);
    spriteSheet.addSpec("qbert_down_neg_y", 32, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_neg_y", 48, 0, 16, 16);
    spriteSheet.addSpec("qbert_down_pos_x", 64, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_pos_x", 80, 0, 16, 16);
    spriteSheet.addSpec("qbert_down_pos_y", 96, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_pos_y", 112, 0, 16, 16);

    Qbert.sprites = {
      [DIRECTION.NEG_X]: {
        [POSE.UP]: spriteSheet.getSprite("qbert_up_neg_x"),
        [POSE.DOWN]: spriteSheet.getSprite("qbert_down_neg_x"),
      },
      [DIRECTION.POS_X]: {
        [POSE.UP]: spriteSheet.getSprite("qbert_up_pos_x"),
        [POSE.DOWN]: spriteSheet.getSprite("qbert_down_pos_x"),
      },
      [DIRECTION.NEG_Y]: {
        [POSE.UP]: spriteSheet.getSprite("qbert_up_neg_y"),
        [POSE.DOWN]: spriteSheet.getSprite("qbert_down_neg_y"),
      },
      [DIRECTION.POS_Y]: {
        [POSE.UP]: spriteSheet.getSprite("qbert_up_pos_y"),
        [POSE.DOWN]: spriteSheet.getSprite("qbert_down_pos_y"),
      },
    }


  }

  update() {
    switch (this.state) {
      case STATE.IDLE:
        this.frameCount++;
        return;
      case STATE.JUMPING:
        if (this.frameCount >= 12) {
          this.frameCount = 0;
          this.state = STATE.IDLE;
          return
        }
        this.frameCount++
        return;
    }
  }

  draw(cnv, pos) {
    // const sprites = [
    //   Qbert.sprites[DIRECTION.NEG_X][POSE.UP],
    //   Qbert.sprites[DIRECTION.NEG_X][POSE.DOWN],
    //   Qbert.sprites[DIRECTION.POS_X][POSE.UP],
    //   Qbert.sprites[DIRECTION.POS_X][POSE.DOWN],
    //   Qbert.sprites[DIRECTION.NEG_Y][POSE.UP],
    //   Qbert.sprites[DIRECTION.NEG_Y][POSE.DOWN],
    //   Qbert.sprites[DIRECTION.POS_Y][POSE.UP],
    //   Qbert.sprites[DIRECTION.POS_Y][POSE.DOWN],
    // ];

    // const spriteIndex = floor(this.frameCount);
    // const sprite = sprites[spriteIndex];

    // this.frameCount = (this.frameCount + 1) % sprites.length;

    let sprite;
    switch (this.state) {
      case STATE.IDLE:
        sprite = Qbert.sprites[this.direction][POSE.DOWN];
        break;
      case STATE.JUMPING:
        sprite = Qbert.sprites[this.direction][POSE.UP];
        break;
    }

    // cnv.imageMode(CENTER);
    cnv.image(sprite, pos.x, pos.y);
  }

  startJump() {
    this.state = STATE.JUMPING;
    frameCount = 0;
  }

}

class QbertGame {
  /**
   * 
   * @param {IsometricProjection} proj 
   */
  constructor(proj, spriteSheet) {
    this.size = 7;
    this.proj = proj;
    this.#initMap();

    this.entities[this.zeroPlane.x][this.zeroPlane.y].push(new Qbert(spriteSheet))
  }

  #initMap() {
    const size = this.size;
    // this represents the map as a 2d array that includes 
    // the border empty spaces
    const heightMap = []
    this.zeroPlane = createVector(1, 1) // actual coordinates of zero in the array
    // this represents the tile states / times pressed
    const tileStates = [];
    const tiles = [];
    const entities = [];
    for (let x = -1; x < size + 1; x++) {
      const heightRow = [];
      const stateRow = [];
      const entityRow = [];
      for (let y = -1; y < size - x + 1; y++) {
        let z;
        if (x < 0 || x >= size || y < 0 || y >= size - x) {
          z = NaN;
        } else {
          z = size - x - y;
          tiles.push(createVector(x, y, z));
        }
        heightRow.push(z);
        stateRow.push(0);
        entityRow.push([]);
      }
      heightMap.push(heightRow);
      tileStates.push(stateRow);
      entities.push(entityRow);
    }

    this.heightMap = heightMap;
    this.tileStates = tileStates;
    this.entities = entities;
    this.mapRender = new IsometricMap(tiles, proj);
  }
  // utility function to ease iterating over one of the maps
  #mapIter(map, func) {
    for (let x = -1; x < this.size + 1; x++) {
      for (let y = -1; y < this.size - x + 1; y++) {
        const z = this.heightMap[x+1][y+1]
        func(createVector(x,y,z), map[x + 1][y + 1]);
      }
    }
  }

  update() {
    // lets iterate over the entity map and run events for all the entities found
    // note that this is easier than keeping just an entity list since this way 
    // it's easier to check for collisions vs the O(n^2) alternative of checking 
    // for every pair of entities or more complex alternatives.

    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        console.log(pos.toString(), entity.constructor.name, entity);
      }
    })



  }


  draw(cnv) {
    this.mapRender.draw(cnv);
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        // entities are nicely rendered in an ismoetric map if the sprite center
        // is one unit above the tile they are in
        const renderPos = pos.copy().add([0,0,1])
        entity.draw(cnv, this.proj.projectTo2D(renderPos))
      }
    })
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
  const tileSize = 16 // px
  angleMode(DEGREES);
  const angle = 25; // the angle between the axis (x or y) and the horizontal
  screenSize = createVector(400, 400);
  const screenCenter = screenSize.copy().mult(0.5);
  scale = 4;
  scaledScreenSize = screenSize.copy().mult(scale);

  createCanvas(scaledScreenSize.x, scaledScreenSize.y);
  frameRate(7);

  buffer = createGraphics(screenSize.x, screenSize.y)
  buffer.imageMode(CENTER);
  buffer.pixelDensity(1);
  noSmooth();

  ss = new SpriteSheet(spriteSheetImg);


  proj = new IsometricProjection(screenCenter, angle, tileSize);
  game = new QbertGame(proj, ss);;


  background(255);
}

function draw() {
  // const n = 12
  // if (count < n) {
  //   proj.zero.add(proj.xUnit);
  // } else if (count == n) {
  //   count = -n - 1;
  //   proj.zero.sub(proj.xUnit.copy().mult(2 * n));
  // }

  game.update();


  buffer.background(1);
  game.draw(buffer);
  count++;

  image(buffer, 0, 0, scaledScreenSize.x, scaledScreenSize.y);
}
