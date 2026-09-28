import { activeView, currentNodeHref, imagePathFor, loadGuide, neighbours, nodeFromHash, resolveNode } from './content.js';
import { AudioController, mountPlayer } from './player.js';
import { routeHint } from './route-map.js';
import { mountHotspotDialog } from './hotspots.js';
import { SISTINE_PREP_CARDS, SistineController } from './sistine.js';
import { downloadOfflinePackage, registerServiceWorker } from './offline.js';

const app = document.querySelector('#app');
let guide;
let hotspots = {};
let selectedLayer = 'standard';
const player = new AudioController();
const sistine = new SistineController({player, navigate: (id) => { location.hash = `#node/${id}`; }});

function imageFor(node) {
  return node.image?.path || imagePathFor(node.id);
}

function renderRoute() {
  app.innerHTML = `<section class="hero"><p class="eyebrow">21 站 · 一条主线</p><h1>从古典身体，走到人的创造与终点</h1><p>按真实参观顺序整理。每一站只保留标准讲解和深入补充，进入西斯廷礼拜堂前请把手机收起。</p><div class="route-summary"><div><strong>21</strong><small>个停留点</small></div><div><strong>6</strong><small>个章节</small></div><div><strong>离线</strong><small>可完整使用</small></div></div><a class="start-button" href="#node/V01">从入口开始</a></section><section class="offline-card"><div><p class="eyebrow">出发前准备</p><h2>下载完整离线包</h2><p>建议在 Wi-Fi 下下载，完成后音频、图片和路线都可离线使用。</p></div><button id="offline-download" class="primary-button">开始下载</button><p id="offline-progress" aria-live="polite"></p><details><summary>iPhone 添加到主屏幕</summary><p>用 Safari 打开网址，点底部“共享”，再选“添加到主屏幕”。</p></details><p><a href="./credits.html">查看图片来源与授权</a></p></section>`;
  app.querySelector('#offline-download').onclick = startOfflineDownload;
  for (const [index, chapter] of guide.chapters.entries()) {
    const details = document.createElement('details');
    details.className = 'chapter';
    details.open = index === 0;
    details.innerHTML = `<summary><div><p class="eyebrow">${chapter.floor} · ${chapter.minutes}</p><h2>${chapter.name}</h2></div><span aria-hidden="true">＋</span></summary><ol class="chapter-list"></ol>`;
    const list = details.querySelector('ol');
    chapter.nodes.map((id) => resolveNode(guide, id)).forEach((node) => {
      const item = document.createElement('li');
      item.innerHTML = `<a class="route-card" href="#node/${node.id}"><span class="route-number">${node.id.slice(1)}</span><span><strong>${node.title}</strong><small>${node.area}</small></span><span aria-hidden="true">›</span></a>`;
      list.append(item);
    });
    app.append(details);
  }
}

async function startOfflineDownload() {
  const button = app.querySelector('#offline-download'); const progress = app.querySelector('#offline-progress');
  button.disabled = true; button.textContent = '正在下载…';
  try {
    await downloadOfflinePackage(({completedFiles, totalFiles, error}) => { progress.textContent = `${completedFiles} / ${totalFiles}${error ? ' · 有文件待重试' : ''}`; });
    button.textContent = '离线包已完成'; progress.textContent = '已可断网使用';
  } catch (error) { button.disabled = false; button.textContent = '继续下载'; progress.textContent = error.message; }
}

