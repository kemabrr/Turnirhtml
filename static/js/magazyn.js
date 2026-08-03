/* ===== MAGAZYN JS ===== */
const API_BASE = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-ŇYZI GOYUN

let currentTab = 'uc';
let selectedProduct = null;
let ucPaketler = [];
let akkauntlar = [];

// ===== DOM ELEMENTS =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ucGrid = document.getElementById('uc-grid');
const akkauntList = document.getElementById('akkaunt-list');
const sargytList = document.getElementById('sargyt-list');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalProductInfo = document.getElementById('modal-product-info');
const modalClose = document.getElementById('modal-close');
const btnCancel = document.getElementById('btn-cancel');
const btnConfirm = document.getElementById('btn-confirm');
const inputPubgId = document.getElementById('input-pubg-id');
const inputTelegram = document.getElementById('input-telegram');
const toast = document.getElementById('toast');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadUCPaketler();
    loadAkkauntlar();

    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnConfirm.addEventListener('click', confirmSargyt);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('selected'));
            pm.classList.add('selected');
        });
    });
});

// ===== TABS =====
function initTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'sargyt') {
        loadSargytlar();
    }
}

// ===== API CALLS =====
async function apiGet(endpoint) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { headers });
        return await res.json();
    } catch (err) {
        showToast('Baglanyşyk ýalňyşlygy!', 'error');
        return null;
    }
}

async function apiPost(endpoint, body) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (err) {
        showToast('Baglanyşyk ýalňyşlygy!', 'error');
        return null;
    }
}

// ===== LOAD UC PAKETLER =====
async function loadUCPaketler() {
    ucGrid.innerHTML = '<div class="loading-skeleton"></div><div class="loading-skeleton"></div>';

    const data = await apiGet('/api/uc-paketler');
    if (!data || !data.success) {
        ucGrid.innerHTML = getEmptyState('💎', 'UC paketler elýeterli däl', 'Soňra synanyşyň');
        return;
    }

    ucPaketler = data.data || [];
    renderUCPaketler();
}

function renderUCPaketler() {
    if (ucPaketler.length === 0) {
        ucGrid.innerHTML = getEmptyState('💎', 'Häzirlikçe UC paket ýok', 'Admin täze paket goşar');
        return;
    }

    ucGrid.innerHTML = ucPaketler.map(p => `
        <div class="uc-card">
            <div class="uc-icon">💎</div>
            <div class="uc-amount">${p.uc_sany} UC</div>
            <div class="uc-label">PUBG Mobile</div>
            <div class="uc-price">${p.bahasy} TMT</div>
            <button class="btn-buy" onclick="openSargytModal('uc', ${p.id})">Satyn al</button>
        </div>
    `).join('');
}

// ===== LOAD AKKAUNTLAR =====
async function loadAkkauntlar() {
    akkauntList.innerHTML = '<div class="loading-skeleton" style="height:200px"></div>';

    const data = await apiGet('/api/akkauntlar');
    if (!data || !data.success) {
        akkauntList.innerHTML = getEmptyState('👤', 'Akkauntlar elýeterli däl', 'Soňra synanyşyň');
        return;
    }

    akkauntlar = data.data || [];
    renderAkkauntlar();
}

