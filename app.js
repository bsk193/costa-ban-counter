(() => {
  const API = 'https://countapi.mileshilliard.com/api/v1';
  const COUNT_KEY = 'costa_ban_4c58f0afac374379b4737b38ce534087';
  const LAST_KEY = `${COUNT_KEY}_lastban`;
  const PREVIOUS_KEY = `${COUNT_KEY}_previousban`;
  const STARTING_COUNT = 4;

  const nodes = {
    count: document.getElementById('count'),
    status: document.getElementById('api-status'),
    statusWrap: document.querySelector('.system-state'),
    elapsed: document.getElementById('elapsed'),
    lastEvent: document.getElementById('last-event'),
    interval: document.getElementById('interval'),
    intervalNote: document.getElementById('interval-note'),
  };

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

  async function readOrInitialize(key, startingValue) {
    try {
      return await request(`/get/${key}`);
    } catch (error) {
      if (error.status !== 404) throw error;
      return request(`/set/${key}?value=${startingValue}`);
    }
  }

  async function readOptionalTimestamp(key) {
    try {
      return await request(`/get/${key}`);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  function formatDuration(milliseconds) {
    const minutes = Math.floor(Math.max(0, milliseconds) / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remaining = minutes % 60;
    const hourText = `${String(hours).padStart(2, '0')}h`;
    const minuteText = `${String(remaining).padStart(2, '0')}m`;
    return days > 0 ? `${days}d ${hourText} ${minuteText}` : `${hourText} ${minuteText}`;
  }

  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  let lastBanAt = null;
  let previousBanAt = null;

  function renderTiming() {
    if (lastBanAt === null) {
      nodes.elapsed.textContent = '--h --m';
      nodes.lastEvent.textContent = 'No new ban events logged yet.';
      nodes.interval.textContent = '--h --m';
      nodes.intervalNote.textContent = 'Waiting for two new ban events.';
      return;
    }

    nodes.elapsed.textContent = formatDuration(Date.now() - lastBanAt);
    nodes.lastEvent.textContent = `Last event logged ${formatTimestamp(lastBanAt)}.`;

    if (previousBanAt === null) {
      nodes.interval.textContent = '--h --m';
      nodes.intervalNote.textContent = 'Waiting for the next new ban.';
    } else {
      nodes.interval.textContent = formatDuration(lastBanAt - previousBanAt);
      nodes.intervalNote.textContent = `Gap between ${formatTimestamp(previousBanAt)} and ${formatTimestamp(lastBanAt)}.`;
    }
  }

  function cleanAddLink() {
    const params = new URLSearchParams(window.location.search);
    params.delete('add');
    const query = params.toString();
    const cleanUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
  }

  function setStatus(label, state) {
    nodes.status.textContent = label;
    nodes.statusWrap.dataset.state = state;
  }

  async function start() {
    setStatus('SYNCING', 'syncing');
    try {
      const params = new URLSearchParams(window.location.search);
      const addOne = params.get('add') === '1';
      let count;

      if (addOne) {
        await readOrInitialize(COUNT_KEY, STARTING_COUNT);
        previousBanAt = await readOptionalTimestamp(LAST_KEY);
        count = await request(`/hit/${COUNT_KEY}`);
        lastBanAt = Date.now();
        if (previousBanAt !== null) await request(`/set/${PREVIOUS_KEY}?value=${previousBanAt}`);
        await request(`/set/${LAST_KEY}?value=${lastBanAt}`);
        cleanAddLink();
      } else {
        [count, lastBanAt, previousBanAt] = await Promise.all([
          readOrInitialize(COUNT_KEY, STARTING_COUNT),
          readOptionalTimestamp(LAST_KEY),
          readOptionalTimestamp(PREVIOUS_KEY),
        ]);
      }

      nodes.count.textContent = String(count).padStart(4, '0');
      setStatus('ONLINE', 'online');
      renderTiming();
      window.setInterval(renderTiming, 1000);
    } catch (_error) {
      nodes.count.textContent = '----';
      nodes.elapsed.textContent = '--h --m';
      nodes.interval.textContent = '--h --m';
      nodes.lastEvent.textContent = 'Shared event data is currently unreachable.';
      nodes.intervalNote.textContent = 'No timing data available.';
      setStatus('OFFLINE', 'offline');
    }
  }

  start();
})();
