import * as THREE from "three";
import { createRaceAudio } from "./audio.js";
import "./style.css";

const TRACK_WIDTH = 14;
const CURB_WIDTH = 1.25;
const CHECKPOINT_COUNT = 18;
const ROAD_SAMPLES = 560;
const CHECKPOINT_RADIUS = 20;
const CAR_BASE_HEIGHT = 0.62;
const PLAYER_START_T = 0.006;
const GRID_BASE_T = 0.026;
const GRID_STEP_T = 0.0175;
const PLAYER_MAX_SPEED = 58;
const PLAYER_BOOST_SPEED = 78;
const PLAYER_COAST_SPEED = 18;
const TRACK_LAYOUT_SCALE = 1;
const TRACK_WIDTH_SCALE = 1;

const DIFFICULTY_PRESETS = {
  rookie: { label: "Rookie", aiPace: 0.95, aiRubberBand: 1.5 },
  pro: { label: "Pro", aiPace: 1, aiRubberBand: 2.3 },
  elite: { label: "Elite", aiPace: 1.06, aiRubberBand: 3.1 },
};

const TRACK_PRESETS = {
  monza: {
    label: "Monza",
    circuitName: "Autodromo Nazionale Monza",
    country: "Italy",
    officialLengthKm: 5.793,
    note: "Long straights and heavy-braking chicanes inspired by Formula 1's Temple of Speed.",
    width: 15.5,
    widthScale: 1.18,
    layoutScale: 2.05,
    speedFactor: 1.16,
    accelerationFactor: 1.05,
    aiSpeedFactor: 1.06,
    tension: 0.22,
    controlPoints: [
      [86, -8],
      [62, -24],
      [24, -30],
      [-18, -28],
      [-58, -18],
      [-82, -2],
      [-74, 14],
      [-52, 24],
      [-24, 26],
      [-6, 18],
      [8, 8],
      [24, 10],
      [34, 26],
      [44, 52],
      [68, 56],
      [84, 38],
    ],
    theme: {
      sky: 0x0b1825,
      fog: 0x0b1825,
      ground: 0x28422a,
      glow: 0x537c4d,
      sun: 0xffc16d,
      mountain: 0x41505b,
    },
  },
  silverstone: {
    label: "Silverstone",
    circuitName: "Silverstone Circuit",
    country: "Great Britain",
    officialLengthKm: 5.891,
    note: "Fast, flowing corners echoing Abbey, Maggotts-Becketts and the blast to Stowe.",
    width: 15.2,
    widthScale: 1.2,
    layoutScale: 2.08,
    speedFactor: 1.08,
    accelerationFactor: 1,
    aiSpeedFactor: 1.02,
    tension: 0.24,
    controlPoints: [
      [82, 12],
      [66, 34],
      [36, 48],
      [8, 42],
      [-14, 52],
      [-42, 46],
      [-70, 24],
      [-80, -2],
      [-64, -28],
      [-34, -44],
      [-2, -40],
      [18, -26],
      [28, -6],
      [44, 0],
      [62, -14],
      [82, -4],
    ],
    theme: {
      sky: 0x0d1420,
      fog: 0x0d1420,
      ground: 0x24403b,
      glow: 0x4f7385,
      sun: 0xffd098,
      mountain: 0x4a5966,
    },
  },
  suzuka: {
    label: "Suzuka",
    circuitName: "Suzuka Circuit",
    country: "Japan",
    officialLengthKm: 5.807,
    note: "A crossover-style recreation with first-sector S curves, a hairpin and a 130R-style finish.",
    width: 14.4,
    widthScale: 1.16,
    layoutScale: 1.96,
    speedFactor: 1.01,
    accelerationFactor: 0.98,
    aiSpeedFactor: 1,
    tension: 0.2,
    controlPoints: [
      [78, -10],
      [62, -28],
      [36, -34],
      [10, -26],
      [-12, -8],
      [-32, 12],
      [-52, 20],
      [-70, 6],
      [-72, -18],
      [-56, -40],
      [-26, -46],
      [0, -34],
      [6, -10],
      [-8, 12],
      [-30, 30],
      [-24, 50],
      [0, 62],
      [30, 56],
      [56, 40],
      [74, 14],
      [82, 30],
      [68, 52],
      [42, 70],
      [8, 74],
      [-6, 58],
      [10, 38],
      [34, 22],
      [58, 6],
    ],
    theme: {
      sky: 0x0e1424,
      fog: 0x0e1424,
      ground: 0x213a2b,
      glow: 0x5b7f63,
      sun: 0xffbf78,
      mountain: 0x43535d,
    },
  },
  monaco: {
    label: "Monaco",
    circuitName: "Circuit de Monaco",
    country: "Monaco",
    officialLengthKm: 3.337,
    note: "Tight and narrow, with a Fairmont-style hairpin and quick harbour-section direction changes.",
    width: 10.6,
    widthScale: 1.14,
    layoutScale: 2.12,
    speedFactor: 0.78,
    accelerationFactor: 0.86,
    aiSpeedFactor: 0.9,
    tension: 0.18,
    controlPoints: [
      [34, -18],
      [18, -30],
      [-8, -30],
      [-28, -20],
      [-36, -4],
      [-30, 12],
      [-18, 24],
      [-2, 30],
      [16, 28],
      [24, 18],
      [18, 8],
      [4, 6],
      [-8, 10],
      [-16, 20],
      [-12, 34],
      [4, 40],
      [22, 38],
      [36, 26],
      [40, 8],
    ],
    theme: {
      sky: 0x10223a,
      fog: 0x10223a,
      ground: 0x2b3226,
      glow: 0x355b68,
      sun: 0xffca90,
      mountain: 0x49545e,
    },
  },
  spa: {
    label: "Spa",
    circuitName: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    officialLengthKm: 7.004,
    note: "A longer forest circuit with an Eau Rouge-style climb and sweeping high-speed sections.",
    width: 15.8,
    widthScale: 1.2,
    layoutScale: 2.18,
    speedFactor: 1.12,
    accelerationFactor: 1.02,
    aiSpeedFactor: 1.05,
    tension: 0.22,
    controlPoints: [
      [88, -12],
      [62, -32],
      [26, -40],
      [-8, -28],
      [-30, -6],
      [-46, 14],
      [-70, 34],
      [-88, 14],
      [-76, -14],
      [-48, -36],
      [-10, -50],
      [28, -54],
      [60, -42],
      [82, -18],
      [90, 12],
      [70, 44],
      [34, 64],
      [-6, 58],
      [0, 28],
      [26, 14],
      [56, 6],
    ],
    theme: {
      sky: 0x0a1520,
      fog: 0x0a1520,
      ground: 0x203726,
      glow: 0x4e8156,
      sun: 0xffbe72,
      mountain: 0x40505a,
    },
  },
};

