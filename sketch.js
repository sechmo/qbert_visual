function easeOut(currentTime, startValue, endValue, totalTime) {
  const unitEaseOut = (time) => 1 - pow(1 - time, 2);
  // now we scale for our parameters
  return (
    startValue + (endValue - startValue) * unitEaseOut(currentTime / totalTime)
  );
}

function easeIn(currentTime, startValue, endValue, totalTime) {
  const unitEaseIn = (time) => pow(time, 2);
  // now we scale for our parameters
  return (
    startValue + (endValue - startValue) * unitEaseIn(currentTime / totalTime)
  );
}

const DIRECTION = Object.freeze({
  POS_X: "POS_X",
  NEG_X: "NEG_X",
  POS_Y: "POS_Y",
  NEG_Y: "NEG_Y",
});

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
      throw `invalid DIRECTION "${dir}"`;
  }
}

function invDir(dir) {
  switch (dir) {
    case DIRECTION.POS_X:
      return DIRECTION.NEG_X;
    case DIRECTION.NEG_X:
      return DIRECTION.POS_X;
    case DIRECTION.POS_Y:
      return DIRECTION.NEG_Y;
    case DIRECTION.NEG_Y:
      return DIRECTION.POS_Y;
  }
}

const POSE = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
});

const STATE = Object.freeze({
  IDLE: "IDLE",
  JUMPING: "JUMPING",
  FALLING: "FALLING",
});

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
    };
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
          return;
        }
        this.frameCount++;
        return;
      case STATE.FALLING:
        this.frameCount++;
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
      case STATE.FALLING:
        sprite = Qbert.sprites[this.direction][POSE.UP];
        break;
    }

    // console.log("VOY", sprite);
    cnv.image(sprite, pos.x, pos.y);
  }

  startJump() {
    this.state = STATE.JUMPING;
    this.frameCount = 0;
  }

  startFall() {
    this.state = STATE.FALLING;
    this.frameCount = 0;
  }

  reset() {
    this.frameCount = 0;
    this.direction = DIRECTION.NEG_X;
    this.state = STATE.IDLE;
  }
}

class QbertGame {
  /**
   *
   * @param {IsometricProjection} proj
   */
  constructor(proj, spriteSheet) {
    this.spriteSheet = spriteSheet;
    this.size = 7;
    this.proj = proj;
    this.#initMap(spriteSheet);
    this.movement = null;
    this.deadQbert = false;
    this.gameOver = false;
    this.fall = true;
    this.lifes = 3;
    this.qbert = new Qbert(spriteSheet);
    this.entities[this.zeroPlane.x][this.zeroPlane.y].push(this.qbert);
    // this.mapState[1][1] = 1;
    this.mapState[0][5] = 1;
    this.tileMap.updatePowers(createVector(-1, 4, 3));
    this.mapState[5][0] = 1;
    this.tileMap.updatePowers(createVector(4, -1, 3));
    this.gravity = 0.025;
    this.tick = 0;
  }

  #initMap(spriteSheet) {
    const size = this.size;
    // this represents the map as a 2d array that includes
    // the border empty spaces
    this.zeroPlane = createVector(1, 1); // actual coordinates of zero in the array
    // this represents the tile states / times pressed
    const tileStates = [];
    const tiles = [];
    const entities = [];
    const mapState = [];
    for (let x = -1; x < size + 1; x++) {
      const stateRow = [];
      const entityRow = [];
      const mapStateRow = [];
      for (let y = -1; y < size - x + 1; y++) {
        const z = this.#getMapHeight(x, y);
        if (z) {
          tiles.push(createVector(x, y, z));
        }
        stateRow.push(0);
        entityRow.push([]);
        mapStateRow.push(0);
      }
      tileStates.push(stateRow);
      entities.push(entityRow);
      mapState.push(mapStateRow);
    }

