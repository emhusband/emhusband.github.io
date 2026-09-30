document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('h1.title, #title-block-header h1, .quarto-title-block h1');
  if (!title) return;
  const header = title.closest('#title-block-header, .quarto-title-block') || title.parentElement;
  if (!header || header.querySelector('.page-network-backdrop')) return;

  header.classList.add('network-page-header');
  const layer = document.createElement('div');
  layer.className = 'page-network-backdrop';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<svg viewBox="0 0 1500 220" preserveAspectRatio="xMidYMid slice"><defs>' +
    '<radialGradient id="ph-blue"><stop offset="0%" stop-color="#4b86c5" stop-opacity=".12"/><stop offset="100%" stop-color="#4b86c5" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ph-green"><stop offset="0%" stop-color="#4b9b86" stop-opacity=".11"/><stop offset="100%" stop-color="#4b9b86" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ph-amber"><stop offset="0%" stop-color="#d39b4f" stop-opacity=".10"/><stop offset="100%" stop-color="#d39b4f" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="380" cy="110" rx="430" ry="165" fill="url(#ph-blue)"/><ellipse cx="760" cy="110" rx="440" ry="165" fill="url(#ph-green)"/><ellipse cx="1130" cy="110" rx="430" ry="165" fill="url(#ph-amber)"/>' +
    '<g class="ph-edges"></g><g class="ph-nodes"></g></svg>';
  header.prepend(layer);

  const svg = layer.querySelector('svg');
  const edgeLayer = layer.querySelector('.ph-edges');
  const nodeLayer = layer.querySelector('.ph-nodes');
  const NS = 'http://www.w3.org/2000/svg';
  const W=1500,H=220, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const regions=[{c:380,col:'#4b86c5'},{c:750,col:'#4b9b86'},{c:1120,col:'#d39b4f'}];
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const nodes=[]; let t0=performance.now();
  for(let r=0;r<3;r++) for(let i=0;i<14;i++){
    const x=regions[r].c+rand(-250,250), y=rand(20,H-20);
    nodes.push({r,x,y,bx:x,by:y,vx:rand(-.025,.025),vy:rand(-.018,.018),size:rand(2.2,5.8),phase:rand(0,6.28),op:rand(.30,.62)});
  }
  const pairs=[];
  for(let i=0;i<nodes.length;i++){
    const near=nodes.map((n,j)=>({j,d:j===i?9999:Math.hypot(n.x-nodes[i].x,n.y-nodes[i].y)})).sort((a,b)=>a.d-b.d).slice(0,2);
    near.forEach(({j,d})=>{ if(i<j && d<190) pairs.push([i,j]); });
  }
  function render(t){
    edgeLayer.innerHTML=''; nodeLayer.innerHTML='';
    pairs.forEach(([i,j])=>{const a=nodes[i],b=nodes[j], line=document.createElementNS(NS,'line'); line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.setAttribute('stroke',regions[a.r].col);line.setAttribute('stroke-width','.9');line.setAttribute('stroke-opacity',String(Math.min(a.op,b.op)*.32));edgeLayer.appendChild(line)});
    nodes.forEach(n=>{const c=document.createElementNS(NS,'circle'); const pulse=reduce?1:1+.11*Math.sin(t/2600+n.phase);c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',n.size*pulse);c.setAttribute('fill',regions[n.r].col);c.setAttribute('fill-opacity',n.op);nodeLayer.appendChild(c)});
  }
  function step(t){
    if(!reduce) nodes.forEach((n,i)=>{n.vx+=(n.bx-n.x)*.000012+Math.sin(t/14000+n.phase+i)*.00018;n.vy+=(n.by-n.y)*.000012+Math.cos(t/17000+n.phase)*.00015;n.vx*=.997;n.vy*=.997;n.x=clamp(n.x+n.vx,10,W-10);n.y=clamp(n.y+n.vy,10,H-10)});
    render(t); if(!reduce) requestAnimationFrame(step);
  }
  render(t0); if(!reduce) requestAnimationFrame(step);
});
