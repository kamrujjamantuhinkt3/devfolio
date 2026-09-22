/* Kamrujjaman Tuhin — Portfolio interactions */
(function () {
    "use strict";

    var root = document.documentElement;
    root.classList.add("js");
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


    /* Skills — the featured core cycles through each technology, and any chip
       can take it over. The skill list lives in the markup, so there is one
       source of truth rather than a copy of it in here. */
    var core = document.getElementById("core");

    if (core) {
        var coreUse = document.getElementById("coreUse");
        var coreLogo = document.getElementById("coreLogo");
        var coreName = document.getElementById("coreName");
        var coreRole = document.getElementById("coreRole");
        var coreDots = document.getElementById("coreDots");

        // only the first copy of each marquee row — the duplicate is decorative
        var techs = Array.prototype.slice.call(
            document.querySelectorAll('.tech:not([aria-hidden="true"])'));

        var focused = 0;
        var coreTimer = null;
        var coreHeld = false;

        function paintCore(i) {
            var el = techs[i];
            if (!el) return;

            core.style.setProperty("--acc", el.style.getPropertyValue("--acc") || "#818cf8");
            coreUse.setAttribute("href", "#" + el.dataset.icon);
            coreName.textContent = el.dataset.name;
            coreRole.textContent = el.dataset.role;

            techs.forEach(function (t, k) { t.classList.toggle("is-focus", k === i); });
            Array.prototype.forEach.call(coreDots.children, function (d, k) {
                d.classList.toggle("is-on", k === i);
                d.setAttribute("aria-selected", String(k === i));
            });
        }

        function focus(i, manual) {
            focused = (i + techs.length) % techs.length;

            if (reduced) {
                paintCore(focused);
            } else {
                coreLogo.classList.add("is-swapping");
                setTimeout(function () {
                    paintCore(focused);
                    coreLogo.classList.remove("is-swapping");
                }, 240);
            }
            if (manual) restartCore();
        }

        function restartCore() {
            clearInterval(coreTimer);
            if (reduced) return;
            coreTimer = setInterval(function () {
                if (!coreHeld) focus(focused + 1);
            }, 2800);
        }

        techs.forEach(function (el, i) {
            var dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", el.dataset.name);
            dot.addEventListener("click", function () { focus(i, true); });
            coreDots.appendChild(dot);

            el.addEventListener("click", function () { focus(i, true); });
            el.addEventListener("mouseenter", function () { focus(i, true); });
        });

        // pause the rotation while someone is reading the panel
        core.addEventListener("mouseenter", function () { coreHeld = true; });
        core.addEventListener("mouseleave", function () { coreHeld = false; });

        paintCore(0);
        restartCore();
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
