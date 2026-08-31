/* ============ pjax.js — PJAX 无刷新导航 ============ */
const PJAX = (() => {
  const mainEl = () => document.getElementById("pjax-main");
  let currentPage = null;  // 当前活跃的页面模块
  let isTransitioning = false;

  /* ---------- 页面模块注册表 ---------- */
  const pages = {};

  function registerPage(name, { init, destroy }) {
    pages[name] = { init, destroy };
  }

  /* ---------- 根据 URL 判断页面名 ---------- */
  function getPageName(url) {
    const path = new URL(url, location.href).pathname;
    if (path.endsWith("log.html") || path.endsWith("blog")) return "blog";
    if (path.endsWith("links.html") || path.endsWith("friends")) return "links";
    return "home";
  }

  /* ---------- 更新导航栏 active ---------- */
  function updateNavActive(pageName) {
    const links = document.querySelectorAll(".nav .menu a");
    links.forEach(a => {
      a.classList.remove("active");
      const href = a.getAttribute("href") || "";
      if (pageName === "home" && (href === "#top" || href === "index.html" || href === "/")) {
        a.classList.add("active");
      } else if (pageName === "blog" && (href.includes("log.html") || href.includes("/blog"))) {
        a.classList.add("active");
      } else if (pageName === "links" && (href.includes("links.html") || href.includes("/friends"))) {
        a.classList.add("active");
      }
    });
  }

  /* ---------- 加载目标页面 ---------- */
  async function loadPage(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const title = doc.querySelector("title")?.textContent || document.title;
    const mainContent = doc.querySelector("#pjax-main") || doc.querySelector("main");
    return { title, mainContent, doc };
  }

  /* ---------- 切换页面 ---------- */
  async function navigateTo(url, pushState = true) {
    if (isTransitioning) return;
    const pageName = getPageName(url);
    if (pageName === getPageName(location.href) && pushState) return;

    isTransitioning = true;
    const main = mainEl();
    if (!main) { isTransitioning = false; return; }

    // 退场动画
    main.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    main.style.opacity = "0";
    main.style.transform = "translateY(16px)";

    await new Promise(r => setTimeout(r, 200));

    // 销毁旧页面模块
    if (currentPage && pages[currentPage] && pages[currentPage].destroy) {
      pages[currentPage].destroy();
    }

    try {
      const { title, mainContent } = await loadPage(url);

      if (mainContent) {
        main.innerHTML = mainContent.innerHTML;
      }

      document.title = title;

      if (pushState) {
        history.pushState({ page: pageName }, "", url);
      }

      updateNavActive(pageName);

      // 看板娘气泡消息
      if (typeof Shared !== "undefined" && Shared.onPageChange) {
        Shared.onPageChange(pageName);
      }

      // 初始化新页面模块
      currentPage = pageName;
      if (pages[pageName] && pages[pageName].init) {
        pages[pageName].init();
      }

      // 全局 reveals
      Shared.observeReveals();

      // 入场动画
      const targetUrl = new URL(url, location.href);
      const anchor = targetUrl.hash;
      if (anchor) {
        const target = document.getElementById(anchor.slice(1));
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 50);
        } else {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      main.style.opacity = "1";
      main.style.transform = "translateY(0)";
    } catch (err) {
      console.error("[PJAX] 加载失败，回退到整页跳转:", err);
      location.href = url;
    }

    isTransitioning = false;
  }

  /* ---------- 拦截导航链接 ---------- */
  function interceptLinks() {
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href) return;

      // 跳过外部链接、mailto/tel、download、target=_blank
      if (href.startsWith("http") && !href.includes(location.hostname)) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;

      // 纯锚点（#xxx）：交给浏览器默认平滑滚动
      if (href.startsWith("#")) return;

      // 只拦截本站页面
      if (href.includes("log.html") || href.includes("links.html") || href.includes("index.html") || href === "/" || href === "") {
        e.preventDefault();

        const targetPage = getPageName(href);
        const currentPageName = getPageName(location.href);
        const hash = new URL(href, location.href).hash;

        // 同页锚点（主页点 index.html#about）：平滑滚动，不整页刷新，保活 Live2D/音乐
        if (targetPage === currentPageName && hash) {
          const target = document.getElementById(hash.slice(1));
          if (target) target.scrollIntoView({ behavior: "smooth" });
          return;
        }

        // 跨页（博客/友链/回主页）走 PJAX
        navigateTo(href);
      }
    });
  }

  /* ---------- 浏览器前进/后退 ---------- */
  function handlePopState() {
    window.addEventListener("popstate", e => {
      const pageName = getPageName(location.href);
      navigateTo(location.href, false);
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    interceptLinks();
    handlePopState();
    const pageName = getPageName(location.href);
    updateNavActive(pageName);
    // 首次加载或回退：初始化当前页面模块
    currentPage = pageName;
    if (pages[pageName] && pages[pageName].init) {
      pages[pageName].init();
    }
    Shared.observeReveals();
  }

  /* 自动初始化（等所有页面模块注册完再 init） */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(init));
  } else {
    requestAnimationFrame(init);
  }

  return { init, registerPage, navigateTo };
})();
