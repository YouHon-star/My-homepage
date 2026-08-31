/* ============ log.js — 博客 & 友链模块 ============ */
const BlogApp = (() => {
  const $ = (s, c = document) => c.querySelector(s);

  /* ---------- 数据 ---------- */
  const POST_KEY = "site_posts";

  function loadPosts() {
    try {
      let raw = JSON.parse(localStorage.getItem(POST_KEY));
      if (!raw || !raw.length) {
        const oldLogs = JSON.parse(localStorage.getItem("site_logs")) || [];
        if (oldLogs.length) {
          raw = oldLogs.map(l => ({
            title: l.title || "",
            content: l.content || "",
            mood: l.mood || "✨",
            tags: [],
            category: "其他",
            date: l.time || "",
            wordCount: Shared.countWords(l.content || ""),
            readingTime: Math.max(1, Math.ceil(Shared.countWords(l.content || "") / 300))
          }));
          localStorage.setItem(POST_KEY, JSON.stringify(raw));
          localStorage.removeItem("site_logs");
        } else {
          raw = [];
        }
      }
      return raw.map(p => ({
        title: p.title || "",
        content: p.content || "",
        mood: p.mood || "✨",
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []),
        category: p.category || "其他",
        date: p.date || "",
        wordCount: p.wordCount || Shared.countWords(p.content || ""),
        readingTime: p.readingTime || Math.max(1, Math.ceil(Shared.countWords(p.content || "") / 300))
      }));
    } catch (e) { return []; }
  }
  function savePosts(list) {
    try { localStorage.setItem(POST_KEY, JSON.stringify(list)); } catch (e) {}
  }

  /* ---------- 渲染状态 ---------- */
  let currentFilter = null;
  let currentFilterType = null;
  let searchQuery = "";
  let selectedDate = null;
  let listeners = [];

  function on(el, ev, fn, opts) {
    if (!el) return;
    el.addEventListener(ev, fn, opts);
    listeners.push({ el, ev, fn });
  }
  function cleanListeners() {
    listeners.forEach(({ el, ev, fn }) => el.removeEventListener(ev, fn));
    listeners = [];
  }

  /* ---------- 标签 / 分类 ---------- */
  function getAllTags(posts) {
    const map = {};
    posts.forEach(p => (p.tags || []).forEach(t => { if (t) map[t] = (map[t] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }
  function getAllCategories(posts) {
    const map = {};
    posts.forEach(p => { if (p.category) map[p.category] = (map[p.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  /* ---------- sidebar ---------- */
  function renderSidebar(posts) {
    const catList = $("#categoryList");
    const tagCloud = $("#tagCloud");
    const sidePosts = $("#sidePosts");
    const sideWords = $("#sideWords");
    const statPosts = $("#statPosts");
    const statWords = $("#statWords");
    const archiveCard = $("#archiveCard");
    const archiveList = $("#archiveList");

    const totalWords = posts.reduce((s, p) => s + (p.wordCount || 0), 0);
    if (sidePosts) sidePosts.textContent = posts.length;
    if (sideWords) sideWords.textContent = totalWords.toLocaleString();
    if (statPosts) statPosts.textContent = posts.length;
    if (statWords) statWords.textContent = totalWords.toLocaleString();

    if (catList) {
      const cats = getAllCategories(posts);
      catList.innerHTML = `<li data-cat="" class="${!currentFilter ? 'active' : ''}">全部<span>${posts.length}</span></li>` +
        cats.map(([name, count]) => `<li data-cat="${Shared.escapeHtml(name)}" class="${currentFilterType === 'category' && currentFilter === name ? 'active' : ''}">${Shared.escapeHtml(name)}<span>${count}</span></li>`).join("");
      catList.onclick = e => {
        const li = e.target.closest("li");
        if (!li) return;
        const cat = li.dataset.cat;
        if (cat) { currentFilter = cat; currentFilterType = "category"; selectedDate = null; }
        else { currentFilter = null; currentFilterType = null; selectedDate = null; }
        renderPosts(posts);
        renderFilterBar(posts);
        renderSidebar(posts);
      };
    }

    if (tagCloud) {
      const tags = getAllTags(posts);
      if (!tags.length) { tagCloud.innerHTML = '<span style="color:var(--muted);font-size:.82rem">暂无标签</span>'; }
      else {
        tagCloud.innerHTML = tags.map(([name, count]) =>
          `<span class="tag-cloud-item ${currentFilterType === 'tag' && currentFilter === name ? 'active' : ''}" data-tag="${Shared.escapeHtml(name)}">${Shared.escapeHtml(name)} (${count})</span>`
        ).join("");
        tagCloud.onclick = e => {
          const el = e.target.closest(".tag-cloud-item");
          if (!el) return;
          const tag = el.dataset.tag;
          if (currentFilter === tag && currentFilterType === "tag") { currentFilter = null; currentFilterType = null; }
          else { currentFilter = tag; currentFilterType = "tag"; selectedDate = null; }
          renderPosts(posts);
          renderFilterBar(posts);
          renderSidebar(posts);
        };
      }
    }

    if (archiveList) {
      const dateMap = {};
      posts.forEach(p => {
        const d = p.date ? p.date.slice(0, 7) : "";
        if (d) dateMap[d] = (dateMap[d] || 0) + 1;
      });
      const dates = Object.entries(dateMap).sort((a, b) => b[0].localeCompare(a[0]));
      if (!dates.length) { archiveCard.style.display = "none"; }
      else {
        archiveCard.style.display = "";
        archiveList.innerHTML = dates.map(([ym, count]) =>
          `<li class="archive-item ${selectedDate === ym ? 'active' : ''}" data-date="${Shared.escapeHtml(ym)}">📅 ${Shared.escapeHtml(ym)}<span>${count}</span></li>`
        ).join("");
        archiveList.onclick = e => {
          const li = e.target.closest(".archive-item");
          if (!li) return;
          const d = li.dataset.date;
          if (selectedDate === d) { selectedDate = null; }
          else { selectedDate = d; currentFilter = null; currentFilterType = null; }
          renderPosts(posts);
          renderFilterBar(posts);
          renderSidebar(posts);
        };
      }
    }
  }

  /* ---------- 筛选 ---------- */
  function getFilteredPosts(posts) {
    let result = posts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => (p.title || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    if (currentFilter) {
      if (currentFilterType === "category") result = result.filter(p => p.category === currentFilter);
      else if (currentFilterType === "tag") result = result.filter(p => (p.tags || []).includes(currentFilter));
    }
    if (selectedDate) {
      result = result.filter(p => (p.date || "").startsWith(selectedDate));
    }
    return result;
  }

  function renderFilterBar(posts) {
    const bar = $("#filterBar");
    if (!bar) return;
    const parts = [];
    if (currentFilter && currentFilterType === "category") parts.push({ label: "分类", value: currentFilter });
    if (currentFilter && currentFilterType === "tag") parts.push({ label: "标签", value: currentFilter });
    if (selectedDate) parts.push({ label: "归档", value: selectedDate });
    if (searchQuery) parts.push({ label: "搜索", value: searchQuery });

    if (!parts.length) { bar.classList.remove("show"); bar.innerHTML = ""; return; }

    bar.classList.add("show");
    bar.innerHTML = parts.map(p =>
      `<span class="blog-filter-label">${p.label}:</span><span class="blog-filter-tag">${Shared.escapeHtml(p.value)}</span>`
    ).join("") + `<button class="blog-filter-clear" id="clearFilter">✕ 清除筛选</button>`;

    const clearBtn = $("#clearFilter");
    if (clearBtn) {
      clearBtn.onclick = () => {
        currentFilter = null; currentFilterType = null; searchQuery = ""; selectedDate = null;
        const searchEl = $("#blogSearch");
        if (searchEl) searchEl.value = "";
        renderPosts(posts);
        renderFilterBar(posts);
        renderSidebar(posts);
      };
    }
  }

  /* ---------- 文章列表 ---------- */
  let sorted = [];
  function renderPosts(posts) {
    const listEl = $("#blogPosts");
    if (!listEl) return;
    const filtered = getFilteredPosts(posts);

    const statPosts = $("#statPosts");
    const statWords = $("#statWords");
    if (statPosts) statPosts.textContent = filtered.length;
    if (statWords) {
      const fw = filtered.reduce((s, p) => s + (p.wordCount || 0), 0);
      statWords.textContent = fw.toLocaleString();
    }

    if (!filtered.length) {
      listEl.innerHTML = `<p class="blog-posts-empty">${(searchQuery || currentFilter || selectedDate) ? "没有找到匹配的文章" : "还没有文章，写下第一篇吧～"}</p>`;
      return;
    }
    sorted = filtered.slice().reverse();
    listEl.innerHTML = sorted.map((post) => {
      const tagsHtml = (post.tags || []).map(t => `<span class="post-tag" data-tag="${Shared.escapeHtml(t)}">${Shared.escapeHtml(t)}</span>`).join("");
      return `<article class="post-card glass card">
        <div class="post-card-top">
          <span class="post-date">📅 ${Shared.escapeHtml(post.date || "")}</span>
          <span class="post-category">${Shared.escapeHtml(post.category || "其他")}</span>
          <span class="post-reading">${post.wordCount || 0} 字 · ${post.readingTime || 1} 分钟</span>
        </div>
        <h3 class="post-card-title">${Shared.escapeHtml(post.title || "无标题")}</h3>
        <p class="post-card-desc">${Shared.escapeHtml(post.content || "")}</p>
        <div class="post-card-foot">
          <div class="post-card-tags">${tagsHtml}</div>
          <span class="post-mood">${Shared.escapeHtml(post.mood || "✨")}</span>
        </div>
      </article>`;
    }).join("");

    listEl.onclick = e => {
      const tagEl = e.target.closest(".post-tag");
      if (tagEl) {
        e.stopPropagation();
        const tag = tagEl.dataset.tag;
        currentFilter = tag; currentFilterType = "tag"; selectedDate = null;
        renderPosts(posts);
        renderFilterBar(posts);
        renderSidebar(posts);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const card = e.target.closest(".post-card");
      if (!card) return;
      const postText = card.querySelector(".post-card-title")?.textContent || "";
      const idx = posts.findIndex(p => (p.title || "无标题") === postText && p.date === card.querySelector(".post-date")?.textContent?.replace("📅 ", ""));
      const safeIdx = idx >= 0 ? idx : posts.indexOf(sorted.find(p => (p.title || "无标题") === postText));
      showDetail(posts, safeIdx >= 0 ? safeIdx : posts.indexOf(sorted[0]));
    };
  }

  /* ---------- 文章详情 ---------- */
  function showDetail(posts, index) {
    const post = posts[index];
    if (!post) return;
    const detail = $("#postDetail");
    if (!detail) return;
    const tagsHtml = (post.tags || []).map(t => `<span class="post-tag">${Shared.escapeHtml(t)}</span>`).join("");
    detail.innerHTML = `
      <div class="post-detail-head">
        <button class="back-btn" id="backToList">← 返回列表</button>
        <span class="post-category">${Shared.escapeHtml(post.category || "其他")}</span>
        <span class="post-reading">${post.wordCount || 0} 字 · ${post.readingTime || 1} 分钟阅读</span>
      </div>
      <h1 class="post-detail-title">${Shared.escapeHtml(post.title || "无标题")}</h1>
      <div class="post-detail-meta">
        <span>📅 ${Shared.escapeHtml(post.date || "")}</span>
        <span>${Shared.escapeHtml(post.mood || "✨")}</span>
        ${tagsHtml ? `<span>${tagsHtml}</span>` : ""}
      </div>
      <div class="post-detail-content">${Shared.escapeHtml(post.content)}</div>
      <div class="post-detail-actions">
        ${Shared.isEditMode() ? `<button class="btn btn-primary" id="deletePost" style="background:var(--glass-inner);color:var(--text);border:1px solid var(--glass-border);box-shadow:none;font-size:.85rem;padding:10px 20px">🗑️ 删除</button>` : ""}
      </div>`;
    detail.classList.add("show");
    const postsEl = $("#blogPosts");
    const editorToggle = $("#editorToggle");
    const editor = $("#blogEditor");
    const stats = $("#blogStats");
    if (postsEl) postsEl.style.display = "none";
    if (editorToggle) editorToggle.style.display = "none";
    if (editor) editor.classList.remove("show");
    if (stats) stats.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });

    const backBtn = $("#backToList");
    if (backBtn) {
      backBtn.onclick = () => {
        detail.classList.remove("show");
        detail.innerHTML = "";
        if (postsEl) postsEl.style.display = "";
        if (editorToggle) editorToggle.style.display = Shared.isEditMode() ? "" : "none";
        if (stats) stats.style.display = "";
      };
    }
    const deleteBtn = $("#deletePost");
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (!confirm("确定删除这篇文章？")) return;
        const list = loadPosts();
        list.splice(index, 1);
        savePosts(list);
        detail.classList.remove("show");
        detail.innerHTML = "";
        if (postsEl) postsEl.style.display = "";
        if (editorToggle) editorToggle.style.display = Shared.isEditMode() ? "" : "none";
        if (stats) stats.style.display = "";
        renderPosts(loadPosts());
        renderSidebar(loadPosts());
      };
    }
  }

  /* ---------- 编辑器 ---------- */
  function initEditor() {
    const editorToggle = $("#editorToggle");
    const blogEditor = $("#blogEditor");
    const blogForm = $("#blogForm");
    const postContent = $("#postContent");
    const charCount = $("#charCount");
    const blogSearch = $("#blogSearch");
    const isEditor = Shared.isEditMode();

    if (editorToggle) editorToggle.style.display = isEditor ? "" : "none";
    if (blogEditor) blogEditor.style.display = isEditor ? "" : "none";

    if (blogSearch) {
      on(blogSearch, "input", () => {
        searchQuery = blogSearch.value.trim();
        renderPosts(loadPosts());
        renderFilterBar(loadPosts());
      });
    }

    if (!isEditor) return;

    if (editorToggle && blogEditor) {
      on(editorToggle, "click", () => {
        const show = blogEditor.classList.toggle("show");
        editorToggle.classList.toggle("open", show);
        editorToggle.querySelector(".toggle-arrow").textContent = show ? "▴" : "▾";
      });
    }

    if (postContent && charCount) {
      on(postContent, "input", () => {
        charCount.textContent = Shared.countWords(postContent.value) + " 字";
      });
    }

    if (blogForm) {
      on(blogForm, "submit", e => {
        e.preventDefault();
        const title = $("#postTitle").value.trim();
        const content = postContent.value.trim();
        const mood = "✨";
        const category = $("#postCategory").value.trim() || "其他";
        const tagsRaw = $("#postTags").value.trim();
        const tags = tagsRaw ? tagsRaw.split("#").map(t => t.trim()).filter(Boolean) : [];
        if (!content) return;
        const wc = Shared.countWords(content);
        const list = loadPosts();
        list.push({
          title, content, mood, tags, category,
          date: new Date().toLocaleString("zh-CN", { hour12: false }),
          wordCount: wc,
          readingTime: Math.max(1, Math.ceil(wc / 300))
        });
        savePosts(list);
        blogForm.reset();
        charCount.textContent = "0 字";
        currentFilter = null; currentFilterType = null; selectedDate = null; searchQuery = "";
        if (blogSearch) blogSearch.value = "";
        renderPosts(loadPosts());
        renderFilterBar(loadPosts());
        renderSidebar(loadPosts());
      });
    }
  }

  /* ---------- init / destroy ---------- */
  function init() {
    currentFilter = null; currentFilterType = null; searchQuery = ""; selectedDate = null;
    initEditor();
    renderPosts(loadPosts());
    renderFilterBar(loadPosts());
    renderSidebar(loadPosts());
  }

  function destroy() {
    cleanListeners();
    currentFilter = null; currentFilterType = null; searchQuery = ""; selectedDate = null;
  }

  return { init, destroy };
})();


const LinksApp = (() => {
  const $ = (s, c = document) => c.querySelector(s);

  const LINK_KEY = "site_links";
  let listeners = [];

  function on(el, ev, fn, opts) {
    if (!el) return;
    el.addEventListener(ev, fn, opts);
    listeners.push({ el, ev, fn });
  }
  function cleanListeners() {
    listeners.forEach(({ el, ev, fn }) => el.removeEventListener(ev, fn));
    listeners = [];
  }

  function loadLinks() {
    try { return JSON.parse(localStorage.getItem(LINK_KEY)) || []; } catch (e) { return []; }
  }
  function saveLinks(list) {
    try { localStorage.setItem(LINK_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function renderLinks() {
    const gridEl = $("#linksGrid");
    if (!gridEl) return;
    const list = loadLinks();
    const sideLinks = $("#sideLinks");
    if (sideLinks) sideLinks.textContent = list.length;

    if (!list.length) {
      gridEl.innerHTML = '<p class="links-empty">还没有友链，添加第一个吧～</p>';
      return;
    }
    gridEl.innerHTML = list.map((link, i) => {
      const avatarHtml = link.avatar
        ? `<img class="link-avatar" src="${Shared.escapeHtml(link.avatar)}" alt="${Shared.escapeHtml(link.name)}" onerror="this.outerHTML='<span class=\\'link-avatar\\'>🌐</span>'" />`
        : `<span class="link-avatar">🌐</span>`;
      return `<a class="link-card glass card" href="${Shared.escapeHtml(link.url)}" target="_blank" rel="noopener">
        ${avatarHtml}
        <div class="link-info">
          <div class="link-name">${Shared.escapeHtml(link.name)}</div>
          <div class="link-desc">${Shared.escapeHtml(link.desc || "")}</div>
        </div>
        <button class="link-card-delete" data-i="${i}" title="删除">✕</button>
      </a>`;
    }).join("");

    gridEl.onclick = e => {
      const btn = e.target.closest(".link-card-delete");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(btn.dataset.i, 10);
      if (!confirm("确定删除这个友链？")) return;
      const links = loadLinks();
      links.splice(idx, 1);
      saveLinks(links);
      renderLinks();
    };
  }

  function initEditor() {
    const linksEditor = $("#linksEditor");
    if (!Shared.isEditMode()) {
      if (linksEditor) linksEditor.style.display = "none";
      return;
    }
    if (linksEditor) linksEditor.style.display = "";

    const linksForm = $("#linksForm");
    if (!linksForm) return;

    const urlInput = $("#linkUrl");
    if (urlInput) {
      on(urlInput, "blur", () => {
        let v = urlInput.value.trim();
        if (v && !/^https?:\/\//i.test(v)) urlInput.value = "https://" + v;
      });
    }

    on(linksForm, "submit", e => {
      e.preventDefault();
      const name = $("#linkName").value.trim();
      let url = urlInput.value.trim();
      const avatar = $("#linkAvatar").value.trim();
      const desc = $("#linkDesc").value.trim();
      if (!name || !url) return;
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      const links = loadLinks();
      links.push({ name, url, avatar, desc, time: new Date().toLocaleString("zh-CN", { hour12: false }) });
      saveLinks(links);
      linksForm.reset();
      renderLinks();
    });
  }

  function init() {
    initEditor();
    renderLinks();
  }

  function destroy() {
    cleanListeners();
  }

  return { init, destroy };
})();


/* ---------- 注册页面模块 ---------- */
PJAX.registerPage("blog", BlogApp);
PJAX.registerPage("links", LinksApp);
