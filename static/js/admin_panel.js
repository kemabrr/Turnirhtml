const API_URL = 'https://web-production-413a9.up.railway.app';

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
                    alert('Admin sessiýaňyz gutardy ýa-da hukuklaryňyz ýok. Täzeden giriň.');
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
                document.getElementById('stat-odeme').textContent = s.odeme_yapan || 0;
                document.getElementById('stat-onay').textContent = s.onaylanan || 0;

                cachedTurnirler = data.turnirler || [];
                cachedKatilimcilar = data.katilimcilar || [];
                cachedTakimlar = data.takimlar || [];

                renderTurnirler(cachedTurnirler);
                renderKatilimcilar(cachedKatilimcilar);
                renderTakimlar(cachedTakimlar);
            } catch (e) {
                console.error('Admin data yuklenmedi:', e);
            }
        }

        function renderTurnirler(turnirler) {
            const container = document.getElementById('turnir-list-container');
            if (!turnirler || !turnirler.length) {
                container.innerHTML = '<p style="text-align:center; opacity:0.6; padding:40px 0;">Häzirki wagtda turnir ýok.</p>';
                return;
            }
            container.innerHTML = '<div class="turnir-list">' + turnirler.map(t => `
                <div class="turnir-admin-card">
                    <div class="turnir-admin-header">
                        <h4>${escapeHtml(t.ad)}</h4>
                        <div style="display:flex; gap:6px;">
                            ${t.tolekli === 0 ? '<span class="status-badge" style="background:rgba(0,200,83,0.15); color:#00c853; border:1px solid rgba(0,200,83,0.3);">TÖLEGSIZ</span>' : ''}
                            <span class="status-badge status-${escapeHtml(t.status)}">${escapeHtml(t.status)}</span>
                        </div>
                    </div>
                    <div class="turnir-admin-info">
                        <p><strong>Sene:</strong> ${escapeHtml(t.senesi)}</p>
                        <p><strong>Wagt:</strong> ${escapeHtml(t.wagty)}</p>
                        <p><strong>Karta:</strong> ${escapeHtml(t.karta)}</p>
                        <p><strong>Mode:</strong> ${escapeHtml(t.mode)}</p>
                        <p><strong>Toleg:</strong> ${escapeHtml(t.tolek)}</p>
                        <p><strong>Yer:</strong> ${t.onaylanan || 0}/${t.yer_sany || 0}</p>
                        ${t.lobi_kodu ? `<p><strong>Lobi Kody:</strong> ${escapeHtml(t.lobi_kodu)}</p>` : ''}
                    </div>
                    <div class="turnir-admin-actions">
                        <button class="btn-edit" onclick="editTurnir(${t.id})" type="button">
                            <i class="fas fa-edit"></i> Üýtget
                        </button>
                        <button class="btn-delete-turnir" onclick="deleteTurnir(${t.id}, '${escapeHtml(t.ad)}')" type="button">
                            <i class="fas fa-trash"></i> Poz
                        </button>
                    </div>
                </div>
            `).join('') + '</div>';
        }

        function renderKatilimcilar(katilimcilar) {
            const tbody = document.getElementById('katilimci-tbody');
            if (!katilimcilar || !katilimcilar.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Katylymcy ýok</td></tr>';
                return;
            }
            tbody.innerHTML = katilimcilar.map(k => `
                <tr>
                    <td><code>${escapeHtml(k.referans_kodu)}</code></td>
                    <td>${escapeHtml(k.ad)}</td>
                    <td>${escapeHtml(k.pubg_id) || '-'}</td>
                    <td>${escapeHtml(k.telefon)}</td>
                    <td>${escapeHtml(getTurnirAd(k.turnir_id))}</td>
                    <td>${k.odeme_durumu === 1 ? '<i class="fas fa-check-circle" style="color:#00c853"></i>' : '<i class="fas fa-times-circle" style="color:#ff2d55"></i>'}</td>
                    <td>
                        ${k.admin_onay === 0 ? 'Garasyl yar' : k.admin_onay === 1 ? 'Tassyklandy' : 'Ret edildi'}
                    </td>
                    <td>
                        ${k.odeme_durumu === 1 && k.admin_onay === 0 ? `
                            <button onclick="onayla('${escapeHtml(k.referans_kodu)}')" class="btn-approve" type="button">Onayla</button>
                            <button onclick="reddet('${escapeHtml(k.referans_kodu)}')" class="btn-reject" type="button">Reddet</button>
                        ` : ''}
                        <button onclick="poz('${escapeHtml(k.referans_kodu)}')" class="btn-delete" type="button">Poz</button>
                    </td>
                </tr>
            `).join('');
        }

        function renderTakimlar(takimlar) {
            const grid = document.getElementById('teams-grid-container');
            if (!takimlar || !takimlar.length) {
                grid.innerHTML = '<p style="text-align:center; opacity:0.6; padding:40px 0;">Topar ýok.</p>';
                return;
            }
            grid.innerHTML = takimlar.map(t => {
                let uyeCount = 1;
                if (t.uye1_referans) uyeCount++;
                if (t.uye2_referans) uyeCount++;
                if (t.uye3_referans) uyeCount++;
                return `
                    <div class="team-admin-card">
                        <h4>${escapeHtml(t.takim_adi || 'Topar')}</h4>
                        <p>Kod: <code>${escapeHtml(t.takim_kodu)}</code></p>
                        <p>Lider: ${escapeHtml(t.lider_ady || '-')}</p>
                        <p>Agzalar: ${uyeCount}</p>
                    </div>
                `;
            }).join('');
        }

        function showAdminTab(tab, btn) {
            document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-btn').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + tab).classList.add('active');
            if (btn) btn.classList.add('active');
        }

        function openTurnirModal() {
            document.getElementById('modal-title').textContent = 'Täze Turnir';
            document.getElementById('modal-turnir-id').value = '';
            document.getElementById('turnir-form').reset();
            document.getElementById('turnir-modal').classList.add('active');
        }

        function closeTurnirModal() {
            document.getElementById('turnir-modal').classList.remove('active');
        }

        function editTurnir(id) {
            apiGet('/api/turnir-detay/' + id).then(result => {
                if (result.success) {
                    const t = result.turnir;
                    document.getElementById('modal-title').textContent = 'Turnir Üýtget';
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
                    document.getElementById('turnir-status').value = t.status || 'upcoming';
                    document.getElementById('turnir-tolekli').checked = t.tolekli === 1;
                    document.getElementById('turnir-modal').classList.add('active');
                }
            }).catch(e => alert('Turnir maglumatlaryny almakda yalnyslyk!'));
        }

        async function deleteTurnir(id, ad) {
            if (!confirm('"' + ad + '" turnirini pozmak isleyarsinizmi?')) return;
            try {
                const result = await apiPost('/api/admin-turnir-sil', { turnir_id: id });
                if (result.success) await loadAdminData();
                else alert(result.message);
            } catch (error) { alert('Yalnyslyk: ' + error.message); }
        }

        document.getElementById('turnir-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const turnirId = document.getElementById('modal-turnir-id').value;
            const isEdit = turnirId !== '';

            const data = {
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
                status: document.getElementById('turnir-status').value,
                tolekli: document.getElementById('turnir-tolekli').checked
            };

            if (isEdit) data.turnir_id = parseInt(turnirId);
            const url = isEdit ? '/api/admin-turnir-guncelle' : '/api/admin-turnir-ekle';

            try {
                const result = await apiPost(url, data);
                if (result.success) { closeTurnirModal(); await loadAdminData(); }
                else alert(result.message);
            } catch (error) { alert('Yalnyslyk: ' + error.message); }
        });

        async function onayla(refCode) {
            if (!confirm('Tassyklamak isleyarsinizmi?')) return;
            try {
                const result = await apiPost('/api/admin-onayla', { referans_kodu: refCode });
                if (result.success) await loadAdminData(); else alert(result.message);
            } catch (error) { alert('Yalnyslyk: ' + error.message); }
        }

        async function reddet(refCode) {
            if (!confirm('Ret etmek isleyarsinizmi?')) return;
            try {
                const result = await apiPost('/api/admin-reddet', { referans_kodu: refCode });
                if (result.success) await loadAdminData(); else alert(result.message);
            } catch (error) { alert('Yalnyslyk: ' + error.message); }
        }

        async function poz(refCode) {
            if (!confirm('Katylyjy pozmak isleyarsinizmi? Bu hereket yzyna alynyp bilmez!')) return;
            try {
                const result = await apiPost('/api/admin-poz', { referans_kodu: refCode });
                if (result.success) await loadAdminData(); else alert(result.message);
            } catch (error) { alert('Yalnyslyk: ' + error.message); }
        }

        function adminLogout() {
            removeAdminToken();
            window.location.href = './admin_login.html';
        }

        document.addEventListener('DOMContentLoaded', () => {
            if (!getAdminToken()) {
                window.location.href = './admin_login.html';
                return;
            }
            loadAdminData();
        });
