class Tile {
  /**
   *
   * @param {Vector} pos the position of the tile corner towards (-inf,-inf,-inf)
   * @param {Projection} proj frame of reference used for 2D projection
   */
  constructor(pos, proj, spriteSheet) {
    this.pos = pos;
    this.proj = proj;
    this.visited = false;
    // if (pos.x == 0 && pos.y == 0) {
    //   this.visited = true;
    // }
  }
  static sprites = {}

  static loadSprites(spriteSheet) {

    let offsetY = 32 * 5;

    let columnChoice = round(random(0,7))

    let offsetX = (32 * 2.5) * (columnChoice);

    // initial 

    let initialChoice = round(random(0,2)) 

    spriteSheet.addSpec("tile_initial", offsetX, offsetY + initialChoice * 32, 32,32);
    Tile.sprites["initial"] = spriteSheet.getSprite("tile_initial");


    // visited

    let visitedChoice = round(random(0,2));
    while (visitedChoice == initialChoice) {
      visitedChoice = round(random(0,2));
    }

    spriteSheet.addSpec("tile_visited", offsetX, offsetY + visitedChoice * 32, 32,32);
    Tile.sprites["visited"] = spriteSheet.getSprite("tile_visited");

  }

  draw(cnv) {
    // NOTE: We tried drawing the cubes using the projection
    // however they do not look very good due to the aliasing
    // so we will use sprites instead
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
    const projPos = this.proj.projectTo2D(pos);

    cnv.image(this.visited ? Tile.sprites["visited"] : Tile.sprites["initial"], projPos.x, projPos.y)


    // cnv.noStroke();

    // // top face
    // cnv.fill(this.visited ? "red" : "green");
    // const topCorners = [
    //   pos.copy().add([0, 0, 1]), // ·
    //   pos.copy().add([1, 0, 1]), // ·, ↘
    //   pos.copy().add([1, 1, 1]), // ·, ↘, ↙
    //   pos.copy().add([0, 1, 1]), // ·, ↙
    // ];
    // vecQuad(...topCorners.map((v) => this.proj.projectTo2D(v)));

    // // Y face
    // cnv.fill("purple");
    // const yCorners = [
    //   pos.copy().add([0, 1, 0]),
    //   pos.copy().add([1, 1, 0]),
    //   pos.copy().add([1, 1, 1]),
    //   pos.copy().add([0, 1, 1]),
    // ];
    // vecQuad(...yCorners.map((v) => this.proj.projectTo2D(v)));

    // // X face
    // cnv.fill("blue");
    // const xCorners = [
    //   pos.copy().add([1, 0, 0]),
    //   pos.copy().add([1, 1, 0]),
    //   pos.copy().add([1, 1, 1]),
    //   pos.copy().add([1, 0, 1]),
    // ];
    // vecQuad(...xCorners.map((v) => this.proj.projectTo2D(v)));
  }

  getPosition() {
    return this.pos.copy();
  }

  visit() {
    this.visited = true;
  }
}

