/* First-party visible-document presence. No learning/activity writes. */
(() => {
  'use strict';
  const csrf = document.currentScript.dataset.csrf;
  const root = document.querySelector('.presence');
  const byId = id => document.getElementById(`presence-${id}`);
  const toggle = byId('toggle'), panel = byId('panel');
  let page = 1, pages = 1, busy = false, stopped = false, timer, controller;
  let heartbeatPending = false, suspended = false;
  function face(member) {
    const node = document.createElement('span'); node.className = 'presence-face';
    node.textContent = member.name.trim().slice(0, 2).toUpperCase();
    if (member.photo_url) {
      const image = document.createElement('img'); image.src = member.photo_url; image.alt = '';
      image.addEventListener('error', () => image.remove()); node.append(image);
    }
    return node;
  }
  function render(data) {
    if (!root) return;
    root.dataset.state = 'ready';
    byId('label').textContent = `ออนไลน์ ${data.total}`;
    toggle.setAttribute('aria-label', `ออนไลน์ ${data.total} คน ดูรายชื่อสมาชิก`);
    byId('stack').replaceChildren(...data.members.slice(0, 3).map(face));
    byId('members').replaceChildren(...data.members.map(member => {
      const li = document.createElement('li'), link = document.createElement('a');
      const name = document.createElement('span'), handle = document.createElement('small');
      link.href = member.profile_url; name.textContent = member.name;
      handle.textContent = `@${member.username}`; name.append(handle);
      link.append(face(member), name); li.append(link); return li;
    }));
    byId('status').textContent = data.total ? `ออนไลน์ ${data.total} คน` : 'ยังไม่มีสมาชิกออนไลน์';
    byId('page').textContent = `${page} / ${pages}`;
    byId('retry').hidden = true;
  }
  function unavailable(message = 'ตรวจสอบออนไลน์ไม่ได้') {
    if (!root) return;
    root.dataset.state = 'error'; byId('label').textContent = message;
    toggle.setAttribute('aria-label', `${message} ดูรายละเอียด`);
    byId('stack').replaceChildren(); byId('members').replaceChildren();
    byId('status').textContent = stopped ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง' : 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่';
    byId('page').textContent = ''; byId('retry').hidden = stopped;
  }
  function controls() {
    if (!root) return;
    const disabled = busy || root.dataset.state !== 'ready';
    byId('prev').disabled = disabled || page <= 1;
    byId('next').disabled = disabled || page >= pages;
    byId('retry').disabled = busy;
  }
  async function refresh(heartbeat = true) {
    if (document.visibilityState !== 'visible' || stopped || suspended) return;
    if (busy) { heartbeatPending ||= heartbeat; return; }
    heartbeatPending = false;
    if (heartbeat) clearTimeout(timer);
    busy = true; controls();
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`/api/presence?page=${page}`, {
        method: heartbeat ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        headers: heartbeat ? {'Content-Type': 'application/json', 'X-CSRF-Token': csrf} : {},
        ...(heartbeat ? {body: '{}'} : {}), signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) stopped = true;
      if (!response.ok) throw new Error('presence unavailable');
      const data = await response.json();
      if (!Number.isInteger(data.total) || !Array.isArray(data.members)) throw new Error('invalid snapshot');
      page = data.page; pages = data.pages; render(data);
    } catch (_) { unavailable(); }
    finally {
      clearTimeout(timeout); busy = false; controls();
      if (stopped || suspended || document.visibilityState !== 'visible') {
        clearTimeout(timer); heartbeatPending = false;
      } else {
        if (heartbeatPending) refresh();
        else if (heartbeat) timer = setTimeout(refresh, 30000);
      }
    }
  }
  function close(restore = false) {
    if (!panel) return;
    panel.hidden = true; toggle.setAttribute('aria-expanded', 'false');
    if (restore) toggle.focus();
  }
  if (root) {
    toggle.addEventListener('click', () => {
      panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) refresh(false);
    });
    byId('close').addEventListener('click', () => close(true));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) close(true); });
    document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
    for (const [id, delta] of [['prev', -1], ['next', 1]]) byId(id).addEventListener('click', () => { page += delta; refresh(false); });
    byId('retry').addEventListener('click', () => refresh());
  }
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (document.visibilityState === 'visible') { refresh(); }
    else { controller?.abort(); close(); }
  });
  window.addEventListener('pagehide', () => { suspended = true; clearTimeout(timer); controller?.abort(); });
  window.addEventListener('pageshow', () => { suspended = false; refresh(); });
  refresh();
})();
