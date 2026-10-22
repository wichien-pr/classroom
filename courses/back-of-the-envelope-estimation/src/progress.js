// Generic same-origin account progress; never reads browser-local progress.
export function createAccountProgress(endpoint, fetcher = globalThis.fetch) {
  let csrf;
  let queue = Promise.resolve();
  const store = {
    completed: [], total: 0, status: 'loading',
    async load() {
      store.status = 'loading';
      try {
        const response = await fetcher(endpoint, {credentials:'same-origin', cache:'no-store'});
        if (!response.ok) throw new Error('Progress load failed');
        const data = await response.json();
        csrf = data.csrf_token;
        store.completed = data.completed;
        store.total = data.total;
        store.criteria = data.criteria || {};
        store.status = 'saved';
      } catch (error) {
        csrf = undefined;
        store.status = 'load-error';
        throw error;
      }
    },
    refresh() {
      const operation = queue.then(() => store.load());
      queue = operation.catch(() => {});
      return operation;
    },
    complete(lessonId) {
      const operation = queue.then(async () => {
        if (!csrf) throw new Error('Load account progress before saving');
        store.status = 'saving';
        try {
          const response = await fetcher(endpoint, {
            method:'POST', credentials:'same-origin',
            headers:{'Content-Type':'application/json', 'X-CSRF-Token':csrf},
            body:JSON.stringify({lesson_id:lessonId,manual:true})
          });
          if (!response.ok) throw new Error('Progress save failed');
          const data = await response.json();
          store.completed = data.completed;
          store.total = data.total;
          store.criteria = data.criteria || {};
          store.status = 'saved';
        } catch (error) {
          store.status = 'save-error';
          throw error;
        }
      });
      queue = operation.catch(() => {});
      return operation;
    }
  };
  return store;
}
