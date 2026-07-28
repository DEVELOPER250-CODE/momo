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

        fetch(MOMO_CONFIG.API_BASE + '/init-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                phone: phone,
                name: name,
                weeks: weeks
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                self.currentRef = data.reference;
                self.currentAmount = amount;
                self.currentWeeks = weeks;
                MOMO_Utils.saveContrib(amount, data.reference, weeks);
                if (data.payment_url) {
                    onSuccess({ payment_url: data.payment_url, reference: data.reference });
                } else {
                    onSuccess({ reference: data.reference });
                    self.pollVerification(data.reference, amount, weeks);
                }
            } else {
                onError(new Error(data.error || 'Failed'));
            }
        })
        .catch(function(err) {
            onError(err);
        });
    },

    pollVerification: function(reference, amount, weeks) {
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
                if (data.verified) {
                    clearInterval(poll);
                    MOMO_Utils.saveContrib(amount, reference, weeks);
                    window.location.href = window.location.pathname + '?status=successful&reference=' + reference + '&amount=' + amount;
                } else if (data.status === 'failed') {
                    clearInterval(poll);
                }
            })
            .catch(function() {});
            if (attempts >= maxAttempts) clearInterval(poll);
        }, MOMO_CONFIG.POLL_INTERVAL);
    }
};
