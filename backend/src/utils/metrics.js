// In-memory API request metrics — hidup selama proses berjalan, reset saat
// restart. Bukan rolling window: "since" menandai kapan proses mulai supaya
// frontend bisa jujur soal cakupan datanya.
const MAX_DURATIONS = 500;

const state = {
  since: new Date(),
  total: 0,
  countOk: 0,
  count4xx: 0,
  count5xx: 0,
  countTimeout: 0,
  durations: [],
};

export function recordRequest(durationMs, statusCode) {
  state.total += 1;
  if (statusCode >= 500) state.count5xx += 1;
  else if (statusCode >= 400) state.count4xx += 1;
  else state.countOk += 1;

  state.durations.push(durationMs);
  if (state.durations.length > MAX_DURATIONS) state.durations.shift();
}

export function recordTimeout() {
  state.total += 1;
  state.countTimeout += 1;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function getSnapshot() {
  const { total, countOk, count4xx, count5xx, countTimeout, durations } = state;
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  return {
    since: state.since.toISOString(),
    total_requests: total,
    success_rate_percent: total > 0 ? Math.round((countOk / total) * 1000) / 10 : 100,
    avg_response_ms: Math.round(avg),
    p95_response_ms: Math.round(percentile(sorted, 95)),
    error_rate_percent: total > 0 ? Math.round(((count4xx + count5xx) / total) * 1000) / 10 : 0,
    count_4xx: count4xx,
    count_5xx: count5xx,
    count_timeout: countTimeout,
  };
}
