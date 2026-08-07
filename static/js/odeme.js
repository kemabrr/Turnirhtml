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

        const MAX_SKRINSHOT_SIZE = 5 * 1024 * 1024; // 5MB
        let selectedSkrinshot = null;

        function onSkrinshotSelect(event) {
            const file = event.target.files[0];
            const labelText = document.getElementById('skrinshot-label-text');
            const preview = document.getElementById('skrinshot-preview');
            const confirmBtn = document.getElementById('confirm-btn');

            if (!file) {
                selectedSkrinshot = null;
                confirmBtn.disabled = true;
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Diňe surat faýly saýlaň!');
                event.target.value = '';
                return;
            }

            if (file.size > MAX_SKRINSHOT_SIZE) {
                alert('Surat 5MB-dan uly bolmaly däl!');
                event.target.value = '';
                return;
            }

            selectedSkrinshot = file;
            labelText.textContent = file.name;
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            confirmBtn.disabled = false;
        }

        async function confirmPayment() {
            if (!selectedSkrinshot) {
                alert('Iberimizden ozal toleg skrinshotyny yukläň!');
                return;
            }

            const btn = document.getElementById('confirm-btn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            btn.disabled = true;

            try {
                const token = localStorage.getItem('pubg_token');
                const formData = new FormData();
                formData.append('skrinshot', selectedSkrinshot);

                const response = await fetch(API_URL + '/api/odeme-skrinshot-yukle', {
                    method: 'POST',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                    body: formData
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || ('Server yalnyslygy: ' + response.status));
                }

                document.getElementById('pending-modal').style.display = 'flex';
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
                btn.disabled = false;
            } finally {
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadOdemeBilgi();
            document.getElementById('skrinshot-input').addEventListener('change', onSkrinshotSelect);
        });
