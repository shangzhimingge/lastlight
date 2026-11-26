"use strict";

const get = (id) => document.getElementById(id);
const header = get("site-header");
const navigation = get("nav");
const menuToggle = document.querySelector(".menu-toggle");
const documentRoot = document.documentElement;
const photos = [
  ["fleet", "成都 · 车队街拍", "午后的成都街道上，一辆蓝白色迁里搬家货车停在树荫下"],
  ["packing", "槐荫里 · 出车准备", "阳光照在蓝色封箱胶带和两只纸箱上"],
  ["loading", "槐荫里 · 小区装车点", "穿蓝色工装的师傅把打包好的纸箱推向货车"]
];
const returnPhotos = [
  ["landing", "送达位置 · 你的门口", "绿色走廊尽头，一只蓝色封条的高纸箱靠在门边"],
  ["opened", "补拍 · 封条已断", "一只手从裂开的纸箱中伸了出来"],
  ["unclaimed", "前一站 · 库区 B", "同一只纸箱还在仓库的车厢里时留下的照片"]
];
const evidencePhotos = [
  ["loading", "09:26", "槐荫里 · 旧址装车", "师傅把最后几箱行李推向小区里等候的货车"],
  ["new-home", "16:48", "梧桐公寓 · 十八箱签收", "新家的客厅里放着封好的纸箱，窗边的沙发已经归位"]
];
const prices = {
  light: { name: "轻装小搬", base: 168 },
  family: { name: "家庭整搬", base: 368 },
  full: { name: "打包到家", base: 688 }
};
let returned = false;
let photoIndex = 0;

function closeMenu() {
  navigation.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "展开导航");
}
menuToggle.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "收起导航" : "展开导航");
});
navigation.addEventListener("click", closeMenu);
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    closeMenu();
    menuToggle.focus();
  }
});
window.matchMedia("(max-width: 52rem)").addEventListener("change", closeMenu);

function showGallery(index) {
  const items = returned ? returnPhotos : photos;
  photoIndex = (index + items.length) % items.length;
  const [file, label, alt] = items[photoIndex];
  const image = get("hero-image");
  image.src = "./assets/" + file + ".webp";
  image.alt = alt;
  get("gallery-label").textContent = label;
  get("gallery-counter").textContent = String(photoIndex + 1).padStart(2, "0") + " / 03";
}
get("gallery-prev").addEventListener("click", () => showGallery(photoIndex - 1));
get("gallery-next").addEventListener("click", () => showGallery(photoIndex + 1));

function updateQuote() {
  const plan = prices[get("plan").value];
  const distance = Number(get("km").value);
  const mileage = Math.max(0, distance - 5) * 6;
  const stairs = Number(get("stairs").value) * 20;
  get("km-value").value = distance + " 公里";
  get("km").setAttribute("aria-valuetext", distance + " 公里");
  get("base-name").textContent = plan.name + " · 起步价";
  get("base-cost").textContent = "¥" + plan.base;
  get("km-cost").textContent = "¥" + mileage;
  get("stair-cost").textContent = "¥" + stairs;
  get("total").value = String(plan.base + mileage + stairs);
}
get("plan").addEventListener("change", updateQuote);
get("stairs").addEventListener("change", updateQuote);
get("km").addEventListener("input", updateQuote);
document.querySelectorAll("[data-plan]").forEach((link) => {
  link.addEventListener("click", () => {
    get("plan").value = link.dataset.plan;
    updateQuote();
  });
});
updateQuote();

const caseButtons = [...document.querySelectorAll("[data-case]")];
function showCase(index) {
  const [file, time, caption, alt] = evidencePhotos[index];
  const img = get("case-image");
  img.src = "./assets/" + file + ".webp";
  img.alt = alt;
  get("case-caption").textContent = caption;
  get("case-time").textContent = time;
  caseButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(index === i)));
}
caseButtons.forEach((button, i) => button.addEventListener("click", () => showCase(i)));

