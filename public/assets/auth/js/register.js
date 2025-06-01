// Register Form Validation
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    document.getElementById('submit-btn').addEventListener('click', function (e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const birthdate = document.getElementById('birthdate').value;
        const terms = document.getElementById('terms').checked;

        let isValid = true;

        // Full Name validation
        if (!fullName) {
            notify('Full name is required', 'error');
            isValid = false;
        } else if (fullName.length < 3) {
            notify('Name must be at least 3 characters', 'error');
            isValid = false;
        }

        // Email validation
        if (!email) {
            notify('Email is required', 'error');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            notify('Please enter a valid email address', 'error');
            isValid = false;
        }

        // Phone validation
        if (!phone) {
            notify('Phone number is required', 'error');
            isValid = false;
        }

        // Password validation
        if (!password) {
            notify('Password is required', 'error');
            isValid = false;
        } else if (password.length < 8) {
            notify('Password must be at least 8 characters', 'error');
            isValid = false;
        } else if (!/[A-Z]/.test(password)) {
            notify('Password must contain at least one uppercase letter', 'error');
            isValid = false;
        } else if (!/[0-9]/.test(password)) {
            notify('Password must contain at least one number', 'error');
            isValid = false;
        }

        // Confirm Password validation
        if (!confirmPassword) {
            notify('Please confirm your password', 'error');
            isValid = false;
        } else if (password !== confirmPassword) {
            notify('Passwords do not match', 'error');
            isValid = false;
        }

        // Birthdate validation
        if (!birthdate) {
            notify('Date of birth is required', 'error');
            isValid = false;
        } else {
            const birthDate = new Date(birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 13) {
                notify('You must be at least 13 years old', 'error');
                isValid = false;
            }
        }

        // Terms validation
        if (!terms) {
            notify('You must accept the terms and conditions', 'error');
            isValid = false;
        }

        // If form is valid, call backend to register
        if (isValid) {
            const submitButton = registerForm.querySelector('#submit-btn');
            const originalText = submitButton.textContent;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitButton.disabled = true;

            const payload = {
                username: fullName,
                email,
                phone,
                birthdate,
                password,
            };

            fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
                .then(async (res) => {
                    const data = await res.json();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;

                    if (!res.ok) {
                        throw new Error(data.error || "Something went wrong!");
                    }

                    fetch("/api/auth/send-verification-link", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ identifier: email }),
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                notify(data.error, 'error');

                            } else {
                                location.assign(data.redirect)
                            }
                        })
                        .catch(err => {
                            console.error("Fetch error:", err);
                            notify("Fetch Error", 'error');
                        });
                })
                .catch((err) => {
                    console.error("Registration failed:", err);
                    notify(err.message, 'error');
                });
        }
    });

    // Password strength indicator (unchanged)
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            const strengthBar = document.createElement('div');
            strengthBar.className = 'password-strength-bar';

            let strength = 0;
            if (password.length > 0) strength += 20;
            if (password.length >= 8) strength += 20;
            if (/[A-Z]/.test(password)) strength += 20;
            if (/[0-9]/.test(password)) strength += 20;
            if (/[^A-Za-z0-9]/.test(password)) strength += 20;

            let strengthIndicator = this.parentElement.querySelector('.password-strength');
            if (!strengthIndicator) {
                strengthIndicator = document.createElement('div');
                strengthIndicator.className = 'password-strength';
                this.parentElement.appendChild(strengthIndicator);
            }

            strengthIndicator.innerHTML = '';
            const bar = document.createElement('div');
            bar.className = 'password-strength-bar';
            strengthIndicator.appendChild(bar);

            bar.style.width = `${strength}%`;
            if (strength < 40) {
                bar.style.backgroundColor = 'var(--error)';
            } else if (strength < 80) {
                bar.style.backgroundColor = 'orange';
            } else {
                bar.style.backgroundColor = 'var(--success)';
            }
        });
    }
}

// Toggle password visibility for confirm password field
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
}

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', function () {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
}