const OPPONENT_SPECS = [
  { id: "orion", name: "Orion", bodyColor: 0x2c79d8, accentColor: 0xd4efff, trimColor: 0x0b1622, driverColor: 0x10202f, baseSpeed: 38.4, paceOffset: 0.6, weave: 0.28 },
  { id: "sol", name: "Sol", bodyColor: 0xf0aa2d, accentColor: 0x371809, trimColor: 0x1a0c06, driverColor: 0x2b1610, baseSpeed: 37.6, paceOffset: 0.2, weave: 0.3 },
  { id: "jade", name: "Jade", bodyColor: 0x24b37e, accentColor: 0xd9fff0, trimColor: 0x071510, driverColor: 0x0e2318, baseSpeed: 37.9, paceOffset: 0.1, weave: 0.33 },
  { id: "nova", name: "Nova", bodyColor: 0xc63ed9, accentColor: 0xffd6ff, trimColor: 0x16071c, driverColor: 0x231029, baseSpeed: 38.1, paceOffset: 0.4, weave: 0.27 },
  { id: "atlas", name: "Atlas", bodyColor: 0xd55342, accentColor: 0xffefe2, trimColor: 0x190b08, driverColor: 0x281711, baseSpeed: 37.5, paceOffset: -0.15, weave: 0.24 },
  { id: "pixel", name: "Pixel", bodyColor: 0x41c7d8, accentColor: 0xeeffff, trimColor: 0x07161b, driverColor: 0x10242b, baseSpeed: 37.2, paceOffset: -0.1, weave: 0.31 },
];

const ui = {
  lap: document.querySelector("#lapValue"),
  position: document.querySelector("#positionValue"),
  timer: document.querySelector("#timerValue"),
  lapTimer: document.querySelector("#lapTimerValue"),
  bestLap: document.querySelector("#bestLapValue"),
  speed: document.querySelector("#speedValue"),
  status: document.querySelector("#statusValue"),
  session: document.querySelector("#sessionValue"),
  leaderboard: document.querySelector("#leaderboard"),
  boostFill: document.querySelector("#boostFill"),
  countdown: document.querySelector("#countdownValue"),
  intro: document.querySelector("#introOverlay"),
  finish: document.querySelector("#finishOverlay"),
  finishTitle: document.querySelector("#finishTitle"),
  finishBody: document.querySelector("#finishBody"),
  finishStats: document.querySelector("#finishStats"),
  garageMeta: document.querySelector("#garageMeta"),
  trackInfo: document.querySelector("#trackInfo"),
  startButton: document.querySelector("#startButton"),
  restartButton: document.querySelector("#restartButton"),
  garageButton: document.querySelector("#garageButton"),
  trackSelect: document.querySelector("#trackSelect"),
  lapsSelect: document.querySelector("#lapsSelect"),
  rivalsSelect: document.querySelector("#rivalsSelect"),
  difficultySelect: document.querySelector("#difficultySelect"),
  soundToggle: document.querySelector("#soundToggle"),
  volumeControl: document.querySelector("#volumeControl"),
  volumeValue: document.querySelector("#volumeValue"),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09131f);
