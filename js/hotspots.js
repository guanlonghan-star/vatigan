export class HotspotSequence {
  constructor(items = []) { this.items = items; this.index = 0; }
  get active() { return this.items[this.index] || null; }
  next() { this.index = Math.min(this.items.length - 1, this.index + 1); return this.active; }
  previous() { this.index = Math.max(0, this.index - 1); return this.active; }
}

export function mountHotspotDialog(dialog, node, items, imagePath) {
  const sequence = new HotspotSequence(items);
  dialog.innerHTML = `<div class="hotspot-panel"><header><div><p class="eyebrow">细节指引</p><h2>${node.title}</h2></div><button class="close-hotspots" aria-label="关闭">×</button></header><div class="zoom-stage"><img src="${imagePath}" alt="${node.title}"><button class="hotspot-dot" aria-label="当前细节"></button><div class="hotspot-image-fallback" hidden>图片未载入，请按下方文字顺序观察。</div></div><section class="hotspot-caption"><strong></strong><p></p><span></span></section><nav><button class="hotspot-prev">上一个</button><button class="hotspot-next">下一个</button></nav></div>`;
  const image = dialog.querySelector('img');
  const dot = dialog.querySelector('.hotspot-dot');
  const render = () => {
    const active = sequence.active;
    dot.style.left = `${active.x * 100}%`; dot.style.top = `${active.y * 100}%`;
    dialog.querySelector('.hotspot-caption strong').textContent = active.label;
    dialog.querySelector('.hotspot-caption p').textContent = active.note;
    dialog.querySelector('.hotspot-caption span').textContent = `${sequence.index + 1} / ${sequence.items.length}`;
    dialog.querySelector('.hotspot-prev').disabled = sequence.index === 0;
    dialog.querySelector('.hotspot-next').disabled = sequence.index === sequence.items.length - 1;
  };
  image.addEventListener('error', () => { image.hidden = true; dot.hidden = true; dialog.querySelector('.hotspot-image-fallback').hidden = false; });
  dialog.querySelector('.hotspot-prev').onclick = () => { sequence.previous(); render(); };
  dialog.querySelector('.hotspot-next').onclick = () => { sequence.next(); render(); };
  dialog.querySelector('.close-hotspots').onclick = () => dialog.close();
  render(); dialog.showModal();
}
