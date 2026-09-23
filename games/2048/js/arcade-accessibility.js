// Duvera integration, 2026-09-23: keyboard access to the original action links.
document.querySelectorAll('a[role="button"]').forEach(function (button) {
  button.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      button.click();
    }
  });
});
