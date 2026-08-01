const API_URL = 'https://web-production-413a9.up.railway.app';

function getToken() { return localStorage.getItem('pubg_token'); }
function removeToken() { localStorage.removeItem('pubg_token'); }

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

async function apiGet(endpoint) {
    const res = await fetch(API_URL + endpoint, { headers: getAuthHeaders() });
    return res.json();
}

async function loadProfil() {
    try {
        const result = await apiGet('/api/profil');
        if (!result.success || !result.data || !result.data.katilimci) {
            window.location.href = './login.html';
            return;
        }

        const k = result.data.katilimci;

        document.getElementById('profil-ad').textContent = k.ad || '-';
        document.getElementById('profil-telefon').textContent = k.telefon ? '📞 ' + k.telefon : '-';
        document.getElementById('profil-ref').textContent = k.referans_kodu || '-';

    } catch (error) {
        console.error('Profil yuklenmedi:', error);
        window.location.href = './login.html';
    }
}

function logout() {
    if (!confirm('Hakykatdanam çykmak isleýärsiňizmi?')) return;
    removeToken();
    window.location.href = './index.html';
}

document.addEventListener('DOMContentLoaded', loadProfil);
