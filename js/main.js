/* Kamrujjaman Tuhin — Portfolio interactions */
(function () {
    "use strict";

    var root = document.documentElement;
    var body = document.body;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    window.addEventListener("load", function () { pageLoaded = true; });

    function finish() {
        if (finished) return;
        finished = true;

        preBar.style.width = "100%";
        prePct.textContent = "100";

        setTimeout(function () {
            preloader.classList.add("is-done");
            body.classList.remove("is-loading");
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
    setTimeout(function () { clearInterval(timer); finish(); }, 5000);

    /* Starfield */
    var canvas = document.getElementById("stars");

    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d");
        var stars = [];
        var shooting = null;
        var w = 0, h = 0, dpr = 1;

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

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = s.a;

                if (!reduced) {
                    s.tw += s.ts;
                    alpha = s.a * (0.55 + 0.45 * Math.sin(s.tw));
                    s.y -= s.sp;                       // slow upward drift
                    if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(" + (s.r > 1.05 ? accent : rgb) + "," + alpha.toFixed(3) + ")";
                ctx.fill();
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
            text: "One question I could never put down — how does any of this actually work? " +
                  "It cost me a lot of sleep. I have never regretted it.",
            x: 8, y: 22, pos: "top"
        },
        {
            name: "Learning",
            text: "No shortcuts. I broke things, read the docs until they made sense, " +
                  "and rebuilt the same thing until it finally worked.",
            x: 92, y: 16, pos: "top"
        },
        {
            name: "Struggle",
            text: "Some nights the bug won. Some weeks the progress did not show. " +
                  "I kept going, because quitting was the only guaranteed failure.",
            x: 94, y: 74, pos: "bottom"
        },
        {
            name: "Today",
            text: "I still choose the harder path every day — build, break, fix, learn. " +
                  "This place was earned one stubborn day at a time.",
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
        body.style.overflow = open ? "hidden" : "";
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