function renderNode(id) {
  const node = resolveNode(guide, id);
  const fragment = document.querySelector('#node-template').content.cloneNode(true);
  fragment.querySelector('.node-meta').textContent = `${node.id} · ${node.floor} · ${node.area}`;
  fragment.querySelector('h1').textContent = node.title;
  fragment.querySelector('.english-title').textContent = node.englishTitle;
  const image = fragment.querySelector('.artwork');
  const fallback = fragment.querySelector('.media-fallback');
  const imagePath = imageFor(node);
  if (imagePath) {
    image.src = imagePath;
    image.alt = `${node.title}导览图`;
    image.addEventListener('error', () => { image.remove(); fallback.hidden = false; });
  } else {
    fragment.querySelector('.artwork-wrap').remove();
  }
  const list = fragment.querySelector('.look-card ol');
  node.look.forEach((instruction) => { const li = document.createElement('li'); li.textContent = instruction; list.append(li); });
  const hint = document.createElement('p'); hint.className = 'route-hint'; hint.textContent = routeHint(guide.nodes, node.id); fragment.querySelector('.look-card').append(hint);
  if (hotspots[node.id]) {
    const detailsButton = document.createElement('button'); detailsButton.className = 'details-button'; detailsButton.textContent = '打开细节指引';
    detailsButton.onclick = () => mountHotspotDialog(document.querySelector('#hotspot-dialog'), node, hotspots[node.id], imageFor(node));
    fragment.querySelector('.look-card').append(detailsButton);
  }
  if (node.id === 'V15') {
    const prep = document.createElement('section'); prep.className = 'prep-grid';
    prep.innerHTML = SISTINE_PREP_CARDS.map((card) => `<a href="#node/${card.node}"><strong>${card.label}</strong><span>${card.cue}</span></a>`).join('');
    fragment.querySelector('.look-card').append(prep);
  }
  if (node.id === 'V20') {
    const enterButton = document.createElement('button'); enterButton.className = 'sistine-enter'; enterButton.textContent = '我准备进入礼拜堂';
    enterButton.onclick = () => sistine.enter(); fragment.querySelector('.look-card').append(enterButton);
  }
  fragment.querySelector('.transcript-body').textContent = node[selectedLayer];
  fragment.querySelectorAll('[data-layer]').forEach((button) => button.addEventListener('click', () => {
    selectedLayer = button.dataset.layer;
    renderNode(node.id);
  }));
  fragment.querySelector(`[data-layer="${selectedLayer}"]`).setAttribute('aria-selected', 'true');
  fragment.querySelector(`[data-layer="${selectedLayer === 'standard' ? 'deep' : 'standard'}"]`).setAttribute('aria-selected', 'false');
  const near = neighbours(guide, node.id);
  const previous = fragment.querySelector('.previous');
  const next = fragment.querySelector('.next');
  previous.href = near.previous ? `#node/${near.previous}` : '#';
  next.href = near.next ? `#node/${near.next}` : '#';
  if (!near.previous) previous.setAttribute('aria-disabled', 'true');
  if (!near.next) next.setAttribute('aria-disabled', 'true');
  app.replaceChildren(fragment);
  mountPlayer(app.querySelector('#player-slot'), player, node, selectedLayer);
}

function renderMap() {
  app.innerHTML = `<section class="map-card"><p class="eyebrow">不依赖室内定位</p><h1>六段参观路线</h1><p>跟随楼层、展厅名和地标前进；馆内临时封路时以现场工作人员指引为准。</p></section>`;
  const card = app.firstElementChild;
  guide.chapters.forEach((chapter) => {
    const band = document.createElement('section'); band.className = 'map-band';
    band.innerHTML = `<strong>${chapter.floor} · ${chapter.name}</strong><div class="map-track">${chapter.nodes.map((id) => `<a class="map-stop" href="#node/${id}">${id}<br>${resolveNode(guide,id).title.split('：')[0]}</a>`).join('')}</div>`;
    card.append(band);
  });
}

function render() {
  const view = activeView(location.hash);
  document.querySelector('[data-route="node"]').href = currentNodeHref(location.hash, guide);
  if (view !== 'node') player.pause();
  document.querySelectorAll('.bottom-nav a').forEach((link) => link.classList.toggle('active', link.dataset.route === view));
  if (view === 'node') renderNode(nodeFromHash(location.hash, guide));
  else if (view === 'map') renderMap();
  else renderRoute();
  app.focus({preventScroll: true});
  scrollTo({top: 0, behavior: 'instant'});
}

function setupSettings() {
  const dialog = document.querySelector('#settings-dialog');
  const root = document.documentElement;
  const savedFont = localStorage.getItem('display-font') || 'normal';
  const highContrast = localStorage.getItem('display-contrast') === 'true';
  root.dataset.font = savedFont; root.classList.toggle('high-contrast', highContrast);
  dialog.querySelector('#contrast-toggle').checked = highContrast;
  dialog.querySelectorAll('[data-font]').forEach((button) => {
    button.classList.toggle('active', button.dataset.font === savedFont);
    button.addEventListener('click', () => {
      localStorage.setItem('display-font', button.dataset.font);
      root.dataset.font = button.dataset.font;
      dialog.querySelectorAll('[data-font]').forEach((item) => item.classList.toggle('active', item === button));
    });
  });
  dialog.querySelector('#contrast-toggle').onchange = (event) => { localStorage.setItem('display-contrast', event.target.checked); root.classList.toggle('high-contrast', event.target.checked); };
  document.querySelector('#settings-button').onclick = () => dialog.showModal();
}

async function boot() {
  setupSettings();
  registerServiceWorker().catch(() => {});
  try { [guide, hotspots] = await Promise.all([loadGuide(), fetch('./data/hotspots.json').then((response) => response.json())]); window.addEventListener('hashchange', render); render(); }
  catch (error) { app.innerHTML = `<section class="error-card"><h1>导览暂时没有载入</h1><p>请检查网络或离线包后重试。</p><button class="primary-button" id="retry">重新载入</button></section>`; document.querySelector('#retry').onclick = () => location.reload(); }
}

boot();
