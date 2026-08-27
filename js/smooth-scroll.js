        // ── SMOOTH SCROLL FOR ALL ANCHOR LINKS ──
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offset = 80;
                    const position = target.offsetTop - offset;
                    window.scrollTo({ top: position, behavior: 'smooth' });
                }
            });
        });
