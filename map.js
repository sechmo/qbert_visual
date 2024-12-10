function drawLine(cnv, p1, p2) {
  const eps = 0.0001;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (abs(dx) < eps && abs(dy) < eps) {
    // only draw single point
    cnv.rect(p1.x,p1.y,1,1);
    return;
  }

  if (abs(dx) < eps) {
    // vertical
    const invM = dx/dy;
    const yStep = dy > 0 ? 1 : -1;
    const yCmp = dy > 0 ? (a,b) => a <= b : (a,b) => a >= b;

    for (const p = p1.copy(); yCmp(p.y,p2.y); p.add([invM * yStep,yStep])) {
      cnv.rect(round(p.x),round(p.y),1,1);
    }

    return;

  }

  // admisible slope
  const m = dy/dx;
  const xStep = dx > 0 ? 1 : -1;
  const xCmp = dx > 0 ? (a,b) => a <= b : (a,b) => a >= b;


  for (const p = p1.copy(); xCmp(p.x,p2.x); p.add([xStep,m * xStep])) {
    cnv.rect(round(p.x),round(p.y),1,1);
  }
}

// Pixel-perfect quad drawing function using p5.Vector
function drawPixelQuad(cnv, v1, v2, v3, v4) {
  // Create array of points for sorting
  const points = [v1, v2, v3, v4];
  
  // Sort points by Y coordinate
  const sortedPoints = points.sort((a, b) => a.y - b.y || a.x - b.x);
  
  // Get top, middle points, and bottom point
  const [top, middleTop, middleBottom, bottom] = sortedPoints;
  
  // Draw the quad by scanning horizontal lines
  for (let y = Math.round(top.y); y <= Math.round(bottom.y); y++) {
    let leftX, rightX;

    console.log(y);
    
    if (y <= middleTop.y) {
      // Top section
      const topLeftRatio = (y - top.y) / (middleTop.y - top.y);
      const leftPoint = p5.Vector.lerp(top, middleTop, topLeftRatio);
      leftX = leftPoint.x;
      
      const topRightRatio = (y - top.y) / (middleBottom.y - top.y);
      const rightPoint = p5.Vector.lerp(top, middleBottom, topRightRatio);
      rightX = rightPoint.x;
    } else {
      // Bottom section
      const bottomLeftRatio = (y - middleTop.y) / (bottom.y - middleTop.y);
      const leftPoint = p5.Vector.lerp(middleTop, bottom, bottomLeftRatio);
      leftX = leftPoint.x;
      
      const bottomRightRatio = (y - middleBottom.y) / (bottom.y - middleBottom.y);
      const rightPoint = p5.Vector.lerp(middleBottom, bottom, bottomRightRatio);
      rightX = rightPoint.x;
    }
    
    // Draw horizontal line pixel by pixel
    drawHorizontalLine(cnv, Math.round(leftX), Math.round(rightX), y);
  }
}

// Helper function to draw a horizontal line pixel by pixel
function drawHorizontalLine(cnv, x1, x2, y) {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);

  console.log(startX, endX);
  for (let x = startX; x <= endX; x++) {
    // cnv.point(x, y);
    cnv.rect(x,y,1,1);
  }
}

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
      // cnv.quad(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, v4.x, v4.y);
      // console.log(v2.toString(), v3.toString());

      // drawPixelQuad(cnv, v1,v2,v3,v4);

      // drawLine(cnv, v3,v1);
      // drawLine(cnv, v2,v4);
      drawLine(cnv, v1,v2);
      drawLine(cnv, v2,v3);
      drawLine(cnv, v3,v4);
      drawLine(cnv, v4,v1);
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
    cnv.fill("purple");
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
