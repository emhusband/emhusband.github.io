document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('research-network');
  if (!host) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 1500;
  const H = 400;
  const regionDefs = [
    { key: 'blue', center: 380, color: '#4b86c5', spread: 285 },
    { key: 'green', center: 750, color: '#4b9b86', spread: 300 },
    { key: 'amber', center: 1120, color: '#d39b4f', spread: 285 }
  ];
  const labels = [
    {
      region: 'blue',
      title: 'Representation & Structure',
      subtitle: 'What is the format and structure of meaning?',
      href: 'research/index.html#grammatical-structure'
    },
    {
      region: 'green',
      title: 'Construction & Inference',
      subtitle: 'How is meaning built, enriched, and used?',
      href: 'research/index.html#expectation-inference'
    },
    {
      region: 'amber',
      title: 'Memory & Knowledge',
      subtitle: 'How is meaning encoded, organized, and retrieved?',
      href: 'research/index.html#meaning-memory'
    }
  ];

  const svgNS = 'http://www.w3.org/2000/svg';
  host.innerHTML = `
    <div class="network-wrap">
      <svg id="research-network-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="network-title network-desc">
        <title id="network-title">Research on meaning and cognition</title>
        <desc id="network-desc">An animated network with three overlapping fields representing representation, construction and inference, and memory and knowledge.</desc>
        <defs>
          <radialGradient id="wash-blue"><stop offset="0%" stop-color="#4b86c5" stop-opacity="0.10"/><stop offset="100%" stop-color="#4b86c5" stop-opacity="0"/></radialGradient>
          <radialGradient id="wash-green"><stop offset="0%" stop-color="#4b9b86" stop-opacity="0.10"/><stop offset="100%" stop-color="#4b9b86" stop-opacity="0"/></radialGradient>
          <radialGradient id="wash-amber"><stop offset="0%" stop-color="#d39b4f" stop-opacity="0.10"/><stop offset="100%" stop-color="#d39b4f" stop-opacity="0"/></radialGradient>
        </defs>
        <g aria-hidden="true">
          <ellipse cx="380" cy="${H / 2}" rx="420" ry="${H * 0.42}" fill="url(#wash-blue)"/>
          <ellipse cx="750" cy="${H / 2}" rx="430" ry="${H * 0.42}" fill="url(#wash-green)"/>
          <ellipse cx="1120" cy="${H / 2}" rx="420" ry="${H * 0.42}" fill="url(#wash-amber)"/>
        </g>
        <g id="network-edges" aria-hidden="true"></g>
        <g id="network-nodes" aria-hidden="true"></g>
      </svg>
      <div class="network-labels">
        ${labels.map((label, i) => `
          <a class="network-label network-label-${label.region}" href="${label.href}" data-region="${label.region}" aria-label="Explore ${label.title} research">
            <span class="network-title">${label.title}</span>
            <span class="network-subtitle">${label.subtitle}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;

  const svg = document.getElementById('research-network-svg');
  const edgeLayer = document.getElementById('network-edges');
  const nodeLayer = document.getElementById('network-nodes');

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (a, b) => a + Math.random() * (b - a);
  const nodes = [];
  const N_PER_REGION = 17;
  let now = performance.now();

  function spawn(regionIndex, t, initial = false) {
    const r = regionDefs[regionIndex];
    const x = r.center + rand(-r.spread, r.spread);
    const y = rand(42, H - 42);
    return {
      id: Math.random().toString(36).slice(2),
      regionIndex,
      x, y,
      bx: x, by: y,
      vx: rand(-0.035, 0.035),
      vy: rand(-0.03, 0.03),
      phase: rand(0, Math.PI * 2),
      born: initial ? t - rand(7000, 18000) : t,
      lifetime: rand(22000, 50000),
      size: rand(2.5, 6.8),
      pulse: rand(0.55, 1.2),
      opacity: rand(0.42, 0.82)
    };
  }

  for (let ri = 0; ri < regionDefs.length; ri++) {
    for (let i = 0; i < N_PER_REGION; i++) nodes.push(spawn(ri, now, true));
  }

  const edges = new Map();
  const edgeKey = (a, b) => a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;

  function nearestCandidates(n) {
    return nodes
      .filter(o => o !== n)
      .map(o => {
        const dx = o.x - n.x;
        const dy = o.y - n.y;
        return { o, d: Math.hypot(dx, dy) };
      })
      .filter(x => x.d < 215)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
  }

  function updateEdges(t) {
    const desired = new Set();
    nodes.forEach(n => {
      nearestCandidates(n).forEach(({o, d}) => {
        const cross = n.regionIndex !== o.regionIndex;
        const p = cross ? 0.18 : 0.31;
        if (Math.random() < p * (1 - d / 225) + 0.075) {
          desired.add(edgeKey(n, o));
        }
      });
    });

    desired.forEach(key => {
      if (!edges.has(key)) {
        const [a, b] = key.split('|');
        edges.set(key, { a, b, created: t, lifetime: rand(5000, 15000) });
      }
    });

    [...edges.entries()].forEach(([key, e]) => {
      if (t - e.created > e.lifetime) edges.delete(key);
    });
  }

  function nodeOpacity(n, t) {
    const age = (t - n.born) / n.lifetime;
    const fadeIn = clamp(age / 0.08, 0, 1);
    const fadeOut = clamp((1 - age) / 0.10, 0, 1);
    return n.opacity * Math.min(fadeIn, fadeOut);
  }

  function render(t) {
    if (!reduceMotion) updateEdges(t);

    const byId = new Map(nodes.map(n => [n.id, n]));
    edgeLayer.innerHTML = '';
    edges.forEach(e => {
      const a = byId.get(e.a);
      const b = byId.get(e.b);
      if (!a || !b) return;
      const line = document.createElementNS(svgNS, 'line');
      const age = (t - e.created) / e.lifetime;
      const edgeLife = Math.min(clamp(age / 0.15, 0, 1), clamp((1 - age) / 0.18, 0, 1));
      const alpha = edgeLife * Math.min(nodeOpacity(a, t), nodeOpacity(b, t)) * 0.36;
      line.setAttribute('x1', a.x.toFixed(2));
      line.setAttribute('y1', a.y.toFixed(2));
      line.setAttribute('x2', b.x.toFixed(2));
      line.setAttribute('y2', b.y.toFixed(2));
      line.setAttribute('stroke', regionDefs[a.regionIndex].color);
      line.setAttribute('stroke-opacity', alpha.toFixed(3));
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-linecap', 'round');
      edgeLayer.appendChild(line);
    });

    nodeLayer.innerHTML = '';
    nodes.forEach(n => {
      const circle = document.createElementNS(svgNS, 'circle');
      const pulse = reduceMotion ? 1 : (1 + 0.18 * Math.sin(t / 2150 * n.pulse + n.phase));
      const radius = n.size * pulse;
      const alpha = nodeOpacity(n, t);
      circle.setAttribute('cx', n.x.toFixed(2));
      circle.setAttribute('cy', n.y.toFixed(2));
      circle.setAttribute('r', radius.toFixed(2));
      circle.setAttribute('fill', regionDefs[n.regionIndex].color);
      circle.setAttribute('fill-opacity', clamp(alpha, 0, 0.88).toFixed(3));
      nodeLayer.appendChild(circle);
    });
  }

  function step(t) {
    nodes.forEach((n, i) => {
      if (reduceMotion) return;
      const dx = n.bx - n.x;
      const dy = n.by - n.y;
      n.vx += dx * 0.000017 + Math.sin(t / 12000 + n.phase + i) * 0.00034;
      n.vy += dy * 0.000017 + Math.cos(t / 15000 + n.phase * 1.2) * 0.00031;
      n.vx *= 0.996;
      n.vy *= 0.996;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 42 || n.x > W - 42) n.vx *= -1;
      if (n.y < 32 || n.y > H - 32) n.vy *= -1;
      n.x = clamp(n.x, 42, W - 42);
      n.y = clamp(n.y, 32, H - 32);
    });

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!reduceMotion && t - n.born > n.lifetime) {
        nodes[i] = spawn(n.regionIndex, t, false);
      }
    }

    render(t);
    if (!reduceMotion) requestAnimationFrame(step);
  }

  // Labels provide a gentle visual response without turning the graphic into a dashboard.
  document.querySelectorAll('.network-label').forEach(label => {
    label.addEventListener('mouseenter', () => {
      host.classList.add(`focus-${label.dataset.region}`);
    });
    label.addEventListener('mouseleave', () => {
      host.classList.remove('focus-blue', 'focus-green', 'focus-amber');
    });
    label.addEventListener('focus', () => {
      host.classList.add(`focus-${label.dataset.region}`);
    });
    label.addEventListener('blur', () => {
      host.classList.remove('focus-blue', 'focus-green', 'focus-amber');
    });
  });

  render(now);
  if (!reduceMotion) requestAnimationFrame(step);
});
