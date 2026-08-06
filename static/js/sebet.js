/* ===== SEBET JS ===== */
const API_BASE = 'https://web-production-413a9.up.railway.app';

const ICON_UC = '<svg viewBox="0 0 24 24"><path d="M12 2 2 9l10 13L22 9 12 2zm0 2.5L19.2 9 12 18.5 4.8 9 12 4.5zM7.5 9h9L12 15.5 7.5 9z"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/></svg>';
const ICON_CART = '<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>';

const sargytList = document.getElementById('sargyt-list');
const toast = document.getElementById('toast');
let adminTelefon = '';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('pubg_token');
    console.log('Sebet: pubg_token bar my?', !!token);
    if (!token) {
        window.location.href = './login.html';
        return;
    }
    loadAyarlar();
    loadSargytlar();
});

async function apiGet(endpoint) {
    const token = localStorage.getItem('pubg_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { headers });
        const data = await res.json();
        if (!res.ok) {
            console.error('API ýalňyşlygy:', res.status, data);
            return { success: false, message: data?.message || `Serwer ${res.status}` };
        }
        return data;
    } catch (err) {
        console.error('Fetch ýalňyşlygy:', err);
        return null;
    }
}

async function loadAyarlar() {
    const data = await apiGet('/api/magazyn-ayarlar');
    if (data && data.success) {
        adminTelefon = data.data.admin_telefon || '';
    }
}

async function loadSargytlar() {
    sargytList.innerHTML = '<div class="loading-skeleton"></div><div class="loading-skeleton"></div>';

    const data = await apiGet('/api/menin-sargytlarym');
    console.log('Sebet API jogaby:', data);

    if (!data || !data.success) {
        sargytList.innerHTML = getEmptyState('Sebediňiz elýeterli däl', data?.message || 'Soňra synanyşyň');
        return;
    }

    renderSargytlar(data.data || []);
}

function renderSargytlar(sargytlar) {
    if (sargytlar.length === 0) {
        sargytList.innerHTML = getEmptyState('Sebediňiz boş', 'UC ýa-da akkaunt satyn alyp, şu ýerden yzarlaň');
        return;
    }

    sargytList.innerHTML = sargytlar.map(s => {
        const statusClass = s.status === 'completed' ? 'status-completed' :
                           s.status === 'cancelled' ? 'status-cancelled' : 'status-pending';
        const statusText = s.status === 'completed' ? 'Tamamlandy' :
                          s.status === 'cancelled' ? 'Ýatyryldy' : 'Garaşylýar';
        const icon = s.product_type === 'uc' ? ICON_UC : ICON_USER;

        const telClean = adminTelefon.replace(/[^0-9+]/g, '');
        const actions = s.status === 'pending' && telClean ? `
            <div class="sargyt-actions">
                <a class="btn-action btn-call" href="tel:${telClean}">
                    <i class="fas fa-phone"></i> Admina jaň et
                </a>
                <a class="btn-action btn-sms" href="sms:${telClean}">
                    <i class="fas fa-comment-sms"></i> Admine SMS ýaz
                </a>
            </div>
        ` : s.status === 'pending' ? `
            <div class="sargyt-waiting-note">
                <i class="fas fa-hourglass-half"></i> Admin tassyklamasyna garaşylýar...
            </div>
        ` : '';

        return `
        <div class="sargyt-card">
            <div class="sargyt-header">
                <div class="sargyt-type">
                    <span class="sargyt-type-icon">${icon}</span>
                    <span>${s.product_ady}</span>
                </div>
                <div class="sargyt-status ${statusClass}">${statusText}</div>
            </div>
            <div class="sargyt-details">
                <div>Bahasy: <span>${s.bahasy} TMT</span></div>
                <div>ID: <span>#${s.id}</span></div>
                ${s.pubg_id ? `<div>Oýun ID: <span>${s.pubg_id}</span></div>` : ''}
                ${s.telegram ? `<div>Telefon: <span>${s.telegram}</span></div>` : ''}
            </div>
            <div class="sargyt-date">${formatDate(s.created_at)}</div>
            ${actions}
        </div>
        `;
    }).join('');
}

function getEmptyState(title, desc) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${ICON_CART}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
            <a href="./magazyn.html">Magazyna geç</a>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tk-TM', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}
