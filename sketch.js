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


const GAME_STATE = Object.freeze({
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY",
});
class QbertGame {
  /**
   *
   * @param {IsometricProjection} proj
   */
  constructor(proj, spriteSheet) {
    this.spriteSheet = spriteSheet;
    this.size = 7;
    this.proj = proj;
    this.isoRender = new IsometricRender(proj);
    this.#initMap(proj);
    this.movement = null;
    this.tick = 0;
    this.graceTime = 30; // ticks
    this.deadQbert = false;
    this.gameState = GAME_STATE.PLAYING
    this.fall = true;
    this.lives = 3;
    this.qbert = new Qbert(spriteSheet);
    this.entities[this.zeroPlane.x][this.zeroPlane.y].push(this.qbert);
    this.tileStates[0][5] = 1;
    this.tileStates[5][0] = 1;
    this.gravity = 0.025;
    this.score = 0;

    Tile.loadSprites(spriteSheet);


    QbertGame.#loadSprites(spriteSheet);
  }

  static spritesLoaded = false
  static sprites = {}

  static #loadSprites(spriteSheet) {
    if (this.spritesLoaded) {
      return;
    }

    this.spritesLoaded = true;
    spriteSheet.addSpec("qbert_game_life", 16 * 14, 16 * 2, 8, 16);
    this.sprites["LIFE"] = spriteSheet.getSprite("qbert_game_life");
  }

  #initMap() {
    const size = this.size;
    // this represents the map as a 2d array that includes
    // the border empty spaces
    this.zeroPlane = createVector(1, 1); // actual coordinates of zero in the array
    // this represents the tile states / times pressed
    const tiles = [];
    const entities = [];
    const tileStates = [];
    for (let x = -1; x < size + 1; x++) {
      const entityRow = [];
      const tileStateRow = [];
      const tilesRow = [];
      for (let y = -1; y < size - x + 1; y++) {
        const z = this.#getMapHeight(x, y);
        if (z) {
          tilesRow.push(new Tile(createVector(x, y, z), this.proj));
        } else {
          tilesRow.push(null);
        }
        entityRow.push([]);
        tileStateRow.push(0);
      }
      tiles.push(tilesRow)
      entities.push(entityRow);
      tileStates.push(tileStateRow);
    }

    this.entities = entities;
    this.tileStates = tileStates;
    this.tiles = tiles;
    // this.tileMap = new IsometricMap(tiles, proj, spriteSheet);
  }

  #getMapHeight(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size - x) {
      return undefined;
    }

    return this.size - x - y;
  }

  #verifyPower(x, y) {
    if ((x < 0 || y < 0) && this.tileStates[x + 1][y + 1] == 1) {
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

  #updateScore(delta) {
    this.score += delta;
  }

  update() {
    if (this.gameState != GAME_STATE.PLAYING) {
      return;
    }


    this.spawnPowers();

    // Allow some grace time before starting to spawn enemies
    if (this.tick >= this.graceTime) {
      this.spawnEnemies();
    };

    /* 
     Lets iterate over the entity map and run events for all the entities found.
     Note that this is easier than keeping just an entity list since this way
     it's easier to check for collisions vs the O(n^2) alternative of checking
     for every pair of entities or more complex alternatives.
    */
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        // entitiy logic update needs map and game properties
        // so it's simpler to do it in the game class rather than 
        // saving the game in each entity, and exposing appropiate 
        // methods, etc. 
        if (entity instanceof Qbert) {
          this.#updateQbert(pos, entity);
        } else if (entity instanceof Snake) {
          this.#updateSnake(pos, entity);
        } else if (entity instanceof Enemy) {
          this.#updateEnemy(pos, entity);
        } else if (entity instanceof PowerDisk) {
          this.#updateDisk(pos, entity);
        }
      }
    });

    if (!this.deadQbert) {
      this.validate();
    }


    this.tick++;
  }

  validate() {
    this.deadQbert = false;
    this.#mapIter(this.entities, (_, tileEntities) => {
      // enemies can only kill qbert when both qbert and them 
      // are idel on the same tile
      let hasIdleQbert = false;
      let hasIdleEnemies = false;
      let qbertFalling = false;
      for (const entity of tileEntities) {
        if (entity instanceof Qbert) {
          qbertFalling = entity.state === STATE.FALLING;
        }

        hasIdleQbert = hasIdleQbert || (entity instanceof Qbert && entity.state === STATE.IDLE);
        hasIdleEnemies = hasIdleEnemies || ((entity instanceof Enemy) && entity.state == STATE.IDLE);
      }



      this.deadQbert = this.deadQbert || (hasIdleQbert && hasIdleEnemies) || qbertFalling;

    });


    if (this.deadQbert) {
      this.lives--;
      this.#updateScore(-50);
    }


    if (this.lives == 0) {
      this.gameState = GAME_STATE.GAME_OVER;
      return;
    }

    let victory = true;
    this.#mapIter(this.tileStates,
      (pos, tileState) => {
        victory = victory &&
          (this.#getMapHeight(pos.x, pos.y) === undefined || tileState == 1)
      }
    )

    if (victory) {
      this.gameState = GAME_STATE.VICTORY
    }

  }


  #powerAtPos(pos) {
    return this.entities[pos.x + 1][pos.y + 1].some((e) => e instanceof PowerDisk);
  }


  #qbertAtPos(pos) {
    return this.entities[pos.x + 1][pos.y + 1].some((e) => e instanceof Qbert);
  }

  #updateDisk(pos, disk) {
    disk.update();

    if (disk.state === DISK_STATE.DEAD) {
      this.#removeEntityMap(pos, disk);
      return;
    }

    if (disk.state === DISK_STATE.WITH_QBERT) {
      return;
    }

    if (this.#qbertAtPos(pos)) {
      disk.startWithQbert();
    }
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
          let newPos;
          if (qbert.wasOnDisk) {
            newPos = this.#moveEntityTo(pos, qbert, createVector(0, 0));
            qbert.wasOnDisk = false;

          } else {
            newPos = this.#moveEntityMap(pos, qbert, qbert.direction);

          }

          // check if it is falling 
          const newPosHeight = this.#getMapHeight(newPos.x, newPos.y);

          if (newPosHeight === undefined) {

            if (this.#powerAtPos(newPos)) {

              qbert.startOnDisk();
              this.#updateScore(20);
              return;
            }



            qbert.startFall();
            return;
          }


        }

        if (this.deadQbert) {
          qbert.startDying();
        }

        const mov = this.#getMovement();
        if (mov) {
          qbert.direction = mov;
          qbert.startJump();
        }
        return;
      case STATE.FALLING:
      case STATE.DYING:

        // almost instant respawn when killed, but let it fall if 
        // the player jumped outside of the map
        const respawnTime = qbert.state === STATE.FALLING ? 30 : 10;
        // wait some time before respawn
        if (qbert.frameCount > respawnTime) {
          this.#removeEntityMap(pos, qbert);
          // add again at first empty tile 
          let added = false;
          this.#mapIter(this.entities, (pos, entities) => {
            if (this.#getMapHeight(pos.x, pos.y) === undefined) {
              return;
            }

            if (!added && entities.length == 0) {
              entities.push(qbert);
              added = true;
            }
          })

          qbert.startIdle();

          this.deadQbert = false;
        }
        return

      case STATE.ON_DISK:

        return;

    }
  }

  #updateSnake(pos, snake) {
    snake.update();

    switch (snake.state) {
      case STATE.JUMPING:
        return;
      case STATE.FALLING:
        if (snake.frameCount > 10) {
          // snake died
          this.#removeEntityMap(pos, snake);
          // extra points for dodging it
          this.#updateScore(20);

        }
        return;
      case STATE.IDLE:
        // just finished jumping
        if (snake.frameCount === 0) {
          // move the entity to the next frame
          const newPos = this.#moveEntityMap(pos, snake, snake.direction);

          if (!this.#getMapHeight(newPos.x, newPos.y)) {
            snake.startFall();
            return;
          }
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

        // some idle time - can only kill when idle
        if (snake.frameCount > 3) {
          snake.startJump();
        }


        return;
    }
  }

  #updateEnemy(pos, enemy) {
    enemy.update();

    switch (enemy.state) {
      case STATE.JUMPING:
        return;
      case STATE.FALLING:
        if (enemy.frameCount > 10) {
          // ball died
          this.#removeEntityMap(pos, enemy);
          // extra score for dodging
          this.#updateScore(10);
        }
        return;
      case STATE.IDLE:
        // just finished jumping
        if (enemy.frameCount === 0) {
          // move the entity to the next tile
          const newPos = this.#moveEntityMap(pos, enemy, enemy.direction);

          if (!this.#getMapHeight(newPos.x, newPos.y)) {
            enemy.startFall();
            return;
          }
        }

        if (random() < 0.5 || pos.x == this.size - 1) {
          enemy.direction = DIRECTION.POS_Y;
        } else {
          enemy.direction = DIRECTION.POS_X;
        }


        if (enemy.frameCount > 3) {
          enemy.startJump();
        }

        return;
    }
  }

  #removeEntityMap(pos, entity) {
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
  }

  #addEntityMap(pos, entity) {
    const tileEntities = this.entities[pos.x + 1][pos.y + 1];
    tileEntities.push(entity);
  }

  #visitTile(pos) {
    this.tiles[pos.x + 1][pos.y + 1].visit();
    this.tileStates[pos.x + 1][pos.y + 1] = 1;
    this.#updateScore(25);
  }

  #moveEntityMap(pos, entity, direction) {
    this.#removeEntityMap(pos, entity);

    // add to new position

    const delta = dirToVec(direction);
    let newPos = pos.copy().add(delta);

    if (entity instanceof Qbert) {
      if (this.#getMapHeight(newPos.x, newPos.y)) {
        this.#visitTile(newPos)
      }
    }
    this.entities[newPos.x + 1][newPos.y + 1].push(entity);

    return newPos;
  }

  #moveEntityTo(oldPos, entity, newPos) {
    this.#removeEntityMap(oldPos, entity);

    if (entity instanceof Qbert) {
      if (this.#getMapHeight(newPos.x, newPos.y)) {
        this.#visitTile(newPos)
      }
    }
    this.entities[newPos.x + 1][newPos.y + 1].push(entity);

    return newPos;

  }


  spawnPowers() {
    if (random() < 0.01) {
      // check count of powers on the map (max 2)
      let powerCount = 0;
      let existingPowerPos = undefined;
      this.#mapIter(this.entities, (pos, entities) => {
        if (entities.some(e => e instanceof PowerDisk)) {
          powerCount++;
          existingPowerPos = pos;
        }
      })

      if (powerCount >= 2) {
        return;
      }

      // one of the power coordinates (x or y) should be -1 
      // so it is in the empty outer edge, the other one 
      // should be random such that it is accesible from one of 
      // the map sides
      let sidePos = round(random(0, this.size - 1));

      let newPos = random() < 0.5 ? createVector(-1, sidePos) : createVector(sidePos, -1);

      // spawn power to the contrary side of the existing 
      if (existingPowerPos) {
        // if the mult is pos they are in the same side
        if (newPos.x * existingPowerPos.x > 0 || newPos.y * existingPowerPos.y > 0) {
          newPos = createVector(newPos.y, newPos.x);
        }
      }



      this.#addEntityMap(newPos, new PowerDisk(this.spriteSheet))


    }
  }

  spawnEnemies() {
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
      if (!nextHeight) {
        nextHeight = currentHeight;
      }
      let jump = nextHeight - currentHeight;


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

      const offDir = dirVec.copy().mult(factOffDir);
      currPos = mapPos.copy().add([0, 0, offHeight]).add(offDir);

    } else if (qbert.state === STATE.IDLE || qbert.state == STATE.DYING) {
      currPos = mapPos
    } else if (qbert.state === STATE.FALLING) {

      const previousPos = mapPos.copy().add(dirToVec(invDir(qbert.direction)))

      const previousHeight = this.#getMapHeight(previousPos.x, previousPos.y); // this should not be undefined

      // falling 
      const t = qbert.frameCount;
      const height = previousHeight - this.gravity * t * t;

      currPos = createVector(mapPos.x, mapPos.y, height);

    } else if (qbert.state === STATE.ON_DISK) {
      // similar to jump but going on the disk to over the initial tile



      let closestTilePos;
      if (mapPos.x < 0) {
        closestTilePos = mapPos.copy().add([1, 0, 0])
      } else {
        closestTilePos = mapPos.copy().add([0, 1, 0])
      }

      const currentHeight = this.#getMapHeight(closestTilePos.x, closestTilePos.y);
      mapPos.z = currentHeight;

      // skip first frame while disk state is also changed
      if (qbert.frameCount === 0) {
        currPos = mapPos;
      } else if (qbert.frameCount > 14) {


        const previousHeight = this.#getMapHeight(0, 0) + 1;
        const targetHeight = this.#getMapHeight(0, 0);

        // falling 
        const t = qbert.frameCount - 14;
        // const height = previousHeight - this.gravity * t * t;

        const height = easeIn(t, previousHeight, targetHeight, 5);


        currPos = createVector(0, 0, height);

      } else {
        let nextPos = createVector(0, 0);
        let nextHeight = this.#getMapHeight(0, 0) + 1;
        let jump = nextHeight - currentHeight;

        let dirVec = nextPos.copy().sub(mapPos);
        dirVec.z = 0;


        let startOff, endOff;
        let endTime;
        startOff = 0;
        endOff = jump;
        endTime = 13;


        const t = qbert.frameCount - 1;
        let offHeight;
        offHeight = easeOut(t, startOff, endOff, endTime);

        // linear movement in the jump direction
        let factOffDir = t / endTime;

        const offDir = dirVec.copy().mult(factOffDir);
        currPos = mapPos.copy().add([0, 0, offHeight]).add(offDir);

      }

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
      let nextHeight = this.#getMapHeight(nextPos.x, nextPos.y);
      if (!nextHeight) {
        nextHeight = currentHeight;
      }
      const jump = nextHeight - currentHeight;

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
    } else if (entity.state === STATE.FALLING) {

      const previousPos = mapPos.copy().add(dirToVec(invDir(entity.direction)))

      const previousHeight = this.#getMapHeight(previousPos.x, previousPos.y); // this should not be undefined

      // falling 
      const t = entity.frameCount;
      const height = previousHeight - this.gravity * t * t;

      currPos = createVector(mapPos.x, mapPos.y, height);
    } else {
      currPos = mapPos;
    }

    // entities are nicely rendered in an ismoetric map if the sprite center
    // is one unit above the tile they are in
    return currPos.copy().add([0, 0, 1]);

  }


  #diskProjPos(mapPos, disk) {

    let currPos;
    if (disk.state === DISK_STATE.IDLE) {
      // find closest height 
      let closestTilePos;
      if (mapPos.x < 0) {
        closestTilePos = mapPos.copy().add([1, 0, 0])
      } else {
        closestTilePos = mapPos.copy().add([0, 1, 0])
      }

      currPos = createVector(mapPos.x, mapPos.y, this.#getMapHeight(closestTilePos.x, closestTilePos.y));

    } else if (disk.state === DISK_STATE.WITH_QBERT) {
      // similar to jump but going on the disk to over the initial tile

      let closestTilePos;
      if (mapPos.x < 0) {
        closestTilePos = mapPos.copy().add([1, 0, 0])
      } else {
        closestTilePos = mapPos.copy().add([0, 1, 0])
      }

      const currentHeight = this.#getMapHeight(closestTilePos.x, closestTilePos.y);
      mapPos.z = currentHeight;
      let nextPos = createVector(0, 0);
      let nextHeight = this.#getMapHeight(0, 0) + 1;
      let jump = nextHeight - currentHeight;

      let dirVec = nextPos.copy().sub(mapPos);
      dirVec.z = 0;


      let startOff, endOff;
      let endTime;
      startOff = 0;
      endOff = jump;
      endTime = 13;

      let t = disk.frameCount;
      if (t > 13) t = 13;
      let offHeight;
      offHeight = easeOut(t, startOff, endOff, endTime);
      // linear movement in the jump direction
      let factOffDir = t / endTime;

      const offDir = dirVec.copy().mult(factOffDir);
      currPos = mapPos.copy().add([0, 0, offHeight]).add(offDir);

    }

    // so we render the power on aligned with the tile tops
    currPos.add([-0.2, -0.2, 0.45]);

    return currPos;
  }

  #drawGUI(cnv) {
    cnv.push();
    SpriteText.drawText(cnv, "lives", TYPEFACE.ORANGE_BOLD, 10, 9);
    for (let i = 0; i < this.lives; i++) {
      cnv.image(QbertGame.sprites.LIFE, 10 + 16 * i, 22, 8, 16);
    }


    SpriteText.drawText(cnv, "score", TYPEFACE.ORANGE_BOLD, 255 - 48, 9);
    SpriteText.drawText(cnv, `${this.score}`, TYPEFACE.GREEN_MEDIUM, 255 - 48, 18);


    cnv.pop();
  }

  draw(cnv) {
    // this.tileMap.draw(cnv);

    const entities = [];

    // remove nulls and map them with their respective position
    entities.push(...this.tiles.flat().filter(t => t).map(t => [t.getPosition(), t]));


    // console.log(this.entities);
    this.#mapIter(this.entities, (pos, tileEntities) => {
      for (const entity of tileEntities) {
        if (entity instanceof Qbert) {
          entities.push([this.#qbertProjPos(pos, entity), entity])
        } else if (entity instanceof PowerDisk) {
          entities.push([this.#diskProjPos(pos, entity), entity])
        } else {
          entities.push([this.#entityProjPos(pos, entity), entity])
        }
      }
    });


    this.isoRender.draw(cnv, entities);

    this.#drawGUI(cnv);

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
let buffer;
let screenSize;
let scale;
let scaledScreenSize;
let anyKeyPress = false;
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

  SpriteText.init(ss);

  proj = new IsometricProjection(
    screenCenter.copy().add(0, 50),
    angle,
    tileSize
  );
  game = new QbertGame(proj, ss);

  background(255);
}

function drawGameOver(cnv) {
  // restart game on key press after gameover
  if (anyKeyPress) {
    anyKeyPress = false;

    // it is easier to create a new game rather than reset all properties
    game = new QbertGame(proj, ss);
  }

  cnv.push();
  const w = round(screenSize.x * 0.5);
  const h = round(screenSize.y * 0.5);
  cnv.rectMode(CENTER);
  cnv.fill(color(0, 0, 0, 200));
  cnv.rect(round(screenSize.x / 2), round(screenSize.y / 2), w, h);
  // cnv.textAlign(CENTER, CENTER);
  // cnv.textSize(50);
  // cnv.text("GAME\nOVER", round(screenSize.x / 2), round(screenSize.y / 2) - 20);

  let scale = 3
  SpriteText.drawText(
    cnv,
    "GAME\nOVER",
    TYPEFACE.ORANGE_BOLD,
    round(screenSize.x / 2 - 1.5 * scale * 8),
    round(screenSize.y / 2 - 1.5 * scale * 8),
    scale,
  )

  scale = 2;
  const scoreText = `${game.score}`;
  SpriteText.drawText(
    cnv,
    scoreText,
    TYPEFACE.GREEN_MEDIUM,
    round(screenSize.x / 2 - (scoreText.length/2 -0.5) * scale * 8),
    round(screenSize.y / 2 + 1 * scale * 8),
    scale,
  )

  scale = 1;
  SpriteText.drawText(
    cnv,
    "press any key\n to restart",
    TYPEFACE.PURPLE_LIGHT,
    round(screenSize.x / 2 - (6) * scale * 8),
    round(screenSize.y / 2 + 4.5 * scale * 8),
    scale,
  )
  // cnv.textSize(20);
  // cnv.text("press any key\nto restart", round(screenSize.x / 2), round(screenSize.y / 2) + 60);
  cnv.pop();

}

function drawVictory(cnv) {
  // restart game on key press after gameover
  if (anyKeyPress) {
    anyKeyPress = false;

    // it is easier to create a new game rather than reset all properties
    game = new QbertGame(proj, ss);
  }

  cnv.push();
  const w = round(screenSize.x * 0.5);
  const h = round(screenSize.y * 0.5);
  cnv.rectMode(CENTER);
  cnv.fill(color(0, 0, 0, 200));
  cnv.rect(round(screenSize.x / 2), round(screenSize.y / 2), w, h);

  let scale = 3
  SpriteText.drawText(
    cnv,
    "YOU\nWIN",
    TYPEFACE.ORANGE_BOLD,
    round(screenSize.x / 2 - 1 * scale * 8),
    round(screenSize.y / 2 - 1.5 * scale * 8),
    scale,
  )

  scale = 2;
  const scoreText = `${game.score}`;
  SpriteText.drawText(
    cnv,
    scoreText,
    TYPEFACE.GREEN_MEDIUM,
    round(screenSize.x / 2 - (scoreText.length/2 -0.5) * scale * 8),
    round(screenSize.y / 2 + 1 * scale * 8),
    scale,
  )

  scale = 1;
  SpriteText.drawText(
    cnv,
    "press any key\n to restart",
    TYPEFACE.PURPLE_LIGHT,
    round(screenSize.x / 2 - (6) * scale * 8),
    round(screenSize.y / 2 + 4.5 * scale * 8),
    scale,
  )
  cnv.pop();

}

function draw() {

  buffer.background(1);
  switch (game.gameState) {
    case GAME_STATE.PLAYING:
      game.update();
      game.draw(buffer);
      break;
    case GAME_STATE.GAME_OVER:
      game.draw(buffer);
      drawGameOver(buffer);
      break
    case GAME_STATE.VICTORY:
      game.draw(buffer);
      drawVictory(buffer);
      break;
  }

  image(buffer, 0, 0, scaledScreenSize.x, scaledScreenSize.y);
}

let timer = Date.now();
function keyPressed() {
  if (Date.now() - timer < 500) {
    return;
  }
  timer = Date.now();

  if (game.gameState !== GAME_STATE.PLAYING) {
    anyKeyPress = true;
    return
  }

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
