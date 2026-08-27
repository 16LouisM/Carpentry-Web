        // ── CONTACT FORM ──
        const formFields = document.getElementById('formFields');
        const formSuccess = document.getElementById('formSuccess');
        const submitBtn = document.getElementById('submitBtn');

        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Simple validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !message) {
                alert('Please fill in all required fields (Name, Email, and Message).');
                return;
            }

            const atIndex = email.lastIndexOf('@');
            if (atIndex < 1 || email.indexOf('.', atIndex) <= atIndex + 1 || atIndex === email.length - 1) {
                alert('Please enter a valid email address.');
                return;
            }

            // Simulate form submission
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                formFields.classList.add('hide');
                formSuccess.classList.add('show');
                submitBtn.textContent = 'Send My Request';
                submitBtn.disabled = false;

                // Reset after 8 seconds so the user can send another if they want
                setTimeout(() => {
                    formFields.classList.remove('hide');
                    formSuccess.classList.remove('show');
                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('phone').value = '';
                    document.getElementById('service').value = '';
                    document.getElementById('message').value = '';
                }, 8000);
            }, 1500);
        });
