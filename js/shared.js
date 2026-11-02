/* ============ shared.js — 持久层（永不销毁） ============ */
const Shared = (() => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function countWords(text) {
    const t = text.replace(/\s+/g, "");
    const cn = (t.match(/[\u4e00-\u9fff]/g) || []).length;
    const en = (t.replace(/[\u4e00-\u9fff]/g, "").match(/[a-zA-Z0-9]+/g) || []).length;
    return cn + en;
  }

  /* ---------- 本人编辑模式（隐藏入口） ---------- */
  // 秘密密钥：访问 ?edit=<以下值> 开启编辑模式；?edit=off 关闭。可改为你自己的值。
  const EDIT_KEY = "yohon0721";
  const EDIT_STORAGE = "yohon_edit_mode";

  function isEditMode() {
    try { return localStorage.getItem(EDIT_STORAGE) === "1"; } catch (e) { return false; }
  }

  function setEditMode(on) {
    try {
      if (on) localStorage.setItem(EDIT_STORAGE, "1");
      else localStorage.removeItem(EDIT_STORAGE);
    } catch (e) {}
  }

  function handleEditUrl() {
    try {
      const edit = new URLSearchParams(location.search).get("edit");
      if (edit === EDIT_KEY) setEditMode(true);
      else if (edit === "off") setEditMode(false);
    } catch (e) {}
  }

  /* ---------- 主题切换 ---------- */
  const root = document.documentElement;
  const themeToggle = $("#themeToggle");
  const sunIcon = $("#sunIcon");
  const moonIcon = $("#moonIcon");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (sunIcon) sunIcon.style.display = t === "dark" ? "none" : "block";
    if (moonIcon) moonIcon.style.display = t === "dark" ? "block" : "none";
    localStorage.setItem("theme", t);
  }
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- 背景图片轮播 ---------- */
  const bgImages = [
    "Background/1.jpg",
    "Background/2.png",
    "Background/3.jpg",
    "Background/4.jpg"
  ];
  const bgSlidesEl = $("#bgSlides");
  let bgInterval = null;
  let bgCurrent = 0;

  function initBgSlideshow() {
    if (!bgSlidesEl) return;
    bgSlidesEl.innerHTML = "";
    bgCurrent = 0;
    bgImages.forEach((src, i) => {
      const div = document.createElement("div");
      div.className = "bg-slide";
      div.style.backgroundImage = `url('${encodeURI(src)}')`;
      if (i === 0) div.classList.add("active");
      bgSlidesEl.appendChild(div);
    });
    if (bgImages.length > 1) {
      bgInterval = setInterval(() => {
        const slides = $$(".bg-slide", bgSlidesEl);
        slides[bgCurrent].classList.remove("active");
        bgCurrent = (bgCurrent + 1) % slides.length;
        slides[bgCurrent].classList.add("active");
      }, 6000);
    }
  }

  /* ---------- 背景粒子 ---------- */
  function initParticles() {
    const firefliesEl = $("#fireflies");
    const sakuraEl = $("#sakura");
    const sparklesEl = $("#sparkles");
    if (!firefliesEl || !sakuraEl || !sparklesEl) return;

    firefliesEl.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const f = document.createElement("span");
      f.className = "firefly";
      f.style.left = Math.random() * 100 + "%";
      f.style.top = Math.random() * 100 + "%";
      f.style.setProperty("--fdur", (4 + Math.random() * 6).toFixed(2) + "s");
      f.style.setProperty("--fdelay", (Math.random() * 6).toFixed(2) + "s");
      firefliesEl.appendChild(f);
    }

    sakuraEl.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = Math.random() * 100 + "%";
      p.style.setProperty("--sdur", (9 + Math.random() * 8).toFixed(2) + "s");
      p.style.setProperty("--sdelay", (Math.random() * 12).toFixed(2) + "s");
      p.style.setProperty("--sway", (Math.random() * 30 - 8).toFixed(0) + "vw");
      p.style.transform = `scale(${(0.6 + Math.random() * 0.8).toFixed(2)})`;
      sakuraEl.appendChild(p);
    }

    sparklesEl.innerHTML = "";
    const sparkleChars = ["✦", "✧", "⋆", "✨", "☆"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = sparkleChars[Math.floor(Math.random() * sparkleChars.length)];
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.fontSize = (0.7 + Math.random() * 1.3).toFixed(2) + "rem";
      s.style.setProperty("--tdur", (2 + Math.random() * 3).toFixed(2) + "s");
      s.style.setProperty("--tdelay", (Math.random() * 4).toFixed(2) + "s");
      sparklesEl.appendChild(s);
    }
  }

  /* ---------- 滚动效果 ---------- */
  const nav = $("#nav");
  const backTop = $("#backTop");
  const progressBar = $("#progressBar");
  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 10);
    if (backTop) backTop.classList.toggle("show", y > 500);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (backTop) {
    backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- 移动端菜单（☰ 展开/收起） ---------- */
  const menuBtn = $("#menuBtn");
  function closeMenu() { if (nav) nav.classList.remove("menu-open"); }
  function toggleMenu(e) {
    if (e) e.stopPropagation();
    if (nav) nav.classList.toggle("menu-open");
  }
  if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
  if (nav) {
    // 点选菜单里的链接后自动收起（含 PJAX 跳转）
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a") && nav.classList.contains("menu-open")) closeMenu();
    });
  }
  // 点击页面其它区域收起
  document.addEventListener("click", (e) => {
    if (nav && nav.classList.contains("menu-open") && !nav.contains(e.target)) closeMenu();
  });
  // 视口变宽（回到桌面布局）时重置
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) closeMenu();
  });

  /* ---------- 页脚 ---------- */
  const badges = ["HTML", "CSS", "JavaScript", "Python"];
  const badgesEl = $("#footerBadges");
  if (badgesEl) badgesEl.innerHTML = badges.map(b => `<span class="badge">${b}</span>`).join("");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 运行时间（自建站日累计） ---------- */
  // 建站时间：改这一行就能调整基准（东八区）
  const SITE_START = new Date("2026-08-31T10:00:00+08:00").getTime();
  const uptimeEl = $("#uptime");
  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = n => String(n).padStart(2, "0");
    return d > 0 ? `${d}天 ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
  }
  if (uptimeEl) {
    const tick = () => { uptimeEl.textContent = fmt(Date.now() - SITE_START); };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 浮现动画 observer（全局复用） ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.1 });

  function observeReveals() {
    $$(".reveal").forEach(el => revealObserver.observe(el));
  }

  /* ---------- 看板娘（Live2D）—— 始终运行 ---------- */
  const mascotCat = $("#mascotCat");
  const mascotBubble = $("#mascotBubble");
  const mascotBox = $("#mascotBox");
  const mascotWrap = $("#mascotWrap");
  const mascotToggle = $("#mascotToggle");
  const live2dCanvas = $("#live2dCanvas");

  const catMessages = [
    "今天也要加油喵～", "来都来了，戳戳我呀", "喵喵～", "累了就歇歇哦我会陪着你哒",
    "今晚补点什么番喵？", "一起听歌吗 (｡･ω･｡)", "欢迎光临我的小站～", "主人好呀 ♪",
    "想我了嘛？", "摸摸我会很开心的喵", "友链页也很好玩哦～", "写点东西记录一下吧",
    "欢迎来到博客～", "记录生活的点滴吧"
  ];

  const pageGreetings = {
    home: "欢迎光临我的小站～",
    blog: "欢迎来到博客～",
    links: "友链页也很好玩哦～"
  };

  let bubbleTimer;
  function showBubble(msg) {
    if (!mascotBubble) return;
    mascotBubble.textContent = msg;
    mascotBubble.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => mascotBubble.classList.remove("show"), 3200);
  }

  /* ---------- 复制提示 Toast ---------- */
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function initMascotMessages() {
    showBubble(catMessages[0]);
    setInterval(() => {
      const m = catMessages[Math.floor(Math.random() * catMessages.length)];
      showBubble(m);
    }, 9000);
  }

  function spawnFloat(emoji, x, y) {
    const el = document.createElement("span");
    el.className = "float-emoji";
    el.textContent = emoji;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function pet() {
    if (!mascotCat) return;
    mascotCat.classList.remove("petting");
    void mascotCat.offsetWidth;
    mascotCat.classList.add("petting");
    showBubble("喵呜～ ♡");
    const rect = mascotBox.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.35;
    const hearts = ["💖", "💕", "💗", "♡"];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnFloat(hearts[Math.floor(Math.random() * hearts.length)],
          cx + (Math.random() * 60 - 30), cy + (Math.random() * 40));
      }, i * 90);
    }
  }

  let mascotVisible = true;
  function initMascotToggle() {
    if (mascotBox) mascotBox.addEventListener("pointerdown", pet);
    if (mascotToggle) {
      const icon = mascotToggle.querySelector("img");
      mascotToggle.addEventListener("click", () => {
        mascotVisible = !mascotVisible;
        if (mascotWrap) mascotWrap.style.display = mascotVisible ? "" : "none";
        if (icon) icon.src = mascotVisible ? "piv/view_off.svg" : "piv/view.svg";
        mascotToggle.title = mascotVisible ? "隐藏看板娘" : "显示看板娘";
      });
    }
  }

  /* ---------- Live2D 初始化（只执行一次） ---------- */
  let live2dApp = null;
  let live2dModel = null;

  async function initLive2D() {
    console.log("[Live2D] 初始化，PIXI:", (typeof PIXI !== "undefined" && PIXI.VERSION) || "undefined", "| Core:", typeof window.Live2DCubismCore);
    if (typeof PIXI === "undefined" || !PIXI.live2d) {
      console.warn("[Live2D] PIXI.live2d 未就绪，隐藏猫 emoji");
      if (mascotCat) mascotCat.style.display = "none";
      return;
    }
    try {
      window.PIXI = PIXI;
      const box = mascotBox.getBoundingClientRect();
      const w = Math.max(box.width, 1);
      const h = Math.max(box.height, 1);

      const modelPath = encodeURI("live2d/空 - 免费版.model3.json");
      console.log("[Live2D] 模型路径:", modelPath);
      live2dModel = await Promise.race([
        PIXI.live2d.Live2DModel.from(modelPath),
        new Promise((_, reject) => setTimeout(() => reject(new Error("模型加载超时")), 60000))
      ]);

      try { live2dModel.internalModel.coreModel.setParameterValueById("Param", 1, 1); } catch (e) {}

      const ZOOM = 1.9;
      const baseScale = Math.min(w / live2dModel.width, h / live2dModel.height);
      const scale = baseScale * ZOOM;

      live2dModel.anchor.set(0.5, 0);
      live2dModel.scale.set(scale);
      live2dModel.x = w / 2;
      live2dModel.y = 0;

      live2dApp = new PIXI.Application({
        view: live2dCanvas, width: w, height: h,
        transparent: true, autoStart: true, antialias: true,
        resolution: Math.max(2, window.devicePixelRatio || 1)
      });

      // 提升裁剪 mask 缓冲分辨率（默认 256px 太低导致裙摆等 clip 区域边缘锯齿）
      try { live2dModel.internalModel.renderer.setClippingMaskBufferSize(1024); } catch (e) {}

      live2dApp.stage.addChild(live2dModel);

      live2dModel.autoInteract = false;
      let targetDirX = 0, targetDirY = 0, curDirX = 0, curDirY = 0;
      window.addEventListener("mousemove", (e) => {
        if (!mascotVisible) return;
        const rect = mascotBox.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * 0.3;
        const dx = e.clientX - cx, dy = cy - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        targetDirX = dx / dist;
        targetDirY = dy / dist;
      });
      live2dApp.ticker.add(() => {
        if (!mascotVisible) return;
        curDirX += (targetDirX - curDirX) * 0.4;
        curDirY += (targetDirY - curDirY) * 0.4;
        try { live2dModel.internalModel.focusController.focus(curDirX, curDirY, true); } catch (e) {}
      });

      if (mascotCat) mascotCat.style.display = "none";

      let renderedFrames = 0;
      const onPostRender = () => {
        renderedFrames++;
        if (renderedFrames >= 3) {
          live2dApp.renderer.off("postrender", onPostRender);
          hideLoading();
        }
      };
      live2dApp.renderer.on("postrender", onPostRender);
    } catch (err) {
      console.error("[Live2D] 看板娘加载失败：", err.message || err);
      if (mascotCat) mascotCat.style.display = "none";
      hideLoading();
    }
  }

  function hideLoading() {
    const ls = $("#loadingScreen");
    if (!ls || ls.classList.contains("hidden")) return;
    ls.classList.add("hidden");
    setTimeout(() => ls.remove(), 1000);
  }

  /* ---------- 页面切换回调 ---------- */
  function onPageChange(pageName) {
    const msg = pageGreetings[pageName] || catMessages[Math.floor(Math.random() * catMessages.length)];
    showBubble(msg);
  }

  /* ---------- 初始化所有持久层 ---------- */
  function init() {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    handleEditUrl();
    initBgSlideshow();
    initParticles();
    initMascotMessages();
    initMascotToggle();
    initLive2D();
    observeReveals();
    // 兜底：5 秒后如果猫 emoji 还在显示，强制隐藏
    setTimeout(() => {
      if (mascotCat && mascotCat.style.display !== "none") {
        mascotCat.style.display = "none";
      }
    }, 5000);
  }

  return { init, $, $$, escapeHtml, countWords, observeReveals, showBubble, showToast, onPageChange, isEditMode };
})();

Shared.init();
