const parseUA = (uaString) => {
    if (!uaString) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };

    let browser = 'Other';
    if (uaString.includes('Firefox')) browser = 'Firefox';
    else if (uaString.includes('Chrome')) browser = 'Chrome';
    else if (uaString.includes('Safari')) browser = 'Safari';
    else if (uaString.includes('Edge')) browser = 'Edge';

    let os = 'Other';
    if (uaString.includes('Win')) os = 'Windows';
    else if (uaString.includes('Mac')) os = 'macOS';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('Android')) os = 'Android';
    else if (uaString.includes('iPhone')) os = 'iOS';

    let device = 'Desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
        device = 'Mobile/Tablet';
    }

    return { browser, os, device };
};

module.exports = { parseUA };
