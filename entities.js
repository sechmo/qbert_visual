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
  DYING: "DYING",
  ON_DISK: "ON_DISK"
});

class Qbert {
  static sprites = {};
  static spritesLoaded = false;
  constructor(spriteSheet) {
    Qbert.#loadSprites(spriteSheet);

    this.frameCount = 0;
    this.direction = DIRECTION.NEG_X;
    this.state = STATE.IDLE;
    this.wasOnDisk = false;
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
    spriteSheet.addSpec("qbert_text_bubble", 16*8,16*5, 16*3, 16*2);

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
    Qbert.bubbleSprite = spriteSheet.getSprite("qbert_text_bubble");
  }

  update() {
    switch (this.state) {
      case STATE.JUMPING:
        if (this.frameCount >= 13) {
          this.frameCount = 0;
          this.state = STATE.IDLE;
          return;
        }
        this.frameCount++;
        return;
      case STATE.ON_DISK:
        if (this.frameCount >= 14 + 5) {
          this.frameCount = 0;
          this.wasOnDisk = true;
          this.state = STATE.IDLE;
          return;
        }
        this.frameCount++;
        return;
      default:
        this.frameCount++;    
        return;
    }
  }

  draw(cnv, pos) {
    let sprite;
    let bubble = null;
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
      case STATE.ON_DISK:
        sprite = Qbert.sprites[this.direction][POSE.DOWN];
        break;
      case STATE.DYING:
        sprite = Qbert.sprites[this.direction][POSE.DOWN];
        bubble = Qbert.bubbleSprite;
        break;
    }

    // console.log("VOY", sprite);
    cnv.image(sprite, pos.x, pos.y);
    if (bubble) {
      cnv.image(bubble, pos.x, pos.y - 16);
    }

    // this.drawDebug(cnv, pos);
  }


  drawDebug(cnv, pos) {
    cnv.push();

    cnv.fill("white");
    cnv.textSize(8);
    cnv.text(this.state, pos.x,pos.y);

    cnv.pop();
  }

  startJump() {
    this.state = STATE.JUMPING;
    this.frameCount = 0;
  }

  startFall() {
    this.state = STATE.FALLING;
    this.frameCount = 0;
  }

  startDying() {
    this.state = STATE.DYING;
    this.frameCount = 0;
  }

  startIdle() {
    this.state = STATE.IDLE;
    this.frameCount = 0;
  }

  startOnDisk() {
    this.state = STATE.ON_DISK;
    this.frameCount = 0;
  }
}


class Enemy {
  static sprites = {};
  static spritesLoaded = false;
  constructor(spriteSheet) {
    Enemy.#loadSprites(spriteSheet);
    this.frameCount = 0;
    this.direction = DIRECTION.NEG_X;
    this.state = STATE.IDLE;
  }

  static #loadSprites(spriteSheet) {
    if (Enemy.spritesLoaded) {
      return;
    }
    spriteSheet.addSpec("enemy_up", 0, 16, 16, 16);
    spriteSheet.addSpec("enemy_down", 16, 16, 16, 16);

    spriteSheet.addSpec("snake_down_neg_y", 0, 48, 16, 16);
    spriteSheet.addSpec("snake_up_neg_y", 16, 32, 16, 32);
    spriteSheet.addSpec("snake_down_neg_x", 32, 48, 16, 16);
    spriteSheet.addSpec("snake_up_neg_x", 48, 32, 16, 32);
    spriteSheet.addSpec("snake_down_pos_x", 64, 48, 16, 16);
    spriteSheet.addSpec("snake_up_pos_x", 80, 32, 16, 32);
    spriteSheet.addSpec("snake_down_pos_y", 96, 48, 16, 16);
    spriteSheet.addSpec("snake_up_pos_y", 112, 32, 16, 32);

