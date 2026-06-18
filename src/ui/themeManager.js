export const THEMES = ['classic', 'wave', 'fire', 'rainbow'];

export class ThemeManager {
  constructor(renderers) {
    this._renderers = renderers; // { classic, wave, fire }
    this._index = 0;
  }

  get name() { return THEMES[this._index]; }

  set(name) {
    const i = THEMES.indexOf(name);
    if (i !== -1) this._index = i;
  }

  next() {
    this._index = (this._index + 1) % THEMES.length;
    return this.name;
  }

  getRenderer() {
    return this._renderers[this.name];
  }
}
