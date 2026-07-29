const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

        function setToken(token) { localStorage.setItem('pubg_token', token); }

        function getAuthHeaders() {
            const token = localStorage.getItem('pubg_token');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const telefon = document.getElementById('telefon').value.trim();
            const parol = document.getElementById('parol').value;

            if (!telefon || !parol) {
                alert('Telefon we parol girizin!');
                return;
            }

            const btn = document.getElementById('login-btn');
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/login', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ telefon, parol })
                });

                const result = await response.json();

                if (result.success && result.data && result.data.access_token) {
                    setToken(result.data.access_token);
                    window.location.href = './profil.html';
                } else {
                    alert(result.message || 'Telefon ýa-da parol nadogry!');
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Yalnyslyk yuze cykdy: ' + error.message);
                btn.disabled = false;
            }
        });
