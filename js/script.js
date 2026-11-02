/* ============ script.js — 首页模块 ============ */
const HomeApp = (() => {
  const $ = (s, c = document) => c.querySelector(s);

  /* ---------- 数据 ---------- */
  const personal = {
    info: [
      { key: "姓名", val: "幽鸿" },
      { key: "身份", val: "苦逼高中生qwq" },
      { key: "生日", val: "3.7" },
      { key: "所在地", val: "China" },
      { key: "状态", val: "上学ing...", dot: true }
    ],
    meta: [
      { key: "MBTI", val: "INFP" },
      { key: "星座", val: "双鱼座" },
      { key: "血型", val: "A型" }
    ]
  };

  const socials = [
    { icon: "𝕏", label: "推特", href: "https://x.com/YoHon11638", img: "piv/X.png", type: "link" },
    { icon: "🐧", label: "QQ", copy: "1923497173", img: "piv/qq.png", type: "copy" },
    { icon: "▶️", label: "Youtube", href: "https://www.youtube.com/@YoHon-c2n4e", img: "piv/youtube.svg", type: "link" },
    { icon: "🐙", label: "GitHub", href: "https://github.com/YouHon-star", img: "piv/github.png", type: "link" },
    { icon: "📧", label: "邮箱", copy: "yohon2348@gmail.com", img: "piv/email.png", type: "copy" }
  ];

  const typedWords = ["懒懒", "失眠", "穷穷", "无聊"];

  /* ---------- 社交链接渲染 & 复制 ---------- */
  function socialIconHtml(s) {
    return s.img ? `<img src="${s.img}" alt="${s.label}">` : s.icon;
  }

  function socialAnchorHtml(s, cls, withLabel) {
    const content = withLabel ? `${socialIconHtml(s)} ${s.label}` : socialIconHtml(s);
    if (s.type === "copy") {
      return `<a class="${cls}" href="#" data-copy="${s.copy}" data-label="${s.label}" title="点击复制${s.label}" aria-label="点击复制${s.label}">${content}</a>`;
    }
    return `<a class="${cls}" href="${s.href}" target="_blank" rel="noopener noreferrer" title="${s.label}" aria-label="${s.label}">${content}</a>`;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        if (document.execCommand("copy")) resolve();
        else reject(new Error("复制失败"));
      } catch (err) { reject(err); }
      finally { document.body.removeChild(ta); }
    });
  }

  function bindSocialCopy(el) {
    if (!el) return;
    el.addEventListener("click", (e) => {
      const a = e.target.closest("[data-copy]");
      if (!a) return;
      e.preventDefault();
      const text = a.dataset.copy || "";
      const label = a.dataset.label || "";
      copyToClipboard(text).then(
        () => Shared.showToast(`${label}已复制：${text}`),
        () => Shared.showToast("复制失败，请手动复制：" + text)
      );
    });
  }

  /* ---------- 渲染 ---------- */
  function render() {
    /* Hero 社交 */
    const socialsEl = $("#socials");
    if (socialsEl) {
      socialsEl.innerHTML = socials.map(s => socialAnchorHtml(s, "social", false)).join("");
      bindSocialCopy(socialsEl);
    }

    /* 个人信息 */
    const infoList = $("#infoList");
    if (infoList) {
      infoList.innerHTML = personal.info.map(i =>
        `<li><span class="info-key">${i.key}</span><span class="info-val">${i.dot ? '<span class="status-dot"></span>' : ""}${i.val}</span></li>`
      ).join("");
    }
    const metaList = $("#metaList");
    if (metaList) {
      metaList.innerHTML = personal.meta.map(m =>
        `<li><span class="info-key">${m.key}</span><span class="info-val">${m.val}</span></li>`
      ).join("");
    }

    /* 联系 */
    const contactLinks = $("#contactLinks");
    if (contactLinks) {
      contactLinks.innerHTML = socials.map(s => socialAnchorHtml(s, "contact-btn", true)).join("");
      bindSocialCopy(contactLinks);
    }
  }

  /* ---------- 时钟 ---------- */
  let clockInterval = null;
  function initClock() {
    const clockTime = $("#clockTime");
    const clockDate = $("#clockDate");
    if (!clockTime || !clockDate) return;
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      clockTime.textContent = `${hh}:${mm}:${ss}`;
      const yy = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      clockDate.textContent = `${yy}.${mo}.${dd}`;
    }
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }

  /* ---------- 打字机 ---------- */
  let typeTimer = null;
  function initTyped() {
    const typedEl = $("#typed");
    if (!typedEl) return;
    let wi = 0, ci = 0, deleting = false;
    function type() {
      const word = typedWords[wi];
      typedEl.textContent = word.slice(0, ci);
      if (!deleting) {
        if (ci < word.length) { ci++; typeTimer = setTimeout(type, 110); }
        else { deleting = true; typeTimer = setTimeout(type, 1800); }
      } else {
        if (ci > 0) { ci--; typeTimer = setTimeout(type, 55); }
        else { deleting = false; wi = (wi + 1) % typedWords.length; typeTimer = setTimeout(type, 350); }
      }
    }
    type();
  }

  /* ---------- 留言板（2026-10-25：改为服务器存储，所有人可见）---------- */
  function initMessageBoard() {
    const messageForm = $("#messageForm");
    const messageInput = $("#messageInput");
    const messageList = $("#messageList");
    const MSG_KEY = "anonymous_messages";   // 只作离线兜底，不再是数据源
    const MSG_API = "/api/messages";

    if (!messageForm) return;

    function cacheMessages(list) {
      try { localStorage.setItem(MSG_KEY, JSON.stringify(list)); } catch (e) {}
    }
    function cachedMessages() {
      try { return JSON.parse(localStorage.getItem(MSG_KEY)) || []; } catch (e) { return []; }
    }

    function paint(list, note) {
      if (!messageList) return;
      const noteHtml = note
        ? '<p class="message-empty">' + Shared.escapeHtml(note) + "</p>"
        : "";
      if (!list || !list.length) {
        messageList.innerHTML = noteHtml ||
          '<p class="message-empty">还没有留言，快来抢沙发～</p>';
        return;
      }
      // 服务端已按「新的在前」返回，这里**不要再 reverse**，否则会翻回旧的在前
      messageList.innerHTML = noteHtml + list.map(m => `
        <div class="message-item">
          <div class="message-content">${Shared.escapeHtml(m.text)}</div>
          <div class="message-time">${Shared.escapeHtml(m.time)}</div>
        </div>
      `).join("");
    }

    async function fetchMessages() {
      const res = await fetch(MSG_API + "?limit=50", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const list = Array.isArray(data.messages)
        ? data.messages
            .filter(m => m && typeof m.text === "string")
            .map(m => ({ text: m.text, time: m.time || "" }))
        : [];
      cacheMessages(list);
      return list;
    }

    async function renderMessages() {
      try {
        paint(await fetchMessages());
      } catch (e) {
        const local = cachedMessages();
        paint(local, local.length ? "" : "留言板暂时连不上服务器，稍后再刷新试试～");
      }
    }

    messageForm.addEventListener("submit", async e => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;
      const btn = messageForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "发送中…"; }
      try {
        const res = await fetch(MSG_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        if (!res.ok) {
          let tip = "发送失败（" + res.status + "）";
          if (res.status === 429) tip = "发太快啦，歇一分钟再发～";
          else if (res.status === 413) tip = "留言太长了，200 字以内～";
          else if (res.status === 400) tip = "这条留言发不出去，换个说法试试～";
          paint(cachedMessages(), tip);
          return;
        }
        messageInput.value = "";
        await renderMessages();
      } catch (err) {
        // 服务器连不上：先存本机，别让用户白打字
        const local = cachedMessages();
        local.push({ text, time: new Date().toLocaleString("zh-CN") });
        cacheMessages(local);
        paint(local, "服务器暂时连不上，这条只存在你的浏览器里");
        messageInput.value = "";
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "发送留言"; }
      }
    });

    renderMessages();
  }

  /* ---------- init / destroy ---------- */
  function init() {
    render();
    initClock();
    initTyped();
    initMessageBoard();
    // 音乐播放器从首页模块中抽离，改为常驻模块（跨页续播）。
    // 这里只负责「挂载视图」；音频实体由 MusicPlayer 持有，不随本模块销毁。
    if (typeof MusicPlayer !== "undefined") MusicPlayer.mount();
  }

  function destroy() {
    clearInterval(clockInterval);
    clearTimeout(typeTimer);
    // 只卸载播放器视图（停进度条刷新），**不碰音频** —— 跳转后音乐继续播放
    if (typeof MusicPlayer !== "undefined") MusicPlayer.unmount();
  }

  return { init, destroy };
})();

/* ---------- 注册页面模块 ---------- */
PJAX.registerPage("home", HomeApp);
