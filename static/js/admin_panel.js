const API_URL = 'https://web-production-413a9.up.railway.app'; // OZ BACKEND URL-iniz bilen calyn

        let cachedTurnirler = [];
        let cachedKatilimcilar = [];
        let cachedTakimlar = [];

        function getAdminToken() { return localStorage.getItem('pubg_admin_token'); }
        function removeAdminToken() { localStorage.removeItem('pubg_admin_token'); }

        function getAdminAuthHeaders() {
            const token = getAdminToken();
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        async function apiGet(endpoint) {
            const res = await fetch(API_URL + endpoint, { headers: getAdminAuthHeaders() });
            return res.json();
        }

        async function apiPost(endpoint, body) {
            const res = await fetch(API_URL + endpoint, {
                method: 'POST',
                headers: getAdminAuthHeaders(),
                body: JSON.stringify(body)
            });
            return res.json();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getTurnirAd(turnirId) {
            if (!turnirId) return '-';
            const t = cachedTurnirler.find(x => x.id === turnirId);
            return t ? t.ad : '-';
        }

        async function loadAdminData() {
            try {
                const response = await fetch(API_URL + '/api/admin-panel', { 
                    headers: getAdminAuthHeaders() 
                });

                if (response.status === 401 || response.status === 403) {
                    alert('Admin sessiyanyz gutardy yada hukuklarynyz yok. Tazeden girin.');
                    adminLogout();
                    return;
                }

                const result = await response.json();

                if (!result.success) {
                    if (result.message && (result.message.includes('Admin') || result.message.includes('token'))) {
                        adminLogout();
                        return;
                    }
                }
                const data = result.data;
                if (!data) return;

                const s = data.stats || {};
                document.getElementById('stat-toplam').textContent = s.toplam || 0;
                document.getElementById('stat-odeme').textContent = s.odeme || 0;
                document.getElementById('stat-onay').textContent = s.onay || 0;

                cachedTurnirler = data.turnirler || [];
                cachedKatilimcilar = data.katilimcilar || [];
                cachedTakimlar = data.takimlar || [];

                renderTurnirler();
                renderKatilimcilar();
                renderTakimlar();
            } catch (e) {
                console.error('Admin data yuklenmedi:', e);
            }
        }

        function renderTurnirler() {
            const container = document.getElementById('turnir-list-container');
            if (!cachedTurnirler.length) {
                container.innerHTML = '<p style="text-align:center; opacity:0.6; padding:40px 0;">Hic turnir yok</p>';
                return;
            }
            container.innerHTML = cachedTurnirler.map(t => {
                const statusColors = { upcoming: '#0096ff', current: '#00c853', past: '#ff2d55' };
                const statusLabels = { upcoming: 'GELEJEK', current: 'HAZIRKI', past: 'GECEN' };
                const color = statusColors[t.status] || '#a0a0c0';
                const label = statusLabels[t.status] || t.status;
                return `
                    <div class="turnir-admin-card">
                        <div class="turnir-admin-header">
                            <h4>${escapeHtml(t.ad)}</h4>
                            <span class="status-badge" style="background:${color}20; color:${color}; border:1px solid ${color}40;">${label}</span>
                        </div>
                        <div class="turnir-admin-info">
                            <p><strong>Sene:</strong> ${escapeHtml(t.senesi)}</p>
                            <p><strong>Wagt:</strong> ${escapeHtml(t.wagty)}</p>
                            <p><strong>Karta:</strong> ${escapeHtml(t.karta)}</p>
                            <p><strong>Mode:</strong> ${escapeHtml(t.mode)}</p>
                            <p><strong>Toleg:</strong> ${escapeHtml(t.tolek)}</p>
                            <p><strong>Yer:</strong> ${t.onaylanan || 0}/${t.yer_sany}</p>
                            <p><strong>Lobi Kody:</strong> ${escapeHtml(t.lobi_kodu) || '<span style="opacity:0.4">Bellenmedi</span>'}</p>
                            <p><strong>Tolekli:</strong> ${t.tolekli ? 'Hawa' : 'Yok'}</p>
                        </div>
                        <div class="turnir-admin-actions">
                            <button class="btn-edit" onclick="editTurnir(${t.id})" type="button"><i class="fas fa-edit"></i> Duzelt</button>
                            <button class="btn-delete-turnir" onclick="deleteTurnir(${t.id})" type="button"><i class="fas fa-trash"></i> Poz</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function openTurnirModal() {
            document.getElementById('modal-title').textContent = 'Taze Turnir';
            document.getElementById('modal-turnir-id').value = '';
            document.getElementById('turnir-form').reset();
            document.getElementById('turnir-status').value = 'upcoming';
            document.getElementById('turnir-tolekli').checked = true;
            document.getElementById('modal-submit-btn').innerHTML = '<span class="btn-text">DORET</span>';
            document.getElementById('turnir-modal').classList.add('active');
        }

        function closeTurnirModal() {
            document.getElementById('turnir-modal').classList.remove('active');
        }

        function editTurnir(id) {
            const t = cachedTurnirler.find(x => x.id === id);
            if (!t) return;
            document.getElementById('modal-title').textContent = 'Turniri Duzelt';
            document.getElementById('modal-turnir-id').value = t.id;
            document.getElementById('turnir-ad').value = t.ad || '';
            document.getElementById('turnir-senesi').value = t.senesi || '';
            document.getElementById('turnir-wagty').value = t.wagty || '';
            document.getElementById('turnir-karta').value = t.karta || '';
            document.getElementById('turnir-mode').value = t.mode || 'squad';
            document.getElementById('turnir-gatnasym').value = t.gatnasym || '';
            document.getElementById('turnir-tolek').value = t.tolek || '';
            document.getElementById('turnir-tolek-usuly').value = t.tolek_usuly || '';
            document.getElementById('turnir-yer-sany').value = t.yer_sany || 100;
            document.getElementById('turnir-b1').value = t.bayrak_1 || '';
            document.getElementById('turnir-b2').value = t.bayrak_2 || '';
            document.getElementById('turnir-b3').value = t.bayrak_3 || '';
            document.getElementById('turnir-bjemi').value = t.bayrak_jemi || '';
            document.getElementById('turnir-lobi-kodu').value = t.lobi_kodu || '';
            document.getElementById('turnir-tolekli').checked = t.tolekli === 1 || t.tolekli === true;
            document.getElementById('turnir-status').value = t.status || 'upcoming';
            document.getElementById('modal-submit-btn').innerHTML = '<span class="btn-text">SAKLA</span>';
            document.getElementById('turnir-modal').classList.add('active');
        }

        document.getElementById('turnir-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = document.getElementById('modal-turnir-id').value;
            const body = {
                ad: document.getElementById('turnir-ad').value,
                senesi: document.getElementById('turnir-senesi').value,
                wagty: document.getElementById('turnir-wagty').value,
                karta: document.getElementById('turnir-karta').value,
                mode: document.getElementById('turnir-mode').value,
                gatnasym: document.getElementById('turnir-gatnasym').value,
                tolek: document.getElementById('turnir-tolek').value,
                tolek_usuly: document.getElementById('turnir-tolek-usuly').value,
                yer_sany: parseInt(document.getElementById('turnir-yer-sany').value) || 100,
                bayrak_1: document.getElementById('turnir-b1').value,
                bayrak_2: document.getElementById('turnir-b2').value,
                bayrak_3: document.getElementById('turnir-b3').value,
                bayrak_jemi: document.getElementById('turnir-bjemi').value,
                lobi_kodu: document.getElementById('turnir-lobi-kodu').value,
                tolekli: document.getElementById('turnir-tolekli').checked,
                status: document.getElementById('turnir-status').value
            };
            const btn = document.getElementById('modal-submit-btn');
            btn.disabled = true;
            try {
                let result;
                if (id) {
                    body.turnir_id = parseInt(id);
                    result = await apiPost('/api/admin/turnir/duzelt', body);
                } else {
                    result = await apiPost('/api/admin/turnir/doret', body);
                }
                if (result.success) {
                    closeTurnirModal();
                    await loadAdminData();
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                }
            } catch (err) {
                alert('Baglanyp bolmady: ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });

        async function deleteTurnir(id) {
            if (!confirm('Bu turniri pozmak isleyanizmi?')) return;
            try {
                const result = await apiPost('/api/admin/turnir/poz', { turnir_id: id });
                if (result.success) {
                    await loadAdminData();
                } else {
                    alert(result.message || 'Pozmak basarylmady');
                }
            } catch (e) {
                alert('Yalnyslyk: ' + e.message);
            }
        }

        function renderKatilimcilar() {
            const tbody = document.getElementById('katilimci-tbody');
            if (!cachedKatilimcilar.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; opacity:0.6;">Hic katylymci yok</td></tr>';
                return;
            }
            tbody.innerHTML = cachedKatilimcilar.map(k => {
                const odemeClass = k.odeme_durumu ? 'status-ok' : 'status-wait';
                const onayClass = k.admin_onay ? 'status-ok' : 'status-wait';
                const odemeText = k.odeme_durumu ? 'Edildi' : 'Beklemede';
                const onayText = k.admin_onay ? 'Onaylandy' : 'Beklemede';
                return `
                    <tr>
                        <td><code>${escapeHtml(k.referans_kodu)}</code></td>
                        <td>${escapeHtml(k.ad)}</td>
                        <td>${escapeHtml(k.pubg_id) || '-'}</td>
                        <td>${escapeHtml(k.telefon)}</td>
                        <td>${escapeHtml(getTurnirAd(k.turnir_id))}</td>
                        <td><span class="${odemeClass}">${odemeText}</span></td>
                        <td><span class="${onayClass}">${onayText}</span></td>
                        <td>
                            <button class="btn-action btn-onay" onclick="onayKatilimci('${escapeHtml(k.referans_kodu)}')" type="button" title="Onayla"><i class="fas fa-check"></i></button>
                            <button class="btn-action btn-reddet" onclick="reddetKatilimci('${escapeHtml(k.referans_kodu)}')" type="button" title="Reddet"><i class="fas fa-times"></i></button>
                            <button class="btn-action btn-delete" onclick="deleteKatilimci('${escapeHtml(k.referans_kodu)}')" type="button" title="Poz"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        async function onayKatilimci(ref) {
            try {
                const result = await apiPost('/api/admin/onayla', { referans_kodu: ref });
                if (result.success) await loadAdminData();
                else alert(result.message);
            } catch (e) { alert('Yalnyslyk: ' + e.message); }
        }

        async function reddetKatilimci(ref) {
            if (!confirm('Bu katylymcyny reddetmek isleyanizmi?')) return;
            try {
                const result = await apiPost('/api/admin/reddet', { referans_kodu: ref });
                if (result.success) await loadAdminData();
                else alert(result.message);
            } catch (e) { alert('Yalnyslyk: ' + e.message); }
        }

        async function deleteKatilimci(ref) {
            if (!confirm('Bu katylymcyny pozmak isleyanizmi?')) return;
            try {
                const result = await apiPost('/api/admin/poz', { referans_kodu: ref });
                if (result.success) await loadAdminData();
                else alert(result.message);
            } catch (e) { alert('Yalnyslyk: ' + e.message); }
        }

        function renderTakimlar() {
            const container = document.getElementById('teams-grid-container');
            if (!cachedTakimlar.length) {
                container.innerHTML = '<p style="text-align:center; opacity:0.6; padding:40px 0;">Hic topar yok</p>';
                return;
            }
            container.innerHTML = cachedTakimlar.map(t => `
                <div class="team-card">
                    <div class="team-header">
                        <h4>${escapeHtml(t.takim_adi) || 'Topar ' + t.takim_kodu}</h4>
                        <span class="team-code">${escapeHtml(t.takim_kodu)}</span>
                    </div>
                    <div class="team-members">
                        <p><i class="fas fa-crown" style="color:#ffd700"></i> ${escapeHtml(t.lider_referans)}</p>
                        ${t.uye1_referans ? `<p><i class="fas fa-user"></i> ${escapeHtml(t.uye1_referans)}</p>` : ''}
                        ${t.uye2_referans ? `<p><i class="fas fa-user"></i> ${escapeHtml(t.uye2_referans)}</p>` : ''}
                        ${t.uye3_referans ? `<p><i class="fas fa-user"></i> ${escapeHtml(t.uye3_referans)}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function showAdminTab(tab, btn) {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');
        }

        function adminLogout() {
            removeAdminToken();
            window.location.href = './admin.html';
        }

        document.addEventListener('DOMContentLoaded', loadAdminData);
