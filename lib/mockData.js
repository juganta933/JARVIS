// Mock & Fallback Telemetry for J.A.R.V.I.S. Prototype

export const SAMPLE_METRICS = {
  success: true,
  hasMetrics: true,
  timestamp: new Date().toISOString(),
  services: [
    {
      name: "auth",
      metrics: {
        requests_total: 482,
        failed_requests: 38,
        avg_latency_ms: 310,
        cpu_usage: 68.4,
        memory_usage: 74.2,
      },
    },
    {
      name: "tasks",
      metrics: {
        requests_total: 890,
        failed_requests: 4,
        avg_latency_ms: 45,
        cpu_usage: 42.1,
        memory_usage: 55.6,
      },
    },
    {
      name: "system",
      metrics: {
        cpu_usage: 78.5,
        memory_usage: 86.2,
        load_average: 3.12,
        active_connections: 142,
      },
    },
  ],
};

export const SAMPLE_SERVICES = {
  success: true,
  services: [
    {
      name: "auth",
      latest_event: new Date(Date.now() - 1000 * 45).toISOString(),
      events_24h: 124,
    },
    {
      name: "tasks",
      latest_event: new Date(Date.now() - 1000 * 180).toISOString(),
      events_24h: 312,
    },
    {
      name: "notifications",
      latest_event: new Date(Date.now() - 1000 * 600).toISOString(),
      events_24h: 58,
    },
    {
      name: "system",
      latest_event: new Date(Date.now() - 1000 * 20).toISOString(),
      events_24h: 490,
    },
  ],
};

export const SAMPLE_EVENTS = {
  success: true,
  count: 6,
  events: [
    {
      id: "evt-01",
      timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
      service: "auth",
      category: "error",
      msg: "PostgreSQL connection pool exhausted while acquiring client session",
      endpoint: "/auth/login",
      trace_id: "trace-9a8b1c",
      metadata: { pool_size: 20, active_clients: 20, waiting_requests: 18, timeout_ms: 5000 },
    },
    {
      id: "evt-02",
      timestamp: new Date(Date.now() - 1000 * 75).toISOString(),
      service: "auth",
      category: "security",
      msg: "Rate limit triggered for IP block: 10 failed login attempts in 2m",
      endpoint: "/auth/login",
      trace_id: "trace-4f2e8d",
      metadata: { client_ip: "192.168.1.104", attempts: 10, window: "10m" },
    },
    {
      id: "evt-03",
      timestamp: new Date(Date.now() - 1000 * 140).toISOString(),
      service: "tasks",
      category: "business",
      msg: "High throughput batch task synchronization completed (1,200 records)",
      endpoint: "/tasks/batch-sync",
      trace_id: "trace-7c3e5a",
      metadata: { records_synced: 1200, duration_ms: 1420 },
    },
    {
      id: "evt-04",
      timestamp: new Date(Date.now() - 1000 * 210).toISOString(),
      service: "system",
      category: "system",
      msg: "Garbage collection cycle took longer than expected: 240ms pause",
      endpoint: "/internal/health",
      trace_id: "trace-11bb99",
      metadata: { gc_type: "major", heap_used_mb: 480, max_heap_mb: 512 },
    },
    {
      id: "evt-05",
      timestamp: new Date(Date.now() - 1000 * 380).toISOString(),
      service: "notifications",
      category: "error",
      msg: "Webhook dispatch timeout to external notification gateway",
      endpoint: "/notifications/dispatch",
      trace_id: "trace-33cc77",
      metadata: { provider: "sendgrid", retry_count: 3, status_code: 504 },
    },
  ],
};
