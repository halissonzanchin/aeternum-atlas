export function pointsForLine(data, valueKey, width = 760, height = 300, padding = 42) {
  const max = Math.max(...data.map(item => item[valueKey]), 1);
  const min = Math.min(...data.map(item => item[valueKey]), 0);
  const range = Math.max(max - min, 1);
  const slot = (width - padding * 2) / Math.max(data.length - 1, 1);

  return data.map((item, index) => {
    const x = padding + slot * index;
    const y = height - padding - ((item[valueKey] - min) / range) * (height - padding * 2);
    return { ...item, x, y };
  });
}

export function linePath(points) {
  return points.map(point => `${point.x},${point.y}`).join(" ");
}
