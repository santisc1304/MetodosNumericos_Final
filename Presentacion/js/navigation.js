/**
 * Navigation Module: Control de Diapositivas y Atajos de Teclado
 */

const Navigation = (() => {
  let currentSlide = 1;
  const totalSlides = 7;

  function init() {
    setupKeyboardListeners();
    setupDockButtons();
    goToSlide(1);
  }

  function goToSlide(n) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;

    // Actualizar clases de slides
    document.querySelectorAll('.slide').forEach((slide, idx) => {
      if (idx + 1 === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Actualizar botones de navegación en el dock
    document.querySelectorAll('.step-pill').forEach((pill, idx) => {
      if (idx + 1 === currentSlide) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Actualizar botones Prev/Next
    const prevBtn = document.getElementById('dock-prev-btn');
    const nextBtn = document.getElementById('dock-next-btn');
    if (prevBtn) prevBtn.disabled = (currentSlide === 1);
    if (nextBtn) nextBtn.disabled = (currentSlide === totalSlides);

    // Actualizar contador del header
    const slideTracker = document.getElementById('hud-slide-tracker');
    if (slideTracker) {
      slideTracker.textContent = `PANTALLA 0${currentSlide} / 0${totalSlides}`;
    }

    Telemetry.playBlip(750 + currentSlide * 40, 'sine', 0.04);

    // Renderizar componentes especiales al entrar a su slide
    if (currentSlide === 3 && window.Charts) {
      setTimeout(() => Charts.renderStabilityChart('stability-chart-container'), 100);
    } else if (currentSlide === 4 && window.Charts) {
      setTimeout(() => Charts.renderFrankeChart('franke-chart-container'), 100);
    } else if (currentSlide === 5 && window.Simulator) {
      setTimeout(() => {
        Simulator.render();
        Simulator.updateTelemetry();
      }, 100);
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    if (currentSlide > 1) goToSlide(currentSlide - 1);
  }

  function setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key >= '1' && e.key <= '7') {
        goToSlide(parseInt(e.key, 10));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        const isMuted = Telemetry.toggleMute();
        console.log(`Audio HUD: ${isMuted ? 'MUTED' : 'UNMUTED'}`);
      }
    });
  }

  function setupDockButtons() {
    const prevBtn = document.getElementById('dock-prev-btn');
    const nextBtn = document.getElementById('dock-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    document.querySelectorAll('.step-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const target = parseInt(pill.getAttribute('data-step'), 10);
        goToSlide(target);
      });
    });

    const fsBtn = document.getElementById('dock-fs-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  return {
    init,
    goToSlide,
    nextSlide,
    prevSlide
  };
})();

document.addEventListener('DOMContentLoaded', Navigation.init);

