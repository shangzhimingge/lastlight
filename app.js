const body = document.body;
const storageKey = "lastlight-returned-v2";
const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});
const normalTitle = document.title;
const normalClock = Array.from(document.querySelectorAll("[data-clock]"));
const heroImage = document.querySelector("#hero-image");
const heroLabel = document.querySelector("#hero-label");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const scene = document.querySelector(".scene-demo");
const sceneImage = document.querySelector("#scene-image");
const sceneTitle = document.querySelector("#scene-title");
const sceneCaption = document.querySelector("#scene-caption");
const sceneDescription = document.querySelector("#scene-description");
const sceneStatus = document.querySelector("#scene-status");
const night = document.querySelector("#night");
const finale = document.querySelector("#finale");
const finalStage = finale.querySelector(".final-sticky");
const finalCaption = document.querySelector("#final-caption");
const finalTitle = document.querySelector("#final-title");
const playbackTime = document.querySelector("#playback-time");
const audioButton = document.querySelector("#audio-button");
const orderDialog = document.querySelector("#order-dialog");
const replacements = Array.from(document.querySelectorAll("[data-after]"), element => ({
  element, initial: Array.from(element.childNodes, node => node.cloneNode(true))
}));
const presets = {
  day: {
    title: "白天照常，灯先休息。",
    description: "环境光充足时，经过玄关也无需亮灯。",
    caption: "白天模式 / 待机",
    status: "无人停留"
  },
  dusk: {
    title: "推开门，光已经亮了。",
    description: "环境变暗后，动作信号触发 2700K 暖光。",
    caption: "晚归模式 / 暖光已启动",
    status: "检测到 1 个信号"
  },
  night: {
    title: "熄灯前，给你二十秒。",
    description: "没人在玄关继续停留时，灯才会开始熄灯计时。",
    caption: "夜间模式 / 等待熄灯",
    status: "延时 20 秒"
  }
};
const playbackCues = [
  { at: 0, note: "灯光感应中", title: "门停了一下。" },
  { at: 3, note: "第二次亮灯", title: "客厅那边还在说话。" },
  { at: 6, note: "门内侧 / 检测到活动", title: "门后有个人。" },
  { at: 9, note: "录像最后一帧", title: "他在看手机。" }
];

let currentMode = "day";
let appliedHero = "";
let signalStarted = Date.now();
let returned = false;
let deepest = 0;
let lastPlaybackSecond = -1;
let frame = 0;
let sound;

function asset(name) {
  return "./" + name + ".webp";
}

function displayTime(element, milliseconds) {
  const date = new Date(milliseconds);
  element.dateTime = date.toISOString();
  element.textContent = dateFormat.format(date);
}

function updateHero(hour) {
  const period = hour >= 6 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "dusk" : "night";
  const appearance = returned ? "occupied" : period;
  if (appliedHero === appearance) return;
  appliedHero = appearance;
  heroImage.closest("figure").dataset.time = appearance;
  heroImage.src = asset(appearance === "occupied" ? "threshold-v2" : appearance === "night" ? "entry-night" : "entry-day");
  heroImage.alt = returned ? "半开的入户门后，有人看向手机镜头" : "归昼 L1 安装在玄关入户门旁";
  heroLabel.textContent = { day: "日间光线", dusk: "傍晚光线", night: "夜间光线", occupied: "检测到 2 个信号" }[appearance];
}

function tick() {
  const now = Date.now();
  normalClock.forEach(element => displayTime(element, now));
  updateHero(new Date(now).getHours());
}

function updateEvents() {
  lastPlaybackSecond = -1;
  document.querySelectorAll("[data-offset]").forEach(element => {
    displayTime(element, signalStarted + Number(element.dataset.offset) * 1000);
  });
}

function showMode(mode) {
  const preset = presets[mode];
  currentMode = mode;
  scene.dataset.mode = mode;
  const occupied = returned && mode === "night";
  sceneImage.src = asset(occupied ? "threshold-v2" : mode === "night" ? "entry-night" : "entry-day");
  sceneTitle.textContent = occupied ? "二十秒从未开始。" : preset.title;
  sceneDescription.textContent = occupied ? "灯在等你们两个都离开。" : preset.description;
  sceneCaption.textContent = occupied ? "夜间模式 / 第二位住户已识别" : preset.caption;
  sceneStatus.textContent = occupied ? "检测到 2 个信号" : preset.status;
  modeButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
}