scene.fog = new THREE.Fog(0x09131f, 65, 240);
const world = new THREE.Group();
scene.add(world);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 700);
camera.position.set(0, 10, -14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.querySelector("#app").prepend(renderer.domElement);

const keys = Object.create(null);
const raceAudio = createRaceAudio();

const state = {
  phase: "garage",
  countdown: 2.99,
  lastCountdownBeat: null,
  cameraMode: "chase",
  finishOrder: [],
  paused: false,
  contactCooldown: 0,
  settings: {
    track: ui.trackSelect.value,
    laps: Number(ui.lapsSelect.value),
    rivals: Number(ui.rivalsSelect.value),
    difficulty: ui.difficultySelect.value,
    soundEnabled: ui.soundToggle.checked,
    volume: Number(ui.volumeControl.value),
  },
  lastResult: null,
};

let trackData = rebuildTrackWorld(state.settings.track);

const player = createPlayerCar(trackData);
const opponentRoster = createOpponents(trackData);
let activeOpponents = [];

let previousFrame = performance.now();

ui.startButton.addEventListener("click", () => {
  void beginCountdown();
});
ui.restartButton.addEventListener("click", () => {
  void beginCountdown();
});
ui.garageButton.addEventListener("click", openGarage);

[ui.trackSelect, ui.lapsSelect, ui.rivalsSelect, ui.difficultySelect].forEach((element) => {
  element.addEventListener("change", () => syncSettingsFromUI({ preview: state.phase === "garage" }));
});

ui.soundToggle.addEventListener("change", () => {
  syncSettingsFromUI();
  void raceAudio.unlock();
});
ui.volumeControl.addEventListener("input", () => syncSettingsFromUI());

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  keys[key] = true;

  if (event.repeat) {
    return;
  }

  if (key === " ") {
    if (state.phase === "garage" || state.phase === "finished") {
      void beginCountdown();
    }
  }

  if (key === "v") {
    state.cameraMode = state.cameraMode === "chase" ? "broadcast" : "chase";
  }

  if (key === "r") {
    if (state.phase !== "garage") {
      void beginCountdown();
    }
  }

  if (key === "p" || key === "escape") {
    togglePause();
  }

  if (key === "m") {
    ui.soundToggle.checked = !ui.soundToggle.checked;
    syncSettingsFromUI();
    void raceAudio.unlock();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

syncSettingsFromUI({ preview: true });
openGarage();
animate();

async function beginCountdown() {
  if (state.phase === "countdown" || (state.phase === "race" && !player.finished && !state.paused)) {
    return;
  }

  syncSettingsFromUI();
  prepareRace();
  state.paused = false;
  state.phase = "countdown";
  state.countdown = 2.99;
  state.lastCountdownBeat = Math.ceil(state.countdown);

  ui.intro.classList.add("overlay-hidden");
  ui.finish.classList.add("overlay-hidden");
  ui.status.textContent = "Formation complete. Watch the lights.";

  await raceAudio.unlock();
  raceAudio.countdownTick(state.lastCountdownBeat);
  updateHUD();
}

function openGarage() {
  state.phase = "garage";
  state.paused = false;
  state.countdown = 2.99;
  state.lastCountdownBeat = null;
  ui.intro.classList.remove("overlay-hidden");
  ui.finish.classList.add("overlay-hidden");
  ui.status.textContent = "Tune the session in the garage and launch when ready.";
  syncSettingsFromUI({ preview: true });
  updateGarageMeta();
  updateHUD();
}

function togglePause() {
  if (state.phase === "garage" || state.phase === "finished") {
    return;
  }

  state.paused = !state.paused;
  ui.status.textContent = state.paused ? "Session paused. Press P or Esc to resume." : state.phase === "countdown" ? "Hold steady for lights out." : "Push for the apex.";
  raceAudio.pauseCue(state.paused);
}

function syncSettingsFromUI({ preview = false } = {}) {
  const selectedTrack = ui.trackSelect.value;
  const trackChanged = state.settings.track !== selectedTrack;
  state.settings.track = selectedTrack;
  state.settings.laps = Number(ui.lapsSelect.value);
  state.settings.rivals = Number(ui.rivalsSelect.value);
  state.settings.difficulty = ui.difficultySelect.value;
  state.settings.soundEnabled = ui.soundToggle.checked;
  state.settings.volume = Number(ui.volumeControl.value);

  if (trackChanged) {
    trackData = rebuildTrackWorld(selectedTrack);
  }

  ui.volumeValue.textContent = `${Math.round(state.settings.volume * 100)}%`;
  ui.session.textContent = buildSessionSummary();

  raceAudio.setEnabled(state.settings.soundEnabled);
  raceAudio.setVolume(state.settings.volume);

  updateTrackInfo();
  updateGarageMeta();

  if (preview || trackChanged) {
    preparePreviewGrid();
  } else {
    updateHUD();
  }
}

function buildSessionSummary() {
  const difficulty = DIFFICULTY_PRESETS[state.settings.difficulty];
  const track = TRACK_PRESETS[state.settings.track];
  return `${track.label} · ${state.settings.laps} laps · ${state.settings.rivals} rivals · ${difficulty.label}`;
}

function updateGarageMeta() {
  const currentTrack = TRACK_PRESETS[state.settings.track];
  if (!state.lastResult) {
    ui.garageMeta.textContent = `Recommended session: ${currentTrack.label}, 5 laps, 5 rivals, Pro difficulty.`;
    return;
  }

  const difficulty = DIFFICULTY_PRESETS[state.lastResult.settings.difficulty];
  const resultTrack = TRACK_PRESETS[state.lastResult.settings.track];
  ui.garageMeta.textContent =
    `Last result: ${ordinal(state.lastResult.place)} in ${formatTime(state.lastResult.raceTime)} ` +
    `with a best lap of ${formatBestTime(state.lastResult.bestLap)} on ${resultTrack.label} in a ${state.lastResult.settings.laps}-lap ${difficulty.label} session.`;
}

function updateTrackInfo() {
  const preset = TRACK_PRESETS[state.settings.track];
  ui.trackInfo.textContent =
    `${preset.circuitName} · ${preset.country} · ${preset.officialLengthKm.toFixed(3)} km. ${preset.note}`;
}

function rebuildTrackWorld(trackKey) {
  clearGroup(world);

  const preset = TRACK_PRESETS[trackKey];
  scene.background = new THREE.Color(preset.theme.sky);
  scene.fog = new THREE.Fog(preset.theme.fog, 65, 255);

  const nextTrack = createTrack(world, preset);
  createEnvironment(world, nextTrack, preset);
  return nextTrack;
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    disposeNode(child);
  }
}

function disposeNode(node) {
  node.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function preparePreviewGrid() {
  configureActiveOpponents();
  state.finishOrder = [];
  resetPlayer(player, trackData);
  resetOpponents(activeOpponents, trackData);
  updateHUD();
}

function prepareRace() {
  configureActiveOpponents();
  state.finishOrder = [];
  state.contactCooldown = 0;
  resetPlayer(player, trackData);
  resetOpponents(activeOpponents, trackData);
}

function configureActiveOpponents() {
  const laneScale = (trackData.width ?? TRACK_WIDTH) / TRACK_WIDTH;
  const gridOffsets = [1.15, -1.15, 0.45, -0.45, 2.05, -2.05].map((offset) => offset * laneScale);

  activeOpponents = opponentRoster.filter((entry, index) => {
    const active = index < state.settings.rivals;
    entry.active = active;
    entry.group.visible = active;
    entry.gridLane = gridOffsets[index];
    if (!active) {
      entry.progress = -999;
      entry.finished = false;
      entry.finishPlace = null;
    }
    return active;
  });
}

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = Math.min((now - previousFrame) / 1000, 0.033);
  previousFrame = now;

  if (state.contactCooldown > 0) {
    state.contactCooldown = Math.max(0, state.contactCooldown - dt);
  }

  if (!state.paused) {
    if (state.phase === "countdown") {
      updateCountdown(dt);
    }

    updateOpponents(dt);
    updatePlayer(dt);
    if (state.phase === "race") {
      resolveTrafficInteractions();
    }
  }

  updateCamera(dt);
  updateHUD();
  raceAudio.update({
    phase: state.phase,
    paused: state.paused,
    speed: player.speed,
    throttle: player.throttleIntent,
    brake: keys.s || keys.arrowdown ? 1 : 0,
    steering: player.steerVisual,
    boostActive: player.boostActive,
    onTrack: player.onTrack,
    draftFactor: player.draftFactor,
    edgeRumble: player.edgeRumble,
  });

  renderer.render(scene, camera);
}

function updateCountdown(dt) {
  state.countdown -= dt;

  const nextBeat = Math.max(0, Math.ceil(state.countdown));
  if (nextBeat > 0 && nextBeat !== state.lastCountdownBeat) {
    state.lastCountdownBeat = nextBeat;
    raceAudio.countdownTick(nextBeat);
  }

  if (state.countdown <= 0) {
    state.phase = "race";
    ui.status.textContent = "Green flag. Attack the opening sector.";
    raceAudio.goCue();
  }
}

function updatePlayer(dt) {
  const throttle = keys.w || keys.arrowup ? 1 : 0;
  const brake = keys.s || keys.arrowdown ? 1 : 0;
  const steer = (keys.a || keys.arrowleft ? 1 : 0) - (keys.d || keys.arrowright ? 1 : 0);

  player.throttleIntent = throttle;
  player.steerVisual = THREE.MathUtils.damp(player.steerVisual, steer, 7.6, dt);

  const infoBeforeMove = getClosestTrackInfo(player.group.position, trackData);
  const onTrack = Math.abs(infoBeforeMove.crossTrack) < trackData.width * 0.5 + 1.6;
  const draftFactor = state.phase === "race" ? getDraftFactor() : 0;
  const boostActive = state.phase === "race" && !player.finished && keys.shift && player.boost > 0.04 && player.speed > 12;
  const trackSpeedFactor = trackData.speedFactor ?? 1;
  const accelerationFactor = trackData.accelerationFactor ?? 1;
  const coastSpeed = onTrack ? PLAYER_COAST_SPEED * trackSpeedFactor : 8;
  const maxSpeed = boostActive ? PLAYER_BOOST_SPEED * trackSpeedFactor : onTrack ? PLAYER_MAX_SPEED * trackSpeedFactor : 34 * Math.max(0.82, trackSpeedFactor);

  player.onTrack = onTrack;
  player.draftFactor = draftFactor;
  player.boostActive = boostActive;

  if (state.phase === "race" && !player.finished) {
    player.raceTime += dt;
    player.currentLapTime += dt;

    if (throttle) {
      player.speed += (onTrack ? 40 : 21) * dt * accelerationFactor;
    }

    if (brake) {
      player.speed -= player.speed > 0 ? 44 * dt : 16 * dt;
    }

    if (!throttle && !brake) {
      player.speed = THREE.MathUtils.damp(player.speed, coastSpeed, onTrack ? 1.3 : 2.6, dt);
    }

    if (draftFactor > 0 && throttle) {
      player.speed += draftFactor * 13 * dt;
      player.boost = Math.min(1, player.boost + draftFactor * dt * 0.035);
    }

    if (boostActive) {
      player.speed += 30 * dt;
      player.boost = Math.max(0, player.boost - dt * 0.26);
    } else {
      player.boost = Math.min(1, player.boost + dt * (onTrack ? 0.085 : 0.05));
    }

    player.speed = THREE.MathUtils.clamp(player.speed, -18, maxSpeed);

    const speedFactor = THREE.MathUtils.clamp(Math.abs(player.speed) / 64, 0, 1);
    const steering = (0.82 + (1 - speedFactor) * 0.58) * Math.sign(player.speed || 1);
    player.heading += steer * steering * dt * (0.34 + speedFactor * 1.04);

    const alignment = shortestAngle(player.heading, infoBeforeMove.heading);
    player.heading += alignment * dt * (onTrack ? 0.48 : 0.14);

    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    player.group.position.addScaledVector(forward, player.speed * dt);

    if (!onTrack) {
      player.speed = THREE.MathUtils.damp(player.speed, 0, 1.9, dt);
      player.group.position.addScaledVector(infoBeforeMove.normal, -Math.sign(infoBeforeMove.crossTrack || 1) * dt * 6.7);
    }
  } else {
    player.speed = THREE.MathUtils.damp(player.speed, 0, 4.2, dt);
    player.boost = Math.min(1, player.boost + dt * 0.08);
  }

  const info = getClosestTrackInfo(player.group.position, trackData);
  player.closestIndex = info.index;
  const trackHalfWidth = trackData.width * 0.5;
  const edgeDistance = trackHalfWidth - Math.abs(info.crossTrack);
  player.onTrack = Math.abs(info.crossTrack) < trackHalfWidth + 1.6;
  player.edgeRumble = player.onTrack ? THREE.MathUtils.clamp(1 - edgeDistance / 1.2, 0, 1) : 0;
  player.progress = player.finished ? state.settings.laps + 1 + 0.02 : (player.lap - 1) + info.progress;
  player.group.position.y = CAR_BASE_HEIGHT + Math.sin(performance.now() * 0.01 + player.speed * 0.08) * 0.012;
  player.group.rotation.y = player.heading;

  animateCarVisuals(player, dt);
  spinWheels(player, dt);
  animateThrusterGlow(player, boostActive, onTrack, draftFactor);

  if (state.phase === "race" && !player.finished) {
    const nextCheckpoint = trackData.checkpoints[player.nextCheckpoint];
    if (player.group.position.distanceToSquared(nextCheckpoint) < CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
      if (player.nextCheckpoint === 0) {
        player.lastLapTime = player.currentLapTime;
        player.bestLapTime = Math.min(player.bestLapTime ?? Number.POSITIVE_INFINITY, player.currentLapTime);
        player.lap += 1;
        player.currentLapTime = 0;

        if (player.lap > state.settings.laps) {
          finishEntity(player);
          return;
        }

        player.nextCheckpoint = 1;
        ui.status.textContent = `Lap ${player.lap} started. Keep it tidy through sector one.`;
      } else {
        player.nextCheckpoint = (player.nextCheckpoint + 1) % CHECKPOINT_COUNT;
      }
    }
  }
}

function getDraftFactor() {
  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const side = new THREE.Vector3(forward.z, 0, -forward.x);
  let best = 0;

  for (const opponent of activeOpponents) {
    if (opponent.finished) {
      continue;
    }

    const delta = opponent.group.position.clone().sub(player.group.position);
    delta.y = 0;

    const ahead = delta.dot(forward);
    const sideways = Math.abs(delta.dot(side));
    const distance = delta.length();

    if (ahead < 2 || ahead > 12 || distance > 13 || sideways > 1.95) {
      continue;
    }

    const factor = (1 - ahead / 12) * (1 - sideways / 1.95);
    best = Math.max(best, factor);
  }

  return THREE.MathUtils.clamp(best, 0, 1);
}

function updateOpponents(dt) {
  const difficulty = DIFFICULTY_PRESETS[state.settings.difficulty];
  const trackAiFactor = trackData.aiSpeedFactor ?? 1;

  for (const opponent of activeOpponents) {
    if (state.phase !== "race" || opponent.finished) {
      opponent.speed = THREE.MathUtils.damp(opponent.speed, 0, 3.2, dt);
    } else {
      const tangentNow = trackData.curve.getTangentAt(opponent.t);
      const tangentSoon = trackData.curve.getTangentAt((opponent.t + 0.012) % 1);
      const turnSeverity = 1 - THREE.MathUtils.clamp(tangentNow.dot(tangentSoon), 0, 1);
      const chaseFactor = player.finished ? 0 : THREE.MathUtils.clamp(player.progress - opponent.progress, -0.35, 0.7);
      const targetSpeed = Math.max(
        28,
        opponent.profile.baseSpeed * difficulty.aiPace * trackAiFactor +
          opponent.profile.paceOffset +
          chaseFactor * difficulty.aiRubberBand -
          turnSeverity * 56,
      );

      opponent.speed = THREE.MathUtils.damp(opponent.speed, targetSpeed, 2.15, dt);
      opponent.t += (opponent.speed / trackData.length) * dt;

      if (opponent.t >= 1) {
        opponent.t -= 1;
        opponent.lap += 1;

        if (opponent.lap > state.settings.laps) {
          finishEntity(opponent);
        }
      }
    }

    const pos = trackData.curve.getPointAt(opponent.t);
    const tangent = trackData.curve.getTangentAt(opponent.t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const heading = Math.atan2(tangent.x, tangent.z);
    const weave = Math.sin(performance.now() * 0.0008 + opponent.weavePhase) * opponent.profile.weave;

    opponent.group.position.copy(pos).addScaledVector(normal, opponent.gridLane + weave);
    opponent.group.position.y = CAR_BASE_HEIGHT + Math.sin(performance.now() * 0.007 + opponent.weavePhase) * 0.012;
    opponent.group.rotation.y = heading;
    opponent.progress = opponent.finished ? state.settings.laps + 1 + opponent.finishPlace * 0.001 : (opponent.lap - 1) + opponent.t;
    opponent.steerVisual = THREE.MathUtils.damp(opponent.steerVisual, shortestAngle(opponent.steerVisual, 0) + shortestAngle(opponent.group.rotation.y, heading) * 1.8, 7, dt);

    animateCarVisuals(opponent, dt);
    spinWheels(opponent, dt);
    animateThrusterGlow(opponent, false, true, 0);
  }
}

function resolveTrafficInteractions() {
  for (const opponent of activeOpponents) {
    const delta = player.group.position.clone().sub(opponent.group.position);
    delta.y = 0;
    const distance = delta.length();

    if (distance < 2.2) {
      const direction = distance > 0.001 ? delta.multiplyScalar(1 / distance) : new THREE.Vector3(1, 0, 0);
      const push = (2.2 - distance) * 0.65;
      player.group.position.addScaledVector(direction, push);
      player.speed *= 0.985;

      if (state.contactCooldown === 0) {
        ui.status.textContent = "Wheel to wheel. Keep it clean through the corner.";
        raceAudio.contactCue(0.6 + Math.min(0.6, Math.abs(player.speed) / 90));
        state.contactCooldown = 1.15;
      }
    }
  }
}

function updateCamera(dt) {
  const speedInfluence = THREE.MathUtils.clamp(player.speed / 70, -0.2, 1);
  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const side = new THREE.Vector3(forward.z, 0, -forward.x);
  const desiredPosition = new THREE.Vector3();
  const lookAtTarget = player.group.position.clone().addScaledVector(forward, 8 + speedInfluence * 4);
  lookAtTarget.y += 1.2;

  if (state.cameraMode === "chase") {
    desiredPosition
      .copy(player.group.position)
      .addScaledVector(forward, -13 - speedInfluence * 4)
      .addScaledVector(side, -player.steerVisual * 1.5);
    desiredPosition.y += 5.8 + speedInfluence * 2.3;
  } else {
    desiredPosition.copy(player.group.position).addScaledVector(forward, -4);
    desiredPosition.y += 18.5;
    lookAtTarget.y = player.group.position.y + 0.3;
  }

  camera.position.lerp(desiredPosition, 1 - Math.exp(-dt * 4.5));
  camera.lookAt(lookAtTarget);
  camera.fov = THREE.MathUtils.damp(camera.fov, 60 + speedInfluence * 11, 4, dt);
  camera.updateProjectionMatrix();
}

function updateHUD() {
  const standings = getStandings();
  const playerRank = standings.findIndex((entry) => entry.id === player.id) + 1;
  const displayLap = Math.min(player.lap, state.settings.laps);

  ui.lap.textContent = `${displayLap} / ${state.settings.laps}`;
  ui.position.textContent = `${player.finished ? player.finishPlace : playerRank} / ${standings.length}`;
  ui.timer.textContent = formatTime(player.raceTime);
  ui.lapTimer.textContent = formatTime(player.currentLapTime);
  ui.bestLap.textContent = formatBestTime(player.bestLapTime);
  ui.speed.textContent = `${Math.max(0, Math.round(player.speed * 4.4))}`;
  ui.boostFill.style.transform = `scaleX(${player.boost.toFixed(3)})`;
  ui.session.textContent = buildSessionSummary();

  if (state.paused) {
    ui.countdown.textContent = "PAUSED";
  } else if (state.phase === "countdown") {
    ui.countdown.textContent = String(Math.max(1, Math.ceil(state.countdown)));
  } else if (state.phase === "race" && player.draftFactor > 0.35) {
    ui.countdown.textContent = "SLIPSTREAM";
  } else if (player.finished) {
    ui.countdown.textContent = "CHECKERED";
  } else {
    ui.countdown.textContent = "";
  }

  ui.leaderboard.innerHTML = standings
    .map((entry, index) => {
      const lap = entry.finished ? "flag" : `L${Math.min(entry.lap, state.settings.laps)}`;
      return `
        <div class="leaderboard-row${entry.id === player.id ? " is-player" : ""}">
          <span class="leaderboard-pos">${index + 1}.</span>
          <span class="leaderboard-name">${entry.name}</span>
          <span class="leaderboard-lap">${lap}</span>
        </div>
      `;
    })
    .join("");
}

function finishEntity(entity) {
  if (entity.finished) {
    return;
  }

  entity.finished = true;
  state.finishOrder.push(entity.id);
  entity.finishPlace = state.finishOrder.length;
  entity.progress = state.settings.laps + 1 + entity.finishPlace * 0.001;

  if (entity.id === player.id) {
    state.phase = "finished";
    state.lastResult = {
      place: player.finishPlace,
      raceTime: player.raceTime,
      bestLap: player.bestLapTime,
      settings: { ...state.settings },
    };

    ui.status.textContent = `P${player.finishPlace}. Cool the tyres and queue the next session when ready.`;
    ui.finishTitle.textContent = `${ordinal(player.finishPlace)} Place`;
    ui.finishBody.textContent =
      `Race time ${formatTime(player.raceTime)}.` +
      (Number.isFinite(player.bestLapTime) ? ` Best lap ${formatTime(player.bestLapTime)}.` : "");

    updateFinishOverlay();
    updateGarageMeta();
    ui.finish.classList.remove("overlay-hidden");
    raceAudio.finishCue(player.finishPlace);
  } else if (!player.finished) {
    ui.status.textContent = `${entity.name} saw the flag first. Keep hunting the podium.`;
  }
}

function updateFinishOverlay() {
  const standings = getStandings();
  const podium = standings.slice(0, 3).map((entry) => entry.name).join(" / ");

  ui.finishStats.innerHTML = [
    { label: "Session", value: buildSessionSummary() },
    { label: "Best Lap", value: formatBestTime(player.bestLapTime) },
    { label: "Grid", value: `${activeOpponents.length + 1} cars` },
    { label: "Podium", value: podium },
  ]
    .map(
      (item) => `
        <div class="finish-stat">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `,
    )
    .join("");
}

function getStandings() {
  return [player, ...activeOpponents].slice().sort((a, b) => {
    if (a.finished && b.finished) {
      return a.finishPlace - b.finishPlace;
    }
    if (a.finished) {
      return -1;
    }
    if (b.finished) {
      return 1;
    }
    return b.progress - a.progress;
  });
}

function resetPlayer(entity, track) {
  const spawn = getSpawnTransform(track, track.startT, track.playerLaneOffset);
  entity.group.position.copy(spawn.position);
  entity.group.position.y = CAR_BASE_HEIGHT;
  entity.heading = spawn.heading;
  entity.group.rotation.y = spawn.heading;
  entity.speed = 0;
  entity.boost = 1;
  entity.lap = 1;
  entity.progress = 0;
  entity.closestIndex = 0;
  entity.nextCheckpoint = 1;
  entity.finished = false;
  entity.finishPlace = null;
  entity.raceTime = 0;
  entity.currentLapTime = 0;
  entity.bestLapTime = null;
  entity.lastLapTime = 0;
  entity.steerVisual = 0;
  entity.boostActive = false;
  entity.draftFactor = 0;
  entity.throttleIntent = 0;
  entity.onTrack = true;
  entity.edgeRumble = 0;
  entity.chassis.rotation.z = 0;
}

function resetOpponents(entries, track) {
  entries.forEach((entry, index) => {
    const row = Math.floor(index / 2);
    const stagger = index % 2 === 0 ? 0 : 0.0025;
    const t = track.gridBaseT + row * track.gridStepT + stagger;
    const spawn = getSpawnTransform(track, t, entry.gridLane);

    entry.group.position.copy(spawn.position);
    entry.group.position.y = CAR_BASE_HEIGHT;
    entry.group.rotation.y = spawn.heading;
    entry.t = t;
    entry.speed = 0;
    entry.lap = 1;
    entry.progress = t;
    entry.finished = false;
    entry.finishPlace = null;
    entry.steerVisual = 0;
    entry.chassis.rotation.z = 0;
  });
}

function createPlayerCar(track) {
  const car = makeCar({
    bodyColor: 0xdb452c,
    accentColor: 0xf6dd9d,
    trimColor: 0x120d0b,
    driverColor: 0x101927,
  });
  const spawn = getSpawnTransform(track, track.startT, track.playerLaneOffset);
  car.group.position.copy(spawn.position);
  car.group.position.y = CAR_BASE_HEIGHT;
  car.group.rotation.y = spawn.heading;
  scene.add(car.group);

  return {
    ...car,
    id: "player",
    name: "You",
    heading: spawn.heading,
    speed: 0,
    lap: 1,
    progress: 0,
    closestIndex: 0,
    nextCheckpoint: 1,
    boost: 1,
    raceTime: 0,
    currentLapTime: 0,
    bestLapTime: null,
    lastLapTime: 0,
    finished: false,
    finishPlace: null,
    steerVisual: 0,
    boostActive: false,
    draftFactor: 0,
    throttleIntent: 0,
    onTrack: true,
    edgeRumble: 0,
  };
}

function createOpponents(track) {
  return OPPONENT_SPECS.map((profile, index) => {
    const car = makeCar(profile);
    const spawn = getSpawnTransform(track, track.gridBaseT + index * 0.012, 0);
    car.group.position.copy(spawn.position);
    car.group.position.y = CAR_BASE_HEIGHT;
    car.group.rotation.y = spawn.heading;
    car.group.visible = false;
    scene.add(car.group);

    return {
      ...car,
      id: profile.id,
      name: profile.name,
      profile,
      gridLane: 0,
      t: track.gridBaseT + index * 0.012,
      speed: 0,
      lap: 1,
      progress: 0,
      weavePhase: index * 1.7 + 0.8,
      steerVisual: 0,
      finished: false,
      finishPlace: null,
      active: false,
    };
  });
}

function makeCar({ bodyColor, accentColor, trimColor, driverColor }) {
  const group = new THREE.Group();
  const chassis = new THREE.Group();
  group.add(chassis);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.24,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.28,
    metalness: 0.12,
  });
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.58,
    metalness: 0.08,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x090c10,
    roughness: 0.96,
    metalness: 0.02,
  });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd8df,
    roughness: 0.24,
    metalness: 0.62,
  });
  const helmetMaterial = new THREE.MeshPhysicalMaterial({
    color: driverColor,
    roughness: 0.22,
    metalness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
  });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc289,
    emissive: 0xff6e39,
    emissiveIntensity: 0.7,
    roughness: 0.18,
    metalness: 0.1,
  });

  const bodyPieces = [
    makeMesh(new THREE.BoxGeometry(1.56, 0.18, 4.35), carbonMaterial, [0, 0.33, 0.08]),
    makeMesh(new THREE.CylinderGeometry(0.16, 0.34, 2.35, 12), bodyMaterial, [0, 0.56, 2.3], [Math.PI * 0.5, 0, 0]),
    makeMesh(new THREE.ConeGeometry(0.14, 0.62, 12), bodyMaterial, [0, 0.56, 3.7], [Math.PI * 0.5, 0, 0]),
    makeMesh(new THREE.BoxGeometry(0.92, 0.54, 1.62), bodyMaterial, [0, 0.79, 0.92]),
    makeMesh(new THREE.BoxGeometry(0.48, 0.44, 1.95), bodyMaterial, [-0.72, 0.58, -0.04]),
    makeMesh(new THREE.BoxGeometry(0.48, 0.44, 1.95), bodyMaterial, [0.72, 0.58, -0.04]),
    makeMesh(new THREE.CylinderGeometry(0.34, 0.48, 1.8, 14), bodyMaterial, [0, 0.86, -1.02], [Math.PI * 0.5, 0, 0]),
    makeMesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), bodyMaterial, [0, 1.18, -0.84]),
    makeMesh(new THREE.BoxGeometry(1.04, 0.16, 1.02), bodyMaterial, [0, 0.62, -1.62]),
    makeMesh(new THREE.BoxGeometry(2.42, 0.06, 0.42), carbonMaterial, [0, 0.24, 4.03]),
    makeMesh(new THREE.BoxGeometry(1.62, 0.05, 0.2), accentMaterial, [0, 0.34, 4.18]),
    makeMesh(new THREE.BoxGeometry(0.12, 0.48, 0.54), carbonMaterial, [-1.2, 0.37, 4.02]),
    makeMesh(new THREE.BoxGeometry(0.12, 0.48, 0.54), carbonMaterial, [1.2, 0.37, 4.02]),
    makeMesh(new THREE.BoxGeometry(2.02, 0.08, 0.42), carbonMaterial, [0, 1.04, -2.42]),
    makeMesh(new THREE.BoxGeometry(1.92, 0.08, 0.36), accentMaterial, [0, 1.34, -2.38]),
    makeMesh(new THREE.BoxGeometry(0.12, 0.72, 0.42), carbonMaterial, [-0.97, 1.18, -2.42]),
    makeMesh(new THREE.BoxGeometry(0.12, 0.72, 0.42), carbonMaterial, [0.97, 1.18, -2.42]),
    makeMesh(new THREE.BoxGeometry(0.08, 0.56, 0.08), carbonMaterial, [-0.32, 0.92, -2.05]),
    makeMesh(new THREE.BoxGeometry(0.08, 0.56, 0.08), carbonMaterial, [0.32, 0.92, -2.05]),
    makeMesh(new THREE.BoxGeometry(0.08, 0.52, 0.08), carbonMaterial, [-0.22, 0.47, 3.55]),
    makeMesh(new THREE.BoxGeometry(0.08, 0.52, 0.08), carbonMaterial, [0.22, 0.47, 3.55]),
    makeMesh(new THREE.BoxGeometry(0.38, 0.04, 2.52), accentMaterial, [0, 0.58, 1.18]),
    makeMesh(new THREE.BoxGeometry(0.05, 0.16, 0.76), accentMaterial, [-0.73, 0.75, -0.08]),
    makeMesh(new THREE.BoxGeometry(0.05, 0.16, 0.76), accentMaterial, [0.73, 0.75, -0.08]),
    makeMesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), accentMaterial, [-0.48, 0.94, 1.22]),
    makeMesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), accentMaterial, [0.48, 0.94, 1.22]),
    makeMesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), glowMaterial, [0, 0.62, -2.76]),
  ];

  const halo = makeMesh(new THREE.TorusGeometry(0.34, 0.04, 10, 20, Math.PI), carbonMaterial, [0, 1.04, 0.58], [Math.PI * 0.5, 0, Math.PI]);
  const haloSupport = makeMesh(new THREE.BoxGeometry(0.08, 0.48, 0.08), carbonMaterial, [0, 0.84, 0.94]);
  const helmet = makeMesh(new THREE.SphereGeometry(0.24, 16, 16), helmetMaterial, [0, 0.94, 0.62]);
  const visor = makeMesh(new THREE.BoxGeometry(0.32, 0.09, 0.12), accentMaterial, [0, 0.95, 0.8]);

  [...bodyPieces, halo, haloSupport, helmet, visor].forEach((piece) => {
    piece.castShadow = true;
    piece.receiveShadow = true;
    chassis.add(piece);
  });

  const frontLeftWheel = makeWheelAssembly([-1.1, 0.42, 1.66], tireMaterial, metalMaterial, accentMaterial);
  const frontRightWheel = makeWheelAssembly([1.1, 0.42, 1.66], tireMaterial, metalMaterial, accentMaterial);
  const rearLeftWheel = makeWheelAssembly([-1.08, 0.42, -1.34], tireMaterial, metalMaterial, accentMaterial);
  const rearRightWheel = makeWheelAssembly([1.08, 0.42, -1.34], tireMaterial, metalMaterial, accentMaterial);

  const wheelAssemblies = [frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel];
  wheelAssemblies.forEach(({ mount }) => {
    mount.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
    chassis.add(mount);
  });

  const suspensionLinks = [
    makeLink(new THREE.Vector3(-0.42, 0.6, 1.28), new THREE.Vector3(-1.1, 0.42, 1.66), carbonMaterial),
    makeLink(new THREE.Vector3(0.42, 0.6, 1.28), new THREE.Vector3(1.1, 0.42, 1.66), carbonMaterial),
    makeLink(new THREE.Vector3(-0.66, 0.5, -0.92), new THREE.Vector3(-1.08, 0.42, -1.34), carbonMaterial),
    makeLink(new THREE.Vector3(0.66, 0.5, -0.92), new THREE.Vector3(1.08, 0.42, -1.34), carbonMaterial),
    makeLink(new THREE.Vector3(-0.58, 0.78, 0.26), new THREE.Vector3(-1.1, 0.42, 1.66), carbonMaterial, 0.025),
    makeLink(new THREE.Vector3(0.58, 0.78, 0.26), new THREE.Vector3(1.1, 0.42, 1.66), carbonMaterial, 0.025),
  ];
  suspensionLinks.forEach((link) => {
    link.castShadow = true;
    link.receiveShadow = true;
    chassis.add(link);
  });

  chassis.scale.setScalar(0.95);

  return {
    group,
    chassis,
    wheelSpinners: wheelAssemblies.map((entry) => entry.spinner),
    frontSteerMounts: [frontLeftWheel.mount, frontRightWheel.mount],
    glow: bodyPieces[bodyPieces.length - 1],
  };
}

