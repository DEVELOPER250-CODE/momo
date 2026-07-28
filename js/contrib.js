// MoMo Payment Tester — Contribution Tracker (no accounts)
(function() {
    'use strict';
    
    // Check if user previously contributed
    function checkPreviousContrib() {
        try {
            var raw = localStorage.getItem('momo_contrib');
            if (!raw) return null;
            return JSON.parse(atob(raw));
        } catch(e) {
            return null;
        }
    }
    
    var prev = checkPreviousContrib();
    
    if (prev && prev.amount >= 10000) {
        var remaining = prev.earlyAccessUntil ? Math.max(0, Math.ceil((prev.earlyAccessUntil - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
        if (remaining > 0) {
            console.log('🏆 Ufite Early Access! Iminsi isigaye: ' + remaining);
            // Could show a special banner here
        }
    }
    
    if (prev) {
        console.log('💜 Washyizeho inkunga ya ' + prev.amount.toLocaleString() + ' RWF — Murakoze!');
    }
    
    // Expose to window
    window.MOMO_Contrib = {
        getPrevious: checkPreviousContrib,
        hasEarlyAccess: function() {
            var p = checkPreviousContrib();
            return p && p.earlyAccess && p.earlyAccessUntil > Date.now();
        }
    };
})();
