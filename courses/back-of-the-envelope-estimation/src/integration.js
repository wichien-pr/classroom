// Optional integration; standalone builds have no platform dependency.
export function classroomLink(url) {
  if (typeof url !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(url)) return '';
  return `<div class="classroom-exit"><a href="${url}" aria-label="ออกจากคลาส · กลับหน้าแรก">← ออกจากคลาส · กลับหน้าแรก</a><button id="theme-toggle" type="button" aria-label="ธีมมืด" aria-pressed="false" title="สลับธีม Dark / Light" hidden><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/></svg><span data-theme-label>Light</span></button></div>`;
}
