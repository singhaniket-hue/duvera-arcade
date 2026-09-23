/* Duvera integration, 2026-09-23: the canvas is letterboxed on phones, so treat a press
 * anywhere on the page as a press on the game. GPL-3.0. */
(function () {
    'use strict';
    var heldKey = null;
    function release() {
        if (heldKey === null) return;
        me.input.triggerKeyEvent(heldKey, false);
        heldKey = null;
    }
    document.addEventListener('pointerdown', function (event) {
        if (event.button !== 0 || !window.me || !me.video.renderer || !me.input.pointer) return;
        if (event.target === me.video.renderer.getScreenCanvas() || event.target.closest('a, button')) return;
        var key = me.input.pointer.bind[me.input.pointer.LEFT];
        if (!key) return;
        release();
        heldKey = key;
        me.input.triggerKeyEvent(key, true);
        event.preventDefault();
    });
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
})();
