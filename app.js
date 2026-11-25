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
    let data;
    try { data = await response.json(); } catch { data = {}; }
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

  async function readOrInitializeCount() {
    try {
      return await request(`/get/${COUNT_KEY}`);
    } catch (error) {
      if (error.status !== 404) throw error;
      return request(`/set/${COUNT_KEY}?value=${STARTING_COUNT}`);
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

  function formatDuration(seconds) {
    const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const hourText = `${String(hours).padStart(2, '0')}h`;
    const minuteText = `${String(minutes).padStart(2, '0')}m`;
    return days > 0 ? `${days}d ${hourText} ${minuteText}` : `${hourText} ${minuteText}`;
  }

  function formatTimestamp(unixSeconds) {
    return new Date(unixSeconds * 1000).toLocaleString(undefined, {
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

    nodes.elapsed.textContent = formatDuration(Date.now() / 1000 - lastBanAt);
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

  async function recordBan() {
    setStatus('ADDING', 'syncing');
    try {
      const count = await request(`/hit/${COUNT_KEY}`);
      nodes.count.textContent = String(count).padStart(4, '0');
      cleanAddLink();

      try {
        const priorBanAt = await readOptionalTimestamp(LAST_KEY);
        const now = Math.floor(Date.now() / 1000);
        if (priorBanAt !== null) {
          await request(`/set/${PREVIOUS_KEY}?value=${priorBanAt}`);
        }
        await request(`/set/${LAST_KEY}?value=${now}`);
        previousBanAt = priorBanAt;
        lastBanAt = now;
        renderTiming();
        setStatus('ONLINE', 'online');
      } catch {
        setStatus('COUNTED / TIME SYNC ERROR', 'warning');
        nodes.lastEvent.textContent = 'Ban counted; timer sync failed.';
      }
    } catch {
      nodes.count.textContent = '----';
      nodes.lastEvent.textContent = 'Ban could not be recorded. Try the link again.';
      setStatus('OFFLINE', 'offline');
    }
  }

  async function start() {
    setStatus('SYNCING', 'syncing');
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === '1') {
      await recordBan();
      return;
    }

    try {
      const count = await readOrInitializeCount();
      nodes.count.textContent = String(count).padStart(4, '0');
      try {
        [lastBanAt, previousBanAt] = await Promise.all([
          readOptionalTimestamp(LAST_KEY),
          readOptionalTimestamp(PREVIOUS_KEY),
        ]);
        setStatus('ONLINE', 'online');
      } catch {
        lastBanAt = null;
        previousBanAt = null;
        setStatus('COUNT LIVE / TIME OFFLINE', 'warning');
      }
      renderTiming();
    } catch {
      nodes.count.textContent = '----';
      nodes.lastEvent.textContent = 'Shared event data is currently unreachable.';
      nodes.intervalNote.textContent = 'No timing data available.';
      setStatus('OFFLINE', 'offline');
    }
  }

  start();
  window.setInterval(renderTiming, 1000);
})();
