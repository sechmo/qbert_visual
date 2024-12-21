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

const TYPEFACE = Object.freeze({
  PURPLE_LIGHT: 6,
  GREEN_MEDIUM: 0,
  ORANGE_BOLD: 2,
})

class SpriteText {
  static spriteSheet = null;
  static sprites = {};

  static init(spriteSheet) {
    SpriteText.spriteSheet = spriteSheet;
    SpriteText.#loadSprites();
  }

  static #loadSprites() {
    for (const [typefaceName, typefaceOffset] of Object.entries(TYPEFACE)) {
      this.sprites[typefaceOffset] = {};
      const offsetX = 8 * 16;
      const offsetY = 8 * (typefaceOffset + 1);
      const offsetNumbersX = 8 * 26;
      const offsetNumbersY = 8 * typefaceOffset;
      const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];


      for (let i = 0; i < numbers.length; i++) {
        const name = `${typefaceName}_${numbers[i]}`;
        SpriteText.spriteSheet.addSpec(name, offsetNumbersX + i * 8, offsetNumbersY, 8, 8);
        SpriteText.sprites[typefaceOffset][numbers[i]] = SpriteText.spriteSheet.getSprite(name);
      }

      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V","W","X","Y","Z"]

      for (let j = 0; j < letters.length; j++) {
        const name = `${typefaceName}_${letters[j]}`;
        SpriteText.spriteSheet.addSpec(name, offsetX + j * 8, offsetY, 8, 8);
        SpriteText.sprites[typefaceOffset][letters[j]] = SpriteText.spriteSheet.getSprite(name);
      }

      if (typefaceOffset === TYPEFACE.GREEN_MEDIUM || typefaceOffset === TYPEFACE.ORANGE_BOLD) {
        // these has signs too
        const offsetSignsX = 8 * 30;
        const offsetSignsY = 8 * (typefaceOffset === TYPEFACE.GREEN_MEDIUM ? 4 : 5);
        const signs = [",",".","!","?","©","=","-","\"","/"]

        for (let j = 0; j < signs.length; j++) {
          const name = `${typefaceName}_${signs[j]}`;
          SpriteText.spriteSheet.addSpec(name, offsetSignsX + j * 8, offsetSignsY, 8, 8);
          SpriteText.sprites[typefaceOffset][signs[j]] = SpriteText.spriteSheet.getSprite(name);
        }
      }

    }


  }

  static drawText(cnv, text, typeface, x, y, scale) {
    scale = scale || 1;
    cnv.noSmooth();
    let line = 0;
    let horizontal = 0
    for (let i = 0; i < text.length; i++) {
      const sprite = SpriteText.sprites[typeface][text.charAt(i).toUpperCase()];

      if (text.charAt(i) === "\n") {
        line++;
        horizontal = 0
        continue;
      }



      if (sprite) {
        cnv.image(sprite, x + horizontal, y + 8 * scale * line, 8 * scale, 8 * scale);
      }


      horizontal += 8 * scale;

    }
  }

}