    Enemy.sprites = {
      [DIRECTION.NEG_X]: {
        [POSE.UP]: spriteSheet.getSprite("snake_up_neg_x"),
        [POSE.DOWN]: spriteSheet.getSprite("snake_down_neg_x"),
      },
      [DIRECTION.POS_X]: {
        [POSE.UP]: spriteSheet.getSprite("snake_up_pos_x"),
        [POSE.DOWN]: spriteSheet.getSprite("snake_down_pos_x"),
      },
      [DIRECTION.NEG_Y]: {
        [POSE.UP]: spriteSheet.getSprite("snake_up_neg_y"),
        [POSE.DOWN]: spriteSheet.getSprite("snake_down_neg_y"),
      },
      [DIRECTION.POS_Y]: {
        [POSE.UP]: spriteSheet.getSprite("snake_up_pos_y"),
        [POSE.DOWN]: spriteSheet.getSprite("snake_down_pos_y"),
      },
      [POSE.UP]: spriteSheet.getSprite("enemy_down"),
      [POSE.DOWN]: spriteSheet.getSprite("enemy_up"),
    };
  }

  update() {
    switch (this.state) {
      case STATE.FALLING:
      case STATE.IDLE:
        this.frameCount++;
        return;
      case STATE.JUMPING:
        if (this.frameCount >= 20) {
          this.frameCount = 0;
          this.state = STATE.IDLE;
          return;
        }
        this.frameCount++;
        return;
    }
  }

  draw(cnv, pos) {
    let sprite;
    switch (this.state) {
      case STATE.IDLE:
        sprite = Enemy.sprites[POSE.DOWN];
        break;
      case STATE.JUMPING:
        // first frame of jumpt just face towards the jump direction
        if (this.frameCount < 7) {
          sprite = Enemy.sprites[POSE.DOWN];
          break;
        }
        sprite = Enemy.sprites[POSE.UP];
        break;
      case STATE.FALLING:
        sprite = Enemy.sprites[POSE.UP];
        break;
    }

    cnv.image(sprite, pos.x, pos.y);
    // this.drawDebug(cnv, pos);
  }

  drawDebug(cnv, pos) {
    cnv.push();

    cnv.fill("white");
    cnv.textSize(8);
    cnv.text(this.state, pos.x,pos.y);

    cnv.pop();
  }

  startJump() {
    this.state = STATE.JUMPING;
    this.frameCount = 0;
  }

  startFall() {
    this.state = STATE.FALLING;
    this.frameCount = 0;
  }
}

class Snake extends Enemy {
  constructor(spriteSheet) {
    super(spriteSheet);
  }

  update() {
    switch (this.state) {
      case STATE.FALLING:
      case STATE.IDLE:
        this.frameCount++;
        return;
      case STATE.JUMPING:
        if (this.frameCount >= 20) {
          this.frameCount = 0;
          this.state = STATE.IDLE;
          return;
        }
        this.frameCount++;
        return;
    }
  }

  draw(cnv, pos) {
    let sprite;
    switch (this.state) {
      case STATE.IDLE:
        sprite = Enemy.sprites[this.direction][POSE.DOWN];
        break;
      case STATE.JUMPING:
        // first frame of jumpt just face towards the jump direction
        if (this.frameCount < 5) {
          sprite = Enemy.sprites[this.direction][POSE.DOWN];
          break;
        }
        sprite = Enemy.sprites[this.direction][POSE.UP];
        break;
      case STATE.FALLING:
        sprite = Enemy.sprites[this.direction][POSE.UP];
        break;
    }
    cnv.image(sprite, pos.x, pos.y);
    // this.drawDebug(cnv,pos);
  }
}

const DISK_STATE = Object.freeze({
  IDLE: "IDLE", 
  WITH_QBERT: "WITH_QBERT",
  DEAD: "DEAD",
})

class PowerDisk {
  static sprites = {}
  static spritesLoaded = false
  constructor(spriteSheet) {
    PowerDisk.#loadSprites(spriteSheet);
    this.palette = round(random(0,7));
    this.continuousframeCount = 0; // to keep disk rotation state
    this.frameCount = 0; // to keep animation frame
    this.state = DISK_STATE.IDLE;
  }

  static #loadSprites(spriteSheet) {
    if (this.spritesLoaded) {
      return;
    }

    for (let palette = 0; palette < 8; palette++) {
      for (let state = 0; state < 4; state++) {
        const name = `power_${palette}_${state}`;
        spriteSheet.addSpec(
          name,
          (state + palette * 5) * 16,
          22 * 16,
          16,
          16
        );
        if (!PowerDisk.sprites[palette]) {
          PowerDisk.sprites[palette] = {};
        }

        PowerDisk.sprites[palette][state] = spriteSheet.getSprite(name);
      }
    }

  }

  draw(cnv, pos) {
    if (this.state === DISK_STATE.DEAD) {
      // let qbert fall
      return;
    }

    // it rotates each 4 ticks
    const state = round(this.continuousframeCount / 4) % 4
    const sprite = PowerDisk.sprites[this.palette][state]


    cnv.image(sprite, pos.x, pos.y);


    // this.drawDebug(cnv, pos);

  }

  update() {
    this.continuousframeCount++;
    switch (this.state) {
      case DISK_STATE.IDLE: 
        this.frameCount++;
        return;
      case DISK_STATE.WITH_QBERT:
        if (this.frameCount >= 13) {
          this.frameCount = 0;
          this.state = DISK_STATE.DEAD;
        }
        this.frameCount++;
        return;
    }
  }

  startWithQbert() {
    this.state = DISK_STATE.WITH_QBERT;
    this.frameCount = 0;
  }



  drawDebug(cnv, pos) {
    cnv.push();

    cnv.fill("white");
    cnv.textSize(8);
    cnv.text(this.state + "" + this.frameCount, pos.x,pos.y);

    cnv.pop();
  }
}