function makeWheelAssembly([x, y, z], tireMaterial, metalMaterial, accentMaterial) {
  const mount = new THREE.Group();
  const spinner = new THREE.Group();
  mount.position.set(x, y, z);

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.34, 20), tireMaterial);
  tire.rotation.z = Math.PI * 0.5;

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.36, 16), metalMaterial);
  rim.rotation.z = Math.PI * 0.5;

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.38, 10), accentMaterial);
  hub.rotation.z = Math.PI * 0.5;

  spinner.add(tire, rim, hub);
  mount.add(spinner);

  return { mount, spinner };
}

function makeLink(start, end, material, radius = 0.03) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeMesh(geometry, material, [x, y, z], [rx = 0, ry = 0, rz = 0] = []) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function animateCarVisuals(car, dt) {
  const speedFactor = THREE.MathUtils.clamp(Math.abs(car.speed) / 80, 0, 1);
  const lean = -car.steerVisual * speedFactor * 0.11;
  car.chassis.rotation.z = THREE.MathUtils.damp(car.chassis.rotation.z, lean, 7, dt);
  for (const mount of car.frontSteerMounts) {
    mount.rotation.y = car.steerVisual * 0.42;
  }
}

function spinWheels(car, dt) {
  const rotation = -car.speed * dt * 1.55;
  for (const spinner of car.wheelSpinners) {
    spinner.rotation.x += rotation;
  }
}

