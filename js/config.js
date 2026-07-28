var MOMO_CONFIG = {
    // Your Vercel serverless functions (no keys exposed!)
    API_BASE: '/api',
    
    CONTRIB_TIERS: {
        '3000':  { weeks: 0, label: "Inkunga y'umutima", bonus: 'Murakoze! 💜' },
        '5000':  { weeks: 0, label: 'Inkunga ikomeye', bonus: 'Murakoze cyane! 🌟' },
        '7000':  { weeks: 0, label: "Inkunga y'umuhate", bonus: 'Urakoze! 🔥' },
        '10000': { weeks: 1, label: 'ICYUMWERU 1 UBUNTU', bonus: '🎁 v2.0 Ubuntu · Icyumweru 1', earlyAccess: true },
        '20000': { weeks: 7, label: 'IBYUMWERU 7 UBUNTU', bonus: '👑 Elite · Ibyumweru 7 Byuzuye', earlyAccess: true, elite: true }
    },
    
    POLL_INTERVAL: 3000,
    POLL_TIMEOUT: 270000
};
