/* ============ player.js — 常驻音乐播放器 ============
 *
 * 设计要点：
 *   音频实体（Audio 对象）常驻本模块，**不随 PJAX 页面切换销毁**。
 *   主页 hero 卡里的播放器 UI 只是它的一个「视图」——
 *   离开主页时视图随 #pjax-main 一起被替换掉，但音乐继续播放；
 *   回到主页时重新挂载视图，并同步当前曲目 / 进度 / 播放状态。
 *
 *   注意：Audio 对象是 new 出来的、不挂在 DOM 上，
 *   所以 DOM 被替换不会影响它 —— 这正是续播能成立的前提。
 */
const MusicPlayer = (() => {
  /* ---------- 播放列表 ---------- */
  const playlist = [
    { title: "リリィ", artist: "倚水/吐息.", src: "music/リリィ(feat. 倚水).mp3", cover: "music-Picture/吐息.jpg", color: ["#ff5c8a", "#9b6bff"] },
    { title: "你有多久都没看过蓝天", artist: "橘猫烧鲷鱼.", src: "music/你有多久都没看过蓝天.mp3", cover: "music-Picture/你有多久都没看过蓝天.jpg", color: ["#38bdf8", "#818cf8"] },
    { title: "ヰ世界の宝石譚", artist: "V.A.", src: "music/宝石谭.mp3?v=2", cover: "music-Picture/宝石谭.jpg", color: ["#14b8a6", "#8b5cf6"] },
    { title: "第六感", artist: "Reol", src: "music/第六感.mp3", cover: "music-Picture/第六感.jpg", color: ["#9b6bff", "#ff5c8a"] },
    { title: "もうどくちゅうい", artist: "猛毒注意", src: "music/もうどくちゅうい.mp3", cover: "music-Picture/猛毒注意.jpg", color: ["#b89af7", "#fea9c1"] }
  ];

  /* ---------- 状态 ---------- */
  let audio = null;        // 音频实体，只创建一次
  let current = 0;         // 当前曲目下标
  let playing = false;     // 播放状态
  let rafId = null;        // 进度条刷新句柄
  let el = null;           // 当前挂载的 DOM 引用（非主页时为 null）

  const $ = id => document.getElementById(id);

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  /* ---------- 音频实体：只创建一次，永不销毁 ---------- */
  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => {
      if (el && el.dur) el.dur.textContent = fmtTime(audio.duration);
      paintProgress();
    });
    audio.addEventListener("ended", next);
    audio.addEventListener("error", () => { if (playing) next(); });
  }

  /* ---------- DOM 引用缓存 ---------- */
  function cacheEls() {
    el = {
      root: $("musicPlayer"),
      play: $("mpPlay"), next: $("mpNext"), prev: $("mpPrev"),
      bar: $("mpBar"), fill: $("mpFill"),
      title: $("mpTitle"), artist: $("mpArtist"),
      art: $("mpArt"), artImg: $("mpArtImg"),
      eq: $("mpEq"), cur: $("mpCur"), dur: $("mpDur")
    };
    return !!el.play;   // 没有 UI（非主页）→ false
  }

  /* ---------- 界面绘制 ---------- */
  function paintTrack() {
    if (!el) return;
    const song = playlist[current];
    if (el.title) el.title.textContent = song.title;
    if (el.artist) el.artist.textContent = song.artist;
    if (el.artImg) el.artImg.src = encodeURI(song.cover);
    if (el.art) el.art.style.background = `linear-gradient(135deg, ${song.color[0]}, ${song.color[1]})`;
  }

  function paintProgress() {
    if (!el) return;
    const t = audio ? audio.currentTime : 0;
    const d = (audio && isFinite(audio.duration)) ? audio.duration : 0;
    if (el.cur) el.cur.textContent = fmtTime(t);
    if (el.dur) el.dur.textContent = d > 0 ? fmtTime(d) : "--:--";
    if (el.fill) el.fill.style.width = d > 0 ? ((t / d) * 100) + "%" : "0%";
  }

  function paintPlaying() {
    if (!el) return;
    if (el.play) el.play.textContent = playing ? "⏸" : "▶";
    if (el.root) el.root.classList.toggle("playing", playing);
    if (el.eq) el.eq.classList.toggle("playing", playing);
  }

  function loop() { paintProgress(); rafId = requestAnimationFrame(loop); }
  function startLoop() { cancelAnimationFrame(rafId); loop(); }
  function stopLoop() { cancelAnimationFrame(rafId); rafId = null; }

  /* ---------- 控制 ---------- */
  function loadTrack(i) {
    current = ((i % playlist.length) + playlist.length) % playlist.length;
    const song = playlist[current];
    paintTrack();
    if (el) {
      if (el.cur) el.cur.textContent = "0:00";
      if (el.dur) el.dur.textContent = "--:--";
      if (el.fill) el.fill.style.width = "0%";
    }
    audio.src = encodeURI(song.src);
  }

  function play() {
    playing = true;
    paintPlaying();
    audio.play().then(startLoop).catch(() => { playing = false; paintPlaying(); });
  }

  function pause() {
    playing = false;
    audio.pause();
    paintPlaying();
    stopLoop();
    paintProgress();
  }

  function toggle() { playing ? pause() : play(); }

  function next() {
    const wasPlaying = playing;
    loadTrack(current + 1);
    if (wasPlaying) play();
  }

  function prev() {
    const wasPlaying = playing;
    loadTrack(current - 1);
    if (wasPlaying) play();
  }

  /* ---------- 绑定 UI 事件（每次挂载拿到的都是全新节点） ---------- */
  function bind() {
    if (el.play) el.play.addEventListener("click", toggle);
    if (el.next) el.next.addEventListener("click", next);
    if (el.prev) el.prev.addEventListener("click", prev);
    if (el.bar) {
      el.bar.addEventListener("click", e => {
        const rect = el.bar.getBoundingClientRect();
        if (!audio || !audio.duration) return;
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        audio.currentTime = ratio * audio.duration;
        paintProgress();
      });
    }
  }

  /* ---------- 挂载 / 卸载 ---------- */
  function mount() {
    ensureAudio();
    if (!cacheEls()) { el = null; return; }   // 当前页没有播放器 UI

    bind();

    if (!audio.src) {
      loadTrack(0);                 // 首次：装载第一首（不自动播放，交给用户点击）
    } else {
      // 复用：只同步界面，**绝不重设 src**（否则会把歌从头开始）
      paintTrack();
      paintProgress();
      paintPlaying();
      if (playing) startLoop();
    }
  }

  function unmount() {
    // 只停掉进度条刷新，**绝不动音频** —— 音乐必须继续播
    stopLoop();
    el = null;
  }

  /* ---------- 对外接口 ---------- */
  return {
    mount,
    unmount,
    isPlaying: () => playing,
    currentTrack: () => playlist[current]
  };
})();