function renderAkkauntlar() {
    if (akkauntlar.length === 0) {
        akkauntList.innerHTML = getEmptyState('👤', 'Häzirlikçe satlyk akkaunt ýok', 'Admin täze akkaunt goşar');
        return;
    }

    akkauntList.innerHTML = akkauntlar.map((a, idx) => {
        const images = a.suratlar || [];
        const firstImage = images[0] || 'https://via.placeholder.com/400x200/1a1a25/ff2d55?text=PUBG+Account';

        return `
        <div class="akkaunt-card">
            <div class="akkaunt-images">
                <img src="${firstImage}" alt="${a.ad}" id="akkaunt-img-${idx}">
                ${images.length > 1 ? `
                <div class="akkaunt-image-dots">
                    ${images.map((_, i) => `<div class="image-dot ${i === 0 ? 'active' : ''}" onclick="changeAkkauntImage(${idx}, ${i}, '${images.join(",")}')"></div>`).join('')}
                </div>
                ` : ''}
                <div class="akkaunt-badge">${a.rank || 'Unranked'}</div>
            </div>
            <div class="akkaunt-info">
                <div class="akkaunt-title">${a.ad}</div>
                <div class="akkaunt-stats">
                    <div class="stat-item">
                        <span class="stat-icon">⭐</span>
                        <span>Level <span class="stat-value">${a.level}</span></span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🎨</span>
                        <span>Skin <span class="stat-value">${a.skin_sany}</span></span>
                    </div>
                </div>
                ${a.taryh ? `<div class="akkaunt-taryh">${a.taryh}</div>` : ''}
                <div class="akkaunt-footer">
                    <div class="akkaunt-price">${a.bahasy} <span>TMT</span></div>
                    <button class="btn-buy" onclick="openSargytModal('akkaunt', ${a.id})">Satyn al</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function changeAkkauntImage(cardIdx, imgIdx, imagesStr) {
    const images = imagesStr.split(',');
    const imgEl = document.getElementById(`akkaunt-img-${cardIdx}`);
    if (imgEl) imgEl.src = images[imgIdx];

    // Update dots
    const card = imgEl.closest('.akkaunt-card');
    card.querySelectorAll('.image-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === imgIdx);
    });
}

// ===== LOAD SARGYTLAR =====
async function loadSargytlar() {
    sargytList.innerHTML = '<div class="loading-skeleton" style="height:100px"></div>';

    const data = await apiGet('/api/menin-sargytlarym');
    if (!data || !data.success) {
        sargytList.innerHTML = getEmptyState('📋', 'Sargytlaryňyz ýok', 'UC ýa-da akkaunt satyn alyň');
        return;
    }

    const sargytlar = data.data || [];
    renderSargytlar(sargytlar);
}

function renderSargytlar(sargytlar) {
    if (sargytlar.length === 0) {
        sargytList.innerHTML = getEmptyState('📋', 'Sargytlaryňyz ýok', 'UC ýa-da akkaunt satyn alyň');
        return;
    }

    sargytList.innerHTML = sargytlar.map(s => {
        const statusClass = s.status === 'completed' ? 'status-completed' : 
                           s.status === 'cancelled' ? 'status-cancelled' : 'status-pending';
        const statusText = s.status === 'completed' ? 'Üstünlikli' : 
                          s.status === 'cancelled' ? 'Ýatyryldy' : 'Garaşylýar';
        const icon = s.product_type === 'uc' ? '💎' : '👤';

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
                ${s.pubg_id ? `<div>PUBG ID: <span>${s.pubg_id}</span></div>` : ''}
                ${s.telegram ? `<div>Aragatnaşyk: <span>${s.telegram}</span></div>` : ''}
            </div>
            <div class="sargyt-date">${formatDate(s.created_at)}</div>
        </div>
        `;
    }).join('');
}

// ===== MODAL =====
function openSargytModal(type, id) {
    selectedProduct = { type, id };

    let product;
    if (type === 'uc') {
        product = ucPaketler.find(p => p.id === id);
        modalTitle.textContent = 'UC Satyn Al';
        inputPubgId.parentElement.style.display = 'block';
    } else {
        product = akkauntlar.find(a => a.id === id);
        modalTitle.textContent = 'Akkaunt Satyn Al';
        inputPubgId.parentElement.style.display = 'none';
    }

    if (!product) return;

    modalProductInfo.innerHTML = `
        <h4>${product.ad || product.uc_sany + ' UC'}</h4>
        <div class="product-price">${product.bahasy} TMT</div>
    `;

    inputPubgId.value = '';
    inputTelegram.value = '';

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    selectedProduct = null;
}

async function confirmSargyt() {
    if (!selectedProduct) return;

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Ilki giriş ediň!', 'error');
        closeModal();
        return;
    }

    const pubgId = inputPubgId.value.trim();
    const telegram = inputTelegram.value.trim();

    if (selectedProduct.type === 'uc' && !pubgId) {
        showToast('PUBG ID girizin!', 'error');
        return;
    }

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Ugradylýar...';

    const data = await apiPost('/api/satyn-al', {
        product_type: selectedProduct.type,
        product_id: selectedProduct.id,
        pubg_id: pubgId || null,
        telegram: telegram || null
    });

    btnConfirm.disabled = false;
    btnConfirm.textContent = 'Sargyt et';

    if (data && data.success) {
        showToast(data.message, 'success');
        closeModal();
        if (currentTab === 'sargyt') loadSargytlar();
    } else {
        showToast(data?.message || 'Ýalňyşlyk ýüze çykdy!', 'error');
    }
}

// ===== HELPERS =====
function getEmptyState(icon, title, desc) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tk-TM', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
