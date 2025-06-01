// --- Forgot Password Form ---
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        document.getElementById('email-error').textContent = '';

        const email = document.getElementById('email').value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email';
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            document.getElementById('email-display').textContent = email;
            forgotPasswordForm.classList.add('hidden');
            document.getElementById('verificationForm').classList.remove('hidden');
        } catch (err) {
            document.getElementById('email-error').textContent = err.message;
        }

        submitBtn.textContent = 'Send Code';
        submitBtn.disabled = false;
    });
}

// --- Verify Code Form ---
const verificationForm = document.getElementById('verificationForm');
if (verificationForm) {
    verificationForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        document.getElementById('code-error').textContent = '';

        const code = document.getElementById('verificationCode').value.trim();
        const email = document.getElementById('email-display').textContent;

        if (!code || !/^\d{6}$/.test(code)) {
            document.getElementById('code-error').textContent = 'Enter a valid 6-digit code';
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid code');

            verificationForm.classList.add('hidden');
            document.getElementById('newPasswordForm').classList.remove('hidden');
        } catch (err) {
            document.getElementById('code-error').textContent = err.message;
        }

        submitBtn.textContent = 'Verify Code';
        submitBtn.disabled = false;
    });

    document.getElementById('resend-code')?.addEventListener('click', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email-display').textContent;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            alert('Verification code resent!');
        } catch {
            alert('Failed to resend code');
        }

        this.textContent = 'Resend code';
    });
}

// --- New Password Form ---
const newPasswordForm = document.getElementById('newPasswordForm');
if (newPasswordForm) {
    newPasswordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        document.getElementById('new-password-error').textContent = '';
        document.getElementById('confirm-new-password-error').textContent = '';

        const password = document.getElementById('newPassword').value.trim();
        const confirm = document.getElementById('confirmNewPassword').value.trim();
        const email = document.getElementById('email-display').textContent;

        let valid = true;
        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
            document.getElementById('new-password-error').textContent = 'Password must be 8+ chars, include uppercase & number';
            valid = false;
        }

        if (!confirm || password !== confirm) {
            document.getElementById('confirm-new-password-error').textContent = 'Passwords do not match';
            valid = false;
        }

        if (!valid) return;

        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword: password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not reset password');

            newPasswordForm.classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
        } catch (err) {
            document.getElementById('new-password-error').textContent = err.message;
        }

        submitBtn.textContent = 'Reset Password';
        submitBtn.disabled = false;
    });
}

const togglePassword = document.getElementById('toggleNewPassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function () {
        const passwordInput = document.getElementById('newPassword');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
}

const toggleConfirmPassword = document.getElementById('toggleConfirmNewPassword');
if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', function () {
        const confirmPasswordInput = document.getElementById('confirmNewPassword');
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
}
