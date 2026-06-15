// Scroll-reveal: fade-up sections and cards on first scroll into view
(function() {
    // Always start at the top on page load (prevents browser restoring mid-page scroll)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Tag elements that should reveal
    var sections = document.querySelectorAll('.leaderboard-section, .how-it-works, .tier-legend');
    sections.forEach(function(el) { el.classList.add('reveal'); });

    // Use a MutationObserver to tag provider cards as they're dynamically injected
    var leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
        var mo = new MutationObserver(function() {
            var cards = leaderboard.querySelectorAll('.provider-card:not(.reveal)');
            cards.forEach(function(card, i) {
                card.classList.add('reveal', 'reveal-stagger');
            });
            // Re-observe new cards
            observeAll();
        });
        mo.observe(leaderboard, { childList: true, subtree: true });
    }

    // IntersectionObserver fires once per element
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    function observeAll() {
        document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
            observer.observe(el);
        });
    }
    observeAll();
})();
