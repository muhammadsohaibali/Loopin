document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    if (email) {
        document.getElementById("email").value = email;
    }

    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Form validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Reset error messages
            document.getElementById('email-error').textContent = '';
            document.getElementById('password-error').textContent = '';

            // Get form values
            const identifier = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            let isValid = true;

            // Email/username validation
            if (!identifier) {
                document.getElementById('email-error').textContent = 'Email or phone number is required';
                isValid = false;
            }

            // Password validation
            if (!password) {
                document.getElementById('password-error').textContent = 'Password is required';
                isValid = false;
            } else if (password.length < 6) {
                document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
                isValid = false;
            }

            if (isValid) {
                const submitButton = loginForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                submitButton.disabled = true;

                const deviceInfo = {
                    userAgent: navigator.userAgent
                };

                const ip = await fetch("https://api.ipify.org?format=json")
                    .then(res => res.json())
                    .then(data => data.ip);

                fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        identifier,
                        password,
                        deviceInfo,
                        ip
                    }),
                })
                    .then(async (res) => {
                        let data = await res.json();
                        if (data.error) notify(data.error, 'alert')
                        if (res.ok) {
                            location.assign('/')
                        } else if (data.error === 'Email Is Not Verified') {
                            notify("Click Here To Verify Email", "info", 10, async () => {
                                try {
                                    const res = await fetch('/api/auth/send-verification-link', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ identifier })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        notify(data.message);
                                    } else {
                                        notify(data.error || 'Something went wrong', 'error');
                                    }
                                } catch (err) {
                                    notify('Failed to send verification link. Try again later.', 'error');
                                }
                            })
                        }
                    })
                    .catch((err) => {
                        console.error("Error:", err);
                        document.getElementById('email-error').textContent = "An error occurred";
                    })
                    .finally(() => {
                        submitButton.innerHTML = originalText;
                        submitButton.disabled = false;
                    });
            }
        });
    }
});