function animateThrusterGlow(car, boostActive, onTrack, draftFactor) {
  car.glow.material.emissiveIntensity = boostActive ? 2.1 : draftFactor > 0.3 ? 1.15 : onTrack ? 0.68 : 0.42;
  car.glow.scale.x = boostActive ? 1.26 : 1;
}

function createTrack(targetScene, preset) {
  const layoutScale = preset.layoutScale ?? TRACK_LAYOUT_SCALE;
  const width = (preset.width ?? TRACK_WIDTH) * (preset.widthScale ?? TRACK_WIDTH_SCALE);
  const controlPoints = preset.controlPoints.map(([x, z]) => new THREE.Vector3(x * layoutScale, 0, z * layoutScale));

  const curve = new THREE.CatmullRomCurve3(controlPoints, true, preset.curveType ?? "centripetal", preset.tension ?? 0.2);
  curve.arcLengthDivisions = 3000;

  const points = curve.getSpacedPoints(ROAD_SAMPLES);
  points.pop();

  const tangents = points.map((_, index) => curve.getTangentAt(index / ROAD_SAMPLES).normalize());
  const normals = tangents.map((tangent) => new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());

  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += points[index - 1].distanceTo(points[index]);
  }

  const roadTexture = createRoadTexture();
  const curbTexture = createCurbTexture();
  const lineTexture = createSideLineTexture();

  const road = new THREE.Mesh(
    createRibbonGeometry(points, normals, width * 0.5, -width * 0.5, 0.04, length, 19),
    new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.92,
      metalness: 0.05,
    }),
  );
  road.receiveShadow = true;
  targetScene.add(road);

  const leftCurb = new THREE.Mesh(
    createRibbonGeometry(points, normals, width * 0.5 + CURB_WIDTH, width * 0.5, 0.041, length, 22),
    new THREE.MeshStandardMaterial({ map: curbTexture, roughness: 0.84, metalness: 0.02 }),
  );
  const rightCurb = new THREE.Mesh(
    createRibbonGeometry(points, normals, -width * 0.5, -(width * 0.5 + CURB_WIDTH), 0.041, length, 22),
    new THREE.MeshStandardMaterial({ map: curbTexture, roughness: 0.84, metalness: 0.02 }),
  );
  leftCurb.receiveShadow = true;
  rightCurb.receiveShadow = true;
  targetScene.add(leftCurb, rightCurb);

  const leftLine = new THREE.Mesh(
    createRibbonGeometry(points, normals, width * 0.5 - 0.36, width * 0.5 - 0.15, 0.043, length, 30),
    new THREE.MeshStandardMaterial({ map: lineTexture, transparent: true }),
  );
  const rightLine = new THREE.Mesh(
    createRibbonGeometry(points, normals, -(width * 0.5 - 0.15), -(width * 0.5 - 0.36), 0.043, length, 30),
    new THREE.MeshStandardMaterial({ map: lineTexture, transparent: true }),
  );
  targetScene.add(leftLine, rightLine);

  buildTracksideProps(targetScene, points, tangents, normals, width, preset);
  buildStartLine(
    targetScene,
    curve.getPointAt(0),
    curve.getTangentAt(0).normalize(),
    new THREE.Vector3(-curve.getTangentAt(0).z, 0, curve.getTangentAt(0).x).normalize(),
    width,
  );

  return {
    key: preset.label,
    preset,
    curve,
    points,
    tangents,
    normals,
    length,
    width,
    speedFactor: preset.speedFactor ?? 1,
    accelerationFactor: preset.accelerationFactor ?? 1,
    aiSpeedFactor: preset.aiSpeedFactor ?? 1,
    startT: preset.startT ?? PLAYER_START_T,
    playerLaneOffset: preset.playerLaneOffset ?? -0.95,
    gridBaseT: preset.gridBaseT ?? GRID_BASE_T,
    gridStepT: preset.gridStepT ?? GRID_STEP_T,
    checkpoints: Array.from({ length: CHECKPOINT_COUNT }, (_, index) => curve.getPointAt(index / CHECKPOINT_COUNT)),
  };
}

