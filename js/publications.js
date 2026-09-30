document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pub-filter-controls');
  const list = document.getElementById('pub-list');
  if (!container || !list) return;

  const items = Array.from(list.querySelectorAll('.pub'));
  const yearHeadings = Array.from(list.querySelectorAll('.pub-year'));
  const labels = [
    ['all', 'All'],
    ['event-structure', 'Event structure'],
    ['genericity-kinds', 'Genericity & kinds'],
    ['composition-enrichment', 'Composition & enrichment'],
    ['prediction-expectation', 'Prediction & expectation'],
    ['probability-inference', 'Probability & inference'],
    ['alternatives-implicature', 'Alternatives & implicature'],
    ['coherence', 'Coherence'],
    ['memory-retrieval', 'Memory & retrieval'],
    ['structure-reanalysis', 'Structure & reanalysis']
  ];

  function apply(filter) {
    container.querySelectorAll('.filter-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.filter === filter);
    });
    items.forEach(item => {
      const tags = (item.dataset.tags || '').split(/\s+/).filter(Boolean);
      item.hidden = !(filter === 'all' || tags.includes(filter));
    });

    yearHeadings.forEach((heading, index) => {
      const nextBoundary = yearHeadings[index + 1];
      let node = heading.nextElementSibling;
      let hasVisible = false;
      while (node && node !== nextBoundary) {
        if (node.classList.contains('pub') && !node.hidden) {
          hasVisible = true;
          break;
        }
        node = node.nextElementSibling;
      }
      heading.hidden = !hasVisible;
    });
  }

  labels.forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-btn';
    button.dataset.filter = value;
    button.textContent = label;
    button.addEventListener('click', () => {
      const url = new URL(window.location.href);
      if (value === 'all') url.searchParams.delete('topic');
      else url.searchParams.set('topic', value);
      window.history.replaceState({}, '', url);
      apply(value);
    });
    container.appendChild(button);
  });

  const initial = new URLSearchParams(window.location.search).get('topic') || 'all';
  apply(labels.some(([value]) => value === initial) ? initial : 'all');
});
