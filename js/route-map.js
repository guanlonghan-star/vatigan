export const MAP_ZONES = [
  {id: 'pinacoteca', floor: '1F', name: '入口与绘画馆', shortName: 'Pinacoteca', landmark: '入口附近支线', nodes: ['V01','V02','V03','V04']},
  {id: 'classical', floor: '1F', name: '古典雕塑区', shortName: 'Pio Clementino', landmark: '八角庭院与缪斯厅', nodes: ['V05','V06','V07','V08']},
  {id: 'galleries', floor: '2F', name: '长廊', shortName: 'Galleries', landmark: '烛台、挂毯与地图长廊', nodes: ['V09','V10']},
  {id: 'raphael', floor: '2F', name: '拉斐尔画室', shortName: 'Raphael Rooms', landmark: 'Stanza della Segnatura', nodes: ['V11','V12','V13','V14']},
  {id: 'sistine', floor: '2F→1F', name: '西斯廷准备与礼拜堂', shortName: 'Sistine', landmark: '进入前完成讲解并收起手机', nodes: ['V15','V16','V17','V18','V19','V20']},
  {id: 'exit', floor: '1F', name: '出口与尾声', shortName: 'Post-Sistine', landmark: '走出礼拜堂后重新打开导览', nodes: ['V21']},
];

const CROSS_ZONE_DIRECTIONS = {
  'V04>V05': '返回入口主区域，按 Museo Pio Clementino 指示前往古典雕塑区。',
  'V08>V09': '通过 Gallery of the Candelabra 后进入二层长廊，再前往挂毯陈列馆。',
  'V10>V11': '沿地图长廊继续，按 Stanze di Raffaello 指示进入拉斐尔画室。',
  'V14>V15': '离开拉斐尔画室后继续跟随 Sistine Chapel 指示，先在入口前完成准备讲解。',
  'V20>V21': '走出西斯廷礼拜堂后再打开手机，进入尾声。',
};

export function routeInstruction(nodes, currentId) {
  const index = Math.max(0, nodes.findIndex((node) => node.id === currentId));
  return {current: nodes[index], next: nodes[index + 1] || null};
}

export function routeHint(nodes, currentId) {
  const {current, next} = routeInstruction(nodes, currentId);
  if (!next) return `当前区域：${current.area}。这是最后一站。`;
  return `当前区域：${current.area}。下一站：${next.area}。`;
}

export function zoneForNode(nodeId) {
  return MAP_ZONES.find((zone) => zone.nodes.includes(nodeId)) || MAP_ZONES[0];
}

export function buildMapState(nodes, currentId) {
  const {current, next} = routeInstruction(nodes, currentId);
  return {
    current,
    next,
    currentZone: zoneForNode(current.id),
    nextZone: next ? zoneForNode(next.id) : null,
  };
}

export function transitionGuidance(currentId, nextId) {
  if (!nextId) return '这是本次导览的最后一站。';
  return CROSS_ZONE_DIRECTIONS[`${currentId}>${nextId}`]
    || `留在当前展区，按展厅顺序继续前往 ${nextId}。`;
}

export function mapViewZones(mode, state) {
  if (mode === 'current') return [state.currentZone];
  if (mode === 'next') {
    return [state.currentZone, state.nextZone].filter((zone, index, zones) => zone && zones.indexOf(zone) === index);
  }
  return MAP_ZONES;
}

export function mapStopStatus(nodeId, state) {
  if (nodeId === state.current.id) return 'current';
  if (nodeId === state.next?.id) return 'next';
  return 'normal';
}
