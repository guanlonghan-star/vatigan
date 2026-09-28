export function routeInstruction(nodes, currentId) {
  const index = Math.max(0, nodes.findIndex((node) => node.id === currentId));
  return {current: nodes[index], next: nodes[index + 1] || null};
}

export function routeHint(nodes, currentId) {
  const {current, next} = routeInstruction(nodes, currentId);
  if (!next) return `当前区域：${current.area}。这是最后一站。`;
  return `当前区域：${current.area}。下一站：${next.area}。`;
}
