/**
 * 查询 OpenAI / ChatGPT 账号注册时间
 * -------------------------------------------------
 * 用法:
 *   1. 浏览器打开并登录 https://platform.openai.com
 *   2. 按 F12 -> Console(控制台)
 *   3. 复制本文件全部内容,粘贴进去,回车
 *      (Chrome/Edge 首次粘贴需先手动输入 allow pasting)
 *   4. 看绿色大字输出的注册时间
 *
 * 原理: 带登录 token 请求官方接口 GET https://api.openai.com/v1/me,
 *       读取其中的 created 字段(Unix 秒级时间戳)并转成北京时间。
 */
(async () => {
  const orig = window.fetch.bind(window);

  // 1) 从浏览器本地存储里翻出登录 token
  const tokens = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const v = JSON.parse(localStorage.getItem(localStorage.key(i)));
      const t = v?.body?.access_token || v?.access_token;
      if (t) tokens.add(t);
    } catch {}
  }
  [localStorage, sessionStorage].forEach(s => {
    for (let i = 0; i < s.length; i++) {
      const m = (s.getItem(s.key(i)) || '').match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g);
      if (m) m.forEach(x => tokens.add(x));
    }
  });

  // 2) 带 token 请求 /v1/me,读取 created
  for (const token of tokens) {
    try {
      const res = await orig('https://api.openai.com/v1/me', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) continue;
      const me = await res.json();
      if (!me.created) continue;

      const d = new Date(me.created * 1000);
      console.log('%c🎉 你的 OpenAI / ChatGPT 注册时间', 'font-size:16px;font-weight:bold;color:#10a37f');
      console.log('%c' + d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
                  'font-size:22px;font-weight:bold;color:#10a37f');
      console.log('账号邮箱:', me.email || '(接口未返回)');
      console.log('原始时间戳 created =', me.created);
      return;
    } catch {}
  }

  console.error('❌ 没查到。请确认:① 已登录 platform.openai.com  ② 是在该页面的控制台里运行的');
})();
