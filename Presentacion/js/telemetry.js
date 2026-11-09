/**
 * Telemetry HUD Audio & State Module
 * Maneja el reloj en tiempo real, efectos de telemetría y síntesis de audio HUD
 */

const Telemetry = (() => {
  let audioCtx = null;
  let audioMuted = false;

  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    initAudio();
  }

  function updateClock() {
    const clockEl = document.getElementById('hud-live-clock');
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CO', { hour12: false });
    clockEl.textContent = `${timeStr} COT (UTC-5)`;
  }

  function initAudio() {
    // Inicializar Web Audio API con primer gesto de usuario
    window.addEventListener('click', () => {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
    }, { once: true });
  }

  function playBlip(freq = 880, type = 'sine', duration = 0.05) {
    if (audioMuted || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio no disponible
    }
  }

  function toggleMute() {
    audioMuted = !audioMuted;
    return audioMuted;
  }

  return {
    init,
    playBlip,
    toggleMute
  };
})();

document.addEventListener('DOMContentLoaded', Telemetry.init);

