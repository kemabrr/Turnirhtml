const API_URL = 'https://web-production-413a9.up.railway.app';

function getToken() { return localStorage.getItem('pubg_token'); }
function removeToken() { localStorage.removeItem('pubg_token'); }

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

async function apiGet(endpoint) {
    const res = await fetch(API_URL + endpoint, { headers: getAuthHeaders() });
    return res.json();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global maglumat
let profilData = null;

async function loadProfil() {
    try {
        const result = await apiGet('/api/profil');
        if (!result.success || !result.data || !result.data.katilimci) {
            window.location.href = './login.html';
            return;
        }

        profilData = result.data;
        const k = result.data.katilimci;

        // Profil kartasy
        document.getElementById('profil-ad').textContent = k.ad;
        document.getElementById('profil-telefon').textContent = k.telefon;
        document.getElementById('profil-ref').textContent = k.referans_kodu;

        // Topar subtitle
        const toparSub = document.getElementById('topar-subtitle');
        if (k.takim_kodu) {
            toparSub.textContent = k.takim_adi || 'Toparyňyz bar';
        } else {
            toparSub.textContent = 'Topar düz';
        }

        // Status subtitle
        const statusSub = document.getElementById('status-subtitle');
        if (k.admin_onay === 1) {
            statusSub.textContent = 'Tassyklandy';
            statusSub.style.color = '#00c853';
        } else if (k.admin_onay === 2) {
            statusSub.textContent = 'Ret edildi';
            statusSub.style.color = '#ff2d55';
        } else if (k.odeme_durumu === 1) {
            statusSub.textContent = 'Toleg edildi, garaşylýar';
            statusSub.style.color = '#ff8c00';
        } else {
            statusSub.textContent = 'Toleg edilmedi';
            statusSub.style.color = '#ff8c00';
        }

        // Status steps (gizlin, acylan wagty görünýär)
        let stepsHtml = '';

        // Step 1: Hasaba alyndy
        stepsHtml += `
            <div class="status-step completed">
                <div class="step-icon"><i class="fas fa-check-circle"></i></div>
                <div class="step-info">
                    <span class="step-title">Hasaba Alyndy</span>
                    <span class="step-date">${k.kayit_tarihi ? new Date(k.kayit_tarihi).toLocaleString('tk-TM') : '-'}</span>
                </div>
            </div>
        `;

        // Step 2: Toleg
        stepsHtml += `
            <div class="status-step ${k.odeme_durumu === 1 ? 'completed' : 'pending'}">
                <div class="step-icon">${k.odeme_durumu === 1 ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-hourglass-half"></i>'}</div>
                <div class="step-info">
                    <span class="step-title">Toleg</span>
                    <span class="step-date">${k.odeme_durumu === 1 ? 'Toleg edildi' : 'Toleg garasyl yar'}</span>
                </div>
            </div>
        `;

        // Step 3: Admin tassyklamasy
        const onayClass = k.admin_onay === 1 ? 'completed' : (k.admin_onay === 2 ? 'rejected' : 'pending');
        const onayIcon = k.admin_onay === 1 ? '<i class="fas fa-check-circle"></i>' : (k.admin_onay === 2 ? '<i class="fas fa-times-circle"></i>' : '<i class="fas fa-hourglass-half"></i>');
        const onayText = k.admin_onay === 1 ? 'Tassyklandy!' : (k.admin_onay === 2 ? 'Ret edildi' : 'Garasyl yar');
        stepsHtml += `
            <div class="status-step ${onayClass}">
                <div class="step-icon">${onayIcon}</div>
                <div class="step-info">
                    <span class="step-title">Admin Tassyklamasy</span>
                    <span class="step-date">${onayText}</span>
                </div>
            </div>
        `;

        document.getElementById('status-steps').innerHTML = stepsHtml;

        // Status action
        let actionHtml = '';
        if (k.admin_onay === 1) {
            actionHtml = '<div class="status-badge approved">Siz Ustunlikli Tassyklandynyz!</div>';
        } else if (k.admin_onay === 2) {
            actionHtml = '<div class="status-badge rejected">Ret Edildi</div><a href="./odeme.html" class="btn-status-action">TOLEGE GAYTADAN GIT</a>';
        } else if (k.odeme_durumu === 0) {
            actionHtml = '<a href="./odeme.html" class="btn-status-action">TOLEGE GIT</a>';
        }
        document.getElementById('status-action').innerHTML = actionHtml;

        // Topar mazmuny (gizlin, acylan wagty görünýär)
        let teamHtml = '';
        if (k.takim_kodu) {
            teamHtml = `
                <div class="team-card-inner">
                    <div class="team-header-inner">
                        <h4>${escapeHtml(k.takim_adi || 'Toparym')}</h4>
                    </div>
                    <div class="team-code-display">
                        <p class="team-code-label">Topar Kodyňyz:</p>
                        <div class="team-code-box">
                            <code>${escapeHtml(k.takim_kodu)}</code>
                            <button onclick="copyTeamCode(event)" type="button"><i class="fas fa-copy"></i></button>
                        </div>
                        <p class="team-code-hint">Bu kody dostlaryňyza paýlaşyň</p>
                    </div>
                </div>
            `;
        } else {
            teamHtml = `
                <div class="team-empty-inner">
                    <p><i class="fas fa-users" style="font-size:32px;color:#ff2d55;margin-bottom:12px;display:block;"></i>Size topar baglanmady.</p>
                    <a href="./takim.html" class="btn-team-action">TOPARA GOSUL</a>
                </div>
            `;
        }
        document.getElementById('topar-content').innerHTML = teamHtml;

        // Loading gizle
        document.getElementById('profil-loading').style.display = 'none';

    } catch (error) {
        console.error('Profil yuklenmedi:', error);
        window.location.href = './login.html';
    }
}

// Acyljak bölekler
function toggleTopar() {
    const expand = document.getElementById('expand-topar');
    const arrow = document.querySelector('#cat-topar .cat-arrow');
    if (expand.style.display === 'none') {
        expand.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
        arrow.style.color = '#ff2d55';
    } else {
        expand.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
        arrow.style.color = '#606070';
    }
}

function toggleStatus() {
    const expand = document.getElementById('expand-status');
    const arrow = document.querySelector('#cat-status .cat-arrow');
    if (expand.style.display === 'none') {
        expand.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
        arrow.style.color = '#ff8c00';
    } else {
        expand.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
        arrow.style.color = '#606070';
    }
}

function goSazlamalar() {
    // Sazlamalar sahypasyna gider
    window.location.href = './sazlamalar.html';
}

function goGoldaw() {
    // Admina ýazmak sahypasyna gider
    window.location.href = './goldaw.html';
}

function copyTeamCode(e) {
    if (e) e.stopPropagation();
    const code = document.querySelector('.team-code-box code');
    if (!code) return;
    const text = code.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert('Topar kody nusga alyndy!'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            alert('Topar kody nusga alyndy!');
        } catch (err) {
            alert(text);
        }
        document.body.removeChild(ta);
    }
}

function logout() {
    if (!confirm('Hakykatdanam çykmak isleýärsiňizmi?')) return;
    removeToken();
    window.location.href = './index.html';
}

document.addEventListener('DOMContentLoaded', loadProfil);
