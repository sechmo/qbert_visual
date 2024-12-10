
function easeOut(currentTime, startValue, endValue, totalTime) {

  const unitEaseOut = (time) => 1 - pow(1-time,2);
  // now we scale for our parameters
  return startValue + (endValue - startValue) * unitEaseOut(currentTime/totalTime)
}

function easeIn(currentTime, startValue, endValue, totalTime) {

  const unitEaseIn = (time) => pow(time,2);
  // now we scale for our parameters
  return startValue + (endValue - startValue) * unitEaseIn(currentTime/totalTime)
}


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
    this.direction = DIRECTION.NEG_X;
    this.state = STATE.IDLE;
  }

  static #loadSprites(spriteSheet) {
    if (Qbert.spritesLoaded) {
      return;
    }
    spriteSheet.addSpec("qbert_down_neg_y", 0, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_neg_y", 16, 0, 16, 16);
    spriteSheet.addSpec("qbert_down_neg_x", 32, 0, 16, 16);
    spriteSheet.addSpec("qbert_up_neg_x", 48, 0, 16, 16);
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
        if (this.frameCount >= 13) {
          this.frameCount = 0;
          this.state = STATE.IDLE;
          return
        }
        this.frameCount++
        return;
    }
  }

  draw(cnv, pos) {
    let sprite;
    switch (this.state) {
      case STATE.IDLE:
        sprite = Qbert.sprites[this.direction][POSE.DOWN];
        break;
      case STATE.JUMPING:
        // first frame of jumpt just face towards the jump direction
        if (this.frameCount == 1) { 
          sprite = Qbert.sprites[this.direction][POSE.DOWN];
          break;
        }
        sprite = Qbert.sprites[this.direction][POSE.UP];
        break;
    }

    cnv.image(sprite, pos.x, pos.y);
  }

  startJump() {
    this.state = STATE.JUMPING;
    this.frameCount = 0;
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
    this.movement = null;

    this.entities[this.zeroPlane.x][this.zeroPlane.y].push(new Qbert(spriteSheet))
  }

  #initMap() {
    const size = this.size;
    // this represents the map as a 2d array that includes 
    // the border empty spaces
    this.zeroPlane = createVector(1, 1) // actual coordinates of zero in the array
    // this represents the tile states / times pressed
    const tileStates = [];
    const tiles = [];
    const entities = [];
    for (let x = -1; x < size + 1; x++) {
      const stateRow = [];
      const entityRow = [];
      for (let y = -1; y < size - x + 1; y++) {
        const z = this.#getMapHeight(x,y);
        if (z) {
          tiles.push(createVector(x, y, z));
        }
        stateRow.push(0);
        entityRow.push([]);
      }
      tileStates.push(stateRow);
      entities.push(entityRow);
    }

    this.tileStates = tileStates;
    this.entities = entities;
    this.mapRender = new IsometricMap(tiles, proj);
  }

  #getMapHeight(x,y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size - x) {
      return undefined;
    }

    return this.size - x - y;
  }

  // utility function to ease iterating over one of the maps
  #mapIter(map, func) {
    for (let x = -1; x < this.size + 1; x++) {
      for (let y = -1; y < this.size - x + 1; y++) {
        const z = this.#getMapHeight(x,y);
        func(createVector(x, y, z), map[x + 1][y + 1]);
      }
    }
  }

  update() {
    // lets iterate over the entity map and run events for all the entities found.
    // Note that this is easier than keeping just an entity list since this way 
    // it's easier to check for collisions vs the O(n^2) alternative of checking 
    // for every pair of entities or more complex alternatives.

    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {

        if (entity instanceof Qbert) {
          this.#updateQbert(pos, entity);
        }
        // console.log(pos.toString(), entity.constructor.name, entity);
      }
    })



  }

  /**
   * 
   * @param {Qbert} qbert 
   */
  #updateQbert(pos, qbert) {
    qbert.update();

    switch (qbert.state) {
      case STATE.JUMPING:
        return;
      case STATE.IDLE:
        // just finished jumping
        if (qbert.frameCount === 0) {
          // move the entity to the next frame
          this.#moveEntityMap(pos, qbert, qbert.direction);
          return ;
        }

        const mov = this.#getMovement();
        if (mov) {
          qbert.direction = mov;
          qbert.startJump();
        }
        return;
    }
  }

  #moveEntityMap(pos, entity, direction) {
    // delete from current position
    const tileEntities = this.entities[pos.x+1][pos.y+1]
    let removed = false;
    for (let i = 0; i < tileEntities.length; i++) {
      if (tileEntities[i] === entity) {
        tileEntities.splice(i,1);
        removed = true;
        break
      }
    } 

    if (!removed) {
      throw `tried to move entity (${entity}) from ${pos.toString()}, but the entity was not there`
    }

    // add to new position

    const delta = dirToVec(direction);
    const newPos = pos.copy().add(delta);
    this.entities[newPos.x + 1][newPos.y +1].push(entity);
  }
  reportMovement(direction) {
    this.movement = direction
  }

  // returns and "consumes" movement
  #getMovement() {
    const mov = this.movement;
    this.movement = null;
    return mov;
  }


  draw(cnv) {
    this.mapRender.draw(cnv);
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        if (entity instanceof Qbert) {
          if (entity.state === STATE.JUMPING) {
            // adjust position for jump
            const currentHeight = pos.z;
            const dirVec = dirToVec(entity.direction)
            const nextPos = pos.copy().add(dirVec);
            const nextHeight = this.#getMapHeight(nextPos.x, nextPos.y);

            const jump = nextHeight - currentHeight;

            console.log({jumpUp: jump});

            let startOff, middleOff, endOff;
            let middleTime, endTime;
            startOff = 0;
            endOff = jump;
            middleTime = 7;
            endTime = 13;


            if (jump > 0) {
              middleOff = endOff + 0.5;
            } else {
              middleOff = startOff + 0.5;
            }

            const t = entity.frameCount;
            let offHeight;
            if (t < middleTime) {
              // ease out (deacceleration) for the jump from start to middle
              offHeight = easeOut(t,startOff, middleOff, middleTime);
            } else {
              // ease in (accelerate) for the jump middle to end
              offHeight = easeIn(t - middleTime, middleOff, endOff, endTime - middleTime);
            }

            // linear movement in the jump direction
            const factOffDir = t/endTime;
            const offDir = dirVec.copy().mult(factOffDir)

            const currPos = pos.copy().add([0,0,offHeight]).add(offDir);
            console.log("currPos", currPos.toString());
            pos = currPos;
          }
        }


        // entities are nicely rendered in an ismoetric map if the sprite center
        // is one unit above the tile they are in
        const renderPos = this.proj.projectTo2D(pos.copy().add([0, 0, 1]))

        // console.log("renPos", renderPos.toString());
        entity.draw(cnv, renderPos)
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
  screenSize = createVector(250, 250);
  const screenCenter = screenSize.copy().mult(0.5);
  scale = 4;
  scaledScreenSize = screenSize.copy().mult(scale);

  createCanvas(scaledScreenSize.x, scaledScreenSize.y);
  frameRate(30);

  buffer = createGraphics(screenSize.x, screenSize.y)
  buffer.imageMode(CENTER);
  buffer.pixelDensity(1);
  noSmooth();

  ss = new SpriteSheet(spriteSheetImg);


  proj = new IsometricProjection(screenCenter.copy().add(0,50), angle, tileSize);
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


let timer = Date.now();
function keyPressed() {
  if (Date.now() - timer < 500) {
    return;
  }
  timer = Date.now();
  let movement = null;
  switch (keyCode) {
    case UP_ARROW:
      movement = DIRECTION.NEG_Y;
      break;
    case DOWN_ARROW:
      movement = DIRECTION.POS_Y;
      break;
    case LEFT_ARROW:
      movement = DIRECTION.NEG_X;
      break;
    case RIGHT_ARROW:
      movement = DIRECTION.POS_X;
      break;
  }

  if (movement) { 
    game.reportMovement(movement);
  }
}