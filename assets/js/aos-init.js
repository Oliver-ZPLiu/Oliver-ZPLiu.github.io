(function () {
  function initAOS() {
    if (!window.AOS) return;
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      offset: 40
    });
    if (AOS.refreshHard) {
      AOS.refreshHard();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAOS);
  } else {
    initAOS();
  }
})();
