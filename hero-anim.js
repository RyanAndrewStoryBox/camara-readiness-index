// Hero radio-wave animation
(function() {
    var hero = document.getElementById('hero');
    var canvas = document.getElementById('hero-canvas');
    if (!hero || !canvas) return;

    var ctx = canvas.getContext('2d');
    var W, H, GRID = 40, nodes = [], signals = [], lastSpawn = 0;

    function resize() {
        W = hero.offsetWidth;
        H = hero.offsetHeight;
        canvas.width = W;
        canvas.height = H;
        nodes = [];
        var cols = Math.ceil(W / GRID) + 1;
        var rows = Math.ceil(H / GRID) + 1;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                nodes.push({ x: c * GRID, y: r * GRID, glow: 0 });
            }
        }
    }
    resize();
    window.addEventListener('resize', resize);

    hero.addEventListener('mousemove', function(e) {
        var now = Date.now();
        if (now - lastSpawn < 320) return;
        lastSpawn = now;
        var rect = hero.getBoundingClientRect();
        signals.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            r: 0,
            maxR: 220 + Math.random() * 80,
            speed: 1.2 + Math.random() * 0.6,
            freq: 3 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
            arc: (1.2 + Math.random() * 0.6) * Math.PI,
            angle: Math.atan2(e.movementY || 0, e.movementX || 0) + Math.PI
        });
    });

    function ambient() {
        if (signals.length < 1 && Math.random() < 0.005) {
            signals.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 0,
                maxR: 160 + Math.random() * 100,
                speed: 0.6 + Math.random() * 0.4,
                freq: 3 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                arc: (1.3 + Math.random() * 0.5) * Math.PI,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Decay node glow
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].glow *= 0.94;
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
                if (ringDist < 12) {
                    var a = Math.atan2(dy, dx);
                    var startA = s.angle - s.arc / 2;
                    var endA = s.angle + s.arc / 2;
                    var na = ((a - startA) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    var range = ((endA - startA) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    if (na <= range) {
                        var life = s.r / s.maxR;
                        var fade = Math.pow(1 - life, 1.5);
                        var proximity = 1 - ringDist / 12;
                        n.glow = Math.min(0.6, n.glow + fade * proximity * 0.35);
                    }
                }
            }
        }

        // Draw grid lines
        ctx.strokeStyle = 'rgba(14,165,233,0.08)';
        ctx.lineWidth = 0.5;
        for (var x = 0; x <= W; x += GRID) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (var y = 0; y <= H; y += GRID) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Draw glowing nodes
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
})();