function createRibbonGeometry(points, normals, offsetA, offsetB, y, totalLength, repeat) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  let distanceAlong = 0;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const normal = normals[index];
    const left = point.clone().addScaledVector(normal, offsetA);
    const right = point.clone().addScaledVector(normal, offsetB);
    left.y = y;
    right.y = y;

    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
    if (index > 0) {
      distanceAlong += points[index - 1].distanceTo(point);
    }
    const u = (distanceAlong / totalLength) * repeat;
    uvs.push(u, 0, u, 1);
  }

  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    const a = index * 2;
    const b = a + 1;
    const c = next * 2;
    const d = c + 1;

    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildTracksideProps(targetScene, points, tangents, normals, trackWidth, preset) {
  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9e3ec,
    roughness: 0.8,
    metalness: 0.16,
  });
  const barrierGeometry = new THREE.BoxGeometry(2.1, 1.1, 0.75);

  for (let index = 0; index < points.length; index += 8) {
    const point = points[index];
    const tangent = tangents[index];
    const normal = normals[index];
    const left = new THREE.Mesh(barrierGeometry, barrierMaterial);
    left.position.copy(point).addScaledVector(normal, trackWidth * 0.5 + CURB_WIDTH + 1.1);
    left.position.y = 0.56;
    left.rotation.y = Math.atan2(tangent.x, tangent.z);
    left.castShadow = true;
    left.receiveShadow = true;
    targetScene.add(left);

    const right = left.clone();
    right.position.copy(point).addScaledVector(normal, -(trackWidth * 0.5 + CURB_WIDTH + 1.1));
    targetScene.add(right);
  }

}