const lightbox = get("lightbox");
document.querySelector("[data-zoom]").addEventListener("click", () => {
  if (typeof lightbox.showModal === "function") lightbox.showModal();
  else window.location.assign("./assets/inspection.webp");
});
lightbox.querySelector(".dialog-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

const stateKey = "milemove.cd0618.received.v1";
function rememberEnding(value) {
  try {
    if (value) sessionStorage.setItem(stateKey, "yes");
    else sessionStorage.removeItem(stateKey);
  } catch { /* The experience also works within one page without storage. */ }
}
function setReturned(value) {
  returned = value;
  document.body.classList.toggle("returned", value);
  get("hero-place").textContent = value ? "成都同城 · 入户补签" : "成都同城搬家服务";
  get("hero-first").textContent = value ? "这一箱，" : "把日子，";
  const stop = get("hero-last").querySelector(".fullstop");
  get("hero-last").replaceChildren(value ? "已经到家" : "搬到新家", stop);
  get("hero-intro").replaceChildren(
    value ? "前十八箱都有主人。第十九张签收联上，" : "从第一卷封箱胶带，到最后一只箱子进门。",
    document.createElement("br"),
    value ? "现在填的是「刚刚回到首页的人」。" : "打包、搬运、归位，这一路交给迁里。"
  );
  get("hero-cta").textContent = value ? "查看我的签收联" : "算算搬家费用";
  get("hero-cta").setAttribute("href", value ? "#receipt" : "#estimate");
  get("hero-secondary").hidden = value;
  get("hero-replay").hidden = !value;
  get("hours-text").textContent = value ? "本单服务状态" : "每日服务时间";
  get("hours-value").textContent = value ? "已入户 · 等待补签" : "08:00 – 20:00";
  get("dispatch-code").textContent = value ? "BOX–019" : "CD–018";
  get("dispatch-kind").textContent = value ? "入户留存" : "同城专车";
  get("promise-count").textContent = value ? "十八箱已签，一箱等你" : "装车和签收都按箱点数";
  get("process-last").textContent = value ? "还有一件待签" : "对码签收";
  get("process-caption").textContent = value ? "前十八件已经交接。剩下这件，司机说他从没有搬过。" : "在新家逐箱点收；司机回场前，补拍最后一张空车照。";
  get("faq-receipt").textContent = value ? "CD–0618 的最后一张照片已经归档。门锁没有打开记录，拍摄位置却在屋内。暂存联现登记在当前查看人名下。" : "随车回单保留装车数、收货数和清车照片。碰到没有对应箱号的物品，会另开一张暂存联。";
  get("footer-state").textContent = value ? "019 · 已入户，待补签" : "同城搬运 · 随车回单";
  document.title = value ? "019 待补签 · 迁里搬家 MILEMOVE" : "迁里搬家 MILEMOVE · 成都同城搬家";
  showGallery(0);
}
try { if (sessionStorage.getItem(stateKey) === "yes") setReturned(true); }
catch { /* Storage is optional. */ }

const clock = document.querySelector(".local-clock");
const timeFormat = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
function updateClock() {
  const now = new Date();
  clock.textContent = timeFormat.format(now);
  clock.dateTime = now.toISOString();
}
updateClock();

// Sound is synthesized locally. A visitor's gesture is required to enable it.
const soundButton = document.querySelector(".sound");
const AudioEngine = window.AudioContext || window.webkitAudioContext;
let audio = null;
let volume = null;
let noiseBuffer = null;
let wantsSound = false;
let soundRunning = false;
let lastSoundBeat = -1;
let inCinema = false;
let selectedBeat = -1;

function makeRoomTone() {
  audio = new AudioEngine();
  volume = audio.createGain();
  volume.gain.value = 0;
  volume.connect(audio.destination);
  const hum = audio.createOscillator();
  const humLevel = audio.createGain();
  hum.type = "triangle";
  hum.frequency.value = 54;
  humLevel.gain.value = .052;
  hum.connect(humLevel).connect(volume);
  hum.start();
  noiseBuffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const hiss = audio.createBufferSource();
  hiss.buffer = noiseBuffer;
  hiss.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 630;
  const hissLevel = audio.createGain();
  hissLevel.gain.value = .043;
  hiss.connect(filter).connect(hissLevel).connect(volume);
  hiss.start();
}
function playBeat(index) {
  if (!soundRunning || index < 0) return;
  const time = audio.currentTime + .09;
  const space = index < 2 ? .42 : .65;
  const count = index < 2 ? 3 : 1;
  for (let i = 0; i < count; i++) {
    const when = time + i * space;
    const source = audio.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = [340, 210, 480, 125][index];
    filter.Q.value = 1.6;
    const level = audio.createGain();
    level.gain.setValueAtTime(.0001, when);
    level.gain.exponentialRampToValueAtTime(index < 2 ? .6 : .24, when + (index < 2 ? .008 : .18));
    level.gain.exponentialRampToValueAtTime(.001, when + (index < 2 ? .24 : .9));
    source.connect(filter).connect(level).connect(volume);
    source.start(when);
    source.stop(when + 1);
    source.onended = () => { source.disconnect(); filter.disconnect(); level.disconnect(); };
  }
}
function syncSound() {
  if (!audio) return;
  const shouldPlay = wantsSound && inCinema && !document.hidden;
  if (soundRunning !== shouldPlay) {
    soundRunning = shouldPlay;
    const now = audio.currentTime;
    volume.gain.cancelScheduledValues(now);
    volume.gain.setTargetAtTime(shouldPlay ? .57 : 0, now, shouldPlay ? .16 : .035);
  }
  if (shouldPlay && selectedBeat !== lastSoundBeat) {
    playBeat(selectedBeat);
    lastSoundBeat = selectedBeat;
  }
}
function soundLabel() {
  soundButton.setAttribute("aria-pressed", String(wantsSound));
  soundButton.querySelector("span").textContent = wantsSound ? "现场声音 · 开" : "现场声音 · 关";
  soundButton.querySelector("use").setAttribute("href", wantsSound ? "#i-sound" : "#i-mute");
}
if (!AudioEngine) soundButton.hidden = true;
soundButton.addEventListener("click", async () => {
  wantsSound = !wantsSound;
  soundLabel();
  try {
    if (wantsSound) {
      if (!audio) makeRoomTone();
      if (audio.state !== "running") await audio.resume();
      lastSoundBeat = -1;
    }
    syncSound();
  } catch {
    wantsSound = false;
    soundRunning = false;
    soundLabel();
    soundButton.querySelector("span").textContent = "声音暂不可用";
  }
});

const cinema = get("doorstep");
const beats = [...cinema.querySelectorAll(".beat")];
const stills = [...cinema.querySelectorAll(".film-image")];
let framePending = false;
let restarting = false;
document.body.classList.add("film-ready");
function syncView() {
  framePending = false;
  if (restarting) {
    if (window.scrollY > 2 || cinema.getBoundingClientRect().top < window.innerHeight) return;
    restarting = false;
  }
  const headerHeight = header.offsetHeight;
  header.classList.toggle("night", get("depot").getBoundingClientRect().top < headerHeight + 12);
  const bounds = cinema.getBoundingClientRect();
  inCinema = bounds.top < window.innerHeight && bounds.bottom > headerHeight;
  if (inCinema) {
    const line = headerHeight + Math.min(175, (window.innerHeight - headerHeight) * .23);
    let next = 0;
    for (let i = 1; i < beats.length; i++) {
      if (beats[i].getBoundingClientRect().top <= line) next = i;
    }
    if (next !== selectedBeat) {
      stills.forEach((image, i) => image.classList.toggle("active", i === next));
      get("camera-name").textContent = next === beats.length - 1 ? "屋内机位" : "门口机";
      selectedBeat = next;
    }
    if (next === beats.length - 1 && !returned) {
      setReturned(true);
      rememberEnding(true);
    }
  }
  syncSound();
}
function queueView() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(syncView);
}
window.addEventListener("scroll", queueView, { passive: true });
window.addEventListener("resize", queueView);
window.addEventListener("pageshow", queueView);
let clockTimer;
function syncVisibility() {
  clearInterval(clockTimer);
  if (!document.hidden) {
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
  }
  syncView();
}
document.addEventListener("visibilitychange", syncVisibility);
syncVisibility();

function replay() {
  restarting = true;
  wantsSound = false;
  lastSoundBeat = -1;
  inCinema = false;
  selectedBeat = -1;
  syncSound();
  stills.forEach((image, i) => image.classList.toggle("active", i === 0));
  get("camera-name").textContent = "门口机";
  soundLabel();
  setReturned(false);
  rememberEnding(false);
  get("plan").value = "light";
  get("km").value = "5";
  get("stairs").value = "0";
  updateQuote();
  showCase(0);
  document.querySelectorAll("details[open]").forEach((details) => { details.open = false; });
  closeMenu();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  documentRoot.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  get("hero-cta").focus({ preventScroll: true });
  // Let the jump and any pending smooth navigation settle before re-arming the ending.
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      documentRoot.style.scrollBehavior = "";
      syncView();
    });
  });
}
document.querySelectorAll("[data-replay]").forEach((button) => button.addEventListener("click", replay));