function setReturned(value) {
  returned = value;
  body.toggleAttribute("data-returned", value);
  document.title = value ? "归昼 Lastlight · 灯还亮着" : normalTitle;
  replacements.forEach(({ element, initial }) => {
    if (value) element.textContent = element.dataset.after;
    else element.replaceChildren(...initial.map(node => node.cloneNode(true)));
  });
  const order = document.querySelector("#order-button");
  order.firstChild.nodeValue = value ? "查看签收记录 " : "查看购买信息 ";
  try {
    if (value) sessionStorage.setItem(storageKey, "1");
    else sessionStorage.removeItem(storageKey);
  } catch {
    // The experience still works when tab storage is disabled.
  }
  tick();
  showMode(currentMode);
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function renderPlayback(progress) {
  const occupant = clamp((progress - .40) / .39);
  const easedOccupant = occupant * occupant * (3 - 2 * occupant);
  finalStage.style.setProperty("--zoom", (1 + progress * .12).toFixed(3));
  finalStage.style.setProperty("--reveal", (.92 + progress * .13).toFixed(3));
  finalStage.style.setProperty("--occupancy", easedOccupant.toFixed(3));
  const second = Math.floor(progress * 10);
  if (second === lastPlaybackSecond) return;
  lastPlaybackSecond = second;
  const cue = playbackCues.findLast(item => item.at <= second);
  displayTime(playbackTime, signalStarted + (second - 10) * 1000);
  finalCaption.textContent = "00:" + String(second).padStart(2, "0") + " / " + cue.note;
  if (finalTitle.textContent !== cue.title) finalTitle.textContent = cue.title;
}

function renderScroll() {
  frame = 0;
  const height = window.innerHeight;
  const nightBounds = night.getBoundingClientRect();
  const finalBounds = finale.getBoundingClientRect();
  const progress = clamp(-finalBounds.top / Math.max(1, finalBounds.height - finalStage.offsetHeight));
  const endingVisible = finalBounds.top < height && finalBounds.bottom > 0;
  if (endingVisible) deepest = Math.max(deepest, progress);
  renderPlayback(progress);
  if (!returned && deepest >= .89) setReturned(true);
  if (sound) {
    const level = document.hidden ? 0 : endingVisible ? .024 + progress * .041 : nightBounds.top < height && nightBounds.bottom > 0 ? .024 : 0;
    sound.volume.gain.setTargetAtTime(level, sound.context.currentTime, .26);
  }
}

function scheduleRender() {
  if (!frame) frame = requestAnimationFrame(renderScroll);
}

function createSound() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("Web Audio unavailable");
  const context = new Context();
  const volume = context.createGain();
  volume.gain.value = 0;
  volume.connect(context.destination);

  const drone = context.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 61;
  const droneGain = context.createGain();
  droneGain.gain.value = .52;
  drone.connect(droneGain).connect(volume);
  drone.start();

  const length = context.sampleRate * 4;
  const noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < samples.length; i++) {
    previous = .94 * previous + .06 * (Math.random() * 2 - 1);
    samples[i] = previous;
  }
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 570;
  filter.Q.value = .55;
  const noiseGain = context.createGain();
  noiseGain.gain.value = .65;
  noise.connect(filter).connect(noiseGain).connect(volume);
  noise.start();

  const pulse = context.createOscillator();
  pulse.frequency.value = .23;
  const pulseGain = context.createGain();
  pulseGain.gain.value = .39;
  pulse.connect(pulseGain).connect(noiseGain.gain);
  pulse.start();

  return { context, volume };
}

async function stopSound() {
  const old = sound;
  sound = undefined;
  audioButton.textContent = "开启环境声";
  audioButton.setAttribute("aria-pressed", "false");
  if (old) await old.context.close();
}

modeButtons.forEach(button => button.addEventListener("click", () => showMode(button.dataset.mode)));
document.querySelector("#order-button").addEventListener("click", () => {
  document.querySelector("#order-dialog-title").textContent = returned ? "无需再次下单" : "暖胡桃木套装";
  document.querySelector("#order-dialog-text").textContent = returned
    ? "灯已在玄关。签收记录显示有人替你开了门。"
    : "含灯体、磁吸底座、免钉贴和 USB-C 充电线。参考售价 ¥169。";
  orderDialog.showModal();
});

audioButton.addEventListener("click", async () => {
  audioButton.disabled = true;
  try {
    if (sound) {
      await stopSound();
      return;
    }
    sound = createSound();
    await sound.context.resume();
    audioButton.textContent = "关闭环境声";
    audioButton.setAttribute("aria-pressed", "true");
    scheduleRender();
  } catch {
    if (sound) await stopSound().catch(() => {});
    audioButton.textContent = "环境声不可用";
  } finally {
    audioButton.disabled = false;
  }
});

document.querySelector("#reset").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "instant" });
  history.replaceState(null, "", location.pathname + location.search);
  deepest = 0;
  currentMode = "day";
  signalStarted = Date.now();
  updateEvents();
  setReturned(false);
  stopSound().catch(() => {});
  scheduleRender();
  document.querySelector("#hero-title").setAttribute("tabindex", "-1");
  document.querySelector("#hero-title").focus({ preventScroll: true });
});

window.addEventListener("scroll", scheduleRender, { passive: true });
window.addEventListener("resize", scheduleRender);
document.addEventListener("visibilitychange", scheduleRender);
try {
  if (sessionStorage.getItem(storageKey) === "1") setReturned(true);
} catch {
  // The experience still works when tab storage is disabled.
}
updateEvents();
tick();
setInterval(tick, 1000);
scheduleRender();
