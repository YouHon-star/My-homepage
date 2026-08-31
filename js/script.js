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

  const playlist = [
    { title: "リリィ", artist: "倚水/吐息.", src: "music/リリィ(feat. 倚水).mp3", cover: "music-Picture/吐息.jpg", color: ["#ff5c8a", "#9b6bff"] },
    { title: "你有多久都没看过蓝天", artist: "橘猫烧鲷鱼.", src: "music/你有多久都没看过蓝天.mp3", cover: "music-Picture/你有多久都没看过蓝天.jpg", color: ["#38bdf8", "#818cf8"] },
    { title: "ヰ世界の宝石譚", artist: "V.A.", src: "music/宝石谭.mp3?v=2", cover: "music-Picture/宝石谭.jpg", color: ["#14b8a6", "#8b5cf6"] },
    { title: "第六感", artist: "Reol", src: "music/第六感.mp3", cover: "music-Picture/第六感.jpg", color: ["#9b6bff", "#ff5c8a"] },
    { title: "もうどくちゅうい", artist: "猛毒注意", src: "music/もうどくちゅうい.mp3", cover: "music-Picture/猛毒注意.jpg", color: ["#b89af7", "#fea9c1"] }
  ];

  const socials = [
    { icon: "𝕏", label: "推特", href: "https://x.com/YoHon11638", img: "piv/X.png", type: "link" },
    { icon: "🐧", label: "QQ", copy: "1923497173", img: "piv/qq.png", type: "copy" },
    { icon: "▶️", label: "Youtube", href: "https://www.youtube.com/@YoHon-c2n4e", img: "piv/youtube.svg", type: "link" },
    { icon: "🐙", label: "GitHub", href: "https://github.com/YouHon-star", img: "piv/github.png", type: "link" },
    { icon: "📧", label: "邮箱", copy: "yohon2348@gmail.com", img: "piv/email.png", type: "copy" }
  ];

  const typedWords = ["懒懒", "失眠", "穷穷", "无聊"];

  /* ---------- 清理引用 ---------- */
  let audioEl = null;
  let rafId = null;

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

  /* ---------- 音乐播放器 ---------- */
  function initMusicPlayer() {
    const mpPlay = $("#mpPlay");
    const mpNext = $("#mpNext");
    const mpPrev = $("#mpPrev");
    const mpBar = $("#mpBar");
    const mpFill = $("#mpFill");
    const mpTitle = $("#mpTitle");
    const mpArtist = $("#mpArtist");
    const mpArt = $("#mpArt");
    const mpArtImg = $("#mpArtImg");
    const mpEq = $("#mpEq");
    const mpCur = $("#mpCur");
    const mpDur = $("#mpDur");
    const mpPlayer = $("#musicPlayer");

    if (!mpPlay) return;

    audioEl = new Audio();
    audioEl.preload = "metadata";
    let current = 0;
    let playing = false;

    function fmtTime(s) {
      if (!isFinite(s)) s = 0;
      s = Math.max(0, Math.floor(s));
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${String(sec).padStart(2, "0")}`;
    }

    function loadTrack(i) {
      current = i;
      const song = playlist[current];
      if (mpTitle) mpTitle.textContent = song.title;
      if (mpArtist) mpArtist.textContent = song.artist;
      if (mpArtImg) mpArtImg.src = encodeURI(song.cover);
      if (mpArt) mpArt.style.background = `linear-gradient(135deg, ${song.color[0]}, ${song.color[1]})`;
      if (mpCur) mpCur.textContent = "0:00";
      if (mpDur) mpDur.textContent = "--:--";
      if (mpFill) mpFill.style.width = "0%";
      audioEl.src = encodeURI(song.src);
    }

    function updateProgress() {
      if (mpCur) mpCur.textContent = fmtTime(audioEl.currentTime);
      const d = audioEl.duration || 0;
      if (d > 0 && mpFill) mpFill.style.width = (audioEl.currentTime / d) * 100 + "%";
    }

    function progressLoop() {
      updateProgress();
      rafId = requestAnimationFrame(progressLoop);
    }

    function setPlaying(v) {
      playing = v;
      mpPlay.textContent = v ? "⏸" : "▶";
      if (mpPlayer) mpPlayer.classList.toggle("playing", v);
      if (mpEq) mpEq.classList.toggle("playing", v);
    }

    function play() {
      setPlaying(true);
      audioEl.play().catch(() => setPlaying(false));
      cancelAnimationFrame(rafId);
      progressLoop();
    }
    function pause() {
      setPlaying(false);
      audioEl.pause();
      cancelAnimationFrame(rafId);
      updateProgress();
    }
    function toggle() { playing ? pause() : play(); }
    function next() {
      loadTrack((current + 1) % playlist.length);
      if (playing) audioEl.play().catch(() => {});
    }
    function prev() {
      loadTrack((current - 1 + playlist.length) % playlist.length);
      if (playing) audioEl.play().catch(() => {});
    }

    audioEl.addEventListener("loadedmetadata", () => {
      if (mpDur) mpDur.textContent = fmtTime(audioEl.duration);
      updateProgress();
    });
    audioEl.addEventListener("ended", next);
    audioEl.addEventListener("error", () => { if (playing) next(); });

    mpPlay.addEventListener("click", toggle);
    if (mpNext) mpNext.addEventListener("click", next);
    if (mpPrev) mpPrev.addEventListener("click", prev);
    if (mpBar) {
      mpBar.addEventListener("click", e => {
        const rect = mpBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (audioEl.duration) {
          audioEl.currentTime = ratio * audioEl.duration;
          updateProgress();
        }
      });
    }

    loadTrack(0);
  }

  /* ---------- 留言板 ---------- */
  function initMessageBoard() {
    const messageForm = $("#messageForm");
    const messageInput = $("#messageInput");
    const messageList = $("#messageList");
    const MSG_KEY = "anonymous_messages";

    if (!messageForm) return;

    function loadMessages() {
      try { return JSON.parse(localStorage.getItem(MSG_KEY)) || []; } catch (e) { return []; }
    }
    function saveMessages(list) {
      try { localStorage.setItem(MSG_KEY, JSON.stringify(list)); } catch (e) {}
    }
    function renderMessages() {
      const list = loadMessages();
      if (!messageList) return;
      if (!list.length) {
        messageList.innerHTML = '<p class="message-empty">还没有留言，快来抢沙发～</p>';
        return;
      }
      messageList.innerHTML = list.slice().reverse().map(m => `
        <div class="message-item">
          <div class="message-content">${Shared.escapeHtml(m.text)}</div>
          <div class="message-time">${Shared.escapeHtml(m.time)}</div>
        </div>
      `).join("");
    }

    messageForm.addEventListener("submit", e => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;
      const list = loadMessages();
      list.push({ text, time: new Date().toLocaleString("zh-CN") });
      saveMessages(list);
      messageInput.value = "";
      renderMessages();
    });

    renderMessages();
  }

  /* ---------- init / destroy ---------- */
  function init() {
    render();
    initClock();
    initTyped();
    initMusicPlayer();
    initMessageBoard();
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    clearInterval(clockInterval);
    if (audioEl) { audioEl.pause(); audioEl.src = ""; audioEl = null; }
  }

  return { init, destroy };
})();

/* ---------- 注册页面模块 ---------- */
PJAX.registerPage("home", HomeApp);
