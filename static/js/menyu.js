function logout() {
            if (!confirm('Hakykatdanam cykmak isleyarsinizmi?')) return;
            localStorage.removeItem('pubg_token');
            localStorage.removeItem('pubg_admin_token');
            window.location.href = './index.html';
        }
