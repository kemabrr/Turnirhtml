// ===================== CONFIG =====================
        const API_URL = 'https://web-production-413a9.up.railway.app'; // BUNI ÖZ BACKEND URL-iňiz bilen çalyň

        // ===================== HELPERS =====================
        function getToken() {
            return localStorage.getItem('pubg_token');
        }

        function setToken(token) {
            localStorage.setItem('pubg_token', token);
        }

        function removeToken() {
            localStorage.removeItem('pubg_token');
        }

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

        async function apiPost(endpoint, body) {
            const res = await fetch(API_URL + endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            return res.json();
        }

        // ===================== AUTH =====================
        let isUserLoggedIn = false;
        let userTurnirId = null;

        async function checkLoginStatus() {
            try {
                const result = await apiGet('/api/katilimci/me');
                if (result.success && result.katilimci) {
                    isUserLoggedIn = true;
                    userTurnirId = result.katilimci.turnir_id || null;
                    updateNavButtons();
                    return true;
                }
            } catch (e) {}
            isUserLoggedIn = false;
            updateNavButtons();
            return false;
        }

        function updateNavButtons() {
            const btnKayit = document.getElementById('btn-kayit');
            const btnProfil = document.getElementById('btn-profil');
            if (!btnKayit || !btnProfil) return;
            btnKayit.classList.remove('nav-btn-hidden');
            btnProfil.classList.remove('nav-btn-hidden');
            if (isUserLoggedIn) {
                btnKayit.style.display = 'none';
                btnProfil.style.display = 'inline-flex';
            } else {
                btnKayit.style.display = 'inline-block';
                btnProfil.style.display = 'none';
            }
        }

        function openAuthModal() {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeAuthModal() {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            const loginForm = document.getElementById('login-form');
            const regForm = document.getElementById('register-form');
            if (loginForm) loginForm.reset();
            if (regForm) regForm.reset();
            const loginError = document.getElementById('login-error');
            const regError = document.getElementById('register-error');
            if (loginError) loginError.classList.remove('show');
            if (regError) regError.classList.remove('show');
        }

        document.addEventListener('click', function(e) {
            const modal = document.getElementById('auth-modal');
            if (e.target === modal) closeAuthModal();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeAuthModal();
        });

        function showAuthTab(tab, btn) {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('auth-tab-' + tab).classList.add('active');
        }

        function checkLobiAccess() {
            if (!isUserLoggedIn) {
                openAuthModal();
                return;
            }
            if (!userTurnirId) {
                const toast = document.getElementById('lobi-toast');
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
                return;
            }
            window.location.href = './takim.html';
        }

        function showSection(section) {
            ['turnir', 'bayrak', 'duzgun', 'lobi'].forEach(s => {
                const el = document.getElementById('section-' + s);
                if (el) el.style.display = 'none';
            });
            const target = document.getElementById('section-' + section);
            if (target) {
                target.style.display = 'block';
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // ===================== DATA LOADING =====================
        async function loadStats() {
            try {
                const result = await apiGet('/api/stats');
                if (result.success) {
                    const s = result.stats;
                    document.getElementById('current-count').textContent = s.onaylanan;
                    document.getElementById('yer-sany').textContent = s.yer_sany;
                    document.getElementById('remaining-count').textContent = s.galan;
                    const pct = s.yer_sany > 0 ? (s.onaylanan / s.yer_sany * 100) : 0;
                    document.getElementById('progress-bar').style.width = pct + '%';
                    
                    const alertEl = document.getElementById('counter-alert');
                    if (s.yer_sany > 0 && s.onaylanan >= s.yer_sany) {
                        alertEl.textContent = 'TURNIR BASLADY! Ahli yerler doldu!';
                    } else if (s.yer_sany > 0) {
                        alertEl.textContent = s.yer_sany + ' gatnasyja yetende turnir baslar! Galan: ' + s.galan + ' yer';
                    } else {
                        alertEl.textContent = 'Yer sany bellenilmedi.';
                    }
                }
            } catch (e) { console.error('Stats yuklenmedi:', e); }
        }

        async function loadTurnirData() {
            try {
                const result = await apiGet('/api/turnir-data');
                if (result.success && result.turnir) {
                    const t = result.turnir;
                    document.getElementById('rule-tolek').textContent = t.tolek || '5 Manat';
                }
            } catch (e) {}
        }

        async function loadUserTurnir() {
            if (!isUserLoggedIn || !userTurnirId) return;
            try {
                const [turnirRes, bayrakRes] = await Promise.all([
                    apiGet('/api/turnir-data?turnir_id=' + userTurnirId),
                    apiGet('/api/bayraklar?turnir_id=' + userTurnirId)
                ]);
                
                if (turnirRes.success && turnirRes.turnir) {
                    const t = turnirRes.turnir;
                    document.getElementById('turnir-content').innerHTML = `
                        <div class="info-list">
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-trophy"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Turnir</span>
                                    <span class="info-value">${escapeHtml(t.ad)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-calendar"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Senesi</span>
                                    <span class="info-value">${escapeHtml(t.senesi)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-clock"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Wagty</span>
                                    <span class="info-value">${escapeHtml(t.wagty)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-map"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Karta</span>
                                    <span class="info-value">${escapeHtml(t.karta)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-user"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Gatnaşyk</span>
                                    <span class="info-value">${escapeHtml(t.gatnasym)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-money-bill-wave"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Toleg</span>
                                    <span class="info-value highlight">${escapeHtml(t.tolek)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon"><i class="fas fa-mobile-alt"></i></span>
                                <div class="info-content">
                                    <span class="info-label">Toleg usuly</span>
                                    <span class="info-value">${escapeHtml(t.tolek_usuly)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                if (bayrakRes.success && bayrakRes.bayraklar) {
                    const b = bayrakRes.bayraklar;
                    document.getElementById('bayrak-content').innerHTML = `
                        <div class="prizes-grid">
                            <div class="prize-card gold">
                                <div class="prize-rank"><i class="fas fa-medal" style="color:#ffd700"></i></div>
                                <div class="prize-info">
                                    <h3>1-nji Orun</h3>
                                    <p class="prize-amount">${escapeHtml(b.bir.mukdar)}</p>
                                    <p class="prize-bonus">${escapeHtml(b.bir.bonus)}</p>
                                </div>
                            </div>
                            <div class="prize-card silver">
                                <div class="prize-rank"><i class="fas fa-medal" style="color:#c0c0c0"></i></div>
                                <div class="prize-info">
                                    <h3>2-nji Orun</h3>
                                    <p class="prize-amount">${escapeHtml(b.iki.mukdar)}</p>
                                </div>
                            </div>
                            <div class="prize-card bronze">
                                <div class="prize-rank"><i class="fas fa-medal" style="color:#cd7f32"></i></div>
                                <div class="prize-info">
                                    <h3>3-nji Orun</h3>
                                    <p class="prize-amount">${escapeHtml(b.uc.mukdar)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="prize-total">
                            <span>JEMI BAYRAK:</span>
                            <strong>${escapeHtml(b.jemi)}</strong>
                        </div>
                    `;
                }
            } catch (e) { console.error('User turnir yuklenmedi:', e); }
        }

        async function loadLobiKodu() {
            if (!isUserLoggedIn) {
                document.getElementById('lobi-kodu-content').innerHTML = `
                    <div class="auth-required-box">
                        <i class="fas fa-lock"></i>
                        <p>Lobi kodyny görmek üçin giriş ediň</p>
                        <button class="btn-primary" onclick="openAuthModal()" style="margin-top:15px; width:auto; padding:12px 30px;">
                            <i class="fas fa-sign-in-alt"></i> GIRIS
                        </button>
                    </div>
                `;
                return;
            }
            
            try {
                const result = await apiGet('/api/lobi-kodu');
                if (result.success && result.data && result.data.görkezilýär) {
                    const d = result.data;
                    document.getElementById('lobi-kodu-content').innerHTML = `
                        <div class="lobi-code-box">
                            <div class="lobi-code-label"><i class="fas fa-key"></i> LOBI KODY</div>
                            <div class="lobi-code-value">${escapeHtml(d.lobi_kodu || '—')}</div>
                            <div class="lobi-code-turnir">${escapeHtml(d.turnir_ady || '')}</div>
                            <div class="lobi-code-badge ${d.tolekli ? 'paid' : 'free'}">
                                ${d.tolekli ? '<i class="fas fa-crown"></i> Tölegli' : '<i class="fas fa-gift"></i> Tölegsiz'}
                            </div>
                        </div>
                    `;
                } else if (result.data && result.data.tolekli && !result.data.onay_durumu) {
                    document.getElementById('lobi-kodu-content').innerHTML = `
                        <div class="lobi-pending-box">
                            <i class="fas fa-clock fa-spin"></i>
                            <p>Admin tassyklamasy garaşylýar...</p>
                            <p class="lobi-pending-sub">Töleg tassyklanandan soň lobi kody görkezilýär</p>
                        </div>
                    `;
                } else {
                    document.getElementById('lobi-kodu-content').innerHTML = `
                        <div class="no-tournament-info">
                            <i class="fas fa-info-circle"></i>
                            <p>${result.message || 'Maglumat ýok'}</p>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Lobi kody yuklenmedi:', e);
                document.getElementById('lobi-kodu-content').innerHTML = `
                    <div class="no-tournament-info">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Lobi kodyny ýüklemekde ýalňyşlyk</p>
                    </div>
                `;
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ===================== FORMS =====================
        document.addEventListener('DOMContentLoaded', async function() {
            await checkLoginStatus();
            await loadStats();
            await loadTurnirData();
            await loadUserTurnir();
            await loadLobiKodu();

            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const telefon = document.getElementById('login-telefon').value.trim();
                    const parol = document.getElementById('login-parol').value;
                    const errorEl = document.getElementById('login-error');
                    const btn = document.getElementById('login-submit-btn');

                    if (!telefon || !parol) {
                        errorEl.textContent = 'Telefon we parol girizin!';
                        errorEl.classList.add('show');
                        return;
                    }
                    btn.disabled = true;
                    errorEl.classList.remove('show');
                    try {
                        const result = await apiPost('/api/login', { telefon, parol });
                        if (result.success && result.data && result.data.access_token) {
                            setToken(result.data.access_token);
                            isUserLoggedIn = true;
                            await checkLoginStatus();
                            updateNavButtons();
                            closeAuthModal();
                            await loadUserTurnir();
                            await loadLobiKodu();
                            window.location.reload();
                        } else {
                            errorEl.textContent = result.message || 'Telefon ya-da parol nadogry!';
                            errorEl.classList.add('show');
                        }
                    } catch (error) {
                        errorEl.textContent = 'Yalnyslyk: ' + error.message;
                        errorEl.classList.add('show');
                    } finally {
                        btn.disabled = false;
                    }
                });
            }

            // Register form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const ad = document.getElementById('reg-ad').value.trim();
                    const telefon = document.getElementById('reg-telefon').value.trim();
                    const parol = document.getElementById('reg-parol').value;
                    const parol_tekrar = document.getElementById('reg-parol-tekrar').value;
                    const errorEl = document.getElementById('register-error');
                    const btn = document.getElementById('register-submit-btn');

                    if (!ad || !telefon || !parol) {
                        errorEl.textContent = 'Ahli maglumatlary dolduryň!';
                        errorEl.classList.add('show');
                        return;
                    }
                    if (ad.length < 2) {
                        errorEl.textContent = 'Ad 2 harpdan uly bolmaly!';
                        errorEl.classList.add('show');
                        return;
                    }
                    if (parol.length < 6) {
                        errorEl.textContent = 'Parol 6 harpdan uly bolmaly!';
                        errorEl.classList.add('show');
                        return;
                    }
                    if (parol !== parol_tekrar) {
                        errorEl.textContent = 'Parollar deň däl!';
                        errorEl.classList.add('show');
                        return;
                    }
                    btn.disabled = true;
                    errorEl.classList.remove('show');
                    try {
                        const result = await apiPost('/api/kayit-ol', { ad, telefon, parol, parol_tekrar });
                        if (result.success && result.data && result.data.access_token) {
                            setToken(result.data.access_token);
                            isUserLoggedIn = true;
                            await checkLoginStatus();
                            updateNavButtons();
                            closeAuthModal();
                            window.location.reload();
                        } else {
                            errorEl.textContent = result.message || 'Yalnyslyk yuze cykdy';
                            errorEl.classList.add('show');
                        }
                    } catch (error) {
                        errorEl.textContent = 'Yalnyslyk: ' + error.message;
                        errorEl.classList.add('show');
                    } finally {
                        btn.disabled = false;
                    }
                });
            }
        });
