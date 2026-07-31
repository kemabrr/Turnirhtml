const API_URL = 'https://web-production-413a9.up.railway.app';

// 1. LOGIN BARLA - Sahypa ýüklenende ilkinji iş
(function checkAuth() {
    const token = localStorage.getItem('pubg_token');
    if (!token) {
        // Login bolmadyk bolsa -> adaty login sahypasyna gönümdir
        const urlParams = new URLSearchParams(window.location.search);
        const turnirId = urlParams.get('id');
        window.location.href = './login.html?redirect=./turnir_gosul.html?id=' + (turnirId || '');
        return;
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('pubg_token');
    if (!token) return; // Ýokarda gönümdirildi

    // URL-dan turnir ID-sini al
    const urlParams = new URLSearchParams(window.location.search);
    const turnirId = urlParams.get('id');

    if (!turnirId) {
        alert('Turnir ID tapylmady!');
        window.location.href = './turnir.html';
        return;
    }

    document.getElementById('turnir_id').value = turnirId;

    // Turnir maglumatlaryny we gatnaşyk ýagdaýyny ýükle
    await loadTurnirData(turnirId);
    await checkJoinStatus(turnirId, token);
});

async function loadTurnirData(turnirId) {
    try {
        const response = await fetch(API_URL + '/api/turnir-data?turnir_id=' + turnirId);
        const result = await response.json();

        if (result.success && result.turnir) {
            const t = result.turnir;
            document.getElementById('tournament-summary').innerHTML = `
                <h3>${escapeHtml(t.ad)}</h3>
                <p>${escapeHtml(t.senesi)} | ${escapeHtml(t.wagty)} | ${escapeHtml(t.karta)}</p>
            `;

            document.getElementById('info-tolek').textContent = t.tolek || '-';
            document.getElementById('info-tolek-usuly').textContent = t.tolek_usuly || '-';
            document.getElementById('turnir_tolekli').value = t.tolekli || 1;

            // Tölegsiz turnir bolsa töleg meýdanlaryny gizle
            if (t.tolekli === 0) {
                document.getElementById('payment-phone-group').style.display = 'none';
                document.getElementById('payment-info-box').style.display = 'none';
                document.getElementById('submit-btn').innerHTML = '<span class="btn-text">TÖLEGSIZ GOŞUL</span>';
            }
        }
    } catch (e) {
        console.error('Turnir yuklenmedi:', e);
    }
}

async function checkJoinStatus(turnirId, token) {
    try {
        const response = await fetch(API_URL + '/api/gatnas-durum/' + turnirId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();

        if (result.success && result.is_joined) {
            // Eýýäm gatnaşan -> "eýýäm gatnaşdyňyz" görkez
            document.getElementById('loading-area').style.display = 'none';
            document.getElementById('content-area').style.display = 'none';
            document.getElementById('already-joined-area').style.display = 'block';

            let statusText = '';
            if (result.admin_onay === 0) statusText = 'Garasylýar';
            else if (result.admin_onay === 1) statusText = 'Tassyklandy';
            else if (result.admin_onay === 2) statusText = 'Ret edildi';

            document.getElementById('joined-status-text').textContent = 'Ýagdaýy: ' + statusText;
        } else {
            // Gatnaşmadyk -> formy görkez
            document.getElementById('loading-area').style.display = 'none';
            document.getElementById('content-area').style.display = 'block';
        }
    } catch (e) {
        console.error('Durum barlanmady:', e);
        document.getElementById('loading-area').style.display = 'none';
        document.getElementById('content-area').style.display = 'block';
    }
}

// Form submit
document.getElementById('join-tournament-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('pubg_token');
    if (!token) {
        window.location.href = './login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    const turnirId = document.getElementById('turnir_id').value;
    const pubgId = document.getElementById('pubg_id').value.trim();
    const paymentPhone = document.getElementById('payment_phone').value.trim();

    if (!pubgId || pubgId.length < 8 || !/^\d+$/.test(pubgId)) {
        alert('PUBG ID diňe san bolmaly (minimum 8)!');
        return;
    }

    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ugradylýar...';

    try {
        const response = await fetch(API_URL + '/api/turnir-gosul', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                pubg_id: pubgId,
                payment_phone: paymentPhone,
                turnir_id: parseInt(turnirId)
            })
        });

        const result = await response.json();

        if (result.success) {
            if (result.data && result.data.auto_approved) {
                // Tölegsiz turnir -> üstünlikli
                alert('Turnira üstünlikli goşuldyňyz!');
                window.location.href = './turnir.html';
            } else {
                // Tölegli turnir -> töleg sahypasyna git
                window.location.href = './payment.html?turnir_id=' + turnirId;
            }
        } else {
            alert(result.message || 'Ýalňyşlyk ýüze çykdy!');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (e) {
        alert('Baglanyşyk ýalňyşlygy!');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
