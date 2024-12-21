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
    spriteSheet.addSpec("enemy_down", 0, 16, 16, 16);
    spriteSheet.addSpec("enemy_up", 16, 16, 16, 16);

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
    }

    cnv.image(sprite, pos.x, pos.y);
  }

  startJump() {
    this.state = STATE.JUMPING;
    this.frameCount = 0;
  }
}

class Snake extends Enemy {
  constructor(spriteSheet) {
    super(spriteSheet);
  }

  update() {
    switch (this.state) {
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
    }

    cnv.image(sprite, pos.x, pos.y);
  }
}
