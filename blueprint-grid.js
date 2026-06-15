// Blueprint grid — full-page background with parallax + fade
(function() {
    var canvas = document.getElementById('blueprint-grid');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var GRID = 40;
    var scrollY = 0;
    var W, H;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Parallax: grid scrolls at 0.3x speed
        var offset = scrollY * 0.3;

        // Opacity fades from 0.10 at top to 0.03 at bottom of viewport
        var topOpacity = 0.10;
        var botOpacity = 0.03;

        // Draw vertical lines
        for (var x = 0; x <= W; x += GRID) {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, 'rgba(14,165,233,' + topOpacity + ')');
            grad.addColorStop(1, 'rgba(14,165,233,' + botOpacity + ')');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        // Draw horizontal lines with parallax offset
        var startY = -(offset % GRID);
        for (var y = startY; y <= H; y += GRID) {
            // Fade based on screen position
            var t = Math.max(0, Math.min(1, y / H));
            var alpha = topOpacity + (botOpacity - topOpacity) * t;
            ctx.strokeStyle = 'rgba(14,165,233,' + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function() {
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
        requestAnimationFrame(draw);
    }, { passive: true });

    resize();
})();
