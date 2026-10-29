// Shows the time of the latest commit on main in the footer.
// On any failure the element stays hidden and only a console warning is logged.

const COMMIT_API = 'https://api.github.com/repos/vrwolf1004/web-picklayer/commits/main';
const TIMEOUT_MS = 5000;

// "YYYY-MM-DD HH:mm" in KST, independent of the visitor's time zone
function formatKst(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = type => parts.find(p => p.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`;
}

async function showLastDeploy() {
  const el = document.getElementById('last-deploy');
  if (!el) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(COMMIT_API, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const committed = new Date(data?.commit?.committer?.date);
    if (Number.isNaN(committed.getTime())) throw new Error('invalid commit date');
    el.textContent = `Updated ${formatKst(committed)} KST`;
    el.hidden = false;
  } catch (error) {
    console.warn('[last-deploy] Could not read the latest commit time:', error);
  } finally {
    clearTimeout(timer);
  }
}

showLastDeploy();
