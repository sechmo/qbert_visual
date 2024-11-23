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
    }


    // each face it's drawn starting
    // from its uppermost corner (in the projection)

    // notice you can reuse each to draw back faces (if needed)
    const pos = this.pos;
    cnv.noStroke();

    // top face
    cnv.fill("green");
    const topCorners = [
      pos.copy().add([0, 0, 1]), // ·
      pos.copy().add([1, 0, 1]), // ·, ↘
      pos.copy().add([1, 1, 1]), // ·, ↘, ↙
      pos.copy().add([0, 1, 1]), // ·, ↙
    ]
    vecQuad(...topCorners.map(v => this.proj.projectTo2D(v)));

    // Y face
    cnv.fill("red");
    const yCorners = [
      pos.copy().add([0, 1, 0]),
      pos.copy().add([1, 1, 0]),
      pos.copy().add([1, 1, 1]),
      pos.copy().add([0, 1, 1]),
    ]
    vecQuad(...yCorners.map(v => this.proj.projectTo2D(v)));

    // X face
    cnv.fill("blue");
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

  draw(cnv) {
    for (const tile of this.tiles) {
      tile.draw(cnv);
    }
  }
}
