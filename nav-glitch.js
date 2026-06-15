// Radio-frequency interference hover effect
(function() {
    var noise = '░▒▓█▄▀■□▪▫─│┌┐└┘├┤┬┴┼━┃╋';
    var digits = '0123456789.:-+=/<>[]{}|\\~';
    var pool = noise + noise + digits;

    // Core animation: scramble text on a target element, resolve to finalText
    function runGlitch(el, finalText, opts) {
        opts = opts || {};
        var maxIterations = opts.steps || 10;
        var speed = opts.speed || 30;
        var iterations = 0;
        var len = finalText.length;

        var origTransform = el.style.transform || '';
        var origTextShadow = el.style.textShadow || '';

        var interval = setInterval(function() {
            var progress = iterations / maxIterations;
            var resolved = Math.floor(progress * len);

            var text = '';
            for (var i = 0; i < len; i++) {
                if (i < resolved) {
                    if (Math.random() < 0.08) {
                        text += pool[Math.floor(Math.random() * pool.length)];
                    } else {
                        text += finalText[i];
                    }
                } else if (finalText[i] === ' ') {
                    text += ' ';
                } else {
                    if (Math.random() < 0.15) {
                        text += finalText[i];
                    } else {
                        text += pool[Math.floor(Math.random() * pool.length)];
                    }
                }
            }

            if (opts.setText) {
                opts.setText(text);
            } else {
                el.textContent = text;
            }

            // Horizontal jitter
            var jitterX = (Math.random() - 0.5) * (1 - progress) * 4;
            var jitterY = (Math.random() - 0.5) * (1 - progress) * 1.5;
            el.style.transform = 'translate(' + jitterX + 'px,' + jitterY + 'px)';

            // Cyan glow flicker
            if (iterations < maxIterations * 0.6) {
                var flash = Math.random();
                if (flash < 0.3) {
                    el.style.textShadow = '0 0 8px rgba(34,211,238,0.6), 2px 0 0 rgba(34,211,238,0.3)';
                } else if (flash < 0.5) {
                    el.style.textShadow = '-1px 0 0 rgba(14,165,233,0.4), 1px 0 0 rgba(34,211,238,0.4)';
                } else {
                    el.style.textShadow = 'none';
                }
            } else {
                el.style.textShadow = 'none';
            }

            iterations++;

            if (iterations > maxIterations) {
                clearInterval(interval);
                if (opts.setText) {
                    opts.setText(finalText);
                } else {
                    el.textContent = finalText;
                }
                el.style.transform = origTransform;
                el.style.textShadow = origTextShadow;
                if (opts.onDone) opts.onDone();
            }
        }, speed);

        return interval;
    }

    // --- Text elements (nav, footer, buttons) ---
    function glitchifyText(el) {
        var original = el.textContent.trim();
        if (!original) return;
        var animating = false;

        el.addEventListener('mouseenter', function() {
            if (animating) return;
            animating = true;
            runGlitch(el, original, {
                onDone: function() { animating = false; }
            });
        });
    }

    document.querySelectorAll('.nav-links a, .footer-links a, .btn').forEach(glitchifyText);

    // --- Select dropdowns: glitch overlay on value change ---
    document.querySelectorAll('.filter-select').forEach(function(select) {
        // Wrap select in a positioned container if not already
        var wrapper = select.parentElement;
        if (!wrapper.classList.contains('select-glitch-wrap')) {
            wrapper = document.createElement('div');
            wrapper.classList.add('select-glitch-wrap');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.minWidth = select.style.minWidth || '200px';
            select.parentNode.insertBefore(wrapper, select);
            wrapper.appendChild(select);
        }

        // Create overlay span for the glitch text
        var overlay = document.createElement('span');
        overlay.classList.add('select-glitch-overlay');
        overlay.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;' +
            'display:flex;align-items:center;padding:0.5rem 0.75rem;' +
            'pointer-events:none;opacity:0;' +
            'font-family:inherit;font-size:0.85rem;color:#22d3ee;' +
            'background:rgba(15,23,42,0.85);border-radius:8px;' +
            'white-space:nowrap;overflow:hidden;z-index:5;';
        wrapper.appendChild(overlay);

        var glitching = false;

        select.addEventListener('change', function() {
            if (glitching) return;
            glitching = true;

            var selectedText = select.options[select.selectedIndex].text;

            // Show overlay, hide native text
            overlay.style.opacity = '1';
            select.style.color = 'transparent';

            runGlitch(overlay, selectedText, {
                steps: 8,
                speed: 30,
                setText: function(t) { overlay.textContent = t; },
                onDone: function() {
                    // Brief hold, then fade overlay out
                    setTimeout(function() {
                        overlay.style.opacity = '0';
                        select.style.color = '';
                        overlay.textContent = '';
                        glitching = false;
                    }, 120);
                }
            });
        });

        // Quick flash on focus/click
        select.addEventListener('focus', function() {
            if (glitching) return;
            var currentText = select.options[select.selectedIndex].text;
            overlay.style.opacity = '1';
            select.style.color = 'transparent';

            // Just 3 fast frames of noise then resolve
            var frames = 0;
            var flashInterval = setInterval(function() {
                var t = '';
                for (var i = 0; i < currentText.length; i++) {
                    if (currentText[i] === ' ') { t += ' '; }
                    else if (Math.random() < 0.4) { t += currentText[i]; }
                    else { t += pool[Math.floor(Math.random() * pool.length)]; }
                }
                overlay.textContent = t;
                overlay.style.textShadow = Math.random() < 0.5 ?
                    '0 0 6px rgba(34,211,238,0.5)' : 'none';
                frames++;
                if (frames >= 3) {
                    clearInterval(flashInterval);
                    overlay.textContent = currentText;
                    overlay.style.textShadow = 'none';
                    setTimeout(function() {
                        overlay.style.opacity = '0';
                        select.style.color = '';
                    }, 60);
                }
            }, 35);
        });
    });
})();
