const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň
        const ADMIN_PANEL_URL = './admin_panel.html'; // Admin panel URL-si

        document.getElementById('admin-login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sifre = document.getElementById('sifre').value;
            if (sifre.length < 6) {
                alert('Parol 6 harpdan uly bolmaly!');
                return;
            }

            const btn = document.getElementById('login-btn');
            const btnText = btn.querySelector('.btn-text');
            btnText.textContent = 'Girilyar...';
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sifre: sifre })
                });

                if (response.status === 429) {
                    alert('Gaty kop synanyshyk! 1 minut garashyn.');
                    btnText.textContent = 'GIR';
                    btn.disabled = false;
                    return;
                }

                // DÜZELDI: Hata mesajını düzgün oku
                if (!response.ok) {
                    let errMsg = 'Server yalnyslygy: ' + response.status;
                    try {
                        const errData = await response.json();
                        errMsg = errData.detail || errData.message || errMsg;
                    } catch(e) {}
                    throw new Error(errMsg);
                }

                const result = await response.json();
                if (result.success && result.data && result.data.access_token) {
                    localStorage.setItem('pubg_admin_token', result.data.access_token);
                    window.location.href = ADMIN_PANEL_URL;
                } else {
                    alert(result.message || 'Parol nadogry!');
                    btnText.textContent = 'GIR';
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
                btnText.textContent = 'GIR';
                btn.disabled = false;
            }
        });
          
