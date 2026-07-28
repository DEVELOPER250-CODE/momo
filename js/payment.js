var KotWebPay = {
    currentRef: null,
    currentAmount: null,
    currentWeeks: null,

    initContribution: function(opts) {
        var self = this;
        var amount = opts.amount;
        var phone = opts.phone;
        var name = opts.name;
        var weeks = opts.weeks || 0;
        var onSuccess = opts.onSuccess || function(){};
        var onError = opts.onError || function(){};

        var payload = {
            amount: amount,
            phone: phone,
            name: name,
            weeks: weeks,
            client_token: MOMO_Utils.genToken()
        };

        fetch(MOMO_CONFIG.API_BASE + '/init-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(res) {
            if (!res.ok) {
                return res.json().then(function(err) {
                    throw new Error(err.error || 'Server error');
                });
            }
            return res.json();
        })
        .then(function(data) {
            if (data.success) {
                self.currentRef = data.reference;
                self.currentAmount = amount;
                self.currentWeeks = weeks;
                MOMO_Utils.saveContrib(amount, data.reference, weeks);
                
                if (data.payment_url) {
                    onSuccess({ payment_url: data.payment_url, reference: data.reference });
                } else {
                    // USSD push — payment already initiated on phone
                    self.pollVerification(data.reference, amount, weeks);
                    onSuccess({ payment_url: null, reference: data.reference });
                }
            } else {
                onError(new Error(data.error || 'Payment initiation failed'));
            }
        })
        .catch(function(err) {
            onError(err);
        });
    },

    pollVerification: function(reference, amount, weeks) {
        var self = this;
        var attempts = 0;
        var maxAttempts = Math.floor(MOMO_CONFIG.POLL_TIMEOUT / MOMO_CONFIG.POLL_INTERVAL);

        var poll = setInterval(function() {
            attempts++;

            fetch(MOMO_CONFIG.API_BASE + '/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: reference })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.verified && data.status === 'completed') {
                    clearInterval(poll);
                    MOMO_Utils.saveContrib(amount, reference, weeks);
                    window.location.href = window.location.pathname + '?status=successful&reference=' + reference + '&amount=' + amount;
                } else if (data.status === 'failed') {
                    clearInterval(poll);
                    window.location.href = window.location.pathname + '?status=failed';
                }
            })
            .catch(function() {
                // Network error — keep polling
            });

            if (attempts >= maxAttempts) {
                clearInterval(poll);
                console.log('Polling timeout: ' + reference);
            }
        }, MOMO_CONFIG.POLL_INTERVAL);
    }
};
