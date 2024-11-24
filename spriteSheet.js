class SpriteSheet {
  constructor(baseImage) {
    this.baseImage = baseImage;
    this.spec = {};
  }

  addSpec(name, x, y, w, h) {
    this.spec[name] = {
      x, y, w, h
    }
  }

  getSprite(name) {
    if (!Object.hasOwn(this.spec, name)) {
      throw `no sprite registered with name "${name}"`
    }

    const spec = this.spec[name];

    // lazy load sprite
    if (!Object.hasOwn(spec, "sprite")) {
      spec.sprite = this.baseImage.get(spec.x, spec.y, spec.w, spec.h);
    }

    return spec.sprite;
  }
}
