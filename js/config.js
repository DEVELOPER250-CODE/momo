// MoMo Payment Tester — Configuration
var MOMO_CONFIG = {
    // Your payment API endpoint (backend that talks to MTN/Airtel)
    API_BASE: 'https://your-backend.com/api',
    
    // Contribution tier mapping
    CONTRIB_TIERS: {
        '3000': { label: 'Inkunga y\'umutima', bonus: 'Murakoze! 💜' },
        '5000': { label: 'Inkunga ikomeye', bonus: 'Murakoze cyane! 🌟' },
        '7000': { label: 'Inkunga y\'umuhate', bonus: 'Ntacyo tutabashije! 🔥' },
        '10000': { label: 'ICYUMSO CY\'UMUZINDA', bonus: 'v2.0 KU BUNTU + Icyumweru 1 Mbere!', earlyAccess: true }
    },
    
    // Polling settings
    POLL_INTERVAL: 3000,  // 3 seconds
    POLL_TIMEOUT: 270000  // 4.5 minutes
};
