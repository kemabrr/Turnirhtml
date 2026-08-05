/* ===== MAGAZYN JS ===== */
const API_BASE = 'https://web-production-413a9.up.railway.app';

let currentTab = 'uc';
let selectedProduct = null;
let ucPaketler = [];
let akkauntlar = [];

// ===== SVG IKONLAR =====
const ICON_UC = '<svg viewBox="0 0 24 24"><path d="M12 2 2 9l10 13L22 9 12 2zm0 2.5L19.2 9 12 18.5 4.8 9 12 4.5zM7.5 9h9L12 15.5 7.5 9z"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
const ICON_SKIN = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';

// ===== DOM ELEMENTS =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ucGrid = document.getElementById('uc-grid');
const akkauntList = document.getElementById('akkaunt-list');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalProductInfo = document.getElementById('modal-product-info');
const modalClose = document.getElementById('modal-close');
const btnCancel = document.getElementById('btn-cancel');
const btnConfirm = document.getElementById('btn-confirm');
const inputPubgId = document.getElementById('input-pubg-id');
const inputTelefon = document.getElementById('input-telefon');
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
}

// ===== API CALLS =====
async function apiGet(endpoint) {
    const token = localStorage.getItem('pubg_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { headers });
        if (!res.ok) {
            const text = await res.text();
            console.error('API ýalňyşlygy:', res.status, text);
            return { success: false, message: `Serwer ${res.status}: ${text.slice(0, 100)}` };
        }
        return await res.json();
    } catch (err) {
        showToast('Baglanyşyk ýalňyşlygy!', 'error');
        return null;
    }
}

async function apiPost(endpoint, body) {
    const token = localStorage.getItem('pubg_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('API ýalňyşlygy:', res.status, text);
            return { success: false, message: `Serwer ${res.status}: ${text.slice(0, 100)}` };
        }
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
        ucGrid.innerHTML = getEmptyState(ICON_UC, 'UC paketler elýeterli däl', 'Soňra synanyşyň');
        return;
    }

    ucPaketler = data.data || [];
    renderUCPaketler();
}

function renderUCPaketler() {
    if (ucPaketler.length === 0) {
        ucGrid.innerHTML = getEmptyState(ICON_UC, 'Häzirlikçe UC paket ýok', 'Admin täze paket goşar');
        return;
    }

    ucGrid.innerHTML = ucPaketler.map(p => `
        <div class="uc-card">
            <div class="uc-icon">${p.surat ? `<img src="${p.surat}" alt="UC" style="width:100%;height:100%;object-fit:contain">` : ICON_UC}</div>
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
        akkauntList.innerHTML = getEmptyState(ICON_USER, 'Akkauntlar elýeterli däl', 'Soňra synanyşyň');
        return;
    }

    akkauntlar = data.data || [];
    renderAkkauntlar();
}

function renderAkkauntlar() {
    if (akkauntlar.length === 0) {
        akkauntList.innerHTML = getEmptyState(ICON_USER, 'Häzirlikçe satlyk akkaunt ýok', 'Admin täze akkaunt goşar');
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
                        <span class="stat-icon">${ICON_STAR}</span>
                        <span>Level <span class="stat-value">${a.level}</span></span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">${ICON_SKIN}</span>
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

    const card = imgEl.closest('.akkaunt-card');
    card.querySelectorAll('.image-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === imgIdx);
    });
}

// ===== MODAL =====
function openSargytModal(type, id) {
    const token = localStorage.getItem('pubg_token');
    if (!token) {
        showToast('Ilki giriş ediň!', 'error');
        setTimeout(() => { window.location.href = './login.html'; }, 1000);
        return;
    }

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
    inputTelefon.value = '';

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

    const token = localStorage.getItem('pubg_token');
    if (!token) {
        showToast('Ilki giriş ediň!', 'error');
        closeModal();
        return;
    }

    const pubgId = inputPubgId.value.trim();
    const telefon = inputTelefon.value.trim();

    if (selectedProduct.type === 'uc' && !pubgId) {
        showToast('Oýun ID-si girizin!', 'error');
        return;
    }

    if (!telefon) {
        showToast('Telefon belgiňizi girizin!', 'error');
        return;
    }

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Ugradylýar...';

    const data = await apiPost('/api/satyn-al', {
        product_type: selectedProduct.type,
        product_id: selectedProduct.id,
        pubg_id: pubgId || null,
        telegram: telefon || null
    });

    btnConfirm.disabled = false;
    btnConfirm.textContent = 'Sargyt et';

    if (data && data.success) {
        showToast('Sargyt ugradyldy! Sebet bölüminden görüp bilersiňiz.', 'success');
        closeModal();
    } else {
        showToast(data?.message || 'Ýalňyşlyk ýüze çykdy!', 'error');
    }
}

// ===== HELPERS =====
function getEmptyState(iconSvg, title, desc) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${iconSvg}</div>
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
