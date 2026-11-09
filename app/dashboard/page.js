"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ironManIcon from "../../public/icon.jpg";
import {
  AlertCircle,
  ChevronDown,
  Cpu,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  api,
  getStoredUserSnapshot,
  setStoredUser,
  subscribeToStoredUser,
} from "@/lib/api";

const REFRESH_INTERVAL = 3000;
const numberFormat = new Intl.NumberFormat();
const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function isValidMetric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPercentage(value) {
  return isValidMetric(value) && value >= 0 && value <= 100;
}

function getMetric(metrics, ...keys) {
  if (!metrics || typeof metrics !== "object") return undefined;
  const normalizedKeys = keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (let index = 0; index < keys.length; index += 1) {
    const value = Object.entries(metrics).find(
      ([name]) => name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedKeys[index],
    )?.[1];
    if (isValidMetric(value)) return value;
  }
  return undefined;
}

function getResourcePercent(metrics, type) {
  const definitions = {
    cpu: {
      usage: ["cpu_usage", "cpu_percent", "cpu_percentage"],
      used: ["cpu_used", "cpu_used_percent"],
      free: ["cpu_free", "cpu_free_percent"],
      total: ["cpu_total"],
    },
    ram: {
      usage: ["ram_usage", "memory_usage", "ram_percent", "memory_percent", "ram_percentage", "memory_percentage"],
      used: ["ram_used", "memory_used", "ram_used_mb", "memory_used_mb", "ram_used_gb", "memory_used_gb"],
      free: ["ram_free", "memory_free", "ram_free_mb", "memory_free_mb", "ram_free_gb", "memory_free_gb"],
      total: ["ram_total", "memory_total", "ram_total_mb", "memory_total_mb", "ram_total_gb", "memory_total_gb"],
    },
    disk: {
      usage: ["disk_usage", "disk_percent", "disk_percentage", "storage_usage"],
      used: ["disk_used", "storage_used", "disk_used_mb", "disk_used_gb"],
      free: ["disk_free", "storage_free", "disk_free_mb", "disk_free_gb"],
      total: ["disk_total", "storage_total", "disk_total_mb", "disk_total_gb"],
    },
  };
  const fields = definitions[type];
  const usage = getMetric(metrics, ...fields.usage);
  if (isValidPercentage(usage)) return usage;

  const used = getMetric(metrics, ...fields.used);
  const free = getMetric(metrics, ...fields.free);
  const total = getMetric(metrics, ...fields.total);
  if (isValidMetric(used) && isValidMetric(free) && used + free > 0) {
    return (used / (used + free)) * 100;
  }
  if (isValidMetric(used) && isValidMetric(total) && total > 0) {
    return (used / total) * 100;
  }
  if (isValidMetric(free) && isValidMetric(total) && total > 0) {
    return ((total - free) / total) * 100;
  }
  return undefined;
}

function formatValue(value, digits = 0) {
  if (!isValidMetric(value)) return "—";
  return numberFormat.format(Number(value.toFixed(digits)));
}

function formatEventTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function sanitizeEventMessage(message) {
  return String(message || "Event message unavailable")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email hidden]")
    .replace(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi, "[ID hidden]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP hidden]")
    .replace(/\beyJ[A-Za-z0-9._-]{20,}\b/g, "[token hidden]")
    .replace(/(["']?(?:user(?:[_-]?(?:id|name))?|email|ip|token|password|secret|authorization|cookie)["']?\s*[:=]\s*["']?)[^"',}\s]+/gi, "$1[hidden]");
}

function categoryClass(category) {
  const value = (category || "event").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `category-${value || "event"}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const inFlight = useRef(false);
  const isHydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const storedUser = useSyncExternalStore(subscribeToStoredUser, getStoredUserSnapshot, () => "");
  const user = useMemo(() => {
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, [storedUser]);
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connection, setConnection] = useState("checking");
  const [errorNotice, setErrorNotice] = useState("");

  useEffect(() => {
    if (isHydrated && !user?.appId) router.replace("/");
  }, [isHydrated, router, user]);

  const fetchDashboardData = useCallback(async (manual = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (manual) setIsRefreshing(true);

    try {
      const results = await Promise.allSettled([
        api.getMetrics(),
        api.getRecentEvents(3),
      ]);
      const [metricsResult, eventsResult] = results;
      const failedRequests = results.filter(
        (result) => result.status === "rejected" || !result.value?.success,
      );

      if (failedRequests.some((result) => result.status === "rejected" && result.reason?.status === 401)) {
        setStoredUser(null);
        router.replace("/");
        return;
      }

      if (metricsResult.status === "fulfilled" && metricsResult.value?.success) {
        setMetrics(metricsResult.value);
      }
      if (eventsResult.status === "fulfilled" && eventsResult.value?.success) {
        setEvents(eventsResult.value.events || []);
      }

      if (failedRequests.length) {
        const firstFailure = failedRequests[0];
        const message = firstFailure.status === "rejected"
          ? firstFailure.reason?.message
          : firstFailure.value?.error;
        setErrorNotice(message || "Some dashboard data could not be refreshed.");
        setConnection(failedRequests.length === results.length ? "offline" : "partial");
      } else {
        setErrorNotice("");
        setConnection("online");
      }
    } finally {
      inFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isHydrated || !user?.appId) return undefined;
    const initialRequest = window.setTimeout(() => fetchDashboardData(), 0);
    const timer = window.setInterval(() => fetchDashboardData(), REFRESH_INTERVAL);
    return () => {
      window.clearTimeout(initialRequest);
      window.clearInterval(timer);
    };
  }, [fetchDashboardData, isHydrated, user]);

  const serviceMetrics = metrics?.services || [];
  async function handleLogout() {
    await api.logout();
    router.push("/");
  }

  if (!isHydrated || !user?.appId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" aria-label="Loading dashboard" />
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-container header-inner">
          <div className="dashboard-brand">
            <span className="brand-mark">
              <Image src={ironManIcon} alt="Iron Man" width={32} height={32} />
            </span>
            <span>JARVIS<span className="brand-period">.</span></span>
          </div>
          <div className="header-controls">
            <div className={`connection-state ${connection === "offline" ? "is-offline" : ""} ${connection === "partial" ? "is-partial" : ""}`}>
              <span className="status-dot" />
              <span className="connection-label">
                {connection === "checking" ? "CONNECTING" : connection === "offline" ? "OFFLINE" : connection === "partial" ? "PARTIAL" : "LIVE"}
              </span>
              <span>· 3s</span>
            </div>
            <button
              className="icon-action"
              type="button"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button className="icon-action" type="button" title="Sign out" aria-label="Sign out" onClick={handleLogout}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-container main-content">
        {errorNotice && (
          <div className="error-banner" role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorNotice} {connection === "offline" ? "Check the configured backend URL." : "Showing the most recently received data."}</span>
          </div>
        )}

        <section className="content-card services-section" aria-labelledby="services-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">CPU &amp; MEMORY</p>
              <h2 id="services-title">Service metrics</h2>
            </div>
          </div>

          {isLoading && !serviceMetrics.length ? (
            <div className="service-grid" aria-label="Loading services">
              {[1, 2, 3].map((item) => (
                <div className="service-card" key={item}>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-value" />
                  <div className="skeleton skeleton-line" style={{ width: "68%", marginTop: 12 }} />
                </div>
              ))}
            </div>
          ) : serviceMetrics.length ? (
            <div className="service-grid">
              {serviceMetrics.map((service, index) => {
                const reportedMetrics = service.metrics;
                const cpuUsage = getResourcePercent(reportedMetrics, "cpu");
                const ramUsage = getResourcePercent(reportedMetrics, "ram");
                const diskUsage = getResourcePercent(reportedMetrics, "disk");
                const hasUsageGauges = isValidPercentage(cpuUsage)
                  || isValidPercentage(ramUsage)
                  || isValidPercentage(diskUsage);
                return (
                  <article className="service-card" key={service.name || index}>
                    <div className="service-heading">
                      <span className="service-glyph"><Server size={15} /></span>
                      <span className="service-name">{service.name || "Unnamed service"}</span>
                    </div>
                    {hasUsageGauges ? (
                      <div className="service-gauges" aria-label={`${service.name} resource usage`}>
                        {isValidPercentage(cpuUsage) && <UsageGauge label="CPU" value={cpuUsage} />}
                        {isValidPercentage(ramUsage) && <UsageGauge label="RAM" value={ramUsage} showFree />}
                        {isValidPercentage(diskUsage) && <UsageGauge label="DISK" value={diskUsage} showFree />}
                      </div>
                    ) : (
                      <p className="service-no-metrics">
                        {reportedMetrics
                          ? "CPU, RAM, or disk usage fields are not available in this snapshot."
                          : "No metric snapshot has been reported for this service."}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState loading={isLoading} message="No services are configured yet." />
          )}
        </section>

        <section className="content-card events-section" aria-labelledby="events-title">
          <details className="events-disclosure">
            <summary>
              <span>
                <span className="section-kicker">LATEST SIGNALS</span>
                <span className="events-title" id="events-title">Recent activity</span>
                <span className="events-hint">Open to view up to three recent events</span>
              </span>
              <span className="events-toggle">
                {isLoading && !events.length ? "Loading" : `${Math.min(events.length, 3)} events`}
                <ChevronDown size={18} aria-hidden="true" />
              </span>
            </summary>
            {isLoading && !events.length ? (
              <EmptyState loading message="Loading recent activity..." />
            ) : events.length ? (
              <div className="event-list">
                {events.slice(0, 3).map((event, index) => (
                  <article className="event-card" key={`${event.timestamp || "event"}-${index}`}>
                    <div className="event-card-top">
                      <div className="event-service">
                        <span className={`event-indicator ${categoryClass(event.category)}`} />
                        <span>{event.service || "Unknown service"}</span>
                      </div>
                      <span className={`category-badge ${categoryClass(event.category)}`}>
                        {event.category || "event"}
                      </span>
                    </div>
                    <h3 className="event-message">{sanitizeEventMessage(event.msg)}</h3>
                    <time className="event-time" dateTime={event.timestamp || undefined}>
                      {formatEventTime(event.timestamp)}
                    </time>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent events to show." />
            )}
          </details>
        </section>
      </main>

      <footer className="dashboard-container dashboard-footer">JARVIS <span>·</span> APPLICATION OBSERVABILITY</footer>

    </div>
  );
}

function UsageGauge({ label, value, showFree = false }) {
  const circumference = 2 * Math.PI * 31;
  const roundedValue = Math.round(value);
  const offset = circumference * (1 - roundedValue / 100);
  const tone = label.toLowerCase();

  return (
    <div className={`resource-reading resource-reading-${tone}`}>
      <div className={`usage-gauge usage-gauge-${tone}`}>
        <svg viewBox="0 0 76 76" role="img" aria-label={`${label} used ${formatValue(roundedValue)} percent`}>
          <circle className="gauge-track" cx="38" cy="38" r="31" />
          <circle
            className="gauge-progress"
            cx="38"
            cy="38"
            r="31"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="gauge-value">{formatValue(roundedValue)}<small>%</small></span>
        <span className="gauge-label">{label}</span>
      </div>
      <div className="resource-breakdown">
        <span><i className="resource-dot resource-dot-used" />Used <strong>{formatValue(roundedValue)}%</strong></span>
        {showFree && <span><i className="resource-dot resource-dot-free" />Free <strong>{formatValue(100 - roundedValue)}%</strong></span>}
      </div>
    </div>
  );
}

function EmptyState({ message, loading }) {
  return (
    <div className="empty-state" role="status">
      {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Cpu size={17} />}
      <span>{message}</span>
    </div>
  );
}
