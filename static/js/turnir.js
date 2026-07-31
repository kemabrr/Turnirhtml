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

        async function loadMyTournaments() {
            if (!isUserLoggedIn) return;
            try {
                const token = localStorage.getItem('pubg_token');
                const result = await fetch(API_URL + '/api/gatnasylan-turnirler', {
                    headers: { 'Authorization': 'Bearer ' + token }
                }).then(r => r.json());

                if (result.success && result.turnirler && result.turnirler.length > 0) {
                    const container = document.getElementById('my-tournaments-list');
                    const section = document.getElementById('my-tournaments-section');
                    section.style.display = 'block';

                    container.innerHTML = result.turnirler.map(t => {
                        let statusClass = 'status-waiting';
                        let statusText = 'Garasylýar';
                        if (t.admin_onay === 1) { statusClass = 'status-approved'; statusText = 'Tassyklandy'; }
                        else if (t.admin_onay === 2) { statusClass = 'status-rejected'; statusText = 'Ret edildi'; }

                        return `
                            <div class="my-tournament-card">
                                <div class="my-tournament-info">
                                    <h4>${escapeHtml(t.ad)}</h4>
                                    <p>${escapeHtml(t.senesi)} | ${escapeHtml(t.wagty)} | ${escapeHtml(t.karta)}</p>
                                </div>
                                <span class="my-tournament-status ${statusClass}">${statusText}</span>
                            </div>
                        `;
                    }).join('');
                }
            } catch (e) {
                console.error('Gatnasylan turnirler yuklenmedi:', e);
            }
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

                return `
                    <div class="tournament-card" data-status="${escapeHtml(t.status)}" data-mode="${escapeHtml(t.mode)}">
                        <div class="tournament-header">
                            <div class="tournament-info">
                                <h3>${escapeHtml(t.ad)}</h3>
                                <p>
                                    ${t.tolekli === 0 ? '<span class="status-badge badge-free">TÖLEGSIZ</span>' : ''}
                                    <span class="status-badge status-${escapeHtml(t.status)}">${escapeHtml(t.status)}</span>
                                </p>
                            </div>
                            <div class="tournament-prize">${escapeHtml(t.bayrak_jemi)}</div>
                        </div>
                        <div class="tournament-meta">
                            <span><i class="fas fa-calendar"></i> ${escapeHtml(t.senesi)}</span>
                            <span><i class="fas fa-clock"></i> ${escapeHtml(t.wagty)}</span>
                            <span><i class="fas fa-users"></i> ${t.onaylanan}/${t.yer_sany}</span>
                            <span><i class="fas fa-gamepad"></i> ${escapeHtml(t.gatnasym)}</span>
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
                // TÄZE: Login soňra turnir_gosul.html-e gaýdyp gelýär
                window.location.href = './login.html?redirect=./turnir_gosul.html?id=' + turnirId;
                return;
            }
            // Eger eýýäm gatnaşan bolsa
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
            const statusBtn = document.querySelector('.tournament-tab.active');
            const modeBtn = document.querySelector('.mode-btn.active');
            const status = statusBtn ? statusBtn.textContent.toLowerCase() === 'hemme' ? 'all' : 
                statusBtn.textContent.toLowerCase() === 'gelejek' ? 'upcoming' :
                statusBtn.textContent.toLowerCase() === 'häzirki' ? 'current' : 'past' : 'all';
            const mode = modeBtn ? modeBtn.textContent.toLowerCase().trim().split(' ')[0] : 'all';

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
            await loadMyTournaments();
            loadTurnirler();
        });
