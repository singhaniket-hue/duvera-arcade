/* Duvera Arcade integration, 2026-09-23: isolate saves and support blocked storage. GPL-3.0-or-later. */
(function () {
  'use strict';
  var memory = Object.create(null);
  var storage = null;
  try {
    storage = window.localStorage;
    storage.setItem('duvera.hextris.test', '1');
    storage.removeItem('duvera.hextris.test');
  } catch (_) { storage = null; }
  window.hextrisStorage = {
    getItem: function (key) {
      var name = 'duvera.hextris.' + key;
      if (storage) { try { return storage.getItem(name); } catch (_) {} }
      return Object.prototype.hasOwnProperty.call(memory, name) ? memory[name] : null;
    },
    setItem: function (key, value) {
      var name = 'duvera.hextris.' + key;
      memory[name] = String(value);
      if (storage) { try { storage.setItem(name, String(value)); } catch (_) { storage = null; } }
    }
  };
}());