function buildStartLine(targetScene, point, tangent, normal, trackWidth) {
  const arch = new THREE.Group();
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2a36,
    roughness: 0.6,
    metalness: 0.22,
  });
  const lightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc8f,
    emissive: 0xff7e47,
    emissiveIntensity: 1,
    roughness: 0.18,
    metalness: 0.16,
  });

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.2, 0.9), darkMaterial);
  const right = left.clone();
  left.position.set(-6.1, 3.1, 0);
  right.position.set(6.1, 3.1, 0);

  const top = new THREE.Mesh(new THREE.BoxGeometry(13.1, 0.9, 0.9), darkMaterial);
  top.position.set(0, 6.2, 0);

  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.55, 0.55), lightMaterial);
  lightBar.position.set(0, 5.25, 0.42);

  arch.add(left, right, top, lightBar);
  arch.position.copy(point).addScaledVector(normal, 0.1).addScaledVector(tangent, 0.4);
  arch.rotation.y = Math.atan2(tangent.x, tangent.z);
  arch.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  targetScene.add(arch);

  const flagTexture = createStartGridTexture();
  const finishLine = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth + 2.2, 3.2),
    new THREE.MeshBasicMaterial({ map: flagTexture, transparent: true }),
  );
  finishLine.rotation.x = -Math.PI * 0.5;
  finishLine.rotation.z = -Math.atan2(tangent.x, tangent.z);
  finishLine.position.copy(point);
  finishLine.position.y = 0.046;
  targetScene.add(finishLine);
}

