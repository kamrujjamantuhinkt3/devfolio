/* Kamrujjaman Tuhin — Portfolio interactions */
(function () {
    "use strict";

    var root = document.documentElement;
    root.classList.add("js");
    var body = document.body;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* Locking the page behind an overlay. `overflow: hidden` on <body> is
       ignored by iOS Safari, which keeps scrolling the page underneath, so the
       body is pinned instead and the scroll position restored on release.
       Counted, because the menu and the project sheet can both ask for it. */
    var scrollLock = (function () {
        var depth = 0;
        var savedY = 0;

        return {
            on: function () {
                if (depth++ > 0) return;
                savedY = window.scrollY || window.pageYOffset || 0;
                body.style.position = "fixed";
                body.style.top = -savedY + "px";
                body.style.left = "0";
                body.style.right = "0";
                body.style.width = "100%";
            },
            off: function () {
                depth -= 1;
                if (depth > 0) return;
                depth = 0;
                body.style.position = "";
                body.style.top = "";
                body.style.left = "";
                body.style.right = "";
                body.style.width = "";
                window.scrollTo(0, savedY);
            }
        };
    })();

    /* Missing images - a logo or badge that has not been uploaded yet shows a
       tidy emblem in its place instead of a broken image. The image itself
       stays, so the moment the real file is added at that path it appears. */
    var FALLBACK_ICONS = {
        school: '<svg viewBox="0 0 24 24"><path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10V5.6L12 2.8Z"/><path d="M8 10c1.5-.6 2.8-.6 4 .4 1.2-1 2.5-1 4-.4v5.2c-1.5-.6-2.8-.6-4 .4-1.2-1-2.5-1-4-.4V10ZM12 10.4v5.2"/></svg>',
        medal: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15"/><path d="M11 31c-2.6-4.2-3-9.6-.7-14.2M37 31c2.6-4.2 3-9.6.7-14.2"/><path class="fallback__fill" d="M24 14.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L24 29.4l-5.8 3 1.1-6.5-4.7-4.6 6.5-.9Z"/></svg>'
    };

    function showFallback(img) {
        var holder = img.parentNode;
        if (!holder || holder.querySelector(".fallback")) return;

        var key = img.getAttribute("data-fallback");
        var mark = document.createElement("span");
        mark.className = "fallback";
        mark.setAttribute("aria-hidden", "true");
        if (FALLBACK_ICONS[key]) mark.innerHTML = FALLBACK_ICONS[key];
        else mark.textContent = key;          // initials

        holder.appendChild(mark);
        holder.classList.add("has-fallback");
    }

    function clearFallback(img) {
        var holder = img.parentNode;
        var mark = holder && holder.querySelector(".fallback");
        if (mark) holder.removeChild(mark);
        if (holder) holder.classList.remove("has-fallback");
    }

    document.querySelectorAll("img[data-fallback]").forEach(function (img) {
        img.addEventListener("error", function () { showFallback(img); });
        img.addEventListener("load", function () { clearFallback(img); });
        // it may already have failed before this script ran
        if (img.complete && !img.naturalWidth) showFallback(img);
    });


    /* Theme*/
    var themeBtn = document.getElementById("themeToggle");

    var stored = null;
    try { stored = localStorage.getItem("kt-theme"); } catch (e) { /* private mode */ }
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);

    function isLight() { return root.getAttribute("data-theme") === "light"; }

    themeBtn.addEventListener("click", function () {
        root.setAttribute("data-theme", isLight() ? "dark" : "light");
        try { localStorage.setItem("kt-theme", root.getAttribute("data-theme")); } catch (e) { /* ignore */ }
    });

    /* Preloader */
    var preloader = document.getElementById("preloader");
    var preBar = document.getElementById("preBar");
    var prePct = document.getElementById("prePct");

    var pct = 0;
    var pageLoaded = false;
    var finished = false;

    scrollLock.on();     // held until the loader finishes

    function markLoaded() { pageLoaded = true; }

    // Waiting on window "load" means waiting for every eager image, which on a
    // phone stalls the bar at 92% for seconds. The only asset the first screen
    // actually needs is the portrait, so that is what is waited on.
    var heroShot = document.querySelector(".portrait__frame img");

    if (heroShot) {
        if (heroShot.complete) markLoaded();
        else {
            heroShot.addEventListener("load", markLoaded);
            heroShot.addEventListener("error", markLoaded);
        }
    } else {
        markLoaded();
    }

    window.addEventListener("load", markLoaded);

    function finish() {
        if (finished) return;
        finished = true;

        preBar.style.width = "100%";
        prePct.textContent = "100";

        setTimeout(function () {
            preloader.classList.add("is-done");
            body.classList.remove("is-loading");
            scrollLock.off();                    // release the pin taken at start-up
            body.classList.add("is-ready");
            startStory();
            setTimeout(function () { preloader.style.display = "none"; }, 900);
        }, 340);
    }

    var timer = setInterval(function () {
        // Creep to 92% while assets load, then run home once the page is ready
        var target = pageLoaded ? 100 : 92;
        pct += Math.max((target - pct) * 0.11, 0.35);
        if (pct > target) pct = target;

        preBar.style.width = pct + "%";
        prePct.textContent = String(Math.floor(pct));

        if (pageLoaded && pct >= 99.4) { clearInterval(timer); finish(); }
    }, 40);

    // never leave anyone stuck behind the loader
    setTimeout(function () { clearInterval(timer); finish(); }, 3200);

    /* Pointer - one record of where the mouse is, shared by the starfield and
       the cursor trail. Mouse and pen only; touch and reduced motion get none
       of the pointer effects. */
    var pointer = { x: -9999, y: -9999, on: false };
    var pointerFx = !reduced && window.matchMedia("(pointer: fine)").matches;

    if (pointerFx) {
        window.addEventListener("pointermove", function (e) {
            if (e.pointerType === "touch") return;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.on = true;
        }, { passive: true });

        document.addEventListener("mouseout", function (e) {
            if (!e.relatedTarget) pointer.on = false;   // left the window
        });
    }


    /* Starfield */
    var canvas = document.getElementById("stars");

    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d");
        var stars = [];
        var shooting = null;
        var w = 0, h = 0, dpr = 1;
        var PULL_RADIUS = 170;      // px around the pointer that stars lean in from
        var LINK_RADIUS = 140;      // and the closer ring that gets joined to it

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
        }

        function seed() {
            var count = Math.min(Math.round((w * h) / 5200), 320);
            stars = [];
            for (var i = 0; i < count; i++) {
                var r = Math.random() * 1.25 + 0.25;
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: r,
                    a: Math.random() * 0.6 + 0.2,
                    tw: Math.random() * Math.PI * 2,
                    ox: 0, oy: 0,                        // pull towards the pointer
                    // nearer (larger) stars drift faster, so the field has depth
                    sp: (Math.random() * 0.12 + 0.06) * (0.6 + r),
                    ts: Math.random() * 0.02 + 0.006     // twinkle speed
                });
            }
        }

        function launchShootingStar() {
            shooting = {
                x: Math.random() * w * 0.6,
                y: Math.random() * h * 0.4,
                len: Math.random() * 110 + 90,
                vx: Math.random() * 3 + 4.5,
                vy: Math.random() * 1.2 + 1.1,
                life: 0,
                max: 70
            };
        }

        function draw(t) {
            ctx.clearRect(0, 0, w, h);

            var light = isLight();
            var rgb = light ? "58, 70, 130" : "255, 255, 255";
            var accent = light ? "79, 70, 229" : "165, 180, 252";

            var near = [];

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = s.a;
                var pull = 0;

                if (!reduced) {
                    s.tw += s.ts;
                    alpha = s.a * (0.55 + 0.45 * Math.sin(s.tw));
                    s.y -= s.sp;                       // slow upward drift
                    if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
                }

                // Stars close to the pointer lean in towards it and brighten
                if (pointerFx) {
                    var tx = 0, ty = 0;
                    if (pointer.on) {
                        var ex = pointer.x - s.x;
                        var ey = pointer.y - s.y;
                        var dist = Math.sqrt(ex * ex + ey * ey);
                        if (dist < PULL_RADIUS) {
                            pull = 1 - dist / PULL_RADIUS;
                            pull *= pull;
                            tx = ex * pull * 0.45;
                            ty = ey * pull * 0.45;
                            if (dist < LINK_RADIUS) near.push({ s: s, d: dist });
                        }
                    }
                    s.ox += (tx - s.ox) * 0.08;             // eased, so they drift back
                    s.oy += (ty - s.oy) * 0.08;
                }

                ctx.beginPath();
                ctx.arc(s.x + s.ox, s.y + s.oy, s.r * (1 + pull * 0.9), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(" + (s.r > 1.05 || pull > 0.2 ? accent : rgb) + ","
                    + Math.min(1, alpha + pull * 0.6).toFixed(3) + ")";
                ctx.fill();
            }

            // ...and the nearest few are joined to it, so the cursor draws a
            // small constellation of its own wherever it goes
            if (near.length) {
                near.sort(function (a, b) { return a.d - b.d; });
                ctx.lineWidth = 0.7;
                for (var j = 0; j < near.length && j < 5; j++) {
                    var ns = near[j].s;
                    ctx.strokeStyle = "rgba(" + accent + "," + ((1 - near[j].d / LINK_RADIUS) * 0.34).toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.moveTo(pointer.x, pointer.y);
                    ctx.lineTo(ns.x + ns.ox, ns.y + ns.oy);
                    ctx.stroke();
                }
            }

            if (!reduced) {
                if (!shooting && Math.random() < 0.0022) launchShootingStar();

                if (shooting) {
                    shooting.life++;
                    shooting.x += shooting.vx;
                    shooting.y += shooting.vy;

                    var fade = 1 - shooting.life / shooting.max;
                    var g = ctx.createLinearGradient(
                        shooting.x, shooting.y,
                        shooting.x - shooting.len, shooting.y - shooting.len * (shooting.vy / shooting.vx)
                    );
                    g.addColorStop(0, "rgba(" + accent + "," + (0.85 * fade).toFixed(3) + ")");
                    g.addColorStop(1, "rgba(" + accent + ",0)");

                    ctx.strokeStyle = g;
                    ctx.lineWidth = 1.4;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(shooting.x, shooting.y);
                    ctx.lineTo(shooting.x - shooting.len, shooting.y - shooting.len * (shooting.vy / shooting.vx));
                    ctx.stroke();

                    if (shooting.life > shooting.max || shooting.x > w + 200) shooting = null;
                }
                requestAnimationFrame(draw);
            }
        }

        resize();
        draw();

        var rt;
        window.addEventListener("resize", function () {
            clearTimeout(rt);
            rt = setTimeout(function () { resize(); if (reduced) draw(); }, 180);
        });
        themeBtn.addEventListener("click", function () { if (reduced) draw(); });
    }

    /* Cursor - a small star follows the pointer, shedding stardust as it
       goes, and a click throws out a little burst. Runs only while something
       is moving, and never for touch or reduced motion. */
    var trail = document.getElementById("trail");

    if (trail && trail.getContext && pointerFx) {
        root.classList.add("has-trail");

        var tctx = trail.getContext("2d");
        var tw = 0, th = 0;
        var sparks = [];
        var MAX_SPARKS = 150;
        var SHED_STEP = 7;           // px of travel per grain of dust
        var comet = { x: 0, y: 0, glow: 0, size: 1, rot: 0, placed: false };
        var carry = 0;
        var trailOn = false;
        var lastFrame = 0;
        var overLink = false;

        // white through indigo on the dark sky, the deeper indigos on light
        var DARK_SPARKS = ["255, 255, 255", "224, 231, 255", "165, 180, 252", "129, 140, 248"];
        var LIGHT_SPARKS = ["79, 70, 229", "67, 56, 202", "30, 64, 175", "99, 102, 241"];

        function sizeTrail() {
            var ratio = Math.min(window.devicePixelRatio || 1, 2);
            tw = window.innerWidth;
            th = window.innerHeight;
            trail.width = Math.round(tw * ratio);
            trail.height = Math.round(th * ratio);
            tctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function spawn(x, y, vx, vy, big) {
            if (sparks.length >= MAX_SPARKS) sparks.shift();
            var colours = isLight() ? LIGHT_SPARKS : DARK_SPARKS;
            sparks.push({
                x: x, y: y, vx: vx, vy: vy,        // velocity in px per ms
                age: 0,
                life: big ? 900 + Math.random() * 500 : 450 + Math.random() * 550,
                size: big ? 2.8 + Math.random() * 2.4 : 1.1 + Math.random() * 1.8,
                star: big || Math.random() < 0.38, // a sparkle, or plain dust
                rot: Math.random() * Math.PI,
                spin: (Math.random() - 0.5) * 0.006,
                colour: colours[(Math.random() * colours.length) | 0]
            });
        }

        // A four-point star with curved sides
        function sparkle(x, y, r, rot) {
            tctx.save();
            tctx.translate(x, y);
            tctx.rotate(rot);
            tctx.beginPath();
            tctx.moveTo(r, 0);
            for (var k = 1; k <= 4; k++) {
                var tip = k * Math.PI / 2;
                var mid = tip - Math.PI / 4;
                tctx.quadraticCurveTo(Math.cos(mid) * r * 0.16, Math.sin(mid) * r * 0.16,
                                      Math.cos(tip) * r, Math.sin(tip) * r);
            }
            tctx.fill();
            tctx.restore();
        }

        // Drop dust evenly along the path the star travelled this frame
        function shed(ax, ay, bx, by) {
            var dx = bx - ax, dy = by - ay;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.5) return;

            carry = Math.min(carry + d, SHED_STEP * 16);
            var ux = dx / d, uy = dy / d;

            while (carry >= SHED_STEP) {
                carry -= SHED_STEP;
                var back = Math.min(carry / d, 1);
                spawn(bx - dx * back + (Math.random() - 0.5) * 6,
                      by - dy * back + (Math.random() - 0.5) * 6,
                      (Math.random() - 0.5) * 0.035 - ux * 0.02,
                      (Math.random() - 0.5) * 0.035 - uy * 0.02,
                      false);
            }
        }

        function frame(now) {
            var dt = lastFrame ? Math.min(now - lastFrame, 48) : 16.7;
            var f = dt / 16.7;                     // this frame, in 60fps frames
            lastFrame = now;

            var light = isLight();
            var colours = light ? LIGHT_SPARKS : DARK_SPARKS;
            var target = overLink ? 1.6 : 1;

            tctx.clearRect(0, 0, tw, th);
            tctx.globalCompositeOperation = light ? "source-over" : "lighter";

            // the star eases after the pointer, so it trails rather than sticks
            if (pointer.on) {
                if (!comet.placed) { comet.x = pointer.x; comet.y = pointer.y; comet.placed = true; }
                var ease = 1 - Math.pow(0.8, f);
                var fromX = comet.x, fromY = comet.y;
                comet.x += (pointer.x - comet.x) * ease;
                comet.y += (pointer.y - comet.y) * ease;
                shed(fromX, fromY, comet.x, comet.y);
            }
            comet.glow += ((pointer.on ? 1 : 0) - comet.glow) * Math.min(1, 0.12 * f);
            comet.size += (target - comet.size) * Math.min(1, 0.16 * f);
            comet.rot += 0.0009 * dt;
            if (!pointer.on && comet.glow < 0.02) comet.placed = false;

            var drag = Math.pow(0.985, f);

            for (var i = sparks.length - 1; i >= 0; i--) {
                var p = sparks[i];
                p.age += dt;
                if (p.age >= p.life) { sparks.splice(i, 1); continue; }

                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= drag;
                p.vy *= drag;
                p.rot += p.spin * dt;

                var t = p.age / p.life;
                var fade = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;   // quick in, long out
                tctx.fillStyle = "rgba(" + p.colour + "," + (fade * (light ? 0.7 : 0.95)).toFixed(3) + ")";

                if (p.star) {
                    sparkle(p.x, p.y, p.size * 2.7 * (1 - t * 0.4), p.rot);
                } else {
                    tctx.beginPath();
                    tctx.arc(p.x, p.y, p.size * 0.55 * (1 - t * 0.5), 0, Math.PI * 2);
                    tctx.fill();
                }
            }

            // the guiding star itself: a soft halo, then the sparkle on top
            if (comet.glow > 0.02) {
                var r = 20 * comet.size;
                var halo = tctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, r);
                halo.addColorStop(0, "rgba(" + colours[2] + "," + (0.45 * comet.glow).toFixed(3) + ")");
                halo.addColorStop(1, "rgba(" + colours[2] + ",0)");
                tctx.fillStyle = halo;
                tctx.beginPath();
                tctx.arc(comet.x, comet.y, r, 0, Math.PI * 2);
                tctx.fill();

                tctx.fillStyle = "rgba(" + colours[0] + "," + comet.glow.toFixed(3) + ")";
                sparkle(comet.x, comet.y, 8 * comet.size, comet.rot);
            }

            // Stop once the dust has settled and the star has caught up
            var resting = !sparks.length && (pointer.on
                ? Math.abs(pointer.x - comet.x) < 0.3 && Math.abs(pointer.y - comet.y) < 0.3
                  && Math.abs(comet.size - target) < 0.01 && comet.glow > 0.99
                : comet.glow < 0.02);

            if (resting) { trailOn = false; lastFrame = 0; }
            else requestAnimationFrame(frame);
        }

        function wake() {
            if (trailOn) return;
            trailOn = true;
            requestAnimationFrame(frame);
        }

        window.addEventListener("pointermove", function (e) {
            if (e.pointerType !== "touch") wake();
        }, { passive: true });

        // the star swells a little over anything that can be clicked
        document.addEventListener("pointerover", function (e) {
            overLink = !!(e.target.closest && e.target.closest(
                "a, button, label, input, textarea, select, [role='button'], .sat"));
        });

        document.addEventListener("mouseout", function (e) {
            if (!e.relatedTarget) wake();          // let the star fade out
        });

        window.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "touch") return;
            for (var k = 0; k < 12; k++) {
                var angle = (k / 12) * Math.PI * 2 + Math.random() * 0.4;
                var speed = 0.07 + Math.random() * 0.09;
                spawn(e.clientX, e.clientY, Math.cos(angle) * speed, Math.sin(angle) * speed, k % 3 === 0);
            }
            wake();
        });

        sizeTrail();
        var trailResize;
        window.addEventListener("resize", function () {
            clearTimeout(trailResize);
            trailResize = setTimeout(function () { sizeTrail(); wake(); }, 150);
        });
    }


    /* Split the name into letters */
    var ci = 0;
    document.querySelectorAll("[data-split]").forEach(function (el) {
        var text = el.textContent;
        el.textContent = "";
        for (var i = 0; i < text.length; i++) {
            if (text[i] === " ") { el.appendChild(document.createTextNode(" ")); continue; }
            var span = document.createElement("span");
            span.className = "char";
            span.style.setProperty("--ci", ci++);
            span.textContent = text[i];
            el.appendChild(span);
        }
    });

    /* Flowing colour accross name - Each letter is a separate transformed span, so a gradient on the parent can never reach them. Instead every letter gets the same gradient, sized to the full name and offset by its own position which reads as one colour wave travelling across the whole name. */
    var accent = document.querySelector(".accent[data-split]");

    // Iridescent chrome: narrow white highlights racing through indigo,
    // Violet and electric blue. First and last stop match, so it loops seamlessly.
    var GRADIENTS = {
        dark:  "linear-gradient(100deg,#4f46e5 0%,#818cf8 12%,#ffffff 22%,#a78bfa 36%," +
               "#60a5fa 50%,#ffffff 62%,#818cf8 76%,#4f46e5 88%,#4f46e5 100%)",
        light: "linear-gradient(100deg,#312e81 0%,#4f46e5 12%,#0b1330 22%,#6d28d9 36%," +
               "#1d4ed8 50%,#0b1330 62%,#4f46e5 76%,#312e81 88%,#312e81 100%)"
    };

    // The gradient repeats over a fraction of the name, so more than one
    // Highlight is travelling across it at any moment
    var FLOW_PERIOD = 0.72;

    function clipSupported() {
        return !!(window.CSS && CSS.supports &&
            (CSS.supports("-webkit-background-clip", "text") || CSS.supports("background-clip", "text")));
    }

    function paintFlow() {
        if (!accent || !clipSupported()) return;

        var chars = accent.querySelectorAll(".char");
        if (!chars.length) return;

        var box = accent.getBoundingClientRect();
        var period = Math.max(Math.round(box.width * FLOW_PERIOD), 1);
        var grad = GRADIENTS[isLight() ? "light" : "dark"];

        for (var i = 0; i < chars.length; i++) {
            var x = Math.round(chars[i].getBoundingClientRect().left - box.left);
            chars[i].style.backgroundImage = grad;
            chars[i].style.backgroundSize = period + "px 100%";
            chars[i].style.setProperty("--bx", -x + "px");
            chars[i].style.setProperty("--bw", period + "px");
        }
        // Only now is it safe to make the glyphs transparent
        accent.classList.add("is-flowing");
    }

    paintFlow();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintFlow);
    themeBtn.addEventListener("click", paintFlow);

    var flowTimer;
    window.addEventListener("resize", function () {
        clearTimeout(flowTimer);
        flowTimer = setTimeout(paintFlow, 200);
    });

    /* The story — four chapters, told as a constellation */
    var chapters = [
        {
            name: "Curiosity",
            text: "It started with one question I could not put down: how does any of this " +
                  "actually work? I have been chasing that answer ever since.",
            x: 8, y: 22, pos: "top"
        },
        {
            name: "Learning",
            text: "I learn by building, breaking and rebuilding. No shortcuts — which is why " +
                  "the fundamentals stuck instead of just the syntax.",
            x: 92, y: 16, pos: "top"
        },
        {
            name: "Struggle",
            text: "I do not leave a problem half-understood. The bugs that cost me a week " +
                  "taught me more than the features that took an hour.",
            x: 94, y: 74, pos: "bottom"
        },
        {
            name: "Today",
            text: "Today I ship production software end to end — and still open every project " +
                  "asking the same question I started with.",
            x: 10, y: 86, pos: "bottom"
        }
    ];

    var story = document.querySelector(".story");
    var storyNo = document.getElementById("storyNo");
    var storyName = document.getElementById("storyName");
    var storyText = document.getElementById("storyText");
    var storyDots = document.getElementById("storyDots");
    var nodesWrap = document.getElementById("nodes");

    var nodeEls = [];
    var dotEls = [];
    var current = 0;
    var cycle = null;

    chapters.forEach(function (ch, i) {
        // Constellation node
        var node = document.createElement("button");
        node.type = "button";
        node.className = "node node--" + ch.pos;
        node.style.left = ch.x + "%";
        node.style.top = ch.y + "%";
        node.setAttribute("aria-label", "Chapter " + (i + 1) + ": " + ch.name);
        node.innerHTML = '<span class="node__dot"></span><span class="node__label">' + ch.name + "</span>";
        node.addEventListener("click", function () { show(i, true); });
        nodesWrap.appendChild(node);
        nodeEls.push(node);

        // Progress dot
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Chapter " + (i + 1) + ": " + ch.name);
        dot.addEventListener("click", function () { show(i, true); });
        storyDots.appendChild(dot);
        dotEls.push(dot);
    });

    function paint(i) {
        var ch = chapters[i];
        storyNo.textContent = "0" + (i + 1);
        storyName.textContent = ch.name;
        storyText.textContent = ch.text;
        story.style.setProperty("--chapter", i);

        nodeEls.forEach(function (n, k) { n.classList.toggle("is-on", k === i); });
        dotEls.forEach(function (d, k) {
            d.classList.toggle("is-on", k === i);
            d.setAttribute("aria-selected", String(k === i));
        });
    }

    function show(i, manual) {
        if (i === current && !manual) return;
        current = i;

        if (reduced) { paint(i); } else {
            story.classList.add("is-swapping");
            setTimeout(function () {
                paint(i);
                story.classList.remove("is-swapping");
            }, 340);
        }

        if (manual) restart();
    }

    function restart() {
        clearInterval(cycle);
        if (reduced) return;
        cycle = setInterval(function () {
            show((current + 1) % chapters.length);
        }, 5200);
    }

    function startStory() {
        paint(0);
        restart();
    }
    paint(0);

    /* Split headings into words so each can rise out from behind a mask */
    document.querySelectorAll("[data-words]").forEach(function (el) {
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = "";

        words.forEach(function (word, i) {
            var outer = document.createElement("span");
            outer.className = "word";

            var inner = document.createElement("span");
            inner.className = "word__in";
            inner.style.setProperty("--wi", i);
            inner.textContent = word;

            outer.appendChild(inner);
            el.appendChild(outer);
            if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
        });
    });


    /* Scroll reveals — elements fade up the first time they enter view */
    var revealEls = document.querySelectorAll("[data-reveal]");

    function revealAll() {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }

    if (revealEls.length) {
        if (reduced || !("IntersectionObserver" in window)) {
            revealAll();
        } else {
            var revealObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-in");
                    revealObs.unobserve(entry.target);   // play once, not on every pass
                });
            }, { threshold: .15, rootMargin: "0px 0px -6% 0px" });

            revealEls.forEach(function (el) { revealObs.observe(el); });

            // Safety net: if nothing has been revealed a few seconds in, the
            // observer never fired — show the content rather than hide it.
            setTimeout(function () {
                if (!document.querySelector("[data-reveal].is-in")) revealAll();
            }, 3000);
        }
    }


    /* Education timeline — the rail fills as you scroll and each milestone
       lights up as the line reaches it, so the section reads like a story
       being told rather than a list that is simply there. */
    var timeline = document.querySelector(".timeline");

    if (timeline) {
        var milestones = Array.prototype.slice.call(timeline.querySelectorAll(".tl"));
        var progress = timeline.querySelector(".timeline__progress");

        function litAll() {
            milestones.forEach(function (li) { li.classList.add("is-lit"); });
            if (progress) progress.style.height = "100%";
        }

        if (reduced) {
            litAll();
        } else {
            var queued = false;

            function drawTimeline() {
                queued = false;

                var vh = window.innerHeight;
                var y = window.scrollY;
                var docMax = Math.max(document.documentElement.scrollHeight - vh, 0);

                var rect = timeline.getBoundingClientRect();
                var absTop = rect.top + y;
                var height = rect.height || 1;

                // Where the rail starts and finishes filling, as scroll positions.
                // The finish is clamped to the furthest the page can actually
                // scroll — otherwise the last milestone sits too close to the
                // bottom to ever be reached, and never appears at all.
                var startY = absTop - vh * 0.85;
                var endY = Math.min(absTop + height - vh * 0.45, docMax);
                if (endY <= startY) endY = startY + 1;

                var pct = (y - startY) / (endY - startY);
                if (pct < 0) pct = 0;
                if (pct > 1) pct = 1;
                if (y >= docMax - 2) pct = 1;      // at the end of the page the story is fully told

                progress.style.height = (pct * 100).toFixed(2) + "%";

                milestones.forEach(function (li) {
                    // measured from the item itself, not its dot — the dot is
                    // hidden on narrow screens and would report no position
                    var mid = li.getBoundingClientRect().top + y + li.offsetHeight * 0.35;
                    var ratio = (mid - absTop) / height;
                    // once lit it stays lit — a story does not un-tell itself
                    if (pct >= ratio * 0.95) li.classList.add("is-lit");
                });
            }

            function queueDraw() {
                if (queued) return;
                queued = true;
                requestAnimationFrame(drawTimeline);
            }

            window.addEventListener("scroll", queueDraw, { passive: true });
            window.addEventListener("resize", queueDraw);
            drawTimeline();

            // Safety net, same reasoning as the scroll reveals
            setTimeout(function () {
                if (!timeline.querySelector(".tl.is-lit") && timeline.getBoundingClientRect().top < window.innerHeight) litAll();
            }, 3000);
        }
    }


    /* Count-up figures */
    function countUp(el) {
        var target = parseFloat(el.dataset.count);
        var decimals = (el.dataset.count.split(".")[1] || "").length;
        var started = null;
        var duration = 1400;

        function step(now) {
            if (started === null) started = now;
            var p = Math.min((now - started) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);          // ease-out, settles gently
            el.textContent = (target * eased).toFixed(decimals);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    var counters = document.querySelectorAll("[data-count]");

    if (counters.length) {
        if (reduced) {
            counters.forEach(function (el) { el.textContent = el.dataset.count; });
        } else {
            var countObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    countUp(entry.target);
                    countObs.unobserve(entry.target);
                });
            }, { threshold: .6 });

            counters.forEach(function (el) { countObs.observe(el); });
        }
    }


    /* Skills — the technologies orbit a core on the right, and whichever one
       is in focus is read out on the left. Positions are computed here rather
       than in CSS so every logo stays upright as it travels, and so the ones
       sweeping across the front can come forward over the ones behind. */
    var solar = document.getElementById("solar");

    if (solar) {
        var focusUse = document.getElementById("focusUse");
        var focusLogo = document.getElementById("focusLogo");
        var focusName = document.getElementById("focusName");
        var focusCat = document.getElementById("focusCat");
        var focusExp = document.getElementById("focusExp");
        var focusDots = document.getElementById("focusDots");
        var focusPanel = document.querySelector(".focus");

        // radius as a fraction of the stage, and how fast each ring travels
        var RINGS = [
            { r: 0.24, speed: 0.000074 },
            { r: 0.34, speed: 0.000055 },
            { r: 0.44, speed: 0.000041 }
        ];
        var TILT = 0.42;          // flattens the circle into a viewed-from-above ellipse

        var sats = Array.prototype.slice.call(solar.querySelectorAll(".sat")).map(function (el) {
            return {
                el: el,
                ring: RINGS[parseInt(el.dataset.ring, 10)] || RINGS[0],
                base: parseFloat(el.dataset.angle) * Math.PI / 180
            };
        });

        var beam = document.getElementById("solarBeam");
        var filters = Array.prototype.slice.call(document.querySelectorAll(".skills .filter"));

        var inFocus = 0;
        var focusTimer = null;
        var held = false;
        var activeCat = "all";

        function inCategory(i) {
            return activeCat === "all" || sats[i].el.dataset.cat === activeCat;
        }

        // the indices the rotation is allowed to visit under the current filter
        function pool() {
            var out = [];
            for (var i = 0; i < sats.length; i++) if (inCategory(i)) out.push(i);
            return out.length ? out : [0];
        }

        function nextInPool(from) {
            var list = pool();
            for (var k = 0; k < list.length; k++) if (list[k] > from) return list[k];
            return list[0];
        }

        function paintFocus(i) {
            var el = sats[i].el;

            var acc = el.style.getPropertyValue("--acc") || "#818cf8";
            focusPanel.style.setProperty("--acc", acc);
            solar.style.setProperty("--acc", acc);
            focusUse.setAttribute("href", "#" + el.dataset.icon);
            focusName.textContent = el.dataset.name;
            focusCat.textContent = el.dataset.cat;
            focusExp.textContent = el.dataset.exp;

            sats.forEach(function (s2, k) { s2.el.classList.toggle("is-focus", k === i); });
            Array.prototype.forEach.call(focusDots.children, function (d, k) {
                d.classList.toggle("is-on", k === i);
                d.setAttribute("aria-selected", String(k === i));
            });
        }

        function setFocus(i, manual) {
            inFocus = (i + sats.length) % sats.length;

            if (reduced) {
                paintFocus(inFocus);
            } else {
                focusLogo.classList.add("is-swapping");
                focusExp.classList.add("is-swapping");
                setTimeout(function () {
                    paintFocus(inFocus);
                    focusLogo.classList.remove("is-swapping");
                    focusExp.classList.remove("is-swapping");
                }, 230);
            }
            if (manual) restartFocus();
        }

        function restartFocus() {
            clearInterval(focusTimer);
            if (reduced) return;
            focusTimer = setInterval(function () {
                if (!held) setFocus(nextInPool(inFocus));
            }, 3600);
        }

        filters.forEach(function (btn) {
            btn.addEventListener("click", function () {
                activeCat = btn.dataset.cat;

                filters.forEach(function (b) {
                    var on = b === btn;
                    b.classList.toggle("is-on", on);
                    b.setAttribute("aria-selected", String(on));
                });

                sats.forEach(function (s2, k) { s2.el.classList.toggle("is-dim", !inCategory(k)); });
                Array.prototype.forEach.call(focusDots.children, function (d, k) {
                    d.hidden = !inCategory(k);
                });

                if (!inCategory(inFocus)) setFocus(pool()[0], true);
                else restartFocus();
            });
        });

        sats.forEach(function (s2, i) {
            var dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", s2.el.dataset.name);
            dot.addEventListener("click", function () { setFocus(i, true); });
            focusDots.appendChild(dot);

            s2.el.addEventListener("click", function () { setFocus(i, true); });
            s2.el.addEventListener("mouseenter", function () { setFocus(i, true); });
            s2.el.addEventListener("focus", function () { setFocus(i, true); });
        });

        // hold the system still while someone is reaching for a logo
        solar.addEventListener("mouseenter", function () { held = true; });
        solar.addEventListener("mouseleave", function () { held = false; });
        focusPanel.addEventListener("mouseenter", function () { held = true; });
        focusPanel.addEventListener("mouseleave", function () { held = false; });

        var stage = solar.clientWidth || 420;

        // Each satellite flies out from the core when the section first arrives,
        // one after another, then settles into its orbit.
        var INTRO_STEP = 70;     // ms between satellites
        var INTRO_RUN = 900;     // ms for one to travel out

        function introEase(i, introT) {
            if (introT < 0) return 0;
            var t = (introT - i * INTRO_STEP) / INTRO_RUN;
            if (t <= 0) return 0;
            if (t >= 1) return 1;
            return 1 - Math.pow(1 - t, 3);
        }

        function place(elapsed, introT) {
            var size = stage;
            var bx = 50, by = 50;

            sats.forEach(function (s2, i) {
                var a = s2.base + elapsed * s2.ring.speed;
                var out = introT === undefined ? 1 : introEase(i, introT);

                var x = Math.cos(a) * s2.ring.r * size * out;
                var y = Math.sin(a) * s2.ring.r * size * TILT * out;

                // 0 at the back of the sweep, 1 at the front
                var depth = (Math.sin(a) + 1) / 2;
                var scale = (0.74 + depth * 0.26) * (0.25 + out * 0.75);
                if (i === inFocus) scale *= 1.22;

                var dim = s2.el.classList.contains("is-dim");
                var alpha = i === inFocus ? 1 : (0.6 + depth * 0.4) * (dim ? 0.35 : 1);

                s2.el.style.transform =
                    "translate(-50%, -50%) translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)" +
                    " scale(" + scale.toFixed(3) + ")";
                s2.el.style.zIndex = String(Math.round(depth * 10) + (i === inFocus ? 20 : 1));
                s2.el.style.opacity = (alpha * out).toFixed(2);

                if (i === inFocus) {
                    bx = 50 + (x / size) * 100;
                    by = 50 + (y / size) * 100;
                }
            });

            if (beam) {
                beam.setAttribute("x2", bx.toFixed(2));
                beam.setAttribute("y2", by.toFixed(2));
            }
        }

        if (reduced) {
            place(0);
        } else {
            var clock = 0;
            var last = 0;
            var introT = -1;        // negative until the section is actually seen

            // hold the satellites in the core until the section comes into view,
            // so the entrance is not wasted above the fold
            if ("IntersectionObserver" in window) {
                var introObs = new IntersectionObserver(function (entries) {
                    if (!entries[0].isIntersecting) return;
                    if (introT < 0) introT = 0;
                    introObs.disconnect();
                }, { threshold: .25 });
                introObs.observe(solar);
                setTimeout(function () { if (introT < 0) introT = 0; }, 4000);
            } else {
                introT = 0;
            }

            (function spinOrbit(now) {
                if (!last) last = now;
                var dt = now - last;
                last = now;

                if (!held) clock += dt;             // freezing the clock freezes the system
                if (introT >= 0) introT += dt;

                place(clock, introT);
                requestAnimationFrame(spinOrbit);
            })(0);
        }

        paintFocus(0);
        restartFocus();

        var solarResize;
        window.addEventListener("resize", function () {
            clearTimeout(solarResize);
            solarResize = setTimeout(function () {
                stage = solar.clientWidth || 420;
                if (reduced) place(0);     // otherwise the next frame picks it up
            }, 160);
        });
    }


    /* Skills — a light that follows the pointer across the section */
    var skillsSection = document.querySelector(".skills");

    if (skillsSection && !reduced && window.matchMedia("(pointer: fine)").matches) {
        var spotQueued = false;
        var lastEvent = null;

        skillsSection.addEventListener("mousemove", function (e) {
            lastEvent = e;
            if (spotQueued) return;
            spotQueued = true;

            requestAnimationFrame(function () {
                spotQueued = false;
                var box = skillsSection.getBoundingClientRect();
                skillsSection.style.setProperty("--mx", (lastEvent.clientX - box.left) + "px");
                skillsSection.style.setProperty("--my", (lastEvent.clientY - box.top) + "px");
            });
        });
    }


    /* Projects — filter the grid, and open a card in the detail sheet */
    var projGrid = document.getElementById("projGrid");
    var sheet = document.getElementById("sheet");

    if (projGrid && sheet) {
        var sheetBody = document.getElementById("sheetBody");
        var sheetLinks = document.getElementById("sheetLinks");
        var projects = Array.prototype.slice.call(projGrid.querySelectorAll(".proj"));
        var projFilters = Array.prototype.slice.call(document.querySelectorAll(".projects .filter"));
        var lastOpener = null;

        /* Filtering */
        projFilters.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var cat = btn.dataset.cat;

                projFilters.forEach(function (b) {
                    var on = b === btn;
                    b.classList.toggle("is-on", on);
                    b.setAttribute("aria-selected", String(on));
                });

                projects.forEach(function (card) {
                    card.classList.toggle("is-hidden", cat !== "all" && card.dataset.cat !== cat);
                });
            });
        });

        /* The sheet */
        function linkButton(href, label, primary) {
            var a = document.createElement("a");
            a.className = "btn " + (primary ? "btn--primary" : "btn--ghost");
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener";
            a.innerHTML = "<span>" + label + "</span>";
            return a;
        }

        function openSheet(card) {
            var detail = card.querySelector(".proj__detail");
            sheetBody.innerHTML = "";

            // carry the card's cover into the sheet, so the thing clicked and the
            // panel that opens are visibly the same project. A real screenshot
            // comes along with it, since the <img> lives inside the cover.
            var cover = card.querySelector(".proj__cover");
            if (cover) {
                var frame = document.createElement("div");
                frame.className = "sheet__cover";
                frame.setAttribute("aria-hidden", "true");
                frame.appendChild(cover.cloneNode(true));
                sheetBody.appendChild(frame);
            }

            sheetBody.appendChild(detail.content.cloneNode(true));

            // the heading has to carry the id the dialog is labelled by
            var title = sheetBody.querySelector(".sheet__name");
            if (title) title.id = "sheetTitle";

            // Both buttons always show. Without a demo URL the first one renders
            // as a plain disabled control rather than a link that goes nowhere.
            sheetLinks.innerHTML = "";

            if (card.dataset.demo) {
                sheetLinks.appendChild(linkButton(card.dataset.demo, "Live Demo", true));
            } else {
                var off = document.createElement("button");
                off.type = "button";
                off.className = "btn btn--off";
                off.disabled = true;
                off.innerHTML = "<span>Live Demo</span>";
                off.title = "Not deployed yet";
                sheetLinks.appendChild(off);
            }

            if (card.dataset.repo) sheetLinks.appendChild(linkButton(card.dataset.repo, "View Code", false));

            lastOpener = card.querySelector(".proj__open");
            sheet.hidden = false;
            scrollLock.on();
            requestAnimationFrame(function () { sheet.classList.add("is-open"); });
            sheet.querySelector(".sheet__close").focus();
        }

        function closeSheet() {
            sheet.classList.remove("is-open");
            scrollLock.off();
            setTimeout(function () {
                sheet.hidden = true;
                sheetBody.innerHTML = "";
                if (lastOpener) lastOpener.focus();   // put focus back where it came from
            }, 320);
        }

        projects.forEach(function (card) {
            var opener = card.querySelector(".proj__open");
            opener.addEventListener("click", function () { openSheet(card); });

            // the light layer is decorative, so it is added here rather than
            // repeated twelve times in the markup
            var glow = document.createElement("span");
            glow.className = "proj__glow";
            glow.setAttribute("aria-hidden", "true");
            opener.appendChild(glow);

            // A screenshot replaces the placeholder number. CSS `:has()` already
            // covers this; the class is the fallback for browsers without it.
            var cover = card.querySelector(".proj__cover");
            var shot = cover && cover.querySelector("img");
            if (!shot) return;

            cover.classList.add("has-shot");
            shot.addEventListener("error", function () {
                // a missing file must not leave an empty cover behind
                cover.classList.remove("has-shot");
                shot.remove();
            });
        });


        /* One delegated listener for all twelve cards, throttled to a frame */
        if (!reduced && window.matchMedia("(pointer: fine)").matches) {
            var tiltCard = null;
            var tiltEvent = null;
            var tiltQueued = false;
            var MAX_TILT = 5;          // degrees; enough to read as depth, not as a toy

            projGrid.addEventListener("mousemove", function (e) {
                var opener = e.target.closest(".proj__open");
                if (!opener) return;

                tiltCard = opener;
                tiltEvent = e;
                if (tiltQueued) return;
                tiltQueued = true;

                requestAnimationFrame(function () {
                    tiltQueued = false;
                    if (!tiltCard || !tiltEvent) return;

                    var box = tiltCard.getBoundingClientRect();
                    var px = (tiltEvent.clientX - box.left) / box.width;
                    var py = (tiltEvent.clientY - box.top) / box.height;

                    tiltCard.style.setProperty("--ry", ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
                    tiltCard.style.setProperty("--rx", ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + "deg");
                    tiltCard.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
                    tiltCard.style.setProperty("--my", (py * 100).toFixed(1) + "%");
                });
            });

            projGrid.addEventListener("mouseout", function (e) {
                var opener = e.target.closest(".proj__open");
                if (!opener || opener.contains(e.relatedTarget)) return;
                opener.style.setProperty("--rx", "0deg");
                opener.style.setProperty("--ry", "0deg");
            });
        }

        sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
            el.addEventListener("click", closeSheet);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !sheet.hidden) closeSheet();
        });

        // keep tabbing inside the sheet while it is open
        sheet.addEventListener("keydown", function (e) {
            if (e.key !== "Tab") return;
            var focusable = sheet.querySelectorAll("button, a[href]");
            if (!focusable.length) return;

            var first = focusable[0];
            var last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }


    /* Achievements - the medal tilts towards the pointer and a glare follows
       it across the glass, like turning a medal in the light. The card's glow
       follows the pointer too. */
    if (pointerFx) {
        document.querySelectorAll(".award__card").forEach(function (card) {
            var coin = card.querySelector(".award__coin");
            var inside = false;
            var queued = false;
            var last = null;
            if (!coin) return;

            card.addEventListener("pointermove", function (e) {
                inside = true;
                last = e;
                if (queued) return;
                queued = true;

                requestAnimationFrame(function () {
                    queued = false;
                    if (!inside || !last) return;

                    var box = card.getBoundingClientRect();
                    var px = (last.clientX - box.left) / box.width;
                    var py = (last.clientY - box.top) / box.height;

                    card.style.setProperty("--mx", (last.clientX - box.left).toFixed(0) + "px");
                    card.style.setProperty("--my", (last.clientY - box.top).toFixed(0) + "px");
                    coin.style.setProperty("--ry", ((px - 0.5) * 28).toFixed(2) + "deg");
                    coin.style.setProperty("--rx", ((0.5 - py) * 22).toFixed(2) + "deg");
                    coin.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
                    coin.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
                });
            });

            card.addEventListener("pointerleave", function () {
                inside = false;
                card.style.removeProperty("--mx");
                card.style.removeProperty("--my");
                coin.style.setProperty("--rx", "0deg");
                coin.style.setProperty("--ry", "0deg");
            });
        });
    }


    /* Activities - a soft light follows the pointer across each role card */
    var clubsGrid = document.querySelector(".clubs");

    if (clubsGrid && pointerFx) {
        clubsGrid.addEventListener("pointermove", function (e) {
            var card = e.target.closest(".club__card");
            if (!card) return;
            var box = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - box.left).toFixed(0) + "px");
            card.style.setProperty("--my", (e.clientY - box.top).toFixed(0) + "px");
        }, { passive: true });
    }


    /* Contact — live local time in Dhaka, so the clock is right whoever is
       reading and wherever they are. */
    var clockEl = document.getElementById("localTime");

    if (clockEl) {
        var fmt;
        try {
            fmt = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", hour12: true
            });
        } catch (e) { fmt = null; }   // no zone data: leave the placeholder alone

        if (fmt) {
            (function tickClock() {
                clockEl.textContent = fmt.format(new Date());
                setTimeout(tickClock, 20000);
            })();
        }
    }


    /* Contact — copy the address rather than make people select it */
    var copyBtn = document.getElementById("copyMail");
    var mailValue = document.getElementById("mailValue");

    if (copyBtn && mailValue) {
        copyBtn.addEventListener("click", function () {
            var address = mailValue.textContent.trim();

            function confirmCopy() {
                copyBtn.classList.add("is-done");
                copyBtn.setAttribute("aria-label", "Email address copied");
                setTimeout(function () {
                    copyBtn.classList.remove("is-done");
                    copyBtn.setAttribute("aria-label", "Copy email address");
                }, 2000);
            }

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(address).then(confirmCopy, fallbackCopy);
            } else {
                fallbackCopy();
            }

            // older browsers, and any page not served over https
            function fallbackCopy() {
                var tmp = document.createElement("textarea");
                tmp.value = address;
                tmp.setAttribute("readonly", "");
                tmp.style.position = "fixed";
                tmp.style.opacity = "0";
                document.body.appendChild(tmp);
                tmp.select();
                try { document.execCommand("copy"); confirmCopy(); } catch (e) { /* give up quietly */ }
                document.body.removeChild(tmp);
            }
        });
    }


    /* Contact — deliver the message straight to the inbox.
       Web3Forms posts the form to its API and forwards it by email, so a static
       page needs no server of its own. Paste the access key below (free, from
       web3forms.com, no account needed) and the form starts delivering.
       Until then it falls back to composing the mail locally, so the button
       never does nothing. */
    var FORM_KEY = "";                                   // <-- your Web3Forms access key
    var FORM_API = "https://api.web3forms.com/submit";

    var form = document.getElementById("contactForm");

    if (form) {
        var sendBtn = document.getElementById("sendBtn");
        var sendText = form.querySelector(".note__send-text");
        var hint = document.getElementById("formHint");
        var hintDefault = hint.textContent;

        var msgField = document.getElementById("cBody");
        var count = document.getElementById("cCount");
        var MAX = 1000;

        msgField.addEventListener("input", function () {
            if (msgField.value.length > MAX) msgField.value = msgField.value.slice(0, MAX);
            count.textContent = msgField.value.length;
        });

        function fieldOf(input) { return input.closest(".field"); }

        function complain(input, message) {
            var wrap = fieldOf(input);
            wrap.classList.add("is-bad");
            var slot = wrap.querySelector(".field__error");
            if (slot) slot.textContent = message;
        }

        function clear(input) {
            var wrap = fieldOf(input);
            wrap.classList.remove("is-bad");
            var slot = wrap.querySelector(".field__error");
            if (slot) slot.textContent = "";
        }

        function checkField(input) {
            var v = input.value.trim();

            if (input.required && !v) {
                complain(input, "This one is needed.");
                return false;
            }
            if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
                complain(input, "That does not look like an email address.");
                return false;
            }
            if (input === msgField && v.length < 10) {
                complain(input, "A little more detail would help.");
                return false;
            }
            clear(input);
            return true;
        }

        var checked = [
            document.getElementById("cName"),
            document.getElementById("cMail"),
            msgField
        ];

        checked.forEach(function (input) {
            input.addEventListener("blur", function () { if (input.value.trim()) checkField(input); });
            input.addEventListener("input", function () { if (fieldOf(input).classList.contains("is-bad")) checkField(input); });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var ok = true;
            checked.forEach(function (input) { if (!checkField(input)) ok = false; });

            if (!ok) {
                hint.textContent = "Nearly \u2014 a couple of fields need a look.";
                hint.classList.remove("is-good");
                checked.some(function (input) {
                    if (fieldOf(input).classList.contains("is-bad")) { input.focus(); return true; }
                    return false;
                });
                return;
            }

            var name = document.getElementById("cName").value.trim();
            var from = document.getElementById("cMail").value.trim();
            var subj = document.getElementById("cSubject").value.trim() || ("Portfolio enquiry from " + name);
            var text = msgField.value.trim();

            function resetSoon(ms) {
                setTimeout(function () {
                    sendBtn.classList.remove("is-done");
                    sendText.textContent = "Send message";
                    hint.textContent = hintDefault;
                    hint.classList.remove("is-good", "is-bad");
                }, ms);
            }

            function succeeded() {
                sendBtn.disabled = false;
                sendBtn.classList.add("is-done");
                sendText.textContent = "Message sent";
                hint.textContent = "Thank you \u2014 your message is in my inbox. I will reply to " + from + ".";
                hint.classList.add("is-good");
                form.reset();
                count.textContent = "0";
                resetSoon(8000);
            }

            function failed() {
                sendBtn.disabled = false;
                sendText.textContent = "Send message";
                hint.textContent = "That did not go through. You can email me directly at kamrujjamantuhinkt3@gmail.com.";
                hint.classList.add("is-bad");
                resetSoon(9000);
            }

            sendBtn.disabled = true;
            sendText.textContent = "Sending";

            if (!FORM_KEY) {
                // no key configured yet: compose it locally rather than fail silently
                window.location.href = "mailto:kamrujjamantuhinkt3@gmail.com"
                    + "?subject=" + encodeURIComponent(subj)
                    + "&body=" + encodeURIComponent(text + "\n\n\u2014 " + name + "\n" + from);

                setTimeout(function () {
                    sendBtn.disabled = false;
                    sendBtn.classList.add("is-done");
                    sendText.textContent = "Ready to send";
                    hint.textContent = "Your message is waiting in your email app \u2014 press send there and it reaches me.";
                    hint.classList.add("is-good");
                    resetSoon(7000);
                }, 900);
                return;
            }

            fetch(FORM_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    access_key: FORM_KEY,
                    subject: subj,
                    name: name,
                    email: from,
                    message: text,
                    from_name: "Portfolio contact form"
                })
            })
                .then(function (res) { return res.json(); })
                .then(function (data) { if (data && data.success) succeeded(); else failed(); })
                .catch(failed);
        });
    }


    /* CV buttons — check the file is actually there before offering it, so a
       recruiter never clicks through to a 404. Skipped on file:// where a
       fetch would fail for reasons that say nothing about the file. */
    var cvButtons = [document.getElementById("cvHero"), document.getElementById("cvContact")]
        .filter(Boolean);

    if (cvButtons.length && /^https?:$/.test(window.location.protocol)) {
        fetch(cvButtons[0].getAttribute("href"), { method: "HEAD" })
            .then(function (res) {
                if (res.ok) return;
                markMissing();
            })
            .catch(markMissing);
    }

    function markMissing() {
        cvButtons.forEach(function (btn) {
            btn.classList.add("is-missing");
            btn.removeAttribute("href");
            btn.removeAttribute("download");
            btn.setAttribute("role", "button");
            btn.setAttribute("aria-disabled", "true");
            btn.title = "CV will be available shortly";
        });
    }


    /* Footer year, so it never goes stale */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());


    /* Showreel — decorative footage, so it only plays when it is actually on
       screen, and not at all for anyone who has asked for less motion. */
    var reel = document.querySelector(".reel__video");

    if (reel) {
        reel.muted = true;          // some browsers need this set in script too

        if (reduced) {
            reel.removeAttribute("autoplay");
            reel.pause();
        } else if ("IntersectionObserver" in window) {
            var reelObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var playing = reel.play();
                        // autoplay can still be refused; the tinted band stands on its own
                        if (playing && playing.catch) playing.catch(function () {});
                    } else {
                        reel.pause();
                    }
                });
            }, { threshold: .15 });

            reelObs.observe(reel);
        }
    }


    /* Experience — accordion. Heights are measured rather than guessed, so a
       row animates smoothly whatever length its content turns out to be. */
    var xps = Array.prototype.slice.call(document.querySelectorAll(".xp"));

    if (xps.length) {
        function setOpen(xp, open) {
            var panel = xp.querySelector(".xp__panel");
            var toggle = xp.querySelector(".xp__toggle");

            xp.classList.toggle("is-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            panel.style.maxHeight = open ? panel.scrollHeight + "px" : "";
        }

        xps.forEach(function (xp) {
            var toggle = xp.querySelector(".xp__toggle");

            // the first row ships open, so the section never looks empty
            if (toggle.getAttribute("aria-expanded") === "true") setOpen(xp, true);

            toggle.addEventListener("click", function () {
                var willOpen = !xp.classList.contains("is-open");
                xps.forEach(function (other) { if (other !== xp) setOpen(other, false); });
                setOpen(xp, willOpen);
            });
        });

        // a reflow (fonts loading, window resizing) changes how tall the text is
        function remeasure() {
            xps.forEach(function (xp) {
                if (!xp.classList.contains("is-open")) return;
                var panel = xp.querySelector(".xp__panel");
                panel.style.maxHeight = panel.scrollHeight + "px";
            });
        }

        var xpResize;
        window.addEventListener("resize", function () {
            clearTimeout(xpResize);
            xpResize = setTimeout(remeasure, 150);
        });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    }


    /* Navbar */
    var nav = document.getElementById("nav");
    var bar = document.getElementById("scrollProgress");

    function onScroll() {
        var y = window.scrollY;
        nav.classList.toggle("is-stuck", y > 24);

        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Sliding pill behind the active link */
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    var pill = document.getElementById("navPill");

    function movePill(el) {
        if (!el) { pill.style.opacity = "0"; return; }
        pill.style.opacity = "1";
        pill.style.width = el.offsetWidth + "px";
        pill.style.transform = "translateX(" + el.offsetLeft + "px)";
    }
    function activeLink() { return document.querySelector(".nav__link.is-active"); }

    links.forEach(function (link) {
        link.addEventListener("mouseenter", function () { movePill(link); });
    });
    document.getElementById("navLinks").addEventListener("mouseleave", function () {
        movePill(activeLink());
    });

    /* Scrollspy */
    var sections = links
        .map(function (l) { return document.querySelector(l.getAttribute("href")); })
        .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (l) {
                l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id);
            });
            movePill(activeLink());
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (sec) { spy.observe(sec); });

    window.addEventListener("load", function () { movePill(activeLink()); });
    window.addEventListener("resize", function () { movePill(activeLink()); });

    /* Mobile Menu */
    var burger = document.getElementById("burger");
    var menu = document.getElementById("mobileMenu");
    var scrim = document.getElementById("scrim");

    function setMenu(open) {
        burger.classList.toggle("is-open", open);
        menu.classList.toggle("is-open", open);
        scrim.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        menu.setAttribute("aria-hidden", String(!open));
        if (open) scrollLock.on();
        else scrollLock.off();
    }

    burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
    scrim.addEventListener("click", function () { setMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });
})();
