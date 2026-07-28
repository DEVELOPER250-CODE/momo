var KotWebPay = {
    initContribution: function(opts) {
        var payload = {
            amount: opts.amount,
            phone: opts.phone,
            name: opts.name,
            currency: 'RWF',
            client_token: MOMO_Utils.genToken(),
            is_contribution: true,
            weeks: opts.weeks || 0,
            tier_label: opts.tierLabel || '',
            description: 'MoMo Tester v2.0 — Inkunga · ' + opts.weeks + ' week(s) free'
        };
        this._call('/init-payment', payload)
            .then(function(r) {
                if (r.error) { opts.onError(new Error(r.error)); return; }
                if (r.payment_url) {
                    MOMO_Utils.saveContrib(opts.amount, r.reference, opts.weeks);
                    opts.onSuccess(r);
                } else { opts.onError(new Error('Nta URL yabonetse.')); }
            }).catch(function(e) { opts.onError(e); });
    },
    pollVerification: function(ref, amount, weeks) {
        var attempts=0, max=Math.floor(MOMO_CONFIG.POLL_TIMEOUT/MOMO_CONFIG.POLL_INTERVAL);
        var poll=setInterval(function(){
            attempts++;
            KotWebPay._call('/verify-payment',{reference:ref}).then(function(r){
                if(r.status==='completed'||r.verified){clearInterval(poll);MOMO_Utils.saveContrib(amount,ref,weeks);window.location.href=window.location.pathname+'?status=successful&reference='+ref+'&amount='+amount;}
                else if(r.status==='failed'){clearInterval(poll);window.location.href=window.location.pathname+'?status=failed';}
            }).catch(function(){});
            if(attempts>=max){clearInterval(poll);}
        },MOMO_CONFIG.POLL_INTERVAL);
    },
    _call: function(ep,body){return fetch(MOMO_CONFIG.API_BASE+ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw new Error('API '+r.status);return r.json();});}
};
