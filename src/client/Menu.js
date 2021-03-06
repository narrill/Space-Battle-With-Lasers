class Menu {
  constructor(elements) {
    this.elements = elements;
    this.cursor = 0;
  }

  draw(ctx, x, y, font, active, color = 'white') {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = color;
    const height = ctx.measureText("M").width;
    const lineHeight = height * 1.5;
    y += (this.elements.length * lineHeight) / 2;
    for (let i = this.elements.length - 1; i >= 0; --i) {
      if(active && this.cursor === i) {
        ctx.save();
        const width = ctx.measureText(this.elements[i].text).width;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'blue';
        ctx.fillRect(x - width/2, y - height, width, height);
        ctx.restore();
      }
      ctx.fillText(this.elements[i].text, x, y);
      y -= lineHeight;
    }
    ctx.restore();
  }

  forward() {
    this.cursor = (this.cursor + 1) % this.elements.length;
  }

  backward() {
    this.cursor = (this.cursor - 1) % this.elements.length;
  }

  select() {
    return this.elements[this.cursor].func(this.elements[this.cursor]);
  }

  key(e) {
    if(e.key === 'Enter')
      return this.select();
    else if(e.key === 'ArrowUp')
      this.backward();
    else if(e.key === 'ArrowDown')
      this.forward();
  }
}

module.exports = Menu;