function createEnvironment(targetScene, track, preset) {
  const theme = preset.theme;
  const hemi = new THREE.HemisphereLight(0xffd9a8, 0x18402f, 1.65);
  targetScene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xffd4a8, 2.1);
  sunLight.position.set(34, 45, -26);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -130;
  sunLight.shadow.camera.right = 130;
  sunLight.shadow.camera.top = 130;
  sunLight.shadow.camera.bottom = -130;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 180;
  targetScene.add(sunLight);

  const grassTexture = createGrassTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      map: grassTexture,
      color: theme.ground,
      roughness: 1,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI * 0.5;
  ground.receiveShadow = true;
  targetScene.add(ground);

  const innerGlow = new THREE.Mesh(
    new THREE.CircleGeometry(42, 64),
    new THREE.MeshBasicMaterial({
      color: theme.glow,
      transparent: true,
      opacity: 0.16,
    }),
  );
  innerGlow.rotation.x = -Math.PI * 0.5;
  innerGlow.position.y = 0.02;
  targetScene.add(innerGlow);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(10, 24, 24),
    new THREE.MeshBasicMaterial({ color: theme.sun }),
  );
  sun.position.set(0, 42, -130);
  targetScene.add(sun);

}

function getClosestTrackInfo(position, track) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < track.points.length; index += 1) {
    const point = track.points[index];
    const dx = point.x - position.x;
    const dz = point.z - position.z;
    const distance = dx * dx + dz * dz;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  const center = track.points[bestIndex];
  const tangent = track.tangents[bestIndex];
  const normal = track.normals[bestIndex];
  const offset = position.clone().sub(center);

  return {
    index: bestIndex,
    center,
    tangent,
    normal,
    crossTrack: offset.dot(normal),
    progress: bestIndex / track.points.length,
    heading: Math.atan2(tangent.x, tangent.z),
  };
}

function getSpawnTransform(track, t, laneOffset = 0) {
  const position = track.curve.getPointAt(t);
  const tangent = track.curve.getTangentAt(t).normalize();
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  position.addScaledVector(normal, laneOffset);
  return {
    position,
    heading: Math.atan2(tangent.x, tangent.z),
  };
}

function shortestAngle(current, target) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe % 1) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatBestTime(value) {
  return Number.isFinite(value) ? formatTime(value) : "NO LAP";
}

function ordinal(value) {
  if (value % 10 === 1 && value % 100 !== 11) {
    return `${value}st`;
  }
  if (value % 10 === 2 && value % 100 !== 12) {
    return `${value}nd`;
  }
  if (value % 10 === 3 && value % 100 !== 13) {
    return `${value}rd`;
  }
  return `${value}th`;
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createRoadTexture() {
  return canvasTexture(1024, 80, (context, width, height) => {
    context.fillStyle = "#24272d";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 3200; index += 1) {
      const shade = 34 + Math.random() * 26;
      context.fillStyle = `rgba(${shade}, ${shade}, ${shade + 4}, ${0.18 + Math.random() * 0.16})`;
      context.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    context.fillStyle = "rgba(0, 0, 0, 0.22)";
    context.fillRect(0, 0, width, 6);
    context.fillRect(0, height - 6, width, 6);

    context.strokeStyle = "rgba(255, 233, 210, 0.85)";
    context.lineWidth = 4;
    context.setLineDash([46, 34]);
    context.beginPath();
    context.moveTo(0, height * 0.5);
    context.lineTo(width, height * 0.5);
    context.stroke();
  });
}

function createCurbTexture() {
  return canvasTexture(512, 64, (context, width, height) => {
    context.fillStyle = "#f7f0e2";
    context.fillRect(0, 0, width, height);

    const stripe = 42;
    for (let x = -height; x < width + height; x += stripe) {
      context.fillStyle = "#e34f34";
      context.beginPath();
      context.moveTo(x, height);
      context.lineTo(x + stripe * 0.5, height);
      context.lineTo(x + stripe * 1.2, 0);
      context.lineTo(x + stripe * 0.7, 0);
      context.closePath();
      context.fill();
    }
  });
}

function createSideLineTexture() {
  return canvasTexture(256, 32, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(255, 246, 232, 0.9)";
    context.fillRect(0, 0, width, height);
  });
}

function createGrassTexture() {
  return canvasTexture(256, 256, (context, width, height) => {
    context.fillStyle = "#27412d";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 1400; index += 1) {
      const hue = 80 + Math.random() * 30;
      const alpha = 0.12 + Math.random() * 0.18;
      context.fillStyle = `hsla(${hue}, 38%, ${18 + Math.random() * 12}%, ${alpha})`;
      context.fillRect(Math.random() * width, Math.random() * height, 3, 3);
    }
  });
}

function createStartGridTexture() {
  const texture = canvasTexture(512, 128, (context, width, height) => {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    const cells = 12;
    const cellWidth = width / cells;
    const cellHeight = height / 2;

    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        if ((row + column) % 2 === 0) {
          context.fillStyle = "#0c1117";
          context.fillRect(column * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  });
  texture.repeat.set(1, 1);
  return texture;
}
