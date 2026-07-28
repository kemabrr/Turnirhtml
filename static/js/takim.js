const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

        function getAuthHeaders() {
            const token = localStorage.getItem('pubg_token');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        async function loadStatus() {
            try {
                const token = localStorage.getItem('pubg_token');
                if (!token) {
                    window.location.href = './login.html';
                    return;
                }
                const result = await fetch(API_URL + '/api/profil', { headers: getAuthHeaders() }).then(r => r.json());
                if (!result.success || !result.data || !result.data.katilimci) {
                    window.location.href = './login.html';
                    return;
                }
                const k = result.data.katilimci;

                document.getElementById('page-loading').style.display = 'none';

                if (k.admin_onay !== 1) {
                    document.getElementById('pending-screen').style.display = 'flex';
                    document.getElementById('main-content').style.display = 'none';
                } else {
                    document.getElementById('pending-screen').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    document.getElementById('lider-ad').textContent = k.ad || '-';
                }
            } catch (e) {
                window.location.href = './login.html';
            }
        }

        function showTab(tab, btn) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.getElementById(tab + '-tab').classList.add('active');
            if (btn) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            }
        }

        document.getElementById('create-team-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const adi = document.getElementById('takim_adi').value.trim();
            if (adi.length < 2 || adi.length > 50) {
                alert('Topar ady 2-50 harp aralygynda bolmaly!');
                return;
            }

            const btn = document.getElementById('create-btn');
            const btnText = btn.querySelector('.btn-text');
            btnText.textContent = 'Duzulyar...';
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/takim-olustur', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ takim_adi: adi })
                });

                if (!response.ok) throw new Error('Server yalnyslygy: ' + response.status);

                const result = await response.json();
                if (result.success) {
                    document.getElementById('team-success-title').textContent = 'Topar Duzuldi!';
                    document.getElementById('team-success-message').textContent = 'Topar kodynyz: ' + (result.data ? result.data.takim_kodu : '');
                    document.getElementById('team-success-modal').style.display = 'flex';
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                }
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
            } finally {
                btnText.textContent = 'TOPAR DUZ';
                btn.disabled = false;
            }
        });

        document.getElementById('join-team-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const kod = document.getElementById('takim_kodu').value.trim().toUpperCase();
            if (!kod) {
                alert('Topar kody girizin!');
                return;
            }

            const btn = document.getElementById('join-btn');
            const btnText = btn.querySelector('.btn-text');
            btnText.textContent = 'Gosulyar...';
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/takima-katil', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ takim_kodu: kod })
                });

                if (!response.ok) throw new Error('Server yalnyslygy: ' + response.status);

                const result = await response.json();
                if (result.success) {
                    document.getElementById('team-success-title').textContent = 'Topara Gosuldynyz!';
                    document.getElementById('team-success-message').textContent = result.message;
                    document.getElementById('team-success-modal').style.display = 'flex';
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                }
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
            } finally {
                btnText.textContent = 'TOPARA GOSUL';
                btn.disabled = false;
            }
        });

        document.addEventListener('DOMContentLoaded', loadStatus);
