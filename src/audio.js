function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

const SAMPLE_DEFS = {
  garage: {
    url: "/audio/mercedes-w196-static.ogg",
  },
  mclaren: {
    url: "/audio/mclaren-mp4-23.ogg",
  },
  williams: {
    url: "/audio/williams-fw32.ogg",
  },
};

const PASSBY_LIBRARY = [
  { id: "mclaren", duration: 6.4, offsetMin: 2.8, offsetMax: 8.8, gain: 0.26 },
  { id: "williams", duration: 8.8, offsetMin: 4.5, offsetMax: 19, gain: 0.24 },
];

function createStereoPanner(context) {
  if (typeof context.createStereoPanner === "function") {
    return context.createStereoPanner();
  }

  const gain = context.createGain();
  gain.pan = {
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
  };
  return gain;
}

export function createRaceAudio() {
  let context = null;
  let masterGain = null;
  let masterCompressor = null;
  let synthBus = null;
  let sampleBus = null;
  let engineBus = null;
  let intakeGain = null;
  let boostGain = null;
  let windGain = null;
  let tireGain = null;
  let curbGain = null;
  let garageGain = null;
  let enginePrimary = null;
  let engineSecondary = null;
  let engineEdge = null;
  let boostOsc = null;
  let windFilter = null;
  let tireFilter = null;
  let curbFilter = null;
  let intakeFilter = null;
  let noiseSource = null;
  let enabled = true;
  let volume = 0.68;
  let sampleLoadPromise = null;
  let sampleBuffers = {};
  let garageSource = null;
  let lastPhase = "garage";
  let lastUpdateTime = 0;
  let simulatedRev = 0.14;
  let currentGear = 1;
  let shiftCutUntil = 0;
  let nextPassbyAt = 0;
  let loggedSampleError = false;

  function ensureContext() {
    if (context) {
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    context = new AudioCtor();

    masterCompressor = context.createDynamicsCompressor();
    masterCompressor.threshold.value = -18;
    masterCompressor.knee.value = 18;
    masterCompressor.ratio.value = 2.8;
    masterCompressor.attack.value = 0.01;
    masterCompressor.release.value = 0.18;
    masterCompressor.connect(context.destination);

    masterGain = context.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(masterCompressor);

    synthBus = context.createGain();
    synthBus.gain.value = 1;
    synthBus.connect(masterGain);

    sampleBus = context.createGain();
    sampleBus.gain.value = 1;
    sampleBus.connect(masterGain);

    engineBus = context.createGain();
    engineBus.gain.value = 0.0001;
    engineBus.connect(synthBus);

    intakeGain = context.createGain();
    intakeGain.gain.value = 0.0001;
    intakeGain.connect(synthBus);

    boostGain = context.createGain();
    boostGain.gain.value = 0.0001;
    boostGain.connect(synthBus);

    windGain = context.createGain();
    windGain.gain.value = 0.0001;
    windGain.connect(synthBus);

    tireGain = context.createGain();
    tireGain.gain.value = 0.0001;
    tireGain.connect(synthBus);

    curbGain = context.createGain();
    curbGain.gain.value = 0.0001;
    curbGain.connect(synthBus);

    garageGain = context.createGain();
    garageGain.gain.value = 0.0001;
    garageGain.connect(sampleBus);

    enginePrimary = createEngineVoice("sawtooth", 105, "lowpass", 1600, 0.8, 0.7);
    engineSecondary = createEngineVoice("triangle", 215, "bandpass", 1350, 1.2, 0.48);
    engineEdge = createEngineVoice("square", 430, "highpass", 1200, 0.7, 0.16);

    boostOsc = context.createOscillator();
    boostOsc.type = "triangle";
    boostOsc.frequency.value = 280;
    boostOsc.connect(boostGain);
    boostOsc.start();

    windFilter = context.createBiquadFilter();
    windFilter.type = "highpass";
    windFilter.frequency.value = 600;
    windFilter.Q.value = 0.5;
    windFilter.connect(windGain);

    tireFilter = context.createBiquadFilter();
    tireFilter.type = "bandpass";
    tireFilter.frequency.value = 1200;
    tireFilter.Q.value = 0.65;
    tireFilter.connect(tireGain);

    curbFilter = context.createBiquadFilter();
    curbFilter.type = "lowpass";
    curbFilter.frequency.value = 240;
    curbFilter.Q.value = 0.45;
    curbFilter.connect(curbGain);

    intakeFilter = context.createBiquadFilter();
    intakeFilter.type = "bandpass";
    intakeFilter.frequency.value = 1400;
    intakeFilter.Q.value = 0.95;
    intakeFilter.connect(intakeGain);

    noiseSource = context.createBufferSource();
    noiseSource.buffer = createNoiseBuffer();
    noiseSource.loop = true;
    noiseSource.connect(windFilter);
    noiseSource.connect(tireFilter);
    noiseSource.connect(curbFilter);
    noiseSource.connect(intakeFilter);
    noiseSource.start();
  }

  function createEngineVoice(type, baseFrequency, filterType, filterFrequency, q, level) {
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    filter.Q.value = q;
    gain.gain.value = 0.0001;

    osc.type = type;
    osc.frequency.value = baseFrequency;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(engineBus);
    osc.start();

    return { osc, filter, gain, level };
  }

  function createNoiseBuffer() {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  async function loadSamples() {
    ensureContext();
    if (!context || sampleLoadPromise) {
      return sampleLoadPromise;
    }

    sampleLoadPromise = Promise.all(
      Object.entries(SAMPLE_DEFS).map(async ([id, definition]) => {
        const response = await fetch(definition.url);
        if (!response.ok) {
          throw new Error(`Failed to load ${definition.url}`);
        }

        const buffer = await response.arrayBuffer();
        const decoded = await context.decodeAudioData(buffer);
        sampleBuffers[id] = decoded;
      }),
    ).catch((error) => {
      sampleBuffers = {};
      sampleLoadPromise = null;

      if (!loggedSampleError) {
        loggedSampleError = true;
        console.warn("Race audio sample load failed:", error);
      }

      return null;
    });

    await sampleLoadPromise;
    ensureGarageLoop();
    return sampleLoadPromise;
  }

  function ensureGarageLoop() {
    if (!context || garageSource || !sampleBuffers.garage) {
      return;
    }

    garageSource = context.createBufferSource();
    garageSource.buffer = sampleBuffers.garage;
    garageSource.loop = true;
    garageSource.connect(garageGain);
    garageSource.start();
  }

  function playPassby(intensity = 1) {
    if (!context) {
      return;
    }

    const options = PASSBY_LIBRARY.filter((entry) => sampleBuffers[entry.id]);
    if (!options.length) {
      return;
    }

    const choice = options[Math.floor(Math.random() * options.length)];
    const buffer = sampleBuffers[choice.id];
    const availableOffset = Math.max(0, buffer.duration - choice.duration - 0.25);
    const offsetRange = clamp(choice.offsetMax, 0, availableOffset) - clamp(choice.offsetMin, 0, availableOffset);
    const offset = clamp(choice.offsetMin, 0, availableOffset) + Math.max(0, offsetRange) * Math.random();
    const duration = Math.min(choice.duration, buffer.duration - offset - 0.05);
    const start = context.currentTime;
    const source = context.createBufferSource();
    const panner = createStereoPanner(context);
    const gain = context.createGain();
    const startPan = Math.random() < 0.5 ? -0.95 : 0.95;
    const endPan = -startPan * 0.55;

    source.buffer = buffer;
    source.playbackRate.value = 0.96 + Math.random() * 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(choice.gain * intensity, start + Math.min(1.2, duration * 0.28));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    if (panner.pan) {
      panner.pan.setValueAtTime(startPan, start);
      panner.pan.linearRampToValueAtTime(endPan, start + duration);
    }

    source.connect(panner);
    panner.connect(gain);
    gain.connect(sampleBus);
    source.start(start, offset, duration);
  }

  async function unlock() {
    ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    void loadSamples();
  }

  function setEnabled(value) {
    enabled = value;

    if (context && !enabled) {
      masterGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.08);
    }

    if (enabled && context) {
      void loadSamples();
    }
  }

  function setVolume(value) {
    volume = clamp(value, 0, 1);
  }

  function update({
    phase,
    paused,
    speed,
    throttle,
    brake = 0,
    steering = 0,
    boostActive = false,
    onTrack = true,
    draftFactor = 0,
    edgeRumble = 0,
  }) {
    if (!context) {
      return;
    }

    const now = context.currentTime;
    const delta = lastUpdateTime > 0 ? now - lastUpdateTime : 1 / 60;
    lastUpdateTime = now;

    if (phase !== lastPhase) {
      if (phase === "countdown" || phase === "race") {
        void loadSamples();
      }

      if (phase === "race") {
        nextPassbyAt = now + 2.8;
      }

      lastPhase = phase;
    }

    const speedRatio = clamp(Math.abs(speed) / 84, 0, 1);
    const steeringAmount = Math.abs(steering);
    const offTrackAmount = onTrack ? 0 : clamp(0.28 + speedRatio * 0.7, 0, 1);
    const trackActive = enabled && phase !== "garage";
    const targetMaster = enabled ? volume * (paused ? 0.2 : phase === "garage" ? 0.34 : 0.92) : 0.0001;

    masterGain.gain.setTargetAtTime(targetMaster, now, 0.08);
    garageGain.gain.setTargetAtTime(enabled && phase === "garage" ? 0.22 : phase === "countdown" ? 0.055 : 0.0001, now, 0.22);
    ensureGarageLoop();

    const targetRev = clamp(speedRatio * 0.8 + throttle * 0.22 + brake * 0.04 + (boostActive ? 0.08 : 0), 0.1, 1);
    simulatedRev = lerp(simulatedRev, targetRev, 1 - Math.exp(-delta * (trackActive ? 7.2 : 3.8)));

    const gear = getGear(speedRatio, boostActive);
    if (phase === "race" && speed > 8 && gear !== currentGear) {
      shiftCutUntil = now + 0.07;
      shiftCue(gear > currentGear);
      currentGear = gear;
    } else if (speed < 2) {
      currentGear = 1;
    }

    const shiftDip = now < shiftCutUntil ? 0.58 : 1;
    const load = clamp(0.2 + throttle * 0.62 + brake * 0.14 + draftFactor * 0.12, 0, 1);
    const engineHz = 92 + simulatedRev * 470;
    const flutter = 1 + Math.sin(now * 29) * 0.004 + Math.sin(now * 51) * 0.0018;

    enginePrimary.osc.frequency.setTargetAtTime(engineHz * flutter, now, 0.03);
    engineSecondary.osc.frequency.setTargetAtTime(engineHz * 2.03, now, 0.025);
    engineEdge.osc.frequency.setTargetAtTime(engineHz * 4.08, now, 0.02);

    enginePrimary.filter.frequency.setTargetAtTime(700 + simulatedRev * 1700 + throttle * 320, now, 0.04);
    engineSecondary.filter.frequency.setTargetAtTime(1050 + simulatedRev * 2500 + load * 260, now, 0.03);
    engineEdge.filter.frequency.setTargetAtTime(1150 + simulatedRev * 3200, now, 0.03);

    engineBus.gain.setTargetAtTime(trackActive ? 0.58 + load * 0.36 : 0.08, now, 0.05);
    enginePrimary.gain.gain.setTargetAtTime((0.045 + simulatedRev * 0.08) * enginePrimary.level * shiftDip, now, 0.03);
    engineSecondary.gain.gain.setTargetAtTime((0.024 + load * 0.06) * engineSecondary.level * shiftDip, now, 0.03);
    engineEdge.gain.gain.setTargetAtTime((0.01 + simulatedRev * 0.032 + (boostActive ? 0.024 : 0)) * engineEdge.level * shiftDip, now, 0.025);

    intakeFilter.frequency.setTargetAtTime(880 + simulatedRev * 2800 + throttle * 320, now, 0.04);
    intakeGain.gain.setTargetAtTime(trackActive ? 0.0001 + load * 0.034 + (boostActive ? 0.012 : 0) : 0.0001, now, 0.05);

    boostOsc.frequency.setTargetAtTime(250 + speedRatio * 740 + draftFactor * 100, now, 0.04);
    boostGain.gain.setTargetAtTime(
      trackActive ? (boostActive ? 0.02 + speedRatio * 0.035 : draftFactor > 0.36 ? 0.004 + draftFactor * 0.012 : 0.0001) : 0.0001,
      now,
      0.04,
    );

    windFilter.frequency.setTargetAtTime(580 + speedRatio * 3000, now, 0.05);
    windGain.gain.setTargetAtTime(trackActive ? 0.004 + speedRatio * 0.05 : 0.0001, now, 0.06);

    const scrub = clamp(speedRatio * steeringAmount * 1.45 + edgeRumble * 0.95 + offTrackAmount * 0.75, 0, 1);
    tireFilter.frequency.setTargetAtTime(540 + scrub * 2500, now, 0.04);
    tireGain.gain.setTargetAtTime(trackActive ? 0.0001 + scrub * 0.07 : 0.0001, now, 0.04);

    const rumble = clamp(edgeRumble * (0.35 + speedRatio) + offTrackAmount * 0.92, 0, 1);
    curbFilter.frequency.setTargetAtTime(120 + rumble * 420, now, 0.05);
    curbGain.gain.setTargetAtTime(trackActive ? 0.0001 + rumble * 0.13 : 0.0001, now, 0.05);

    if (enabled && phase === "race" && !paused && now >= nextPassbyAt) {
      playPassby(0.9 + speedRatio * 0.25 + draftFactor * 0.18);
      nextPassbyAt = now + 7 + Math.random() * 4.2;
    }
  }

  function getGear(speedRatio, boostActive) {
    const thresholds = boostActive ? [0.12, 0.24, 0.39, 0.56, 0.74, 0.9] : [0.1, 0.21, 0.35, 0.5, 0.67, 0.84];
    let gear = 1;

    for (const threshold of thresholds) {
      if (speedRatio > threshold) {
        gear += 1;
      }
    }

    return gear;
  }

  function chirp(frequency, duration, type, gainValue, offset = 0, target = masterGain) {
    ensureContext();
    if (!context || !enabled) {
      return;
    }

    const start = context.currentTime + offset;
    const osc = context.createOscillator();
    const amp = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 1.15), start + duration);

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp);
    amp.connect(target);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  }

  function shiftCue(upshift) {
    chirp(upshift ? 170 : 130, 0.06, "square", 0.026, 0, engineBus);
  }

  function countdownTick(mark) {
    chirp(400 + mark * 92, 0.12, "square", 0.055);
  }

  function goCue() {
    chirp(920, 0.14, "sawtooth", 0.08);
    chirp(1260, 0.2, "triangle", 0.05, 0.1);
    playPassby(1.15);
    if (context) {
      nextPassbyAt = context.currentTime + 4.5;
    }
  }

  function finishCue(place) {
    const base = place === 1 ? 660 : place <= 3 ? 560 : 420;
    chirp(base, 0.18, "triangle", 0.07);
    chirp(base * 1.25, 0.24, "triangle", 0.05, 0.11);
  }

  function pauseCue(paused) {
    chirp(paused ? 300 : 520, 0.09, "square", 0.04);
  }

  function contactCue(intensity = 1) {
    ensureContext();
    if (!context || !enabled) {
      return;
    }

    const start = context.currentTime;
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const burst = context.createBufferSource();
    const burstFilter = context.createBiquadFilter();
    const burstGain = context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, start);
    osc.frequency.exponentialRampToValueAtTime(54, start + 0.14);
    filter.type = "lowpass";
    filter.frequency.value = 420;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05 * intensity, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

    burst.buffer = createNoiseBuffer();
    burstFilter.type = "bandpass";
    burstFilter.frequency.value = 240 + intensity * 220;
    burstFilter.Q.value = 0.65;
    burstGain.gain.setValueAtTime(0.0001, start);
    burstGain.gain.exponentialRampToValueAtTime(0.075 * intensity, start + 0.008);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    burst.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(masterGain);

    osc.start(start);
    osc.stop(start + 0.18);
    burst.start(start);
    burst.stop(start + 0.13);
  }

  return {
    unlock,
    setEnabled,
    setVolume,
    update,
    countdownTick,
    goCue,
    finishCue,
    pauseCue,
    contactCue,
  };
}
