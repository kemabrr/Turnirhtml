const API_URL = 'https://web-production-413a9.up.railway.app'; // ÖZ BACKEND URL-iňiz bilen çalyň

        const urlParams = new URLSearchParams(window.location.search);
        const turnirId = urlParams.get('id') || '';

        function getAuthHeaders() {
            const token = localStorage.getItem('pubg_token');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            };
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        async function loadTurnir() {
            if (!turnirId) {
                alert('Turnir ID tapylmady!');
                window.location.href = './turnir.html';
                return;
            }
            
            // Ilki barla: eýýäm gatnaşanmy?
            try {
                const durumRes = await fetch(API_URL + '/api/gatnas-durum/' + turnirId, {
                    headers: getAuthHeaders()
                });
                
                if (durumRes.ok) {
                    const durum = await durumRes.json();
                    if (durum.success && durum.is_joined) {
                        // Eýýäm gatnaşan - form gizle, habar görkez
                        showAlreadyJoined(durum.admin_onay, durum.odeme_durumu);
                        return;
                    }
                }
            } catch (e) {
                console.error('Gatnas durum barlanylmady:', e);
            }
            
            // Turnir maglumatlaryny yükle
            try {
                const result = await fetch(API_URL + '/api/turnir-data?turnir_id=' + turnirId, {
                    headers: getAuthHeaders()
                }).then(r => r.json());

                if (result.success && result.turnir) {
                    const t = result.turnir;
                    document.getElementById('tournament-summary').innerHTML = `
                        <h3><i class="fas fa-trophy"></i> ${escapeHtml(t.ad)}</h3>
                        <p><strong>Sene:</strong> ${escapeHtml(t.senesi)}</p>
                        <p><strong>Wagt:</strong> ${escapeHtml(t.wagty)}</p>
                        <p><strong>Karta:</strong> ${escapeHtml(t.karta)}</p>
                        <p><strong>Gatnaşyk:</strong> ${escapeHtml(t.gatnasym)}</p>
                        <p><strong>Toleg:</strong> ${escapeHtml(t.tolek)}</p>
                    `;
                    document.getElementById('turnir_id').value = t.id;
                    document.getElementById('turnir_tolekli').value = t.tolekli;

                    const paymentGroup = document.getElementById('payment-phone-group');
                    const paymentInfo = document.getElementById('payment-info-box');
                    const submitBtn = document.getElementById('submit-btn');

                    if (t.tolekli !== 1) {
                        if (paymentGroup) paymentGroup.style.display = 'none';
                        if (paymentInfo) paymentInfo.style.display = 'none';
                        submitBtn.innerHTML = '<span class="btn-text">TURNIRA GOŞUL</span>';
                    } else {
                        if (paymentGroup) paymentGroup.style.display = 'block';
                        if (paymentInfo) paymentInfo.style.display = 'block';
                        submitBtn.innerHTML = '<span class="btn-text">TÖLEGE GIT</span>';
                        document.getElementById('info-tolek').textContent = escapeHtml(t.tolek);
                        document.getElementById('info-tolek-usuly').textContent = escapeHtml(t.tolek_usuly);
                    }

                    document.getElementById('loading-area').style.display = 'none';
                    document.getElementById('content-area').style.display = 'block';
                } else {
                    alert('Turnir tapylmady!');
                    window.location.href = './turnir.html';
                }
            } catch (e) {
                alert('Turnir yuklenmedi: ' + e.message);
                window.location.href = './turnir.html';
            }
        }

        function showAlreadyJoined(adminOnay, odemeDurumu) {
            // Turnir maglumatlaryny görkez
            fetch(API_URL + '/api/turnir-data?turnir_id=' + turnirId, { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(result => {
                    if (result.success && result.turnir) {
                        const t = result.turnir;
                        document.getElementById('joined-tournament-summary').innerHTML = `
                            <h3><i class="fas fa-trophy"></i> ${escapeHtml(t.ad)}</h3>
                            <p><strong>Sene:</strong> ${escapeHtml(t.senesi)}</p>
                            <p><strong>Wagt:</strong> ${escapeHtml(t.wagty)}</p>
                            <p><strong>Karta:</strong> ${escapeHtml(t.karta)}</p>
                            <p><strong>Gatnaşyk:</strong> ${escapeHtml(t.gatnasym)}</p>
                            <p><strong>Toleg:</strong> ${escapeHtml(t.tolek)}</p>
                        `;
                    }
                });
            
            let statusText = '';
            if (adminOnay === 0) statusText = 'Status: Garasylýar (Admin tassyklamagy garaşylýar)';
            else if (adminOnay === 1) statusText = 'Status: Tassyklandy ✅';
            else if (adminOnay === 2) statusText = 'Status: Ret edildi ❌';
            
            if (odemeDurumu === 1) statusText += ' | Toleg: Edilen 💰';
            else statusText += ' | Toleg: Edilmedi';
            
            document.getElementById('joined-status-text').textContent = statusText;
            
            document.getElementById('loading-area').style.display = 'none';
            document.getElementById('already-joined-area').style.display = 'block';
        }

        const paymentPhoneInput = document.getElementById('payment_phone');
        if (paymentPhoneInput) {
            paymentPhoneInput.addEventListener('input', function(e) {
                document.getElementById('display-phone').textContent = e.target.value || '-';
            });
        }

        document.getElementById('join-tournament-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const pubgId = document.getElementById('pubg_id').value.trim();
            const tid = document.getElementById('turnir_id').value;
            const paymentPhoneInput = document.getElementById('payment_phone');
            const paymentPhone = paymentPhoneInput ? paymentPhoneInput.value.trim() : '';
            const tolekli = parseInt(document.getElementById('turnir_tolekli').value) === 1;

            if (!pubgId || pubgId.length < 8) {
                alert('PUBG ID 8 sanly bolmaly!');
                return;
            }
            if (tolekli && !paymentPhone) {
                alert('Toleg telefon belgisini girizin!');
                return;
            }
            if (!tid) {
                alert('Turnir ID tapylmady!');
                return;
            }

            const btn = document.getElementById('submit-btn');
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/turnir-gosul', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        turnir_id: parseInt(tid),
                        tournament_id: 'turnir-' + tid,
                        pubg_id: pubgId,
                        payment_phone: paymentPhone
                    })
                });

                const result = await response.json();

                if (result.success) {
                    if (result.data && result.data.auto_approved) {
                        alert('Turnira üstünlikli goşuldyňyz!');
                        window.location.href = './index.html';
                    } else {
                        window.location.href = './odeme.html?turnir=' + tid;
                    }
                } else {
                    alert(result.message || 'Yalnyslyk yuze cykdy');
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Yalnyslyk: ' + error.message);
                btn.disabled = false;
            }
        });

        document.addEventListener('DOMContentLoaded', loadTurnir);
