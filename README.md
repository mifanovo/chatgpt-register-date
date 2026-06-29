# 🕐 查看你的 ChatGPT / OpenAI 账号注册时间

> 不用第三方网站、不碰密码,在自己浏览器里跑一段代码,**3 秒**查出你的 OpenAI 账号是哪天注册的,还能看到**注册了多少天**、**账号年龄**。

OpenAI 官方页面没有直接显示「注册时间」,但它的接口 `https://api.openai.com/v1/me` 里藏着一个 `created` 字段,那就是你的账号创建时间。本教程教你把它读出来,转成北京时间,并算好你的账号年龄。

✅ 全程在你**自己的浏览器本地**完成,token 不经过任何第三方,代码完全公开可审,安全。

---

## 📺 效果

跑完脚本后,页面会弹出一张卡片(适合直接截图分享,邮箱已自动打码):

```
╔════════════════════════════╗
║      MY CHATGPT ACCOUNT      ║
║      我的 ChatGPT 注册时间     ║
║                              ║
║        2025年4月30日          ║
║        星期三 · 23:20         ║
║   ┌──────────────────────┐   ║
║   │         已陪伴         │   ║
║   │          425          │   ║
║   │           天           │   ║
║   └──────────────────────┘   ║
║       1 年 1 个月 29 天        ║
║       mif***@gmail.com       ║
║          [  关闭  ]          ║
╚════════════════════════════╝
```

同时控制台也会打印一份纯文字(方便复制):

```
🎉 我的 OpenAI / ChatGPT 账号档案
📅 注册时间: 2025年4月30日 星期三 23:20
⏳ 账号年龄: 1 年 1 个月 29 天
🔢 已陪伴: 425 天
📧 邮箱: your@email.com
```

---

## 🚀 方法一:浏览器控制台(推荐,30 秒搞定)

> 前提:你的网络能正常打开 `platform.openai.com`(平时能用 ChatGPT 就行)。

### 步骤

1. 用浏览器(Chrome / Edge 等)打开 **<https://platform.openai.com>** 并登录。
2. 按 **`F12`** 打开开发者工具,切到 **Console(控制台)** 标签页。
3. 把下面整段代码复制进去,按回车。
   > ⚠️ Chrome / Edge 第一次在控制台粘贴代码时会拦截,提示你手动输入 `allow pasting`(允许粘贴)并回车,之后再粘贴代码即可。
4. 页面弹出卡片,显示你的注册日期、已注册天数和账号年龄。

<!-- 想配图的话,可以在这里插一张卡片截图 -->

### 代码

```javascript
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

  // 2) 带 token 请求官方接口 /v1/me
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

  // 3) 计算注册时长(锚点法,正确处理月末/闰年借位)
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

  // 4) 控制台输出(完整信息,本地查看)
  console.log('%c🎉 我的 OpenAI / ChatGPT 账号档案', 'font-size:16px;font-weight:bold;color:#10a37f');
  console.log(`📅 注册时间: ${dateStr} ${weekday} ${timeStr}`);
  console.log(`⏳ 账号年龄: ${ageStr}`);
  console.log(`🔢 已陪伴: ${totalDays} 天`);
  if (me.email) console.log(`📧 邮箱: ${me.email}`);

  // 5) 弹出漂亮卡片(适合截图分享,邮箱自动打码)
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
```

---

## 🖐 方法二:手动抓包(不想跑代码的话)

1. 登录 `platform.openai.com`,按 `F12` → 切到 **Network(网络)** 面板。
2. 在筛选框里输入 `me`。
3. 刷新页面,找到名为 **`me`** 的那条请求,点开 → 看 **Response(响应)**。
4. 里面的 `"created": 1746026441` 就是注册时间戳。
5. 把这个数字转成日期 —— 在控制台输入 `new Date(1746026441 * 1000)` 回车即可看到(把数字换成你自己的)。

---

## 🔍 返回结果怎么看(重要)

接口会返回好几个 `created`,别搞混:

| 字段 | 含义 |
|---|---|
| `created`(最外层) | ✅ **你的账号注册时间** —— 看这个 |
| `orgs.data[0].created` | 你默认组织的创建时间,通常和注册同一刻 |
| `orgs.data[1].created`、`[2]`… | 你后来新建 / 加入的其他组织,**不是**注册时间 |

认准**最外层那个 `created`**就对了(脚本已经帮你挑好)。

---

## 🧠 原理(给好奇的人)

- OpenAI 网页登录后,浏览器本地存着一个访问令牌(access token)。
- 拿这个 token 请求官方接口 `GET https://api.openai.com/v1/me`,会返回当前账号资料,其中 `created` 是 Unix 时间戳(单位:秒)。
- 脚本做的事:① 从浏览器本地存储(localStorage / sessionStorage)里翻出这个 token;② 带着它请求 `/v1/me`;③ 把 `created` ×1000 转成北京时间;④ 用纯前端的日期运算算出「已注册多少天」和「几年几个月几天」(月末、闰年借位都处理好了),最后画成卡片。

> 注:新版 `platform.openai.com` 是单页应用(SPA),一些老教程里用的 `/api/auth/session` 地址已经失效,直接用 `/v1/me` 最稳。

---

## ❓ 常见问题 FAQ

**Q:粘贴代码没反应 / 控制台报红?**
A:① 确认是在 `platform.openai.com` 这个页面的控制台里跑的,不是别的网站;② 确认已登录;③ Chrome 拦截粘贴时要先输入 `allow pasting` 再粘代码。

**Q:卡片没弹出来?**
A:可能被浏览器扩展挡了。控制台里那份纯文字结果一样能看;或刷新页面重跑一次。

**Q:提示「没查到」?**
A:多半是没登录,或当前页面不是 OpenAI 域名。重新登录 `platform.openai.com` 后再试。

**Q:时间准吗?**
A:`created` 是 OpenAI 服务器记录的账号创建时间,精确到秒。脚本默认转成北京时间(东八区)。

**Q:安全吗?会泄露密码吗?**
A:不碰密码。整个过程只在你自己的浏览器里完成,token 不会发给任何第三方,代码也完全公开、可逐行审查。

---

## 🔒 安全与隐私提示

- 这段代码**只读取**账号创建时间,不修改任何数据,也不会上传到别处。
- ⚠️ **不要**把别人发给你的、看不懂的控制台代码随手粘贴运行 —— 那种「自我 XSS」是常见的盗号手段。本教程代码很短,建议你看懂再跑。
- 卡片里的邮箱已自动打码;如果你从**控制台**截图,记得把完整 `邮箱`、`id` 等信息打码,只留注册时间。

---

## 📄 License

[MIT](LICENSE) —— 随意使用、转载、修改,保留出处即可。

---

> 如果这份教程帮到你,欢迎 **Star ⭐** / 转发分享。
