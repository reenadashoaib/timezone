(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  const MAX_ZONES = 12;
  const WORK_START = 9;
  const WORK_END = 17;
  const DEFAULT_ZONES = ['America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];

  // Older ICU builds report legacy names; show the current ones instead.
  const LEGACY = {
    'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Europe/Kiev': 'Europe/Kyiv',
    'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Rangoon': 'Asia/Yangon', 'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
    'Atlantic/Faeroe': 'Atlantic/Faroe', 'Pacific/Ponape': 'Pacific/Pohnpei', 'Pacific/Truk': 'Pacific/Chuuk',
    'America/Godthab': 'America/Nuuk', 'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
  };

  // Abbreviations and big cities that are not IANA zone names.
  const ALIASES = [
    ['EST', 'Eastern Time, US and Canada', 'America/New_York'],
    ['CST', 'Central Time, US and Canada', 'America/Chicago'],
    ['MST', 'Mountain Time, US and Canada', 'America/Denver'],
    ['PST', 'Pacific Time, US and Canada', 'America/Los_Angeles'],
    ['AKST', 'Alaska Time', 'America/Anchorage'],
    ['HST', 'Hawaii Time', 'Pacific/Honolulu'],
    ['GMT', 'Greenwich Mean Time, UK', 'Europe/London'],
    ['UTC', 'Coordinated Universal Time', 'UTC'],
    ['CET', 'Central European Time', 'Europe/Berlin'],
    ['EET', 'Eastern European Time', 'Europe/Athens'],
    ['WET', 'Western European Time', 'Europe/Lisbon'],
    ['MSK', 'Moscow Time', 'Europe/Moscow'],
    ['IST', 'India Standard Time', 'Asia/Kolkata'],
    ['PKT', 'Pakistan Time', 'Asia/Karachi'],
    ['GST', 'Gulf Standard Time', 'Asia/Dubai'],
    ['SGT', 'Singapore Time', 'Asia/Singapore'],
    ['HKT', 'Hong Kong Time', 'Asia/Hong_Kong'],
    ['JST', 'Japan Standard Time', 'Asia/Tokyo'],
    ['KST', 'Korea Standard Time', 'Asia/Seoul'],
    ['AEST', 'Australian Eastern Time', 'Australia/Sydney'],
    ['AWST', 'Australian Western Time', 'Australia/Perth'],
    ['NZST', 'New Zealand Time', 'Pacific/Auckland'],
    ['BRT', 'Brasília Time', 'America/Sao_Paulo'],
    ['WAT', 'West Africa Time', 'Africa/Lagos'],
    ['EAT', 'East Africa Time', 'Africa/Nairobi'],
    ['SAST', 'South Africa Time', 'Africa/Johannesburg'],
    ['PHT', 'Philippine Time', 'Asia/Manila'],
    ['WIB', 'Western Indonesia Time', 'Asia/Jakarta'],
    ['ICT', 'Indochina Time', 'Asia/Bangkok'],
    ['NPT', 'Nepal Time', 'Asia/Kathmandu'],
  ];
  const CITY_ALIASES = {
    'san francisco': 'America/Los_Angeles', 'seattle': 'America/Los_Angeles', 'las vegas': 'America/Los_Angeles',
    'washington': 'America/New_York', 'boston': 'America/New_York', 'miami': 'America/New_York', 'atlanta': 'America/New_York',
    'dallas': 'America/Chicago', 'houston': 'America/Chicago', 'montreal': 'America/Toronto', 'ottawa': 'America/Toronto',
    'mumbai': 'Asia/Kolkata', 'delhi': 'Asia/Kolkata', 'new delhi': 'Asia/Kolkata', 'bangalore': 'Asia/Kolkata',
    'bengaluru': 'Asia/Kolkata', 'chennai': 'Asia/Kolkata', 'hyderabad': 'Asia/Kolkata', 'india': 'Asia/Kolkata',
    'beijing': 'Asia/Shanghai', 'china': 'Asia/Shanghai', 'shenzhen': 'Asia/Shanghai', 'osaka': 'Asia/Tokyo',
    'munich': 'Europe/Berlin', 'frankfurt': 'Europe/Berlin', 'barcelona': 'Europe/Madrid', 'milan': 'Europe/Rome',
    'abu dhabi': 'Asia/Dubai', 'lahore': 'Asia/Karachi', 'islamabad': 'Asia/Karachi', 'uk': 'Europe/London',
    'edt': 'America/New_York', 'cdt': 'America/Chicago', 'mdt': 'America/Denver', 'pdt': 'America/Los_Angeles',
    'bst': 'Europe/London', 'cest': 'Europe/Berlin', 'aedt': 'Australia/Sydney', 'nzdt': 'Pacific/Auckland',
  };

  /* ---------- Zone list ---------- */

  let zoneNames;
  try { zoneNames = Intl.supportedValuesOf('timeZone'); } catch { zoneNames = DEFAULT_ZONES.slice(); }
  zoneNames = [...new Set(['UTC', ...zoneNames.map((z) => LEGACY[z] || z)])];

  const isValidZone = (z) => {
    try { new Intl.DateTimeFormat('en-US', { timeZone: z }); return true; } catch { return false; }
  };
  const normalizeZone = (z) => (z && isValidZone(z) ? (LEGACY[z] || z) : null);

  const cityOf = (z) => (z === 'UTC' ? 'UTC' : z.split('/').pop().replace(/_/g, ' '));
  const regionOf = (z) => {
    if (z === 'UTC') return 'Universal';
    const parts = z.split('/');
    return parts.length > 2 ? `${parts[1].replace(/_/g, ' ')}, ${parts[0]}` : parts[0];
  };

  function fillDatalist() {
    const frag = document.createDocumentFragment();
    for (const [abbr, name, zone] of ALIASES) {
      const o = document.createElement('option');
      o.value = `${abbr}, ${name} (${zone})`;
      frag.appendChild(o);
    }
    for (const z of zoneNames) {
      const o = document.createElement('option');
      o.value = `${cityOf(z)}, ${regionOf(z)} (${z})`;
      frag.appendChild(o);
    }
    $('#zone-list').appendChild(frag);
  }

  function resolveZone(text) {
    const s = text.trim();
    if (!s) return null;
    const m = s.match(/\(([^()]+)\)\s*$/);
    if (m && normalizeZone(m[1])) return normalizeZone(m[1]);
    const key = s.toLowerCase();
    const alias = ALIASES.find(([abbr]) => abbr.toLowerCase() === key);
    if (alias) return alias[2];
    if (CITY_ALIASES[key]) return CITY_ALIASES[key];
    const byName = zoneNames.find((z) => z.toLowerCase() === key || cityOf(z).toLowerCase() === key);
    if (byName) return byName;
    const byStart = zoneNames.find((z) => cityOf(z).toLowerCase().startsWith(key));
    return byStart || null;
  }

  /* ---------- Time math ---------- */

  const partsFmt = new Map();
  function zoneParts(t, zone) {
    let f = partsFmt.get(zone);
    if (!f) {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      partsFmt.set(zone, f);
    }
    const o = {};
    for (const p of f.formatToParts(t)) o[p.type] = p.value;
    return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
  }

  function offsetMinutes(t, zone) {
    const p = zoneParts(t, zone);
    const whole = Math.floor(t / 1000) * 1000;
    return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - whole) / 60000);
  }

  // Wall-clock time in a zone to a UTC timestamp. Handles DST by re-checking the offset.
  function zonedToUtc(dateStr, mins, zone) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const guess = Date.UTC(y, mo - 1, d, 0, mins);
    const off = offsetMinutes(guess, zone);
    let t = guess - off * 60000;
    const off2 = offsetMinutes(t, zone);
    if (off2 !== off) t = guess - off2 * 60000;
    return t;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const dateStrOf = (p) => `${p.y}-${pad(p.mo)}-${pad(p.d)}`;

  function formatOffset(mins) {
    if (mins === 0) return 'UTC+0';
    const sign = mins > 0 ? '+' : '−';
    const a = Math.abs(mins);
    return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
  }

  function formatDiff(mins) {
    if (mins === 0) return 'Same time';
    const a = Math.abs(mins);
    const h = Math.floor(a / 60);
    const m = a % 60;
    const amount = [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
    return `${amount} ${mins > 0 ? 'ahead' : 'behind'}`;
  }

  function timeHtml(h, mi) {
    if (!state.h12) return `${pad(h)}:${pad(mi)}`;
    return `${h % 12 || 12}:${pad(mi)}<small>${h < 12 ? 'am' : 'pm'}</small>`;
  }
  function timeText(h, mi) {
    return state.h12 ? `${h % 12 || 12}:${pad(mi)} ${h < 12 ? 'am' : 'pm'}` : `${pad(h)}:${pad(mi)}`;
  }
  const hourLabel = (h) => (state.h12 ? `${h % 12 || 12}${h < 12 ? 'a' : 'p'}` : String(h));

  const dateFmt = new Map();
  function formatDate(t, zone) {
    let f = dateFmt.get(zone);
    if (!f) {
      f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' });
      dateFmt.set(zone, f);
    }
    return f.format(t).replace(',', '');
  }
  const weekdayFmt = new Map();
  function weekday(t, zone) {
    let f = weekdayFmt.get(zone);
    if (!f) {
      f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short' });
      weekdayFmt.set(zone, f);
    }
    return f.format(t);
  }
  function abbreviation(t, zone) {
    try {
      const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
        .formatToParts(t).find((p) => p.type === 'timeZoneName');
      return name && /^[A-Z]{2,5}$/.test(name.value) && name.value !== 'UTC' ? name.value : '';
    } catch { return ''; }
  }

  const bandClass = (h) => {
    if (h >= WORK_START && h < WORK_END) return 'work';
    if (h >= 7 && h < 21) return 'day';
    if (h === 6 || h === 21) return 'twilight';
    return 'night';
  };

  /* ---------- State ---------- */

  const localZone = normalizeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
  const state = {
    from: localZone,
    date: '',
    mins: 0,
    zones: [],
    h12: false,
    live: true,
  };

  function setNow() {
    const p = zoneParts(Date.now(), state.from);
    state.date = dateStrOf(p);
    state.mins = p.h * 60 + p.mi;
    state.live = true;
  }

  function loadSaved() {
    try {
      const saved = JSON.parse(store.get('tzc:zones') || 'null');
      if (Array.isArray(saved)) state.zones = saved.map(normalizeZone).filter(Boolean);
    } catch { /* ignore */ }
    if (!state.zones.length) state.zones = DEFAULT_ZONES.slice();
    const savedFrom = normalizeZone(store.get('tzc:from'));
    if (savedFrom) state.from = savedFrom;
    const h12 = store.get('tzc:h12');
    state.h12 = h12 === null ? /^en-(US|IN|AU|CA|PH)/.test(navigator.language || '') : h12 === '1';
  }

  function applyHash() {
    const h = location.hash.slice(1);
    if (!h.includes('=')) return false;
    const q = new URLSearchParams(h);
    const from = normalizeZone(q.get('from'));
    if (!from) return false;
    state.from = from;
    const to = (q.get('to') || '').split(',').map(normalizeZone).filter(Boolean);
    if (to.length) state.zones = to;
    if (q.get('h') === '12') state.h12 = true;
    if (q.get('h') === '24') state.h12 = false;
    const t = (q.get('t') || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
    if (t) {
      state.date = t[1];
      state.mins = Math.min(1439, +t[2] * 60 + +t[3]);
      state.live = false;
    } else {
      setNow();
    }
    return true;
  }

  function cleanZones() {
    state.zones = [...new Set(state.zones)].filter((z) => z !== state.from).slice(0, MAX_ZONES - 1);
  }

  function persist() {
    store.set('tzc:zones', JSON.stringify(state.zones));
    store.set('tzc:from', state.from);
    store.set('tzc:h12', state.h12 ? '1' : '0');
  }

  function shareUrl() {
    const q = new URLSearchParams();
    q.set('from', state.from);
    q.set('to', state.zones.join(','));
    q.set('t', `${state.date}T${pad(Math.floor(state.mins / 60))}:${pad(state.mins % 60)}`);
    q.set('h', state.h12 ? '12' : '24');
    return `${location.origin}${location.pathname}#${q.toString().replace(/%2F/g, '/').replace(/%2C/g, ',').replace(/%3A/g, ':')}`;
  }

  /* ---------- Rendering ---------- */

  const icons = {
    pin: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s6-5.2 6-10A6 6 0 0 0 4 8c0 4.8 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="8" r="2.2" fill="currentColor"/></svg>',
    remove: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let bandCache = { key: '', hourStarts: [], bands: new Map() };

  function hourStarts() {
    const key = `${state.from}|${state.date}`;
    if (bandCache.key !== key) {
      bandCache = { key, hourStarts: [], bands: new Map() };
      for (let h = 0; h < 24; h++) bandCache.hourStarts.push(zonedToUtc(state.date, h * 60, state.from));
    }
    return bandCache.hourStarts;
  }

  function bandHtml(zone) {
    const cacheKey = `${zone}|${state.h12}`;
    const cached = bandCache.bands.get(cacheKey);
    if (cached) return cached;
    let html = '';
    hourStarts().forEach((t, i) => {
      const p = zoneParts(t, zone);
      const midnight = p.h === 0 && i > 0;
      const label = midnight ? weekday(t, zone) : hourLabel(p.h);
      html += `<span class="cell cell--${bandClass(p.h)}${midnight ? ' cell--midnight' : ''}" data-hour="${i}" title="${timeText(p.h, p.mi)}">${label}</span>`;
    });
    bandCache.bands.set(cacheKey, html);
    return html;
  }

  function render() {
    const t = zonedToUtc(state.date, state.mins, state.from);
    const refOffset = offsetMinutes(t, state.from);
    const all = [state.from, ...state.zones];
    const markerLeft = (state.mins / 1440) * 100;

    $('#rows').innerHTML = all.map((zone, i) => {
      const p = zoneParts(t, zone);
      const off = offsetMinutes(t, zone);
      const abbr = abbreviation(t, zone);
      const city = esc(cityOf(zone));
      const isRef = i === 0;
      const actions = isRef ? '' : `
        <button type="button" class="icon-btn" data-action="ref" data-zone="${zone}" aria-label="Convert from ${city}" title="Convert from ${city}">${icons.pin}</button>
        <button type="button" class="icon-btn" data-action="remove" data-zone="${zone}" aria-label="Remove ${city}" title="Remove ${city}">${icons.remove}</button>`;
      return `<li class="row${isRef ? ' is-ref' : ''}">
        <div class="row-head">
          <div class="place">
            <span class="city">${city}</span>
            <span class="zone-meta"><span>${esc(regionOf(zone))}</span>${abbr ? `<span>${abbr}</span>` : ''}<span>${formatOffset(off)}</span></span>
          </div>
          <span class="diff">${isRef ? 'Converting from here' : formatDiff(off - refOffset)}</span>
          <div class="clock"><span class="time">${timeHtml(p.h, p.mi)}</span><span class="date">${formatDate(t, zone)}</span></div>
          <div class="row-actions">${actions}</div>
        </div>
        <div class="band" data-zone="${zone}" aria-hidden="true">${bandHtml(zone)}<i class="marker" style="left:${markerLeft}%"></i></div>
      </li>`;
    }).join('');

    renderOverlap(all);
    renderTicks();

    $('#from-input').value = `${cityOf(state.from)}, ${regionOf(state.from)} (${state.from})`;
    $('#date-input').value = state.date;
    $('#time-input').value = `${pad(Math.floor(state.mins / 60))}:${pad(state.mins % 60)}`;
    $('#scrub').value = String(state.mins);
    $('#scrub').setAttribute('aria-valuetext', `${timeText(Math.floor(state.mins / 60), state.mins % 60)} in ${cityOf(state.from)}`);
    $('#now-btn').setAttribute('aria-pressed', String(state.live));
    document.querySelectorAll('.segmented button').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.h12 === 'true') === state.h12));
    });

    if (location.hash.includes('from=') || !state.live) history.replaceState(null, '', shareUrl().replace(location.origin, ''));
  }

  let ticksKey = '';
  function renderTicks() {
    const key = String(state.h12);
    if (ticksKey === key) return;
    ticksKey = key;
    $('#ticks').innerHTML = [0, 3, 6, 9, 12, 15, 18, 21]
      .map((h) => `<span style="left:${(h / 24) * 100}%">${hourLabel(h)}</span>`).join('');
  }

  function renderOverlap(all) {
    const out = $('#overlap');
    if (all.length < 2) { out.textContent = ''; return; }
    const starts = hourStarts();
    let best = null;
    let run = null;
    for (let i = 0; i <= 24; i++) {
      const ok = i < 24 && all.every((z) => {
        const h = zoneParts(starts[i], z).h;
        return h >= WORK_START && h < WORK_END;
      });
      if (ok) run = run ? { start: run.start, end: i + 1 } : { start: i, end: i + 1 };
      else if (run) {
        if (!best || run.end - run.start > best.end - best.start) best = run;
        run = null;
      }
    }
    const city = cityOf(state.from);
    if (!best) {
      out.textContent = `No hour on this day falls within 9:00 to 17:00 in every city. Remove a city or look for the closest early or late slot.`;
      return;
    }
    const startP = zoneParts(starts[best.start], state.from);
    const endT = best.end < 24 ? starts[best.end] : zonedToUtc(state.date, 1440, state.from);
    const endP = zoneParts(endT, state.from);
    out.textContent = `Every city is in working hours from ${timeText(startP.h, startP.mi)} to ${timeText(endP.h, endP.mi)} ${city} time.`;
  }

  /* ---------- Status messages ---------- */

  let statusTimer;
  function say(msg, isError = false) {
    const el = $('#status');
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
    clearTimeout(statusTimer);
    if (!isError) statusTimer = setTimeout(() => { el.textContent = ''; }, 4000);
  }

  /* ---------- Events ---------- */

  function setReference(zone, keepInstant) {
    if (zone === state.from) return;
    const t = zonedToUtc(state.date, state.mins, state.from);
    const old = state.from;
    state.zones = state.zones.map((z) => (z === zone ? old : z));
    state.from = zone;
    if (keepInstant) {
      const p = zoneParts(t, zone);
      state.date = dateStrOf(p);
      state.mins = p.h * 60 + p.mi;
    } else if (state.live) {
      setNow();
    }
    cleanZones();
    persist();
    render();
  }

  function bind() {
    $('#controls').addEventListener('submit', (e) => e.preventDefault());

    const fromInput = $('#from-input');
    fromInput.addEventListener('change', () => {
      const zone = resolveZone(fromInput.value);
      if (!zone) {
        fromInput.setAttribute('aria-invalid', 'true');
        say(`No time zone matches “${fromInput.value.trim()}”. Try a city like Paris or an abbreviation like EST.`, true);
        return;
      }
      fromInput.removeAttribute('aria-invalid');
      say('');
      setReference(zone, false);
    });
    fromInput.addEventListener('focus', () => fromInput.select());

    $('#date-input').addEventListener('change', (e) => {
      if (!e.target.value) return;
      state.date = e.target.value;
      state.live = false;
      render();
    });
    $('#time-input').addEventListener('change', (e) => {
      const m = e.target.value.match(/^(\d{2}):(\d{2})/);
      if (!m) return;
      state.mins = +m[1] * 60 + +m[2];
      state.live = false;
      render();
    });
    $('#scrub').addEventListener('input', (e) => {
      state.mins = Math.min(1439, +e.target.value);
      state.live = false;
      render();
    });
    $('#now-btn').addEventListener('click', () => { setNow(); render(); });

    document.querySelector('.segmented').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.h12 = b.dataset.h12 === 'true';
      ticksKey = '';
      persist();
      render();
    });

    $('#rows').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        const zone = btn.dataset.zone;
        if (btn.dataset.action === 'remove') {
          state.zones = state.zones.filter((z) => z !== zone);
          persist();
          render();
          say(`Removed ${cityOf(zone)}.`);
        } else {
          setReference(zone, true);
          say(`Converting from ${cityOf(zone)}.`);
        }
        return;
      }
      const cell = e.target.closest('.cell');
      if (cell) {
        state.mins = +cell.dataset.hour * 60 + (state.mins % 60);
        state.live = false;
        render();
      }
    });

    $('#add-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#add-input');
      const value = input.value.trim();
      if (!value) { say('Type a city or abbreviation, then choose Add city.', true); input.focus(); return; }
      const zone = resolveZone(value);
      if (!zone) {
        input.setAttribute('aria-invalid', 'true');
        say(`No time zone matches “${value}”. Try a city like Paris or an abbreviation like EST.`, true);
        return;
      }
      input.removeAttribute('aria-invalid');
      if (zone === state.from || state.zones.includes(zone)) { say(`${cityOf(zone)} is already in the list.`, true); return; }
      if (state.zones.length >= MAX_ZONES - 1) { say(`The list holds ${MAX_ZONES} cities. Remove one to add ${cityOf(zone)}.`, true); return; }
      state.zones.push(zone);
      persist();
      render();
      input.value = '';
      say(`Added ${cityOf(zone)}.`);
    });

    $('#share-btn').addEventListener('click', async () => {
      const url = shareUrl();
      try {
        await navigator.clipboard.writeText(url);
        say('Link copied. It opens this exact time and list of cities.');
      } catch {
        window.prompt('Copy this link:', url);
      }
    });

    window.addEventListener('hashchange', () => {
      if (applyHash()) {
        cleanZones();
        persist();
        render();
        $('#converter').scrollIntoView({ block: 'start' });
      }
    });

    setInterval(() => {
      if (state.live && document.visibilityState === 'visible') { setNow(); render(); }
    }, 15000);
    document.addEventListener('visibilitychange', () => {
      if (state.live && document.visibilityState === 'visible') { setNow(); render(); }
    });
  }

  /* ---------- Start ---------- */

  loadSaved();
  if (!applyHash()) setNow();
  cleanZones();
  fillDatalist();
  bind();
  render();
})();
