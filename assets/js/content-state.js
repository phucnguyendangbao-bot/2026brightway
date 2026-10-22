/* Shared loading/error/retry for the legacy public CMS views. */
(function () {
  'use strict';
  const requests = new WeakMap();

  async function load(host, request, render, { errorTitle = 'Chưa tải được nội dung', retry, timeoutMs = 10000 } = {}) {
    const token = {};
    requests.set(host, token);
    host.setAttribute('aria-busy', 'true');
    const status = document.createElement('div');
    status.className = 'bw-content-state';
    status.setAttribute('role', 'status');
    status.textContent = 'Đang tải nội dung…';
    host.replaceChildren(status);
    let timer;
    try {
      const data = await Promise.race([
        Promise.resolve().then(request),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('content-timeout')), timeoutMs); }),
      ]);
      if (requests.get(host) !== token) return;
      render(data);
    } catch {
      if (requests.get(host) !== token) return;
      const state = document.createElement('div');
      state.className = 'bw-content-state';
      state.setAttribute('role', 'status');
      const heading = document.createElement('h2');
      heading.textContent = errorTitle;
      const detail = document.createElement('p');
      detail.textContent = 'Kết nối bị gián đoạn hoặc phản hồi quá chậm. Bạn có thể thử lại; bộ lọc đang chọn được giữ nguyên.';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bw-ui-button';
      button.textContent = 'Thử lại';
      button.addEventListener('click', () => {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        retry?.();
      });
      state.append(heading, detail, button);
      host.replaceChildren(state);
    } finally {
      clearTimeout(timer);
      if (requests.get(host) === token) host.setAttribute('aria-busy', 'false');
    }
  }
  window.BWContent = { load };
})();
