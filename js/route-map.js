export const MAP_ZONES = [
  {id: 'pinacoteca', floor: '1F', name: '入口与绘画馆', shortName: 'Pinacoteca', landmark: '入口附近支线', nodes: ['V01','V02','V03','V04']},
  {id: 'classical', floor: '1F', name: '古典雕塑区', shortName: 'Pio Clementino', landmark: '八角庭院与缪斯厅', nodes: ['V05','V06','V07','V08']},
  {id: 'galleries', floor: '2F', name: '长廊', shortName: 'Galleries', landmark: '烛台、挂毯与地图长廊', nodes: ['V09','V10']},
  {id: 'raphael', floor: '2F', name: '拉斐尔画室', shortName: 'Raphael Rooms', landmark: 'Stanza della Segnatura', nodes: ['V11','V12','V13','V14']},
  {id: 'sistine', floor: '2F→1F', name: '西斯廷准备与礼拜堂', shortName: 'Sistine', landmark: '进入前完成讲解并收起手机', nodes: ['V15','V16','V17','V18','V19','V20']},
  {id: 'exit', floor: '1F', name: '出口与尾声', shortName: 'Post-Sistine', landmark: '走出礼拜堂后重新打开导览', nodes: ['V21']},
];

export const MAP_STOPS = [
  {id:'V01', title:'路线序章', x:74.03, y:47.27},
  {id:'V02', title:'圣杰罗姆', x:35.42, y:43.64},
  {id:'V03', title:'变容', x:26.66, y:43.64},
  {id:'V04', title:'基督下葬', x:17.89, y:43.64},
  {id:'V05', title:'观景殿阿波罗', x:57.92, y:27.00},
  {id:'V06', title:'拉奥孔', x:57.92, y:22.91},
  {id:'V07', title:'观景殿躯干', x:68.34, y:20.55},
  {id:'V08', title:'圆形大厅', x:68.34, y:26.91},
  {id:'V09', title:'挂毯馆', x:33.29, y:79.48},
  {id:'V10', title:'地图长廊', x:57.92, y:79.12},
  {id:'V11', title:'签字厅', x:75.68, y:74.94},
  {id:'V12', title:'雅典学院', x:76.39, y:70.21},
  {id:'V13', title:'圣体争辩', x:73.55, y:73.30},
  {id:'V14', title:'帕纳苏斯山', x:74.97, y:80.39},
  {id:'V15', title:'入堂准备', x:79.71, y:36.64},
  {id:'V16', title:'西斯廷天顶', x:72.13, y:38.00},
  {id:'V17', title:'创造亚当', x:68.34, y:40.18},
  {id:'V18', title:'先知与女先知', x:70.95, y:42.73},
  {id:'V19', title:'米开朗基罗', x:77.34, y:43.91},
  {id:'V20', title:'最后的审判', x:82.08, y:42.27},
  {id:'V21', title:'参观尾声', x:82.55, y:48.36},
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
