# 🕐 查看你的 ChatGPT / OpenAI 账号注册时间

> 不用第三方网站、不碰密码,在自己浏览器里跑一段代码,**3 秒**查出你的 OpenAI 账号是哪天注册的。

OpenAI 官方页面没有直接显示「注册时间」,但它的接口 `https://api.openai.com/v1/me` 里藏着一个 `created` 字段,那就是你的账号创建时间。本教程教你把它读出来,并转成北京时间。

✅ 全程在你**自己的浏览器本地**完成,token 不经过任何第三方,代码完全公开可审,安全。

---

## 📺 效果

跑完后,浏览器控制台会直接打印:

```
🎉 你的 OpenAI / ChatGPT 注册时间
2025/4/30 23:20:41
账号邮箱: your@email.com
原始时间戳 created = 1746026441
```

---

## 🚀 方法一:浏览器控制台(推荐,30 秒搞定)

> 前提:你的网络能正常打开 `platform.openai.com`(平时能用 ChatGPT 就行)。

### 步骤

1. 用浏览器(Chrome / Edge 等)打开 **<https://platform.openai.com>** 并登录。
2. 按 **`F12`** 打开开发者工具,切到 **Console(控制台)** 标签页。
3. 把下面整段代码复制进去,按回车。
   > ⚠️ Chrome / Edge 第一次在控制台粘贴代码时会拦截,提示你手动输入 `allow pasting`(允许粘贴)并回车,之后再粘贴代码即可。
4. 看输出的绿色大字,那就是你的注册时间。

<!-- 想配图的话,可以在这里插一张控制台输出的截图 -->

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

  // 2) 带 token 请求官方接口 /v1/me,读取 created
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

认准**最外层那个 `created`**就对了。

---

## 🧠 原理(给好奇的人)

- OpenAI 网页登录后,浏览器本地存着一个访问令牌(access token)。
- 拿这个 token 请求官方接口 `GET https://api.openai.com/v1/me`,会返回当前账号资料,其中 `created` 是 Unix 时间戳(单位:秒)。
- 脚本做的事:① 从浏览器本地存储(localStorage / sessionStorage)里翻出这个 token;② 带着它请求 `/v1/me`;③ 把 `created` ×1000 转成可读的北京时间。

> 注:新版 `platform.openai.com` 是单页应用(SPA),一些老教程里用的 `/api/auth/session` 地址已经失效,直接用 `/v1/me` 最稳。

---

## ❓ 常见问题 FAQ

**Q:粘贴代码没反应 / 控制台报红?**
A:① 确认是在 `platform.openai.com` 这个页面的控制台里跑的,不是别的网站;② 确认已登录;③ Chrome 拦截粘贴时要先输入 `allow pasting` 再粘代码。

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
- 如果要把控制台结果**截图发出去**,记得把 `邮箱`、`id` 等信息打码,只留注册时间。

---

## 📄 License

[MIT](LICENSE) —— 随意使用、转载、修改,保留出处即可。

---

> 如果这份教程帮到你,欢迎 **Star ⭐** / 转发分享。
