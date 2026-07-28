(function() {
    'use strict';
    function get() {
        try {
            var r = localStorage.getItem('momo_v2_contrib');
            return r ? JSON.parse(atob(r)) : null;
        } catch(e) { return null; }
    }
    var prev = get();
    if (prev && prev.freeUntil && Date.now() < prev.freeUntil) {
        var rem = Math.max(0, Math.ceil((prev.freeUntil - Date.now()) / (1000 * 60 * 60 * 24 * 7)));
        console.log((prev.elite ? '👑 Elite' : '🎁') + ' Ufite ibyumweru ' + rem + ' bisigaye ku buntu!');
    }
    if (prev) console.log('💜 Washyizeho inkunga ya ' + prev.amount.toLocaleString() + ' RWF');
    window.MOMO_Contrib = {
        get: get,
        hasFree: function() { var p = get(); return p && p.freeUntil && Date.now() < p.freeUntil; },
        weeksLeft: function() { var p = get(); if (!p || !p.freeUntil) return 0; return Math.max(0, Math.ceil((p.freeUntil - Date.now()) / (1000 * 60 * 60 * 24 * 7))); }
    };
})();
