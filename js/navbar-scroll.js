        // ── NAVBAR SCROLL EFFECT ──
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
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
            navAnchors.forEach(a => {
                a.classList.remove('active');
                if (a.getAttribute('href') === '#' + current) {
                    a.classList.add('active');
                }
            });
        }
        window.addEventListener('scroll', setActiveLink);
