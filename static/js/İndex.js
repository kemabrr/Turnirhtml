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
            ['turnir', 'bayrak', 'duzgun'].forEach(s => {
                const el = document.getElementById('section-' + s);
                if (el) el.style.display = 'none';
            });
            const target = document.getElementById('section-' + section);
            if (target) {
                target.style.display = 'block';
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }

// ===================== LOBI KODY =====================
        function openLobiModal() {
            const modal = document.getElementById('lobi-modal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                loadLobiData();
            }
        }

        function closeLobiModal() {
        const modal = document.getElementById('lobi-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            }
        }

        async function loadLobiData() {
        const container = document.getElementById('lobi-content');
        container.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="color:#ff2d55;"></i><p style="margin-top:10px;opacity:0.7;">Yuklenyar...</p></div>';
    
        let html = '';
    
        // 1. Kanallar elmydama görkez (auth gerek dal)
        try {
        const kanalRes = await fetch(API_URL + '/api/lobi-kanallar');
        const kanalData = await kanalRes.json();
        
        if (kanalData.success && kanalData.data) {
            const d = kanalData.data;
            const kanallar = d.kanallar || [];
            
            html += `
                <div style="margin-bottom:24px;">
                    <p style="font-size:13px; opacity:0.8; text-align:center; margin-bottom:16px; line-height:1.6; color:#c0c0d0;">
                        ${escapeHtml(d.text)}
                    </p>
                    <div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
                        ${kanallar.map(k => `
                            <a href="${escapeHtml(k.url)}" target="_blank" rel="noopener" 
                               style="display:flex; flex-direction:column; align-items:center; gap:8px; 
                                      text-decoration:none; color:#e8e8e8; transition:all 0.3s;
                                      padding:16px 20px; border-radius:16px; background:rgba(255,255,255,0.03);
                                      border:1px solid rgba(255,255,255,0.08); min-width:80px;"
                               onmouseover="this.style.borderColor='rgba(255,45,85,0.4)';this.style.transform='translateY(-4px)';this.style.background='rgba(255,45,85,0.08)'"
                               onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.transform='none';this.style.background='rgba(255,255,255,0.03)'">
                                <i class="fab fa-telegram" style="font-size:28px; color:#0088cc; text-shadow:0 0 15px rgba(0,136,204,0.4); ${k.icon !== 'telegram' ? 'display:none;' : ''}"></i>
                                <i class="fas fa-comment-dots" style="font-size:28px; color:#ff6b35; text-shadow:0 0 15px rgba(255,107,53,0.4); ${k.icon !== 'imo' ? 'display:none;' : ''}"></i>
                                <i class="fas fa-link" style="font-size:28px; color:#00c853; text-shadow:0 0 15px rgba(0,200,83,0.4); ${k.icon !== 'link' ? 'display:none;' : ''}"></i>
                                <span style="font-size:12px; font-weight:700; letter-spacing:1px;">${escapeHtml(k.name)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error('Kanallar yuklenmedi:', e);
    }

    // 2. Lobi kody - auth bilen synanys
    if (!getToken()) {
        html += `
            <div style="text-align:center; padding:20px; background:rgba(255,45,85,0.05); border-radius:16px; border:1px solid rgba(255,45,85,0.15);">
                <i class="fas fa-lock" style="font-size:24px; color:#ff2d55; margin-bottom:10px;"></i>
                <p style="font-size:14px; opacity:0.9;">Lobi kody görmek üçin <strong>giriş</strong> ediň we bir turnira <strong>gatnaşyň</strong>!</p>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    // Ulanyjy login bolan -> lobi kody synanys
    try {
        const lobiRes = await apiGet('/api/lobi-kodu');
        if (lobiRes.success && lobiRes.data) {
            const d = lobiRes.data;
            const kody = d.lobi_kodu || 'Heniz bellenmedi';
            html += `
                <div style="text-align:center; padding:24px; background:rgba(0,200,83,0.05); border-radius:16px; border:1px solid rgba(0,200,83,0.2);">
                    <p style="font-size:11px; text-transform:uppercase; letter-spacing:3px; opacity:0.6; margin-bottom:8px; color:#a0a0c0;">${escapeHtml(d.turnir_ady)}</p>
                    <p style="font-size:12px; opacity:0.7; margin-bottom:12px;">PUBG Lobi Kody:</p>
                    <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:16px;">
                        <code id="lobi-kod-text" style="font-family:'Orbitron',monospace; font-size:28px; color:#00c853; text-shadow:0 0 20px rgba(0,200,83,0.4); letter-spacing:2px;">${escapeHtml(kody)}</code>
                        <button onclick="copyLobiKodu()" type="button" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:8px 14px; color:#e8e8e8; cursor:pointer; font-size:12px; transition:all 0.3s;">
                            <i class="fas fa-copy"></i> Kopyala
                        </button>
                    </div>
                    ${d.görkezilme_sebabi === 'tassyklandy' ? '<p style="font-size:12px; color:#00c853;"><i class="fas fa-check-circle"></i> Admin tarapyndan tassyklandy</p>' : ''}
                    ${d.görkezilme_sebabi === 'tölegsiz' ? '<p style="font-size:12px; color:#0096ff;"><i class="fas fa-info-circle"></i> Tölegsiz turnir</p>' : ''}
                </div>
            `;
        }
    } catch (error) {
        // Yalnyslyk -> garamyk ýa-da ret edilen
        const errMsg = error.message || '';
        let displayMsg = 'Lobi kody almakda yalnyslyk yuze cykdy.';
        
        if (errMsg.includes('tassyklamasyndan soň') || errMsg.includes('admin')) {
            displayMsg = '⏳ Lobi kody diňe admin tassyklamasyndan soň görkezilýär. Garaşyň!';
        } else if (errMsg.includes('ret edildi')) {
            displayMsg = '❌ Katylyjyňyz ret edildi.';
        } else if (errMsg.includes('gatnaşmadynyz')) {
            displayMsg = 'Siz entek haýsydyr bir turnira gatnaşmadynyz. Turnirler bölüminden gatnaşyň!';
        }
        
        html += `
            <div style="text-align:center; padding:20px; background:rgba(255,140,0,0.05); border-radius:16px; border:1px solid rgba(255,140,0,0.2); margin-top:16px;">
                <i class="fas fa-hourglass-half" style="font-size:24px; color:#ff8c00; margin-bottom:10px;"></i>
                <p style="font-size:14px; opacity:0.9;">${displayMsg}</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

function copyLobiKodu() {
    const kodText = document.getElementById('lobi-kod-text');
    if (!kodText) return;
    const text = kodText.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Lobi kody kopyalandy!');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Lobi kody kopyalandy!');
    });
}

function showToast(msg) {
    // Eger onki toast bar bolsa ony ulan, yoksa täze döret
    let toast = document.getElementById('lobi-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lobi-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Lobi modal üçin click/escape handlers
document.addEventListener('click', function(e) {
    const modal = document.getElementById('lobi-modal');
    if (e.target === modal) closeLobiModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLobiModal();
});

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
