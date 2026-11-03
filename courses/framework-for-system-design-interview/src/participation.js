// Account-only; no imports from the platform and no ambiguous local fallback.
export function createParticipation(endpoint, request=fetch) {
  const client={score:null,status:'loading',pending:null,csrf:null,
    async load(){
      client.status='loading';
      try {
        const response=await request(endpoint,{credentials:'same-origin',cache:'no-store'});
        if(!response.ok) throw Error('load');
        const data=await response.json(); client.score=data.score; client.csrf=data.csrf_token;
        client.status='saved';
      } catch {client.status='load-error';}
    },
    async record(lesson,action,simulation=lesson){
      if(client.status!=='saved') return;
      client.pending={lesson_id:lesson,simulation_id:simulation,action,event_id:crypto.randomUUID()};
      await client.retry();
    },
    async retry(){
      if(!client.pending || client.status==='saving') return;
      client.status='saving';
      try {
        const response=await request(endpoint,{method:'POST',credentials:'same-origin',
          headers:{'Content-Type':'application/json','X-CSRF-Token':client.csrf},body:JSON.stringify(client.pending)});
        if(!response.ok) throw Error('save');
        const data=await response.json(); client.score=data.score; client.csrf=data.csrf_token;
        client.reason=data.reason; client.pending=null; client.status='saved';
      }catch{client.status='save-error';}
    }
  };
  return client;
}
