// Radio-wave ripple animation — full-page canvas, triggered from hero
(function() {
    var hero = document.getElementById('hero');
    var canvas = document.getElementById('hero-canvas');
    if (!hero || !canvas) return;

    var ctx = canvas.getContext('2d');
    var W, H, GRID = 40, nodes = [], signals = [], lastSpawn = 0;
    var scrollY = 0;
    var heroRect = { top: 0, height: 0 };

    function updateHeroRect() {
        var r = hero.getBoundingClientRect();
        heroRect.top = r.top + window.pageYOffset;
        heroRect.height = r.height;
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        updateHeroRect();
        // Build node grid covering full viewport
        nodes = [];
        var cols = Math.ceil(W / GRID) + 1;
        var rows = Math.ceil(H / GRID) + 2;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                nodes.push({ x: c * GRID, y: r * GRID, glow: 0 });
            }
        }
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function() {
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
    }, { passive: true });

    // Mouse interaction — hero area spawns ripples, coordinates mapped to viewport
    hero.addEventListener('mousemove', function(e) {
        var now = Date.now();
        if (now - lastSpawn < 420) return;
        lastSpawn = now;
        var rect = hero.getBoundingClientRect();
        // Use mouse movement direction; fall back to random if stationary
        var mx = e.movementX || 0, my = e.movementY || 0;
        var hasMovement = Math.abs(mx) + Math.abs(my) > 1;
        var dir = hasMovement
            ? Math.atan2(my, mx)
            : Math.random() * Math.PI * 2;
        // Tighter arc when moving (directional beam), wider when stationary
        var arcWidth = hasMovement
            ? (0.6 + Math.random() * 0.3) * Math.PI   // 108-162° cone
            : (1.0 + Math.random() * 0.4) * Math.PI;  // 180-252° spread
        signals.push({
            x: e.clientX,
            y: e.clientY,
            r: 0,
            maxR: 320 + Math.random() * 120,
            speed: 0.6 + Math.random() * 0.3,
            freq: 3 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
            arc: arcWidth,
            angle: dir
        });
    });

    function ambient() {
        // Ambient pulses only in the hero region (mapped to viewport coords)
        var heroScreenTop = heroRect.top - scrollY;
        var heroScreenBot = heroScreenTop + heroRect.height;
        if (signals.length < 2 && Math.random() < 0.003) {
            var ay = heroScreenTop + Math.random() * heroRect.height;
            // Only spawn if hero is at least partially visible
            if (ay > -100 && ay < H + 100) {
                signals.push({
                    x: Math.random() * W,
                    y: ay,
                    r: 0,
                    maxR: 200 + Math.random() * 140,
                    speed: 0.35 + Math.random() * 0.25,
                    freq: 3 + Math.random() * 2,
                    phase: Math.random() * Math.PI * 2,
                    arc: (1.3 + Math.random() * 0.5) * Math.PI,
                    angle: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Parallax offset for nodes — grid scrolls slower
        var offset = scrollY * 0.3;
        var nodeOffsetY = -(offset % GRID);

        // Decay node glow
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].glow *= 0.94;
        }

        // Reposition nodes with parallax
        var cols = Math.ceil(W / GRID) + 1;
        var rows = Math.ceil(H / GRID) + 2;
        var idx = 0;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                if (idx < nodes.length) {
                    nodes[idx].x = c * GRID;
                    nodes[idx].y = nodeOffsetY + r * GRID;
                    idx++;
                }
            }
        }

        // Check which nodes are hit by passing waves
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            for (var j = 0; j < signals.length; j++) {
                var s = signals[j];
                var dx = n.x - s.x;
                var dy = n.y - s.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var ringDist = Math.abs(dist - s.r);
                if (ringDist < 14) {
                    var a = Math.atan2(dy, dx);
                    var startA = s.angle - s.arc / 2;
                    var endA = s.angle + s.arc / 2;
                    var na = ((a - startA) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    var range = ((endA - startA) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    if (na <= range) {
                        var life = s.r / s.maxR;
                        var fade = Math.pow(1 - life, 1.5);
                        var proximity = 1 - ringDist / 14;
                        n.glow = Math.min(0.6, n.glow + fade * proximity * 0.35);
                    }
                }
            }
        }

        // Draw glowing nodes (no grid lines — blueprint-grid.js handles those)
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.glow > 0.02) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1 + n.glow * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(14,165,233,' + (n.glow * 0.45) + ')';
                ctx.fill();
                var segLen = 6 + n.glow * 4;
                ctx.strokeStyle = 'rgba(14,165,233,' + (n.glow * 0.2) + ')';
                ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(n.x - segLen, n.y); ctx.lineTo(n.x + segLen, n.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(n.x, n.y - segLen); ctx.lineTo(n.x, n.y + segLen); ctx.stroke();
            }
        }

        // Draw wave signals
        ambient();
        for (var i = signals.length - 1; i >= 0; i--) {
            var s = signals[i];
            s.r += s.speed;
            var life = s.r / s.maxR;
            if (life > 1) { signals.splice(i, 1); continue; }
            var fade = Math.pow(1 - life, 1.5);
            var segments = 80;
            var startA = s.angle - s.arc / 2;
            var endA = s.angle + s.arc / 2;
            var step = (endA - startA) / segments;
            ctx.beginPath();
            for (var j = 0; j <= segments; j++) {
                var a = startA + step * j;
                var t = j / segments;
                var edgeFade = Math.sin(t * Math.PI);
                var wobble = Math.sin(a * s.freq + s.phase + s.r * 0.08) * (4 + s.r * 0.04) * edgeFade;
                var rx = s.r + wobble;
                var px = s.x + Math.cos(a) * rx;
                var py = s.y + Math.sin(a) * rx;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = 'rgba(14,165,233,' + (fade * 0.25) + ')';
            ctx.lineWidth = 1.5 * fade + 0.5;
            ctx.stroke();
        }

        requestAnimationFrame(draw);
    }
    draw();

    // --- Hero content parallax ---
    var heroContent = hero.querySelector('.container');
    if (heroContent) {
        window.addEventListener('scroll', function() {
            var sy = window.pageYOffset || document.documentElement.scrollTop;
            // Hero text scrolls at 1.4x (moves up faster than page), creating depth
            var translate = sy * 0.4;
            var opacity = Math.max(0, 1 - sy / (heroRect.height * 0.8));
            heroContent.style.transform = 'translateY(-' + translate + 'px)';
            heroContent.style.opacity = opacity;
        }, { passive: true });
    }
})();
