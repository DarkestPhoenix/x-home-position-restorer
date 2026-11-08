// ==UserScript==
// @name         X Home Position Restorer (Mobile)
// @namespace    https://x.com/
// @version      1.2.1
// @description  Snapshot last Home position on leave; floating Restore + Auto button (bottom-left)
// @author       Custom
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'xHomePos_last';
  const AUTO_KEY = 'xHomePos_auto';
  const BTN_ID = 'x-home-pos-float';

  let isRestoring = false;
  let restoreAbort = false;
  let currentHomePos = null;
  let wasOnHome = false;

  function loadPosition() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }
  function savePosition(data) {
    if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getAuto() { return sessionStorage.getItem(AUTO_KEY) === '1'; }
  function setAuto(on) { sessionStorage.setItem(AUTO_KEY, on ? '1' : '0'); }

  function isHome() {
    return location.pathname === '/home' || location.pathname === '/';
  }

  function getTweetId(article) {
    const link = article.querySelector('a[href*="/status/"]');
    if (!link) return null;
    const m = link.href.match(/\/status\/(\d+)/);
    return m ? m[1] : null;
  }

  function getTopVisibleTweet() {
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    let best = null, bestTop = Infinity;
    for (const art of articles) {
      const rect = art.getBoundingClientRect();
      if (rect.bottom > 60 && rect.top < window.innerHeight * 0.55 && rect.top > -150) {
        if (rect.top < bestTop) { bestTop = rect.top; best = art; }
      }
    }
    if (!best) return null;
    const id = getTweetId(best);
    return id ? { tweetId: id, offset: best.getBoundingClientRect().top } : null;
  }

  function findTweetById(id) {
    const links = document.querySelectorAll(`a[href*="/status/${id}"]`);
    for (const link of links) {
      const art = link.closest('article[data-testid="tweet"]');
      if (art) return art;
    }
    return null;
  }

  function updateLivePosition() {
    if (!isHome() || isRestoring) return;
    const pos = getTopVisibleTweet();
    if (pos) currentHomePos = { ...pos, ts: Date.now() };
  }

  let trackTimer;
  function scheduleLiveTrack() {
    clearTimeout(trackTimer);
    trackTimer = setTimeout(updateLivePosition, 250);
  }
  window.addEventListener('scroll', scheduleLiveTrack, { passive: true });
  setInterval(scheduleLiveTrack, 1500);

  function onMaybeLeaveHome() {
    const nowHome = isHome();
    if (wasOnHome && !nowHome && currentHomePos) {
      savePosition(currentHomePos);
      console.log('[Home Pos] Snapshotted on leave:', currentHomePos.tweetId);
    }
    wasOnHome = nowHome;
  }

  async function restorePosition() {
    const saved = loadPosition();
    if (!saved?.tweetId) {
      alert('No saved Home position yet. Leave Home after scrolling to create one.');
      return;
    }
    if (isRestoring) { restoreAbort = true; return; }

    isRestoring = true;
    restoreAbort = false;
    updateFloatText('…');

    const targetId = saved.tweetId;
    const targetOffset = saved.offset || 80;

    const cancel = () => { restoreAbort = true; };
    ['wheel', 'touchmove', 'keydown'].forEach(ev =>
      window.addEventListener(ev, cancel, { once: true, passive: true })
    );

    let attempts = 0;
    while (!restoreAbort && attempts < 45) {
      const art = findTweetById(targetId);
      if (art) {
        const delta = art.getBoundingClientRect().top - targetOffset;
        window.scrollBy(0, delta);
        art.style.outline = '3px solid #1d9bf0';
        setTimeout(() => art.style.outline = '', 3000);
        break;
      }
      window.scrollBy(0, window.scrollY < 80 ? 500 : -700);
      attempts++;
      await new Promise(r => setTimeout(r, 180));
    }

    isRestoring = false;
    restoreAbort = false;
    updateFloatText();
  }

  function checkNavigation() {
    onMaybeLeaveHome();
    if (isHome() && getAuto() && loadPosition() && !isRestoring) {
      setTimeout(() => { if (isHome() && getAuto()) restorePosition(); }, 600);
    }
  }

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function () { origPush.apply(this, arguments); setTimeout(checkNavigation, 40); };
  history.replaceState = function () { origReplace.apply(this, arguments); setTimeout(checkNavigation, 40); };
  window.addEventListener('popstate', () => setTimeout(checkNavigation, 40));
  setInterval(checkNavigation, 700);

  // ---------- Floating button (bottom-left) ----------
  function updateFloatText(override) {
    const el = document.getElementById(BTN_ID);
    if (!el) return;
    const label = el.querySelector('.xhp-label');
    if (label) label.textContent = override || 'Restore';
  }

  function createFloat() {
    if (document.getElementById(BTN_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = BTN_ID;
    wrap.style.cssText = `
      position: fixed; bottom: 72px; left: 16px; z-index: 99999;
      display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const btn = document.createElement('button');
    btn.style.cssText = `
      background: #1d9bf0; color: white; border: none; border-radius: 9999px;
      padding: 10px 16px; font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 6px;
    `;
    btn.innerHTML = `<span class="xhp-label">Restore</span>`;
    btn.addEventListener('click', restorePosition);

    const toggleRow = document.createElement('label');
    toggleRow.style.cssText = `
      background: rgba(0,0,0,0.75); color: white; border-radius: 9999px;
      padding: 4px 10px; font-size: 12px; display: flex; align-items: center; gap: 4px;
      cursor: pointer; user-select: none;
    `;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = getAuto();
    cb.addEventListener('change', () => setAuto(cb.checked));
    toggleRow.appendChild(cb);
    toggleRow.appendChild(document.createTextNode('Auto'));

    wrap.appendChild(btn);
    wrap.appendChild(toggleRow);
    document.body.appendChild(wrap);
  }

  const obs = new MutationObserver(createFloat);
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(createFloat, 800);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isRestoring) restoreAbort = true;
  });

  wasOnHome = isHome();
  if (wasOnHome) updateLivePosition();

  console.log('[Home Pos Mobile] Loaded. Floating button bottom-left.');
})();
