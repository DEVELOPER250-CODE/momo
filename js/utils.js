var MOMO_Utils = {
    genToken: function() {
        var c = 'abcdefghijklmnopqrstuvwxyz0123456789', r = 'v2_';
        for (var i=0;i<28;i++) r += c[Math.floor(Math.random()*c.length)];
        return r + '_' + Date.now().toString(36);
    },
    validPhone: function(p) { return /^7[89]\d{7}$/.test((p||'').replace(/\s/g,'')); },
    fmtAmount: function(a) { return parseInt(a).toLocaleString() + ' RWF'; },
    hasFreeAccess: function() {
        try {
            var r = localStorage.getItem('momo_v2_contrib');
            if (!r) return false;
            var d = JSON.parse(atob(r));
            return d.freeUntil && Date.now() < d.freeUntil;
        } catch(e) { return false; }
    },
    getFreeWeeksRemaining: function() {
        try {
            var r = localStorage.getItem('momo_v2_contrib');
            if (!r) return 0;
            var d = JSON.parse(atob(r));
            if (!d.freeUntil) return 0;
            var remaining = Math.max(0, Math.ceil((d.freeUntil - Date.now()) / (1000*60*60*24*7)));
            return remaining;
        } catch(e) { return 0; }
    },
    saveContrib: function(amount, ref, weeks) {
        var proof = { amount:amount, ref:ref, weeks:weeks, at:Date.now(), freeUntil:Date.now()+(weeks*7*24*60*60*1000) };
        if (weeks >= 7) proof.elite = true;
        if (weeks >= 1) proof.earlyAccess = true;
        localStorage.setItem('momo_v2_contrib', btoa(JSON.stringify(proof)));
    }
};
