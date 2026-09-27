/**
 * DevFlow SVG Chart Rendering Engine
 * High-performance, lightweight, aesthetic SVG charts without external dependencies
 */

export function renderBarChart(containerId, data = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxVal = Math.max(...data.map(d => d.count), 5);
  const width = 500;
  const height = 200;
  const barWidth = 36;
  const gap = (width - data.length * barWidth) / (data.length + 1);

  const barsSvg = data.map((d, i) => {
    const barHeight = (d.count / maxVal) * (height - 40);
    const x = gap + i * (barWidth + gap);
    const y = height - 25 - barHeight;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="url(#barGradient)" />
        <text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif">${d.day}</text>
        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="#f8fafc" font-family="'JetBrains Mono', monospace">${d.count}</text>
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <svg class="custom-chart-svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      ${barsSvg}
    </svg>
  `;
}

export function renderDonutChart(containerId, statusCounts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  const colors = {
    done: '#10b981',
    in_progress: '#3b82f6',
    review: '#a855f7',
    todo: '#64748b'
  };

  let accumulatedOffset = 0;
  const slices = Object.entries(statusCounts).map(([status, count]) => {
    const strokeDash = (count / total) * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;

    return `
      <circle cx="100" cy="100" r="${radius}" fill="none" stroke="${colors[status] || '#64748b'}" 
        stroke-width="22" stroke-dasharray="${strokeDash} ${circumference}" stroke-dashoffset="-${offset}" />
    `;
  }).join('');

  container.innerHTML = `
    <svg class="custom-chart-svg" viewBox="0 0 200 200" style="max-width: 190px;">
      <g transform="rotate(-90 100 100)">
        <circle cx="100" cy="100" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="22" />
        ${slices}
      </g>
      <text x="100" y="96" text-anchor="middle" font-size="22" font-weight="800" fill="#f8fafc" font-family="'JetBrains Mono', monospace">${total}</text>
      <text x="100" y="114" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif">TOTAL TASKS</text>
    </svg>
  `;
}