    this.tileStates = tileStates;
    this.entities = entities;
    this.mapState = mapState;
    this.tileMap = new IsometricMap(tiles, proj, spriteSheet);
    this.isoRender = new IsometricRender(proj);
  }

  #getMapHeight(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size - x) {
      return undefined;
    }

    return this.size - x - y;
  }

  #verifyPower(x, y) {
    if ((x < 0 || y < 0) && this.mapState[x + 1][y + 1] == 1) {
      return this.size - x - y;
    }

    return undefined;
  }

  // utility function to ease iterating over one of the maps
  #mapIter(map, func) {
    for (let x = -1; x < this.size + 1; x++) {
      for (let y = -1; y < this.size - x + 1; y++) {
        const z = this.#getMapHeight(x, y);
        func(createVector(x, y, z), map[x + 1][y + 1]);
      }
    }
  }

  update() {
    // lets iterate over the entity map and run events for all the entities found.
    // Note that this is easier than keeping just an entity list since this way
    // it's easier to check for collisions vs the O(n^2) alternative of checking
    // for every pair of entities or more complex alternatives.

    this.generatePowers();

    this.generateEnemies();

    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        if (entity instanceof Qbert) {
          this.#updateQbert(pos, entity);
        } else if (entity instanceof Snake) {
          this.#updateSnake(pos, entity);
        } else if (entity instanceof Enemy) {
          this.#updateEnemy(pos, entity);
        }
        // console.log(pos.toString(), entity.constructor.name, entity);
      }
    });

    if (!this.deadQbert) {
      this.validate();
    }

    this.tick++;
  }

  validate() {
    this.deadQbert = false;
    this.#mapIter(this.entities, (pos, tileEntities) => {
      let hasQbert = false;
      let hasEnemies = false;
      let qbertFalling = false;
      for (const entity of tileEntities) {
        hasQbert = hasQbert || (entity instanceof Qbert && entity.state === STATE.IDLE);
        if (entity instanceof Qbert) {
          qbertFalling = entity.state === STATE.FALLING;
        }
        hasEnemies = hasEnemies || (!(entity instanceof Qbert) && entity.state == STATE.IDLE);
      }


      this.deadQbert = this.deadQbert || (hasQbert && hasEnemies) || qbertFalling;

    });

    let victory = true;
    this.#mapIter(this.mapState,
      (pos, tileState) => {
        victory = victory &&
          (this.#getMapHeight(pos.x, pos.y) === undefined || tileState == 1)
      }
    )

    if (victory) {
      console.log("VICTORIA");
      noLoop();
    }

    if (this.deadQbert) {
      console.log("GAME OVER");
      this.lifes--;
    }

    if (this.lifes == 0) {
      this.gameOver = true;
    }

    if (!this.deadQbert || !this.fall) {
      // if (this.lifes == 3 || !this.fall) {
      //   noLoop();
      // } else {
      //   this.removeEnemies();
      //   this.gameOver = true;
      //   this.lifes += 1;
      // }
      // return;
    } 
  }

  removeEnemies() {
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (let i = 0; i < tileEntities.length; i++) {
        if (
          tileEntities[i] instanceof Enemy ||
          tileEntities[i] instanceof Snake
        ) {
          tileEntities.splice(i, 1);
          // console.log(pos.toString());
        }
      }
    });
  }

  reset() {
    this.size = 7;
    this.proj = proj;
    this.#initMap(this.spriteSheet);
    this.movement = null;
    this.deadQbert = false;
    this.gameOver = false;
    this.fall = true;
    this.lifes = 3;
    this.entities[this.zeroPlane.x][this.zeroPlane.y].push(this.qbert);
    // this.mapState[1][1] = 1;
    this.mapState[0][5] = 1;
    this.tileMap.updatePowers(createVector(-1, 4, 3));
    this.mapState[5][0] = 1;
    this.tileMap.updatePowers(createVector(4, -1, 3));
    this.tick = 0;

    loop();
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
          // move the entity to the next tile
          const newPos = this.#moveEntityMap(pos, qbert, qbert.direction);
          // check if it is falling 

          const newPosHeight = this.#getMapHeight(newPos.x, newPos.y);

          if (newPosHeight === undefined) {
            qbert.startFall();
            return;
          }


        }

        const mov = this.#getMovement();
        if (mov) {
          qbert.direction = mov;
          qbert.startJump();
        }
        return;
    }
  }

  #updateSnake(pos, snake) {
    snake.update();

    switch (snake.state) {
      case STATE.JUMPING:
        return;
      case STATE.IDLE:
        // just finished jumping
        if (snake.frameCount === 0) {
          // move the entity to the next frame
          this.#moveEntityMap(pos, snake, snake.direction);
        }

        let posQbert;

        this.#mapIter(this.entities, (posIt, tileEntities) => {
          for (const entity of tileEntities) {
            if (entity instanceof Qbert) {
              posQbert = posIt;
              // console.log("POSICION_QBERT", posIt);
              break;
            }
          }
        });

        if (posQbert.y >= pos.y) {
          if (posQbert.x > pos.x) {
            snake.direction = DIRECTION.POS_X;
          } else {
            snake.direction = DIRECTION.POS_Y;
          }
        } else {
          if (posQbert.x >= pos.x) {
            snake.direction = DIRECTION.NEG_Y;
          } else {
            snake.direction = DIRECTION.NEG_X;
          }
        }

        snake.startJump();

        return;
    }
  }

  #updateEnemy(pos, enemy) {
    enemy.update();

    switch (enemy.state) {
      case STATE.JUMPING:
        return;
      case STATE.IDLE:
        // just finished jumping
        if (enemy.frameCount === 0) {
          // move the entity to the next frame
          this.#moveEntityMap(pos, enemy, enemy.direction);
        }

        if (random() < 0.5 || pos.x == this.size - 1) {
          enemy.direction = DIRECTION.POS_Y;
        } else {
          enemy.direction = DIRECTION.POS_X;
        }

        enemy.startJump();

        return;
    }
  }

  #moveEntityMap(pos, entity, direction) {
    const tileEntities = this.entities[pos.x + 1][pos.y + 1];
    let removed = false;
    for (let i = 0; i < tileEntities.length; i++) {
      if (tileEntities[i] === entity) {
        tileEntities.splice(i, 1);
        removed = true;
        break;
      }
    }

    if (!removed) {
      throw `tried to move entity (${entity}) from ${pos.toString()}, but the entity was not there`;
    }

    // add to new position

    const delta = dirToVec(direction);
    let newPos = pos.copy().add(delta);

    if (entity instanceof Qbert) {
      //Fix final position power
      if (pos.x < 0 || pos.y < 0) {
        newPos = createVector(0, 0, 0);
      }
      if (newPos.x >= 0 && newPos.y >= 0) {
        this.mapState[newPos.x + 1][newPos.y + 1] = 1;
        this.tileMap.visitTile(newPos);
      }
      this.entities[newPos.x + 1][newPos.y + 1].push(entity);
    } else {
      if (
        newPos.x >= 0 &&
        newPos.y >= 0 &&
        newPos.x <= this.size - 1 &&
        newPos.y <= this.size - newPos.x - 1
      ) {
        this.entities[newPos.x + 1][newPos.y + 1].push(entity);
      }
    }

    return newPos;
  }

  updatePowers(pos) {
    this.mapState[pos.x + 1][pos.y + 1] = 0;
    this.tileMap.updatePowers(
      createVector(pos.x, pos.y, this.size - (pos.y < 0 ? pos.x : pos.y)),
      false
    );
  }

  generatePowers() {
    if (random() < 0.01 && this.tileMap.powerTiles.length < 2) {
      const rand = floor(random(2, 6.9));
      const position =
        random() < 0.5
          ? createVector(-1, rand, this.size - rand)
          : createVector(rand, -1, this.size - rand);
      this.tileMap.updatePowers(position);
      this.mapState[position.x + 1][position.y + 1] = 1;
    }
  }

  generateEnemies() {
    if (this.tick < 200) {
      return
    };
    if (random() < 0.007) {
      let index, pos;
      while (true) {
        index = floor(random(1, 3.9));
        if (random() < 0.5) {
          pos = createVector(index, 0);
        } else {
          pos = createVector(0, index);
        }
        if (this.entities[pos.x + 1][pos.y + 1].length < 1) {
          break;
        }
      }
      if (random() > 0.5) {
        //Snake
        this.entities[pos.x + 1][pos.y + 1].push(new Snake(this.spriteSheet));
      } else {
        //Ball
        this.entities[pos.x + 1][pos.y + 1].push(new Enemy(this.spriteSheet));
      }
    }
  }

  reportMovement(direction) {
    this.movement = direction;
  }

  // returns and "consumes" movement
  #getMovement() {
    const mov = this.movement;
    this.movement = null;
    return mov;
  }


  /**
   * Calculates the position of qbert accounting for jump and animation progress
   * @param {mapPos}  
   * @param {Qbert} qbert 
   */
  #qbertProjPos(mapPos, qbert) {
    // this should be in the qbert class
    let currPos;
    if (qbert.state === STATE.JUMPING) {
      // adjust position for jump
      const currentHeight = mapPos.z;
      const dirVec = dirToVec(qbert.direction);
      let nextPos = mapPos.copy().add(dirVec);
      let nextHeight = this.#getMapHeight(nextPos.x, nextPos.y);
      let jump = nextHeight - currentHeight;

      if (mapPos.x < 0 || mapPos.y < 0) {
        // console.log("got here");
        nextPos = createVector(0, 0);
        nextHeight = 0;
        jump = mapPos.x < 0 ? mapPos.y : mapPos.x;
      }

      //Jump to a power
      if (this.#verifyPower(nextPos.x, nextPos.y)) {
        nextHeight = currentHeight;
        jump = 0;
      }

      // console.log({ jumpUp: jump });

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

      const t = qbert.frameCount;
      let offHeight;
      if (t < middleTime) {
        // ease out (deacceleration) for the jump from start to middle
        offHeight = easeOut(t, startOff, middleOff, middleTime);
      } else {
        // ease in (accelerate) for the jump middle to end
        offHeight = easeIn(
          t - middleTime,
          middleOff,
          endOff,
          endTime - middleTime
        );
      }

      // linear movement in the jump direction
      let factOffDir = t / endTime;
      if (mapPos.x < 0 || mapPos.y < 0) {
        factOffDir *= mapPos.x < 0 ? mapPos.y : mapPos.x;
        offHeight += 1;
      }
      if (mapPos.x < 0 || mapPos.y < 0) {
        let newPos1 = mapPos.copy();
        newPos1.z = this.size - (mapPos.y < 0 ? newPos1.x : newPos1.y);
        mapPos = newPos1;
      }
      const offDir = dirVec.copy().mult(factOffDir);
      currPos = mapPos.copy().add([0, 0, offHeight]).add(offDir);
      // console.log("currPos", currPos.toString());

    } else if (qbert.state === STATE.IDLE) {
      //Control out of map
      if (
        !this.#getMapHeight(mapPos.x, mapPos.y) &&
        !this.#verifyPower(mapPos.x, mapPos.y)
      ) {
        this.fall = false;
      }

      // if (mapPos.x < 0) {
      //   this.reportMovement(DIRECTION.NEG_Y);
      // } else if (mapPos.y < 0) {
      //   this.reportMovement(DIRECTION.NEG_X);
      // }

      currPos = mapPos

      if (mapPos.x < 0 || mapPos.y < 0) {
        this.updatePowers(mapPos);
        let newPos1 = mapPos.copy();
        newPos1.z = this.size - (mapPos.y < 0 ? newPos1.x : newPos1.y);
        currPos = newPos1;
      }

    } else if (qbert.state === STATE.FALLING) {

      const previousPos = mapPos.copy().add(dirToVec(invDir(qbert.direction)))

      const previousHeight = this.#getMapHeight(previousPos.x,previousPos.y); // this should not be undefined

      // falling 
      const t = qbert.frameCount;
      const height = previousHeight - this.gravity * t * t;

      currPos = createVector(mapPos.x,mapPos.y, height);

      


    }



    // entities are nicely rendered in an ismoetric map if the sprite center
    // is one unit above the tile they are in
    return currPos.copy().add([0, 0, 1]);

  }


  #entityProjPos(mapPos, entity) {
    // this should be implemented in each entity
    let currPos;
    if (entity.state === STATE.JUMPING) {
      // adjust position for jump
      const currentHeight = mapPos.z;
      const dirVec = dirToVec(entity.direction);
      const nextPos = mapPos.copy().add(dirVec);
      const nextHeight = this.#getMapHeight(nextPos.x, nextPos.y);
      const jump = nextHeight - currentHeight;

      // console.log({ jumpUp: jump });

      let startOff, middleOff, endOff;
      let middleTime, endTime;
      startOff = 0;
      endOff = jump;
      middleTime = 10;
      endTime = 20;

      if (jump > 0) {
        middleOff = endOff + 0.5;
      } else {
        middleOff = startOff + 0.5;
      }

      const t = entity.frameCount;
      let offHeight;
      if (t < middleTime) {
        // ease out (deacceleration) for the jump from start to middle
        offHeight = easeOut(t, startOff, middleOff, middleTime);
      } else {
        // ease in (accelerate) for the jump middle to end
        offHeight = easeIn(
          t - middleTime,
          middleOff,
          endOff,
          endTime - middleTime
        );
      }

      // linear movement in the jump direction
      const factOffDir = t / endTime;
      const offDir = dirVec.copy().mult(factOffDir);
      currPos = mapPos.copy().add([0, 0, offHeight]).add(offDir);
    }

    // entities are nicely rendered in an ismoetric map if the sprite center
    // is one unit above the tile they are in
    return currPos.copy().add([0, 0, 1]);

  }

  draw(cnv) {
    // this.tileMap.draw(cnv);

    const entities = [];

    entities.push(...this.tileMap.getTiles().map(t => [t.getPosition(), t]));


    // console.log(this.entities);
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        if (entity instanceof Qbert) {
          entities.push([this.#qbertProjPos(pos, entity), entity])
        } else {
          entities.push([this.#entityProjPos(pos, entity), entity])
        }
      }
    });


    this.isoRender.draw(cnv, entities);
  }
}

let spriteSheetImg;
function preload() {
  const spriteSheetPath = "sprites.png";
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
  const tileSize = 16; // px
  angleMode(DEGREES);
  const angle = 25; // the angle between the axis (x or y) and the horizontal
  screenSize = createVector(250, 250);
  const screenCenter = screenSize.copy().mult(0.5);
  scale = 2.4;
  scaledScreenSize = screenSize.copy().mult(scale);

  createCanvas(scaledScreenSize.x, scaledScreenSize.y);
  frameRate(30);

  buffer = createGraphics(screenSize.x, screenSize.y);
  buffer.imageMode(CENTER);
  buffer.pixelDensity(1);
  noSmooth();

  ss = new SpriteSheet(spriteSheetImg);

  proj = new IsometricProjection(
    screenCenter.copy().add(0, 50),
    angle,
    tileSize
  );
  game = new QbertGame(proj, ss);

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
  if ((game.lifes === 3 || !game.fall) && key == "r") {
    game.reset();
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
