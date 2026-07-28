// MoMo Payment Tester — Payment Integration (MTN / Airtel Money)
var KotWebPay = {
    
    // Initialize a contribution payment
    initContribution: function(opts) {
        var amount = opts.amount;
        var phone = opts.phone;
        var name = opts.name;
        var onSuccess = opts.onSuccess || function(){};
        var onError = opts.onError || function(){};
        
        // Normalize phone to international format
        var intlPhone = '250' + phone.replace(/^0/, '');
        
        // Build payment request
        var payload = {
            amount: amount,
            phone: intlPhone,
            name: name,
            currency: 'RWF',
            client_token: MOMO_Utils.genToken(),
            is_contribution: true,
            contrib_tier: opts.contribTier || '',
            description: 'MoMo Payment Tester v2.0 — Inkunga'
        };
        
        // Call your backend
        this._apiCall('/init-payment', payload)
            .then(function(response) {
                if (response.error) {
                    onError(new Error(response.error));
                    return;
                }
                if (response.payment_url) {
                    // Save contribution proof
                    MOMO_Utils.saveContrib(amount, response.reference, opts.contribTier);
                    onSuccess(response);
                } else {
                    onError(new Error('Nta URL yo kwishyura yagaragaye'));
                }
            })
            .catch(function(err) {
                onError(err);
            });
    },
    
    // Poll for payment verification
    pollVerification: function(reference, amount) {
        var attempts = 0;
        var maxAttempts = Math.floor(MOMO_CONFIG.POLL_TIMEOUT / MOMO_CONFIG.POLL_INTERVAL);
        
        var poll = setInterval(function() {
            attempts++;
            
            KotWebPay._apiCall('/verify-payment', {
                reference: reference
            }).then(function(response) {
                if (response.status === 'completed' || response.verified) {
                    clearInterval(poll);
                    MOMO_Utils.saveContrib(amount, reference, '');
                    // Redirect to success or show message
                    window.location.href = window.location.pathname + '?status=successful&reference=' + reference + '&amount=' + amount;
                } else if (response.status === 'failed') {
                    clearInterval(poll);
                    window.location.href = window.location.pathname + '?status=failed';
                }
            }).catch(function() {
                // Network error — keep polling
            });
            
            if (attempts >= maxAttempts) {
                clearInterval(poll);
            }
        }, MOMO_CONFIG.POLL_INTERVAL);
    },
    
    // API helper
    _apiCall: function(endpoint, body) {
        return fetch(MOMO_CONFIG.API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function(res) {
            if (!res.ok) throw new Error('API error: ' + res.status);
            return res.json();
        });
    }
};
