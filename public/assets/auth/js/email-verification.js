document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const otp = urlParams.get('otp');

    // Show loading state initially
    document.getElementById('loading').style.display = 'block';
    document.getElementById('success').style.display = 'none';
    document.getElementById('already-verified').style.display = 'none';
    document.getElementById('error').style.display = 'none';

    if (!email || !otp) {
        showError("Invalid verification link. Please check your email for the correct link.");
        return;
    }

    // Call verification API
    fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw err;
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showSuccess(data.email);
            } else if (data.code === 'already-verified') {
                showAlreadyVerified(data.email);
            } else {
                throw data;
            }
        })
        .catch(error => {
            let errorMessage = "Verification failed. Please try again.";
            let action = "Register Again";
            let actionUrl = "/auth/register";

            if (error.message) {
                errorMessage = error.message;

                if (error.code === 'already-verified') {
                    action = "Log In";
                    actionUrl = "/auth";
                } else if (error.code === 'invalid-otp') {
                    action = "Request New Code";
                    actionUrl = "/auth/resend-verification";
                } else if (error.code === 'invalid-link') {
                    action = "Register Again";
                    actionUrl = "/auth/register";
                }
            }

            showError(errorMessage, action, actionUrl);
        });

    function showSuccess(email) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('success').style.display = 'block';

        if (email) {
            const loginBtn = document.getElementById('login-btn');
            loginBtn.href = `/auth?email=${encodeURIComponent(email)}`;
        }
    }

    function showAlreadyVerified(email) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('already-verified').style.display = 'block';

        if (email) {
            const loginBtn = document.getElementById('already-login-btn');
            loginBtn.href = `/auth?email=${encodeURIComponent(email)}`;
        }
    }

    function showError(message, action = "Register Again", actionUrl = "/auth/register") {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-message').textContent = message;
        document.getElementById('error').style.display = 'block';

        const actionBtn = document.getElementById('error-action-btn');
        actionBtn.textContent = action;
        actionBtn.href = actionUrl;
    }
});
