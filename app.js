(() => {
  const API = 'https://countapi.mileshilliard.com/api/v1';
  const KEY = 'costa_ban_4c58f0afac374379b4737b38ce534087';
  const STARTING_COUNT = 4;
  const countNode = document.getElementById('count');
  const statusNode = document.getElementById('api-status');
  const statusDot = statusNode.parentElement;

  async function request(path) {
    const response = await fetch(`${API}${path}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'The counter service is unavailable.');
      error.status = response.status;
      throw error;
    }
    const value = Number(data.value);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('The counter returned an invalid value.');
    }
    return value;
  }

  async function readOrInitialize() {
    try {
      return await request(`/get/${KEY}`);
    } catch (error) {
      if (error.status !== 404) throw error;
      return request(`/set/${KEY}?value=${STARTING_COUNT}`);
    }
  }

  function cleanAddLink() {
    const params = new URLSearchParams(window.location.search);
    params.delete('add');
    const query = params.toString();
    const cleanUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
  }

  async function start() {
    countNode.textContent = '…';
    statusNode.textContent = 'CONNECTING';
    try {
      const params = new URLSearchParams(window.location.search);
      const addOne = params.get('add') === '1';
      if (addOne) await readOrInitialize();
      const count = addOne ? await request(`/hit/${KEY}`) : await readOrInitialize();
      countNode.textContent = new Intl.NumberFormat().format(count);
      statusNode.textContent = 'LIVE';
      statusDot.dataset.state = 'live';
      if (addOne) cleanAddLink();
    } catch (_error) {
      countNode.textContent = '—';
      statusNode.textContent = 'UNAVAILABLE';
      statusDot.dataset.state = 'error';
    }
  }

  start();
})();
