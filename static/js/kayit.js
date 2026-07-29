const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

        function setToken(token) { localStorage.setItem('pubg_token', token); }

        function getAuthHeaders() {
            const token = localStorage.getItem('pubg_token');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        function validateForm() {
            const ad = document.getElementById('ad').value.trim();
            const telefon = document.getElementById('telefon').value.trim();
            const parol = document.getElementById('parol').value;
            const parol_tekrar = document.getElementById('parol_tekrar').value;

            if (ad.length < 2) { alert('Ad 2 harpdan uly bolmaly!'); return false; }
            const telClean = telefon.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '');
            if (!/^\d{8}$/.test(telClean) && !/^993\d{8}$/.test(telClean)) {
                alert('Telefon belgisi nadogry! Format: +993 XX XXX XXX ýa-da 8 san');
                return false;
            }
            if (parol.length < 6) { alert('Parol 6 harpdan uly bolmaly!'); return false; }
            if (parol !== parol_tekrar) { alert('Parollar deň däl!'); return false; }
            return true;
        }

        document.getElementById('kayit-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!validateForm()) return;

            const btn = document.getElementById('submit-btn');
            btn.disabled = true;

            const data = {
                ad: document.getElementById('ad').value.trim(),
                telefon: document.getElementById('telefon').value.trim(),
                parol: document.getElementById('parol').value,
                parol_tekrar: document.getElementById('parol_tekrar').value
            };

            try {
                const response = await fetch(API_URL + '/api/kayit-ol', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success && result.data && result.data.access_token) {
                    setToken(result.data.access_token);
                    window.location.href = './profil.html';
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Yalnyslyk yuze cykdy: ' + error.message);
                btn.disabled = false;
            }
        });
