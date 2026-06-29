/**
 * 查询 OpenAI / ChatGPT 账号注册时间(增强版)
 * -------------------------------------------------
 * 用法:
 *   1. 浏览器打开并登录 https://platform.openai.com
 *   2. 按 F12 -> Console(控制台)
 *   3. 复制本文件全部内容,粘贴进去,回车
 *      (Chrome/Edge 首次粘贴需先手动输入 allow pasting)
 *   4. 页面会弹出一张卡片,显示注册日期 / 已注册天数 / 账号年龄
 *
 * 原理: 带登录 token 请求官方接口 GET https://api.openai.com/v1/me,
 *       读取其中的 created 字段(Unix 秒级时间戳),换算成日期与时长。
 */
(async () => {
  const orig = window.fetch.bind(window);

  // ── 1) 从浏览器本地存储里翻出登录 token ──
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

  // ── 2) 带 token 请求官方接口 /v1/me ──
  let me = null;
  for (const token of tokens) {
    try {
      const res = await orig('https://api.openai.com/v1/me', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.created) { me = data; break; }
    } catch {}
  }
  if (!me) {
    console.error('❌ 没查到。请确认:① 已登录 platform.openai.com  ② 是在该页面的控制台里运行');
    return;
  }

  // ── 3) 计算注册时长(锚点法,正确处理月末/闰年借位) ──
  const TZ = 'Asia/Shanghai';
  const addMonths = (date, n) => {
    const m = date.getMonth() + n;
    const ty = date.getFullYear() + Math.floor(m / 12);
    const tm = ((m % 12) + 12) % 12;
    const last = new Date(ty, tm + 1, 0).getDate();
    const r = new Date(date);
    r.setFullYear(ty, tm, Math.min(date.getDate(), last));
    return r;
  };
  const created = new Date(me.created * 1000);
  const now = new Date();
  const totalDays = Math.floor((now - created) / 86400000);
  let months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  if (addMonths(created, months) > now) months--;
  const days = Math.floor((now - addMonths(created, months)) / 86400000);
  const years = Math.floor(months / 12), mon = months % 12;

  const dateStr = created.toLocaleDateString('zh-CN', { timeZone: TZ, year: 'numeric', month: 'long', day: 'numeric' });
  const weekday = created.toLocaleDateString('zh-CN', { timeZone: TZ, weekday: 'long' });
  const timeStr = created.toLocaleTimeString('zh-CN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const ageStr = [years && `${years} 年`, mon && `${mon} 个月`, days && `${days} 天`].filter(Boolean).join(' ') || '今天';

  // ── 4) 控制台输出(完整信息,本地查看) ──
  console.log('%c🎉 我的 OpenAI / ChatGPT 账号档案', 'font-size:16px;font-weight:bold;color:#10a37f');
  console.log(`📅 注册时间: ${dateStr} ${weekday} ${timeStr}`);
  console.log(`⏳ 账号年龄: ${ageStr}`);
  console.log(`🔢 已陪伴: ${totalDays} 天`);
  if (me.email) console.log(`📧 邮箱: ${me.email}`);

  // ── 5) 弹出漂亮卡片(适合截图分享,邮箱自动打码) ──
  document.getElementById('gpt-age-card')?.remove();
  const mask = document.createElement('div');
  mask.id = 'gpt-age-card';
  mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);font-family:system-ui,-apple-system,"Segoe UI",sans-serif';
  const maskedMail = me.email ? me.email.replace(/(.{1,3}).*(@.*)/, '$1***$2') : '';
  mask.innerHTML = `
    <div style="width:330px;padding:30px 26px;border-radius:22px;background:linear-gradient(160deg,#10a37f,#0c7a5e);color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.45);text-align:center">
      <div style="font-size:12px;letter-spacing:2px;opacity:.8">MY CHATGPT ACCOUNT</div>
      <div style="font-size:15px;margin-top:2px;opacity:.92">我的 ChatGPT 注册时间</div>
      <div style="font-size:28px;font-weight:800;margin:16px 0 2px">${dateStr}</div>
      <div style="font-size:13px;opacity:.9">${weekday} · ${timeStr}</div>
      <div style="margin:20px 0 6px;padding:16px;border-radius:16px;background:rgba(255,255,255,.14)">
        <div style="font-size:13px;opacity:.85">已陪伴</div>
        <div style="font-size:46px;font-weight:800;line-height:1.1">${totalDays}</div>
        <div style="font-size:13px;opacity:.85">天</div>
      </div>
      <div style="font-size:15px;font-weight:600;margin-top:10px">${ageStr}</div>
      <div style="font-size:12px;opacity:.7;margin-top:6px">${maskedMail}</div>
      <div id="gpt-age-close" style="margin-top:20px;padding:11px;border-radius:12px;background:rgba(255,255,255,.92);color:#0c7a5e;font-weight:700;font-size:14px;cursor:pointer">关闭</div>
    </div>`;
  mask.addEventListener('click', e => { if (e.target === mask || e.target.id === 'gpt-age-close') mask.remove(); });
  document.body.appendChild(mask);
})();
