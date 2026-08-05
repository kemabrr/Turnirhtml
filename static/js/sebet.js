/* ===== SEBET JS ===== */
const API_BASE = 'https://web-production-413a9.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    loadSargytlar();
});

async function loadSargytlar() {
    const listEl = document.getElementById('sargyt-list');
    const token = localStorage.getItem('pubg_token');

    if (!token) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>
                <h3>Sargytlaryňyzy görmek üçin ulgama girin</h3>
                <a href="./login.html">Giriş et</a>
            </div>`;
        return;
    }

    listEl.innerHTML = '<div class="loading-skeleton"></div><div class="loading-skeleton"></div>';

    try {
        const res = await fetch(`${API_BASE}/api/sebet`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        const data = await res.json();

        if (!data || !data.success || !data.data || data.data.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h6v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>
                    </div>
                    <h3>Sebetiňiz boş</h3>
                    <p>Magazyn bölüminden UC ýa-da Akkaunt satyn alyp bilersiňiz.</p>
                    <a href="./magazyn.html">Magazyna git</a>
                </div>`;
            return;
        }

        const adminTelefon = data.admin_telefon || '';

        listEl.innerHTML = data.data.map(s => {
            const statusClass = s.status === 'completed' ? 'status-completed' : 
                               (s.status === 'cancelled' ? 'status-cancelled' : 'status-pending');
            const statusText = s.status === 'completed' ? 'Tassyklandy' : 
                              (s.status === 'cancelled' ? 'Ýatyrgyldy' : 'Garaşylýar');

            return `
            <div class="sargyt-card">
                <div class="sargyt-header">
                    <div class="sargyt-type">
                        <span>${s.product_type === 'uc' ? '💎 UC Paket' : '👤 Akkaunt'}</span>
                    </div>
                    <div class="sargyt-status ${statusClass}">${statusText}</div>
                </div>
                <div class="sargyt-details">
                    <div>Haryt: <span>${s.product_ady}</span></div>
                    <div>Bahasy: <span>${s.bahasy} TMT</span></div>
                    ${s.pubg_id ? `<div>PUBG ID: <span>${s.pubg_id}</span></div>` : ''}
                </div>
                <div class="sargyt-date">${s.created_at || ''}</div>
                ${adminTelefon ? `
                <div class="sargyt-actions">
                    <a href="tel:${adminTelefon}" class="btn-action btn-call">
                        <i class="fas fa-phone"></i> Jaň et
                    </a>
                    <a href="sms:${adminTelefon}" class="btn-action btn-sms">
                        <i class="fas fa-comment-dots"></i> SMS ugrat
                    </a>
                </div>
                ` : '<div class="sargyt-waiting-note">Admin bilen habarlaşyň.</div>'}
            </div>`;
        }).join('');

    } catch (err) {
        listEl.innerHTML = `
            <div class="empty-state">
                <h3>Baglanyşyk ýalňyşlygy ýüze çykdy</h3>
                <p>Internet baglanyşygyňyzy barlap, sahypany täzeläň.</p>
            </div>`;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
