/**
 * voiceRecorder.js — Voice message recorder for SivionChat
 * Uses MediaRecorder API + canvas-based waveform visualizer
 */

let mediaRecorder = null;
let audioChunks = [];
let analyser = null;
let animFrameId = null;
let audioCtx = null;
let startTime = null;

/**
 * Start recording. Returns a promise that resolves when recording starts.
 * @param {HTMLElement} waveformContainer - DOM element to draw bars into
 * @param {HTMLElement} timerEl - DOM element to show timer
 */
export async function startRecording(waveformContainer, timerEl) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    startTime = Date.now();

    // Set up Web Audio analyser for live waveform
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    // Draw animated waveform bars
    drawWaveform(waveformContainer, analyser);

    // Start timer
    const timerInterval = setInterval(() => {
      if (!startTime) { clearInterval(timerInterval); return; }
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.start(100);

    return () => clearInterval(timerInterval); // cleanup fn
  } catch (err) {
    console.error("Could not start voice recording:", err);
    throw err;
  }
}

/**
 * Stop recording and return the audio Blob
 */
export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) { reject(new Error("No active recording")); return; }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
      audioChunks = [];
      startTime = null;

      // Stop visualizer
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      if (audioCtx)    { audioCtx.close(); audioCtx = null; }
      analyser = null;

      resolve(blob);
    };

    mediaRecorder.stop();
    mediaRecorder.stream?.getTracks().forEach(t => t.stop());
    mediaRecorder = null;
  });
}

/**
 * Cancel recording without producing output
 */
export function cancelRecording() {
  if (!mediaRecorder) return;
  mediaRecorder.ondataavailable = null;
  mediaRecorder.onstop = null;
  mediaRecorder.stop();
  mediaRecorder.stream?.getTracks().forEach(t => t.stop());
  mediaRecorder = null;
  audioChunks = [];
  startTime = null;
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (audioCtx)    { audioCtx.close(); audioCtx = null; }
}

export function isRecording() {
  return mediaRecorder !== null;
}

function drawWaveform(container, analyser) {
  const BAR_COUNT = 12;
  // Build bars once
  if (!container.querySelector(".waveform-bar")) {
    container.innerHTML = "";
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("span");
      bar.className = "waveform-bar";
      bar.style.height = "12px";
      bar.style.animationDelay = `${i * 0.07}s`;
      container.appendChild(bar);
    }
  }

  const bars = container.querySelectorAll(".waveform-bar");
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function frame() {
    animFrameId = requestAnimationFrame(frame);
    analyser.getByteFrequencyData(dataArray);
    bars.forEach((bar, i) => {
      const value = dataArray[i] || 0;
      const h = Math.max(4, Math.round((value / 255) * 28));
      bar.style.height = `${h}px`;
    });
  }
  frame();
}

/**
 * Build a simple static waveform representation from an audio blob
 * for playback display (array of normalized heights 0-1)
 */
export async function computeWaveformData(blob, barCount = 30) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf);
    ctx.close();

    const data = decoded.getChannelData(0);
    const step = Math.floor(data.length / barCount);
    const bars = [];
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += Math.abs(data[i * step + j] || 0);
      }
      bars.push(sum / step);
    }
    const max = Math.max(...bars, 0.001);
    return bars.map(v => v / max);
  } catch (err) {
    console.warn("Could not compute waveform:", err);
    return Array.from({ length: barCount }, () => Math.random() * 0.8 + 0.2);
  }
}
