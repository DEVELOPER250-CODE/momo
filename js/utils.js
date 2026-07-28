// MoMo Payment Tester — Utilities (no accounts needed)
var MOMO_Utils = {
    // Generate unique client token
    genToken: function() {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var result = 'contrib_';
        for (var i = 0; i < 24; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result + '_' + Date.now().toString(36);
    },
    
    // Validate Rwanda phone
    validPhone: function(phone) {
        return /^0?7[89]\d{7}$/.test((phone || '').replace(/\s/g, ''));
    },
    
    // Format amount
    fmtAmount: function(amount) {
        return parseInt(amount).toLocaleString() + ' RWF';
    },
    
    // Check if user has early access (10k contributor)
    hasEarlyAccess: function() {
        try {
            var raw = localStorage.getItem('momo_contrib');
            if (!raw) return false;
            var data = JSON.parse(atob(raw));
            if (data.earlyAccess && data.earlyAccessUntil > Date.now()) return true;
        } catch(e) {}
        return false;
    },
    
    // Save contribution proof
    saveContrib: function(amount, ref, tier) {
        var proof = {
            amount: amount,
            ref: ref,
            at: Date.now(),
            tier: tier || ''
        };
        if (amount >= 10000) {
            proof.earlyAccess = true;
            proof.earlyAccessUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
        }
        localStorage.setItem('momo_contrib', btoa(JSON.stringify(proof)));
    }
};
