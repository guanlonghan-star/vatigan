export async function loadGuide(url = './data/guide.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`guide load failed: ${response.status}`);
  return response.json();
}

export function resolveNode(guide, id) {
  return guide.nodes.find((node) => node.id === id) || guide.nodes[0];
}

export function nodeFromHash(hash, guide) {
  const match = /^#node\/(V\d{2})$/.exec(hash || '');
  return resolveNode(guide, match?.[1]).id;
}

export function neighbours(guide, id) {
  const index = guide.nodes.findIndex((node) => node.id === id);
  const safeIndex = index < 0 ? 0 : index;
  return {
    previous: guide.nodes[safeIndex - 1]?.id || null,
    next: guide.nodes[safeIndex + 1]?.id || null,
  };
}

export function activeView(hash) {
  if ((hash || '').startsWith('#map')) return 'map';
  if ((hash || '').startsWith('#node/')) return 'node';
  return 'route';
}

const VISUAL_NODES = new Set(['V02','V03','V04','V05','V06','V07','V10','V12','V13','V14','V16','V17','V20']);

export function imagePathFor(nodeId) {
  if (!VISUAL_NODES.has(nodeId)) return null;
  return `./assets/images/${nodeId}.${nodeId === 'V16' ? 'svg' : 'webp'}`;
}

export function currentNodeHref(hash, guide) {
  const current = activeView(hash) === 'map' ? mapNodeFromHash(hash, guide) : nodeFromHash(hash, guide);
  return `#node/${current}`;
}

export function mapNodeFromHash(hash, guide) {
  const match = /^#map\/(V\d{2})$/.exec(hash || '');
  return resolveNode(guide, match?.[1]).id;
}

export function mapNodeHref(nodeId) {
  return `#map/${nodeId}`;
}
