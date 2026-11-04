export const reviewTopics={
 recap:'สรุปแบบที่เลือกและทางเลือกที่เคยเสนอ',
 bottleneck:'ระบุคอขวดและแนวทางปรับปรุง',
 failure:'ทบทวน server failure และ network loss',
 operations:'กำหนด metrics, error logs และแผน rollout',
 refinement:'ระบุสิ่งที่จะปรับเพิ่มหากมีเวลา',
 feedback:'ขอความเห็นลูกค้าและตกลงสิ่งที่ต้องทำต่อ'
};
export function reviewWrapUp(input={}){
 const missing=Object.keys(reviewTopics).filter(k=>input[k]!==true);
 const measured=input.growth==='investigate';
 return {missing,measured,ready:missing.length===0&&measured};
}
