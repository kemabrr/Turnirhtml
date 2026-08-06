const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

let allTurnirler = [];
let isUserLoggedIn = false;
let myTurnirId = null;
let loginCheckPromise = null;

async function checkLoginStatus() {
    if (loginCheckPromise) return loginCheckPromise;
    loginCheckPromise = new Promise(async (resolve) => {
        try {
            const token = localStorage.getItem('pubg_token');
            if (!token) { isUserLoggedIn = false; resolve(false); return; }
            const response = await fetch(API_URL + '/api/katilimci/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (response.ok) {
                const result = await response.json();
                isUserLoggedIn = result.success === true;
                if (result.katilimci && result.katilimci.turnir_id) {
                    myTurnirId = result.katilimci.turnir_id;
                }
            } else {
                isUserLoggedIn = false;
            }
        } catch (error) {
            isUserLoggedIn = false;
        }
        resolve(isUserLoggedIn);
    });
    return loginCheckPromise;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadTurnirler() {
    try {
        const result = await fetch(API_URL + '/api/turnirler').then(r => r.json());
        if (result.success && result.turnirler) {
            allTurnirler = result.turnirler;
            renderTurnirler(allTurnirler);
        } else {
            showEmpty('Turnirler yuklenmedi');
        }
    } catch (e) {
        showEmpty('Baglanyşyk yalnyslygy');
    }
}

function renderTurnirler(turnirler) {
    const list = document.getElementById('tournament-list');
    if (!turnirler || !turnirler.length) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Turnir Ýok</h3>
                <p>Häzirki wagtda elýeterli turnir ýok.</p>
            </div>`;
        return;
    }
    list.innerHTML = turnirler.map(t => {
        const isFull = t.onaylanan >= t.yer_sany;
        const isJoined = myTurnirId === t.id;

        let btnHtml;
        if (isJoined) {
            btnHtml = `
                <button class="btn-join-tournament btn-joined" type="button" disabled>
                    <i class="fas fa-check-circle"></i> GATNAŞDYŇYZ
                </button>`;
        } else if (isFull) {
            btnHtml = `
                <button class="btn-join-tournament btn-full" type="button" disabled>
                    <i class="fas fa-lock"></i> YERLER DOLDY
                </button>`;
        } else if (t.tolekli === 0) {
            btnHtml = `
                <button class="btn-join-tournament btn-free" onclick="joinTournament(${t.id})" type="button">
                    <i class="fas fa-plus-circle"></i> TÖLEGSIZ GOŞUL
                </button>`;
        } else {
            btnHtml = `
                <button class="btn-join-tournament" onclick="joinTournament(${t.id})" type="button">
                    <i class="fas fa-plus-circle"></i> TURNIRA GOŞUL
                </button>`;
        }

        // Gatnasylan turnir ucin adyna GOK ✓ belgisi
        const adDisplay = isJoined 
            ? escapeHtml(t.ad) + ' <span style="color:#0096ff;margin-left:6px;font-size:0.85em;"><i class="fas fa-check-circle"></i></span>' 
            : escapeHtml(t.ad);

        return `
            <div class="tournament-card" data-status="${escapeHtml(t.status)}" data-mode="${escapeHtml(t.mode)}">
                <div class="tournament-card-top">
                    <span class="meta-date"><i class="fas fa-calendar"></i> ${escapeHtml(t.senesi)} · ${escapeHtml(t.wagty)}</span>
                    <span class="meta-slots">
                        <span class="tag-mode">${escapeHtml(t.gatnasym)}</span>
                        <i class="fas fa-users"></i> ${t.onaylanan}/${t.yer_sany}
                    </span>
                </div>
                <div class="tournament-card-main">
                    <div class="tournament-icon"><i class="fas fa-gamepad"></i></div>
                    <div class="tournament-card-info">
                        <h3>${adDisplay}</h3>
                        <div class="tournament-card-tags">
                            ${t.tolekli === 0 ? '<span class="status-badge badge-free">TÖLEGSIZ</span>' : ''}
                            <span class="status-badge status-${escapeHtml(t.status)}">${escapeHtml(t.status)}</span>
                        </div>
                    </div>
                    <div class="tournament-prize-box">
                        <div class="tournament-prize">${escapeHtml(t.bayrak_jemi)} <img src="/static/images/uc-icon.webp" alt="UC" class="prize-icon"></div>
                    </div>
                </div>
                ${btnHtml}
            </div>
        `;
    }).join('');
}

function showEmpty(msg) {
    document.getElementById('tournament-list').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>${msg}</h3>
        </div>`;
}

async function joinTournament(turnirId) {
    await checkLoginStatus();
    if (!isUserLoggedIn) {
        window.location.href = './login.html?redirect=./turnir.html';
        return;
    }
    if (myTurnirId === turnirId) {
        alert('Siz eýýäm bu turnira gatnaşdyňyz!');
        return;
    }
    window.location.href = './turnir_gosul.html?id=' + turnirId;
}

function filterTournaments(status, btn) {
    document.querySelectorAll('.tournament-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
}

function filterMode(mode, btn) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const list = document.getElementById('tournament-list');

    if (allTurnirler.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Yuklenyar...</h3>
            </div>`;
        return;
    }

    const statusBtn = document.querySelector('.tournament-tab.active');
    const modeBtn = document.querySelector('.mode-btn.active');
    const statusText = statusBtn ? statusBtn.textContent.trim().toLowerCase() : 'hemme';
    const status = statusText === 'hemme' ? 'all' : 
        statusText === 'gelejek' ? 'upcoming' :
        statusText === 'häzirki' ? 'current' : 'past';
    const modeText = modeBtn ? modeBtn.textContent.trim().toLowerCase() : 'hemme';
    const mode = modeText === 'hemme' ? 'all' : modeText.split(' ')[0];

    document.querySelectorAll('.tournament-card').forEach(card => {
        const cardStatus = card.dataset.status;
        const cardMode = card.dataset.mode;
        const statusMatch = status === 'all' || cardStatus === status;
        const modeMatch = mode === 'all' || cardMode === mode;
        card.style.display = (statusMatch && modeMatch) ? 'block' : 'none';
    });
    checkEmptyState();
}

function checkEmptyState() {
    const visibleCards = Array.from(document.querySelectorAll('.tournament-card')).filter(c => c.style.display !== 'none');
    const list = document.getElementById('tournament-list');
    const existingEmpty = list.querySelector('.empty-state');
    if (existingEmpty) existingEmpty.remove();
    if (visibleCards.length === 0 && allTurnirler.length > 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = `
            <i class="fas fa-filter"></i>
            <h3>Netije Ýok</h3>
            <p>Saýlanan kriteriýalara laýyk turnir ýok.</p>
        `;
        list.appendChild(emptyDiv);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
    loadTurnirler();
});
