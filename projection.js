class Projection {
  /**
   * 
   * @param {Vector} zero  2d projection of (0,0,0)
   * @param {Vector} xUnit 2d projection of (1,0,0) - zero
   * @param {Vector} yUnit 2d projection of (0,1,0) - zero
   * @param {Vector} zUnit 2d projection of (0,0,1) - zero
   */
  constructor(zero, xUnit, yUnit, zUnit) {
    this.zero = zero;
    this.xUnit = xUnit;
    this.yUnit = yUnit;
    this.zUnit = zUnit;
  }

  projectTo2D(vec) {
    // // console.log("----------------------")
    // // console.log("vec", vec.toString());
    const x = this.xUnit.copy().mult(vec.x);
    const y = this.yUnit.copy().mult(vec.y);
    const z = this.zUnit.copy().mult(vec.z);
    let res = this.zero.copy().add(x).add(y).add(z);
    // // console.log("res", res.toString());
    // return res;
    // don't allow fractional pixels
    res = createVector(round(res.x), round(res.y));
    // // console.log("resRound", res.toString());
    return res;
  }
}

class IsometricProjection extends Projection {
  constructor(zero, angle, unitLength) {
    ;
    // to achieve an isometric "3/4 view" of the tiles we will skew the plane
    // to do this we calculate the unit x and y vectors as rotated by the angle 
    // with respect to the screen horizon
    const xUnit = createVector(
      round(cos(angle) * unitLength),
      round(sin(angle) * unitLength),
    )

    const yUnit = createVector(
      -round(cos(angle) * unitLength),
      round(sin(angle) * unitLength),
    )

    const zUnit = createVector(0, -unitLength)
    super(zero, xUnit, yUnit, zUnit)
  }
}

class IsometricRender {
  /**
   * 
   * @param {IsometricProjection} proj 
   */
  constructor(proj) {
    this.proj = proj;
  }

  draw(cnv, elements) {

    const sortedElements = elements.toSorted(([pos1, e1], [pos2, e2]) => {
      /*
        for appropiate rendering of the tiles  by their euclidean distance to 
        the origin, this may not work in all cases but works with qbert
      */

      return (pos1.x + pos1.y + pos1.z) - (pos2.x + pos2.y + pos2.z);
    })

    sortedElements.forEach(([pos, e]) => {
      const renderPos = this.proj.projectTo2D(pos);
      e.draw(cnv,renderPos);
    });



  }
}