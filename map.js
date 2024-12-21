class Tile {
  /**
   *
   * @param {Vector} pos the position of the tile corner towards (-inf,-inf,-inf)
   * @param {Projection} proj frame of reference used for 2D projection
   */
  constructor(pos, proj) {
    this.pos = pos;
    this.proj = proj;
    this.visited = false;
    // if (pos.x == 0 && pos.y == 0) {
    //   this.visited = true;
    // }
  }

  draw(cnv) {
    const vecQuad = (v1, v2, v3, v4) => {
      // this has aliased borders either way :c
      cnv.quad(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, v4.x, v4.y);
      // cnv.beginShape()
      // cnv.vertex(v1.x,v1.y);
      // cnv.vertex(v2.x,v2.y);
      // cnv.vertex(v3.x,v3.y);
      // cnv.vertex(v4.x,v4.y);
      // cnv.endShape(CLOSE);
    };

    // each face it's drawn starting
    // from its uppermost corner (in the projection)

    // notice you can reuse each to draw back faces (if needed)
    const pos = this.pos;
    cnv.noStroke();

    // top face
    cnv.fill(this.visited ? "red" : "green");
    const topCorners = [
      pos.copy().add([0, 0, 1]), // ·
      pos.copy().add([1, 0, 1]), // ·, ↘
      pos.copy().add([1, 1, 1]), // ·, ↘, ↙
      pos.copy().add([0, 1, 1]), // ·, ↙
    ];
    vecQuad(...topCorners.map((v) => this.proj.projectTo2D(v)));

    // Y face
    cnv.fill("purple");
    const yCorners = [
      pos.copy().add([0, 1, 0]),
      pos.copy().add([1, 1, 0]),
      pos.copy().add([1, 1, 1]),
      pos.copy().add([0, 1, 1]),
    ];
    vecQuad(...yCorners.map((v) => this.proj.projectTo2D(v)));

    // X face
    cnv.fill("blue");
    const xCorners = [
      pos.copy().add([1, 0, 0]),
      pos.copy().add([1, 1, 0]),
      pos.copy().add([1, 1, 1]),
      pos.copy().add([1, 0, 1]),
    ];
    vecQuad(...xCorners.map((v) => this.proj.projectTo2D(v)));
  }
}

class PowerTile extends Tile {
  /**
   *
   * @param {Vector} pos the position of the tile corner towards (-inf,-inf,-inf)
   * @param {Projection} proj frame of reference used for 2D projection
   */
  constructor(pos, proj, sprite) {
    super(pos, proj);
    this.sprite = sprite;
  }

  draw(cnv) {
    const renderPos = this.proj.projectTo2D(this.pos.copy().add([0, 0, 1]));
    console.log("renPos", renderPos.toString());
    cnv.image(this.sprite, renderPos.x, renderPos.y);
  }
}

class IsometricMap {
  /**
   *
   * @param {Array<Vector>} tilePos
   * @param {IsometricProjection} proj
   */

  static sprites = {};

  constructor(tilePos, proj, spriteSheet) {
    IsometricMap.#loadSprites(spriteSheet);
    this.tiles = tilePos.map((p) => new Tile(p, proj));
    this.proj = proj;
    this.powerTiles = [];
    this.#sortTiles();
  }

  static #loadSprites(spriteSheet) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) {
        spriteSheet.addSpec(
          "power" + (j + i * 4),
          (j + i * 5) * 16,
          22 * 16,
          16,
          16
        );
      }
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) {
        IsometricMap.sprites[j + i * 4] = spriteSheet.getSprite(
          "power" + (j + i * 4)
        );
      }
    }
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
    });
  }

  updatePowers(pos, flag = true) {
    if (flag) {
      const spriteIndex = floor(random(32));
      console.log("AAAA", IsometricMap.sprites[spriteIndex]);
      this.powerTiles.push(
        new PowerTile(pos, this.proj, IsometricMap.sprites[spriteIndex])
      );
    } else {
      for (let i = 0; i < this.powerTiles.length; i++) {
        let position = this.powerTiles[i].pos;
        if (position.x == pos.x && position.y == pos.y) {
          this.powerTiles.splice(i, 1);
          break;
        }
      }
    }
  }

  visitTile(pos) {
    for (const tile of this.tiles) {
      const position = tile.pos;
      if (pos.x == position.x && pos.y == position.y) {
        tile.visited = true;
      }
    }
  }

  draw(cnv) {
    for (const tile of this.tiles) {
      tile.draw(cnv);
    }
    for (const powTile of this.powerTiles) {
      powTile.draw(cnv);
    }
  }
}
