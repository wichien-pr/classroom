// Optional integration; standalone builds have no platform dependency.
export function classroomLink(url) {
  if (typeof url !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(url)) return '';
  return `<div class="classroom-exit"><a href="${url}" aria-label="ออกจากคลาส · กลับหน้าแรก">← ออกจากคลาส · กลับหน้าแรก</a><span>Classroom</span></div>`;
}
