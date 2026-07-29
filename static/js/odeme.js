const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

        function getAuthHeaders() {
            const token = localStorage.getItem('pubg_token');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        async function loadOdemeBilgi() {
            try {
                const result = await fetch(API_URL + '/api/odeme-bilgi', { headers: getAuthHeaders() }).then(r => r.json());
                if (result.success && result.data) {
                    const d = result.data;
                    const k = d.katilimci;
                    document.getElementById('user-ad').textContent = k.ad || '-';
                    document.getElementById('user-ref').textContent = k.referans_kodu || '-';
                    document.getElementById('user-telefon').textContent = k.telefon || '-';
                    document.getElementById('tolek-mukdar').textContent = d.turnir_tolek || '-';
                    document.getElementById('tolek-usuly').textContent = d.turnir_tolek_usuly || '-';

                    document.getElementById('modal-ref').textContent = k.referans_kodu || '-';
                    document.getElementById('modal-ad').textContent = k.ad || '-';
                    document.getElementById('modal-tolek').textContent = d.turnir_tolek || '-';

                    if (k.odeme_durumu === 1) {
                        document.getElementById('confirm-btn').disabled = true;
                        document.getElementById('confirm-btn').innerHTML = '<span class="btn-text">TOLEG EDILDI</span>';
                    }
                }
            } catch (e) {
                console.error('Odeme bilgi yuklenmedi:', e);
            }
        }

        function openSMS() {
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
            const body = encodeURIComponent('62237781 5');
            window.location.href = isIOS ? 'sms:0804&body=' + body : 'sms:0804?body=' + body;
        }

        function copySMS() {
            const text = '62237781 5';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => alert('Nusga alyndy!'));
            } else {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); alert('Nusga alyndy!'); } catch(e) { alert(text); }
                document.body.removeChild(ta);
            }
        }

        async function confirmPayment() {
            const btn = document.getElementById('confirm-btn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/odeme-yapildi', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({})
                });

                if (!response.ok) throw new Error('Server yalnyslygy: ' + response.status);

                const result = await response.json();
                if (result.success) {
                    document.getElementById('pending-modal').style.display = 'flex';
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                }
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
            } finally {
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
                btn.disabled = false;
            }
        }

        document.addEventListener('DOMContentLoaded', loadOdemeBilgi);
