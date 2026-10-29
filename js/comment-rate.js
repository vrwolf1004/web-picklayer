// ── Comment rate limit (client side) ──────────────────────────────
// Abuse mitigation only, not a security control. The log lives in localStorage, so anyone can clear or edit it.
// Real server-side limits need Cloud Functions or App Check (see todo.md decision items).

export const COMMENT_RATE_LOG_KEY = 'commentRateLog';
export const COMMENT_MIN_INTERVAL_MS = 20 * 1000;
export const COMMENT_RATE_WINDOW_MS = 10 * 60 * 1000;
export const COMMENT_RATE_MAX_IN_WINDOW = 5;

// Post timestamps (ms) inside the window, oldest first. Bad or missing data counts as no posts.
function readRecentPosts(storage, now) {
  let log = [];
  try {
    const parsed = JSON.parse(storage.getItem(COMMENT_RATE_LOG_KEY) || '[]');
    if (Array.isArray(parsed)) log = parsed;
  } catch (e) {
    log = [];
  }
  return log
    .filter(t => typeof t === 'number' && t <= now && now - t < COMMENT_RATE_WINDOW_MS)
    .sort((a, b) => a - b);
}

// Milliseconds until a new comment is allowed; 0 means allowed now
export function getCommentRateWait(now = Date.now(), storage = localStorage) {
  const recent = readRecentPosts(storage, now);
  let wait = 0;
  if (recent.length > 0) {
    wait = Math.max(wait, recent[recent.length - 1] + COMMENT_MIN_INTERVAL_MS - now);
  }
  // Allowed only while fewer than COMMENT_RATE_MAX_IN_WINDOW posts are inside the window
  if (recent.length >= COMMENT_RATE_MAX_IN_WINDOW) {
    wait = Math.max(wait, recent[recent.length - COMMENT_RATE_MAX_IN_WINDOW] + COMMENT_RATE_WINDOW_MS - now);
  }
  return Math.max(0, wait);
}

// Call only after a comment was saved successfully
export function recordCommentPost(now = Date.now(), storage = localStorage) {
  const recent = readRecentPosts(storage, now);
  recent.push(now);
  try {
    storage.setItem(COMMENT_RATE_LOG_KEY, JSON.stringify(recent));
  } catch (e) {
    // Storage full or blocked: the limit is not enforced for this post
  }
}
