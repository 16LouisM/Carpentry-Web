// ── MOBILE MENU TOGGLE ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

// ── NAVBAR SCROLL EFFECT ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ── ACTIVE NAV LINK HIGHLIGHT ──
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a:not(.nav-cta)');

function setActiveLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navAnchors.forEach(anchor => {
        anchor.classList.toggle('active', anchor.getAttribute('href') === '#' + current);
    });
}

window.addEventListener('scroll', setActiveLink);

// ── BACK TO TOP ──
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── CONTACT FORM ──
const formFields = document.getElementById('formFields');
const formSuccess = document.getElementById('formSuccess');
const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
        alert('Please fill in all required fields (Name, Email, and Message).');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Temporary UI simulation. This will be replaced with the real API request later.
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
        formFields.classList.add('hide');
        formSuccess.classList.add('show');
        submitBtn.textContent = 'Send My Request';
        submitBtn.disabled = false;

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

// ── SMOOTH SCROLL FOR ALL ANCHOR LINKS ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (event) {
        event.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const offset = 80;
            const position = target.offsetTop - offset;
            window.scrollTo({ top: position, behavior: 'smooth' });
        }
    });
});
