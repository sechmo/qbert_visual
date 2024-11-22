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
    const x = this.xUnit.copy().mult(vec.x);
    const y = this.yUnit.copy().mult(vec.y);
    const z = this.zUnit.copy().mult(vec.z);
    return this.zero.copy().add(x).add(y).add(z);
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