/**
 * Analytics Module
 * Tracks page views, section views, visitor info, and session duration.
 * Stores data in localStorage for the dashboard, and optionally sends
 * to Azure Application Insights if configured.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ap_analytics';
  const SESSION_KEY = 'ap_session';

  // ---- Azure Application Insights (optional) ----
  // Replace with your real instrumentation key / connection string to enable cloud analytics.
  const AI_CONNECTION_STRING = 'InstrumentationKey=2e006d29-3ceb-4684-815a-a788327d8257;IngestionEndpoint=https://eastus2-3.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus2.livediagnostics.monitor.azure.com/;ApplicationId=26ee58fa-1edd-49f4-ac1b-ef4e7394ee02'; // e.g. 'InstrumentationKey=xxxxxxxx-xxxx-...;IngestionEndpoint=...'

  function loadAppInsightsSDK() {
    if (!AI_CONNECTION_STRING) return;
    const script = document.createElement('script');
    script.src = 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      if (window.Microsoft && window.Microsoft.ApplicationInsights) {
        const appInsights = new window.Microsoft.ApplicationInsights.ApplicationInsights({
          config: { connectionString: AI_CONNECTION_STRING }
        });
        appInsights.loadAppInsights();
        appInsights.trackPageView();
        window.__appInsights = appInsights;
      }
    };
    document.head.appendChild(script);
  }
  loadAppInsightsSDK();

  // ---- Helpers ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function getVisitorId() {
    let id = localStorage.getItem('ap_visitor_id');
    if (!id) {
      id = generateId();
      localStorage.setItem('ap_visitor_id', id);
    }
    return id;
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return 'Mobile';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Other';
  }

  function getReferrerSource() {
    const ref = document.referrer;
    if (!ref) return 'Direct';
    try {
      const url = new URL(ref);
      const host = url.hostname.toLowerCase();
      if (host.includes('google')) return 'Google';
      if (host.includes('linkedin')) return 'LinkedIn';
      if (host.includes('github')) return 'GitHub';
      if (host.includes('twitter') || host.includes('x.com')) return 'Twitter/X';
      if (host.includes('facebook')) return 'Facebook';
      return host;
    } catch {
      return 'Other';
    }
  }

  // ---- Data Store ----
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore corrupt data */ }
    return { visits: [], sectionViews: {}, sources: {}, devices: {}, browsers: {} };
  }

  function saveData(data) {
    // Keep last 500 visits to avoid unbounded growth
    if (data.visits.length > 500) {
      data.visits = data.visits.slice(-500);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ---- Session ----
  function startSession() {
    const session = {
      id: generateId(),
      visitorId: getVisitorId(),
      startTime: Date.now(),
      device: getDeviceType(),
      browser: getBrowser(),
      source: getReferrerSource(),
      sections: []
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return startSession();
  }

  function updateSession(updates) {
    const session = getSession();
    Object.assign(session, updates);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  // ---- Record Visit ----
  function recordVisit() {
    const data = loadData();
    const session = getSession();

    data.visits.push({
      id: session.id,
      visitorId: session.visitorId,
      timestamp: new Date().toISOString(),
      device: session.device,
      browser: session.browser,
      source: session.source
    });

    // Increment aggregates
    data.sources[session.source] = (data.sources[session.source] || 0) + 1;
    data.devices[session.device] = (data.devices[session.device] || 0) + 1;
    data.browsers[session.browser] = (data.browsers[session.browser] || 0) + 1;

    saveData(data);

    // Track in Application Insights
    if (window.__appInsights) {
      window.__appInsights.trackEvent({
        name: 'PageVisit',
        properties: { device: session.device, browser: session.browser, source: session.source }
      });
    }
  }

  // ---- Record Section View ----
  function recordSectionView(sectionId) {
    const data = loadData();
    data.sectionViews[sectionId] = (data.sectionViews[sectionId] || 0) + 1;
    saveData(data);

    const session = getSession();
    if (!session.sections.includes(sectionId)) {
      session.sections.push(sectionId);
      updateSession({ sections: session.sections });
    }

    if (window.__appInsights) {
      window.__appInsights.trackEvent({ name: 'SectionView', properties: { section: sectionId } });
    }
  }

  // ---- Record Session End ----
  function recordSessionEnd() {
    const session = getSession();
    const duration = Math.round((Date.now() - session.startTime) / 1000);
    const data = loadData();

    // Update last visit with duration
    const lastVisit = data.visits[data.visits.length - 1];
    if (lastVisit && lastVisit.id === session.id) {
      lastVisit.duration = duration;
    }
    saveData(data);

    if (window.__appInsights) {
      window.__appInsights.trackMetric({ name: 'SessionDuration', average: duration });
    }
  }

  // ---- Dashboard Rendering ----
  function renderDashboard() {
    const data = loadData();

    // Total visits
    const totalVisitsEl = document.getElementById('totalVisits');
    if (totalVisitsEl) totalVisitsEl.textContent = data.visits.length;

    // Unique visitors
    const uniqueIds = new Set(data.visits.map(v => v.visitorId));
    const uniqueVisitorsEl = document.getElementById('uniqueVisitors');
    if (uniqueVisitorsEl) uniqueVisitorsEl.textContent = uniqueIds.size;

    // Average duration
    const durations = data.visits.filter(v => v.duration).map(v => v.duration);
    const avgDurationEl = document.getElementById('avgDuration');
    if (avgDurationEl) {
      const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      avgDurationEl.textContent = avg < 60 ? avg + 's' : Math.round(avg / 60) + 'm';
    }

    // Top section
    const topSectionEl = document.getElementById('topSection');
    if (topSectionEl) {
      const sections = data.sectionViews;
      const topEntry = Object.entries(sections).sort((a, b) => b[1] - a[1])[0];
      topSectionEl.textContent = topEntry ? capitalize(topEntry[0]) : '—';
    }

    // Section bars
    renderBars('sectionBars', data.sectionViews);

    // Traffic sources
    renderBars('trafficSources', data.sources);

    // Devices
    renderBars('deviceStats', data.devices);

    // Recent visitors table
    renderRecentVisitors(data.visits);
  }

  function renderBars(containerId, dataObj) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 1;

    container.innerHTML = entries.map(([label, value]) => `
      <div class="analytics-bar-item">
        <span class="analytics-bar-label">${escapeHtml(capitalize(label))}</span>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill" style="width: ${(value / max) * 100}%"></div>
        </div>
        <span class="analytics-bar-value">${value}</span>
      </div>
    `).join('');
  }

  function renderRecentVisitors(visits) {
    const container = document.getElementById('recentVisitors');
    if (!container) return;

    const recent = visits.slice(-10).reverse();
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Device</th>
            <th>Browser</th>
            <th>Source</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(v => `
            <tr>
              <td>${formatTime(v.timestamp)}</td>
              <td>${escapeHtml(v.device || '—')}</td>
              <td>${escapeHtml(v.browser || '—')}</td>
              <td>${escapeHtml(v.source || '—')}</td>
              <td>${v.duration ? v.duration + 's' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  }

  // ---- Intersection Observer for Section Tracking ----
  function setupSectionTracking() {
    const sections = document.querySelectorAll('.content-section, .hero');
    const observed = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id && !observed.has(id)) {
            observed.add(id);
            recordSectionView(id);
          }
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));
  }

  // ---- Init ----
  function init() {
    startSession();
    recordVisit();
    setupSectionTracking();

    // Record session end on page unload
    window.addEventListener('beforeunload', recordSessionEnd);

    // Expose dashboard renderer to app.js
    window.apAnalytics = { renderDashboard };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
