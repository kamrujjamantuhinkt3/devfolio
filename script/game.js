/* Kamrujjaman Tuhin — Portfolio game layer
   Quests, XP and levels, hidden star shards, and the Bug Hunt arcade.
   Everything here sits on top of the page: nothing is locked behind it,
   so a visitor who never plays still reads the whole portfolio. */
(function () {
    "use strict";

    var root = document.documentElement;
    var body = document.body;
    var hud = document.getElementById("hud");
    if (!hud) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function $(id) { return document.getElementById(id); }
    function count(obj) { return Object.keys(obj).length; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }


    /* Quests */
    var QUESTS = [
        { id: "launch",  name: "Liftoff",        text: "Scroll past the launch pad.",                        xp: 50,  icon: "rocket" },
        { id: "sectors", name: "Cartographer",   text: "Visit every sector of the page.",                     xp: 150, icon: "map", goal: 9 },
        { id: "skill",   name: "Tech scanner",   text: "Pick a technology in the Skills orbit.",              xp: 50,  icon: "scan" },
        { id: "project", name: "Inspector",      text: "Open the details of a project.",                      xp: 75,  icon: "search" },
        { id: "clubs",   name: "Club hopper",    text: "Read the stories of three clubs.",                    xp: 75,  icon: "flag", goal: 3 },
        { id: "theme",   name: "Day and night",  text: "Switch the colour theme.",                            xp: 40,  icon: "moon" },
        { id: "stars",   name: "Star collector", text: "Find the five star shards hidden around the page.",   xp: 100, icon: "star", goal: 5 },
        { id: "contact", name: "Signal sent",    text: "Copy the email, open a profile or grab the CV.",      xp: 75,  icon: "signal" },
        { id: "arcade",  name: "Bug hunter",     text: "Squash 25 bugs in one game of Bug Hunt.",             xp: 150, icon: "bug", goal: 25 },
        { id: "secret",  name: "Old school",     text: "A classic cheat code works on this page.",            xp: 100, icon: "key", bonus: true }
    ];
    var MAIN = QUESTS.filter(function (q) { return !q.bonus; });
    var QUEST = {};
    QUESTS.forEach(function (q) { QUEST[q.id] = q; });

    // The last title is earned by finishing every main quest, not by XP
    var LEVELS = [
        { xp: 0,   name: "Visitor" },
        { xp: 100, name: "Explorer" },
        { xp: 250, name: "Navigator" },
        { xp: 450, name: "Voyager" },
        { xp: 700, name: "Pathfinder" }
    ];
    var COMMANDER = "Commander";

    var SECTORS = [
        ["home", "Home"], ["about", "About"], ["education", "Education"], ["skills", "Skills"],
        ["projects", "Projects"], ["experience", "Experience"], ["achievements", "Achievements"],
        ["activities", "Activities"], ["contact", "Contact"]
    ];

    // Five shards, tucked into quiet corners of five sections
    var SHARDS = [
        { at: "home",         x: "6%",  low: true },
        { at: "about",        x: "16%", y: "24px" },
        { at: "skills",       x: "8%",  y: "30px" },
        { at: "achievements", x: "30%", y: "20px" },
        { at: "contact",      x: "12%", y: "26px" }
    ];
    var SHARD_XP = 20;

    var ICONS = {
        rocket: '<path d="M14.5 4.5c2.6-1.1 4.6-1.1 5-.7.4.4.4 2.4-.7 5L12.5 15 9 11.5z"/><path d="M9 11.5 5.5 12 4 14l3.5 1M12.5 15l-.5 3.5L10 20l-1-3.5M6.5 17.5c-1 .5-2 2-2 2s1.5-1 2-2"/><circle cx="15" cy="9" r="1.3"/>',
        map: '<path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4zM9 4v13.5M15 6.5V20"/>',
        scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7.5 12h9"/>',
        search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
        flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
        moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>',
        star: '<path d="M12 2.5l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 16.9 6.3 20l1.2-6.4-4.7-4.4 6.4-.8Z"/>',
        signal: '<path d="M4.5 10a11 11 0 0 1 15 0M7.5 13.5a6.5 6.5 0 0 1 9 0M10.5 17a2 2 0 0 1 3 0"/>',
        bug: '<path d="M8 10a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0v-4zM12 10v8M4 13h4M16 13h4M5 8l3 2M19 8l-3 2M5 19l3-2M19 19l-3-2M10 6 9 4M14 6l1-2"/>',
        key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M17 6l2 2M14.5 8.5l2 2"/>',
        check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        level: '<path d="m6 13 6-6 6 6M6 19l6-6 6 6"/>',
        trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4"/>'
    };
    function icon(name) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.star) + "</svg>";
    }


    /* Progress - kept in this browser, so a visitor who comes back carries on */
    var KEY = "kt-game-v1";

    function fresh() {
        return { xp: 0, done: {}, sectors: {}, clubs: {}, shards: {}, best: 0, bestKills: 0,
                 sound: false, briefed: false, started: Date.now(), finished: 0 };
    }
    function load() {
        var s = fresh();
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || "null");
            if (saved && typeof saved === "object") {
                Object.keys(s).forEach(function (k) {
                    if (Object.prototype.hasOwnProperty.call(saved, k)) s[k] = saved[k];
                });
            }
        } catch (e) { /* private mode: progress lasts for this visit */ }
        return s;
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    var state = load();

    function doneCount() { return MAIN.filter(function (q) { return state.done[q.id]; }).length; }

    function progressOf(q) {
        if (q.id === "sectors") return count(state.sectors);
        if (q.id === "clubs") return count(state.clubs);
        if (q.id === "stars") return count(state.shards);
        if (q.id === "arcade") return state.bestKills;
        return state.done[q.id] ? 1 : 0;
    }

    function levelIndex() {
        if (state.finished) return LEVELS.length;
        var at = 0;
        LEVELS.forEach(function (l, i) { if (state.xp >= l.xp) at = i; });
        return at;
    }
    function levelName(i) { return i >= LEVELS.length ? COMMANDER : LEVELS[i].name; }

    // how far through the current level, for the ring and the bar
    function levelProgress() {
        var i = levelIndex();
        if (i >= LEVELS.length) return 1;
        if (i === LEVELS.length - 1) return doneCount() / MAIN.length;
        var from = LEVELS[i].xp, to = LEVELS[i + 1].xp;
        return clamp((state.xp - from) / (to - from), 0, 1);
    }
    function nextLabel() {
        var i = levelIndex();
        if (i >= LEVELS.length) return "Every quest complete";
        if (i === LEVELS.length - 1) return "Finish every quest to become " + COMMANDER;
        return (LEVELS[i + 1].xp - state.xp) + " XP to " + LEVELS[i + 1].name;
    }


    /* Sound - small tones made on the fly, so there are no files to load.
       Off until the visitor turns it on. */
    var sound = (function () {
        var ctx = null;

        function ensure() {
            if (!ctx) {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                ctx = new AC();
            }
            if (ctx.state === "suspended") ctx.resume();
            return ctx;
        }

        function tone(freq, start, dur, type, vol, to) {
            var a = ensure();
            if (!a) return;
            var t0 = a.currentTime + start;
            var osc = a.createOscillator();
            var gain = a.createGain();
            osc.type = type || "sine";
            osc.frequency.setValueAtTime(freq, t0);
            if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
            gain.gain.setValueAtTime(0.0001, t0);
            gain.gain.exponentialRampToValueAtTime(vol || 0.07, t0 + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(gain);
            gain.connect(a.destination);
            osc.start(t0);
            osc.stop(t0 + dur + 0.03);
        }

        var SOUNDS = {
            quest: function () { tone(660, 0, .14, "triangle"); tone(990, .1, .2, "triangle"); },
            shard: function () { tone(1320, 0, .1, "sine", .05); tone(1760, .07, .14, "sine", .045); tone(2350, .14, .22, "sine", .04); },
            level: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * .09, .24, "triangle", .07); }); },
            hit:   function () { tone(240, 0, .09, "square", .03, 90); },
            hurt:  function () { tone(320, 0, .32, "sawtooth", .05, 60); },
            power: function () { tone(500, 0, .1, "triangle", .06, 1000); tone(1000, .1, .18, "triangle", .05); },
            over:  function () { [440, 349, 262].forEach(function (f, i) { tone(f, i * .17, .28, "triangle", .06); }); }
        };

        return {
            play: function (name) {
                if (!state.sound || !SOUNDS[name]) return;
                try { SOUNDS[name](); } catch (e) { /* audio is a nicety */ }
            },
            unlock: ensure
        };
    })();

    var soundBtns = [$("soundToggle"), $("arcadeSound")].filter(Boolean);

    function paintSound() {
        soundBtns.forEach(function (b) {
            b.setAttribute("aria-pressed", String(!!state.sound));
            var label = b.querySelector("[data-sound-label]");
            if (label) label.textContent = state.sound ? "Sound on" : "Sound off";
            b.classList.toggle("is-on", !!state.sound);
        });
    }
    soundBtns.forEach(function (b) {
        b.addEventListener("click", function () {
            state.sound = !state.sound;
            save();
            paintSound();
            if (state.sound) { sound.unlock(); sound.play("quest"); }
        });
    });


    /* Sparks - a burst of little stars from a point on screen */
    function burst(x, y, n, spread) {
        if (reduced) return;
        var colours = ["#ffffff", "#c7d2fe", "#a5b4fc", "#818cf8"];
        for (var i = 0; i < n; i++) {
            var s = document.createElement("span");
            var a = Math.random() * Math.PI * 2;
            var d = (spread || 70) * (0.4 + Math.random() * 0.8);
            s.className = "spark";
            s.style.setProperty("--x0", x + "px");
            s.style.setProperty("--y0", y + "px");
            s.style.setProperty("--x1", (x + Math.cos(a) * d) + "px");
            s.style.setProperty("--y1", (y + Math.sin(a) * d) + "px");
            s.style.setProperty("--s", (5 + Math.random() * 7) + "px");
            s.style.setProperty("--c", colours[i % colours.length]);
            s.style.setProperty("--t", (0.6 + Math.random() * 0.5) + "s");
            body.appendChild(s);
            setTimeout(function (el) { el.remove(); }.bind(null, s), 1200);
        }
    }


    /* Toasts - quest and shard announcements, stacked above the HUD */
    var toastBox = $("toasts");

    function toast(o) {
        if (!toastBox) return;
        var t = document.createElement("div");
        var life = o.life || 3800;
        t.className = "toast" + (o.wide ? " toast--wide" : "");
        t.style.setProperty("--life", life + "ms");
        t.innerHTML =
            '<span class="toast__icon">' + icon(o.icon) + "</span>" +
            '<span class="toast__copy"><span class="toast__kind">' + o.kind + "</span>" +
            '<span class="toast__title">' + o.title + "</span></span>" +
            (o.xp ? '<span class="toast__xp">+' + o.xp + " XP</span>" : "") +
            '<span class="toast__time" aria-hidden="true"></span>';

        if (o.action) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "toast__act";
            b.textContent = o.action.label;
            b.addEventListener("click", function () { dismiss(t); o.action.run(); });
            t.querySelector(".toast__copy").appendChild(b);
        }

        toastBox.appendChild(t);
        while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
        requestAnimationFrame(function () { t.classList.add("is-in"); });
        setTimeout(function () { dismiss(t); }, life);
    }

    function dismiss(t) {
        if (!t.parentNode || t.classList.contains("is-out")) return;
        t.classList.add("is-out");
        setTimeout(function () { t.remove(); }, 450);
    }


    /* HUD - the level ring and XP, bottom right */
    var hudFill = $("hudFill");
    var hudLevel = $("hudLevel");
    var hudTitle = $("hudTitle");
    var hudMeta = $("hudMeta");
    var hudGain = $("hudGain");
    var hudBtn = $("hudBtn");
    var metaTimer = null;

    function metaText() {
        return state.xp + " XP · " + doneCount() + "/" + MAIN.length + " quests";
    }

    function renderHud() {
        var i = levelIndex();
        hudLevel.textContent = i + 1;
        hudTitle.textContent = levelName(i);
        if (!metaTimer) hudMeta.textContent = metaText();
        hudFill.style.strokeDasharray = (levelProgress() * 100).toFixed(1) + " 100";
        hud.classList.toggle("is-max", i >= LEVELS.length);
        hudBtn.setAttribute("aria-label", "Open the quest log. Level " + (i + 1) + ", " + levelName(i) + ", " + metaText());
    }

    // a passing note in the HUD, then back to the XP line
    function flashMeta(text) {
        clearTimeout(metaTimer);
        hudMeta.textContent = text;
        hud.classList.add("is-note");
        metaTimer = setTimeout(function () {
            metaTimer = null;
            hud.classList.remove("is-note");
            hudMeta.textContent = metaText();
        }, 2400);
    }

    function floatXp(n) {
        hudGain.textContent = "+" + n + " XP";
        hudGain.classList.remove("is-on");
        void hudGain.offsetWidth;          // restart the animation
        hudGain.classList.add("is-on");
        hud.classList.remove("is-up");
        void hud.offsetWidth;
        hud.classList.add("is-up");
    }


    /* Levels - a banner when a new title is reached, one at a time */
    var banner = $("levelUp");
    var bannerQueue = [];
    var bannerBusy = false;

    function levelUp(i) {
        bannerQueue.push(i);
        if (!bannerBusy) nextBanner();
    }

    function nextBanner() {
        var i = bannerQueue.shift();
        if (i === undefined || !banner) { bannerBusy = false; return; }
        bannerBusy = true;
        $("levelUpName").textContent = levelName(i);
        $("levelUpNum").textContent = i + 1;
        banner.classList.remove("is-on");
        void banner.offsetWidth;
        banner.classList.add("is-on");
        sound.play("level");
        var r = hud.getBoundingClientRect();
        burst(r.left + 28, r.top + 28, 16, 90);
        setTimeout(function () {
            banner.classList.remove("is-on");
            setTimeout(nextBanner, 250);
        }, 2300);
    }

    function gain(n) {
        var before = levelIndex();
        state.xp += n;
        save();
        floatXp(n);
        renderHud();
        var after = levelIndex();
        if (after > before) levelUp(after);
    }

    function complete(id) {
        var q = QUEST[id];
        if (!q || state.done[id]) return;
        state.done[id] = true;
        save();
        toast({ kind: q.bonus ? "Bonus quest" : "Quest complete", title: q.name, xp: q.xp, icon: q.icon });
        sound.play("quest");
        gain(q.xp);
        renderLog();

        if (!state.finished && doneCount() === MAIN.length) {
            state.finished = Date.now();
            save();
            renderHud();
            renderLog();
            levelUp(LEVELS.length);
            setTimeout(openVictory, 2700);
        }
    }


    /* Quest log */
    var log = $("questLog");
    var logList = $("qlogList");
    var logNodes = $("qlogNodes");

    function renderLog() {
        if (!log) return;
        var i = levelIndex();
        $("qlogLevel").textContent = i + 1;
        $("qlogTitle").textContent = levelName(i);
        $("qlogNext").textContent = nextLabel();
        $("qlogXp").textContent = state.xp + " XP";
        $("qlogBar").style.width = (levelProgress() * 100).toFixed(1) + "%";
        $("qlogCount").textContent = doneCount() + " of " + MAIN.length;
        $("qlogSectors").textContent = count(state.sectors) + " of " + SECTORS.length;
        $("gameReport").hidden = !state.finished;

        logNodes.innerHTML = SECTORS.map(function (s) {
            var on = !!state.sectors[s[0]];
            return '<li><a class="qnode' + (on ? " is-on" : "") + '" href="#' + s[0] + '">' +
                '<span class="qnode__dot" aria-hidden="true"></span>' + s[1] +
                '<span class="sr-only">' + (on ? " (visited)" : " (not visited yet)") + "</span></a></li>";
        }).join("");

        logList.innerHTML = QUESTS.map(function (q) {
            var done = !!state.done[q.id];
            var p = q.goal ? Math.min(progressOf(q), q.goal) : 0;
            var bar = q.goal && !done
                ? '<span class="quest__bar"><i style="width:' + (p / q.goal * 100).toFixed(0) + '%"></i></span>' +
                  '<span class="quest__n">' + p + " / " + q.goal + "</span>"
                : "";
            return '<li class="quest' + (done ? " is-done" : "") + (q.bonus ? " quest--bonus" : "") + '">' +
                '<span class="quest__icon">' + icon(done ? "check" : q.icon) + "</span>" +
                '<span class="quest__copy"><span class="quest__name">' + q.name +
                (q.bonus ? ' <em class="quest__tag">Bonus</em>' : "") + "</span>" +
                '<span class="quest__text">' + q.text + "</span>" + bar + "</span>" +
                '<span class="quest__xp">' + (done ? "Done" : q.xp + " XP") + "</span></li>";
        }).join("");
    }

    function openLog() {
        if (!log || !log.hidden) return;
        // the log says everything the toasts were saying, and they share the corner
        if (toastBox) Array.prototype.slice.call(toastBox.children).forEach(dismiss);
        renderLog();
        log.hidden = false;
        hudBtn.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () { log.classList.add("is-open"); });
        $("qlogClose").focus();
    }

    function closeLog(keepFocus) {
        if (!log || log.hidden) return;
        log.classList.remove("is-open");
        hudBtn.setAttribute("aria-expanded", "false");
        setTimeout(function () { log.hidden = true; }, 280);
        if (!keepFocus) hudBtn.focus();
    }

    hudBtn.addEventListener("click", function () {
        if (log.hidden) openLog();
        else closeLog();
    });

    if (log) {
        log.addEventListener("click", function (e) {
            if (e.target.closest("[data-qlog-close]")) closeLog();
            else if (e.target.closest(".qnode")) closeLog(true);
        });
    }

    var resetBtn = $("gameReset");
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            if (!window.confirm("Reset your progress and start the mission again?")) return;
            var keepSound = state.sound;
            state = fresh();
            state.briefed = true;
            state.sound = keepSound;
            save();
            document.querySelectorAll(".shard").forEach(function (s) { s.remove(); });
            placeShards();
            watchSectors();
            renderHud();
            renderLog();
        });
    }

    var reportBtn = $("gameReport");
    if (reportBtn) reportBtn.addEventListener("click", function () { closeLog(true); openVictory(); });


    /* Star shards */
    function placeShards() {
        SHARDS.forEach(function (s, i) {
            if (state.shards[i]) return;
            var host = $(s.at);
            if (!host || host.querySelector('[data-shard="' + i + '"]')) return;

            var b = document.createElement("button");
            b.type = "button";
            b.className = "shard" + (s.low ? " shard--low" : "");
            b.setAttribute("data-shard", i);
            b.setAttribute("aria-label", "Hidden star shard");
            b.style.setProperty("--x", s.x);
            if (s.y) b.style.setProperty("--y", s.y);
            b.innerHTML = icon("star");
            b.addEventListener("click", function () { collect(i, b); });
            host.appendChild(b);
        });
    }

    function collect(i, el) {
        if (state.shards[i]) return;
        state.shards[i] = true;
        save();

        var r = el.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 14, 80);
        el.classList.add("is-taken");
        el.disabled = true;
        setTimeout(function () { el.remove(); }, 500);

        var n = count(state.shards);
        sound.play("shard");
        toast({ kind: "Star shard", title: n + " of " + SHARDS.length + " found", xp: SHARD_XP, icon: "star" });
        gain(SHARD_XP);
        renderLog();
        if (n >= SHARDS.length) complete("stars");
    }


    /* Sectors - each section counts once, the first time it crosses the middle of the screen */
    var sectorObs = null;

    function watchSectors() {
        if (!("IntersectionObserver" in window)) return;
        if (sectorObs) sectorObs.disconnect();

        sectorObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = entry.target.id;
                sectorObs.unobserve(entry.target);
                if (state.sectors[id]) return;

                state.sectors[id] = true;
                save();
                var label = SECTORS.filter(function (s) { return s[0] === id; })[0];
                if (id !== "home") flashMeta("Sector " + count(state.sectors) + "/" + SECTORS.length + " · " + (label ? label[1] : id));
                renderLog();
                if (count(state.sectors) >= SECTORS.length) complete("sectors");
            });
        }, { rootMargin: "-40% 0px -40% 0px" });

        SECTORS.forEach(function (s) {
            var el = $(s[0]);
            if (el && !state.sectors[s[0]]) sectorObs.observe(el);
        });
    }


    /* What counts - read from the page, so the portfolio code needs no hooks */
    document.addEventListener("click", function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest("#themeToggle")) complete("theme");
        else if (t.closest(".sat, .skills .filter")) complete("skill");
        else if (t.closest(".proj__open")) complete("project");
        else if (t.closest('#copyMail, #cvHero, #cvContact, a[href^="mailto:"], a[href*="linkedin.com"], a[href*="github.com"]')) complete("contact");

        var play = t.closest("[data-play]");
        if (play) {
            closeLog(true);
            arcade.open();
        }
    });

    var form = $("contactForm");
    if (form) form.addEventListener("submit", function () { complete("contact"); });

    // a club counts once its story has actually been opened
    if ("MutationObserver" in window) {
        var clubObs = new MutationObserver(function (list) {
            list.forEach(function (m) {
                var tab = m.target;
                if (tab.getAttribute("aria-selected") !== "true" || state.clubs[tab.id]) return;
                state.clubs[tab.id] = true;
                save();
                renderLog();
                if (count(state.clubs) >= QUEST.clubs.goal) complete("clubs");
            });
        });
        document.querySelectorAll(".clubx__tab").forEach(function (tab) {
            clubObs.observe(tab, { attributes: true, attributeFilter: ["aria-selected"] });
        });
    }

    function checkLaunch() {
        if (window.scrollY > window.innerHeight * 0.6) {
            complete("launch");
            window.removeEventListener("scroll", checkLaunch);
        }
    }

    // up up down down left right left right B A
    var CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var codeAt = 0;
    document.addEventListener("keydown", function (e) {
        if (arcade.isOpen()) return;
        var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        codeAt = k === CODE[codeAt] ? codeAt + 1 : (k === CODE[0] ? 1 : 0);
        if (codeAt === CODE.length) {
            codeAt = 0;
            complete("secret");
            arcade.open({ cheat: true });
        }
    });


    /* Mission complete */
    var victory = $("victory");
    var victoryFrom = null;

    function openVictory() {
        if (!victory || !victory.hidden) return;
        var ms = state.finished - state.started;
        var row = $("victoryTimeRow");
        if (ms > 0 && ms < 3 * 3600 * 1000) {
            var s = Math.round(ms / 1000);
            $("victoryTime").textContent = (s >= 60 ? Math.floor(s / 60) + "m " : "") + (s % 60) + "s";
            row.hidden = false;
        } else {
            row.hidden = true;
        }
        $("victoryXp").textContent = state.xp;
        $("victoryShards").textContent = count(state.shards) + "/" + SHARDS.length;

        victoryFrom = document.activeElement;
        victory.hidden = false;
        root.classList.add("is-overlay");
        requestAnimationFrame(function () { victory.classList.add("is-open"); });
        victory.querySelector(".victory__actions .btn").focus();

        // stars rain from across the top of the screen
        if (!reduced) {
            for (var i = 0; i < 6; i++) {
                setTimeout(function () {
                    burst(Math.random() * window.innerWidth, window.innerHeight * (0.15 + Math.random() * 0.3), 14, 160);
                }, i * 180);
            }
        }
    }

    function closeVictory(goTo) {
        if (!victory || victory.hidden) return;
        victory.classList.remove("is-open");
        root.classList.remove("is-overlay");
        setTimeout(function () { victory.hidden = true; }, 320);
        if (goTo) {
            var el = document.querySelector(goTo);
            if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        } else if (victoryFrom && victoryFrom.focus) {
            victoryFrom.focus();
        }
    }

    if (victory) {
        victory.addEventListener("click", function (e) {
            var closer = e.target.closest("[data-victory-close]");
            if (!closer) return;
            var href = closer.getAttribute("href");
            if (href && href.charAt(0) === "#") e.preventDefault();
            closeVictory(href && href.charAt(0) === "#" ? href : null);
        });
    }


    /* Bug Hunt - the arcade. Bugs fall towards production; the ship fires on
       its own and the player steers. Catch TESTS for a triple shot and GIT
       for an extra life. */
    var arcade = (function () {
        var box = $("arcade");
        var canvas = $("arcadeCanvas");
        if (!box || !canvas || !canvas.getContext) {
            return { open: function () {}, isOpen: function () { return false; } };
        }

        var ctx = canvas.getContext("2d");
        var stage = canvas.parentNode;
        var scoreEl = $("arcadeScore");
        var livesEl = $("arcadeLives");
        var bestEl = $("arcadeBest");
        var screens = { start: $("arcadeStart"), pause: $("arcadePause"), over: $("arcadeOver") };

        var LABELS = ["null", "NaN", "404", "undefined", "CORS", "500", "typo", "leak", "flaky", "off-by-1", "merge", "timeout"];
        var RANKS = [[0, "Intern tester"], [150, "QA engineer"], [400, "Bug bounty hunter"], [800, "Senior debugger"], [1400, "Principal exterminator"]];

        var W = 0, H = 0;
        var g = null;
        var opened = false, running = false, paused = false;
        var rafId = 0, last = 0;
        var keys = { left: false, right: false };
        var cheat = false;
        var shown = {};
        var openedFrom = null;

        function size() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = Math.max(260, stage.clientWidth);
            H = Math.max(260, stage.clientHeight);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (g) {
                g.player.y = H - 54;
                g.player.x = clamp(g.player.x, 22, W - 22);
                g.player.tx = clamp(g.player.tx, 22, W - 22);
            }
        }

        function newGame(lives) {
            var stars = [];
            for (var i = 0; i < 80; i++) {
                stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, s: Math.random() * 40 + 16 });
            }
            return {
                player: { x: W / 2, tx: W / 2, y: H - 54, cool: 0.3, hurt: 0 },
                bullets: [], bugs: [], drops: [], parts: [], texts: [], stars: stars,
                score: 0, lives: lives || 3, kills: 0, shots: 0, hits: 0,
                combo: 0, comboT: 0, spawnT: 0.8, time: 0, triple: 0, shake: 0, flash: 0
            };
        }

        /* Arcade - the rules */
        function spawn() {
            var t = g.time;
            var roll = Math.random();
            var type = t > 22 && roll < 0.14 ? "legacy" : (t > 10 && roll < 0.36 ? "race" : "bug");
            var r = type === "legacy" ? 24 : (type === "race" ? 12 : 16);
            var base = type === "legacy" ? 34 : (type === "race" ? 88 : 50);
            var scale = Math.max(0.78, H / 560);
            g.bugs.push({
                type: type, r: r,
                x: r + 8 + Math.random() * (W - r * 2 - 16), y: -r - 10,
                vy: (base + t * 1.4 + Math.random() * 22) * scale,
                hp: type === "legacy" ? 3 : 1,
                phase: Math.random() * Math.PI * 2,
                sway: type === "race" ? 80 : 20,
                hitT: 0,
                label: type === "legacy" ? "legacy" : LABELS[(Math.random() * LABELS.length) | 0]
            });
        }

        function fire(x, y, angle) {
            g.bullets.push({ x: x, y: y, vx: Math.sin(angle) * 640, vy: -Math.cos(angle) * 640 });
            g.shots++;
        }

        function explode(x, y, n, colours) {
            if (g.parts.length > 360) return;
            for (var i = 0; i < n; i++) {
                var a = Math.random() * Math.PI * 2;
                var s = 40 + Math.random() * 170;
                var life = 0.45 + Math.random() * 0.45;
                g.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life, max: life,
                               r: 1 + Math.random() * 2.2, c: colours[i % colours.length] });
            }
        }

        function say(x, y, text, colour) {
            g.texts.push({ x: x, y: y, text: text, c: colour, life: 1 });
        }

        function kill(bug) {
            bug.dead = true;
            g.kills++;
            g.combo = g.comboT > 0 ? g.combo + 1 : 1;
            g.comboT = 1.3;
            var mult = Math.min(1 + Math.floor(g.combo / 5), 4);
            var pts = (bug.type === "legacy" ? 30 : (bug.type === "race" ? 15 : 10)) * mult;
            g.score += pts;
            say(bug.x, bug.y - bug.r, "+" + pts + (mult > 1 ? " ×" + mult : ""), "#c7d2fe");
            explode(bug.x, bug.y, bug.type === "legacy" ? 24 : 12,
                    bug.type === "legacy" ? ["#fbbf24", "#f59e0b", "#fff"] : ["#fb7185", "#f472b6", "#fff"]);
            sound.play("hit");
            if (Math.random() < 0.09) {
                g.drops.push({ kind: Math.random() < 0.55 ? "tests" : "git", x: bug.x, y: bug.y });
            }
        }

        function hurt(x, y, text) {
            g.lives--;
            g.player.hurt = 1.5;
            g.combo = 0;
            g.shake = reduced ? 0 : 10;
            g.flash = 1;
            say(x, y, text, "#fda4af");
            sound.play("hurt");
            if (g.lives <= 0) gameOver();
        }

        function update(dt) {
            var p = g.player;
            g.time += dt;

            // steering: the pointer sets a target, keys nudge it
            if (keys.left) p.tx -= 560 * dt;
            if (keys.right) p.tx += 560 * dt;
            p.tx = clamp(p.tx, 22, W - 22);
            p.x += (p.tx - p.x) * Math.min(1, dt * 14);

            p.cool -= dt;
            if (p.cool <= 0) {
                p.cool = 0.17;
                fire(p.x, p.y - 20, 0);
                if (g.triple > 0) {
                    fire(p.x - 9, p.y - 12, -0.2);
                    fire(p.x + 9, p.y - 12, 0.2);
                }
            }
            g.triple = Math.max(0, g.triple - dt);
            p.hurt = Math.max(0, p.hurt - dt);

            g.spawnT -= dt;
            if (g.spawnT <= 0) {
                spawn();
                var gap = Math.max(0.32, 1.05 - g.time * 0.012) * (0.7 + Math.random() * 0.6);
                g.spawnT = gap * (W < 520 ? 1.25 : 1);
            }

            g.bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });

            g.bugs.forEach(function (bug) {
                bug.y += bug.vy * dt;
                bug.phase += dt * (bug.type === "race" ? 5 : 2);
                bug.x = clamp(bug.x + Math.cos(bug.phase) * bug.sway * dt, bug.r, W - bug.r);
                bug.hitT = Math.max(0, bug.hitT - dt);

                for (var i = 0; i < g.bullets.length && !bug.dead; i++) {
                    var b = g.bullets[i];
                    if (b.dead) continue;
                    var dx = b.x - bug.x, dy = b.y - bug.y;
                    if (dx * dx + dy * dy < (bug.r + 4) * (bug.r + 4)) {
                        b.dead = true;
                        g.hits++;
                        bug.hp--;
                        bug.hitT = 0.12;
                        if (bug.hp <= 0) kill(bug);
                    }
                }
                if (bug.dead || g.lives <= 0) return;

                var px = bug.x - p.x, py = bug.y - p.y;
                if (p.hurt <= 0 && px * px + py * py < (bug.r + 13) * (bug.r + 13)) {
                    bug.dead = true;
                    explode(bug.x, bug.y, 14, ["#fb7185", "#fff"]);
                    hurt(p.x, p.y - 30, "Crashed!");
                } else if (bug.y - bug.r > H - 8) {
                    bug.dead = true;
                    hurt(bug.x, H - 30, "Shipped to production!");
                }
            });

            g.drops.forEach(function (d) {
                d.y += 95 * dt;
                var dx = d.x - p.x, dy = d.y - p.y;
                if (dx * dx + dy * dy < 30 * 30) {
                    d.dead = true;
                    sound.play("power");
                    if (d.kind === "tests") {
                        g.triple = 7;
                        say(p.x, p.y - 34, "Tests pass: triple shot", "#86efac");
                    } else {
                        g.lives = Math.min(5, g.lives + 1);
                        say(p.x, p.y - 34, "git revert: +1 life", "#c7d2fe");
                    }
                } else if (d.y > H + 20) {
                    d.dead = true;
                }
            });

            g.parts.forEach(function (q) {
                q.x += q.vx * dt; q.y += q.vy * dt;
                q.vx *= 0.96; q.vy *= 0.96;
                q.life -= dt;
            });
            g.texts.forEach(function (t) { t.y -= 34 * dt; t.life -= dt * 0.9; });
            g.stars.forEach(function (s) {
                s.y += s.s * dt;
                if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
            });

            g.bullets = g.bullets.filter(function (b) { return !b.dead && b.y > -20 && b.x > -20 && b.x < W + 20; });
            g.bugs = g.bugs.filter(function (b) { return !b.dead; });
            g.drops = g.drops.filter(function (d) { return !d.dead; });
            g.parts = g.parts.filter(function (q) { return q.life > 0; });
            g.texts = g.texts.filter(function (t) { return t.life > 0; });

            g.comboT -= dt;
            if (g.comboT <= 0) g.combo = 0;
            g.shake = Math.max(0, g.shake - dt * 26);
            g.flash = Math.max(0, g.flash - dt * 2.4);
        }

        /* Arcade - drawing */
        function roundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function drawBug(b) {
            var wig = Math.sin(g.time * 14 + b.phase) * 2.2;
            var c = b.type === "legacy" ? ["#fcd34d", "#b45309"] : (b.type === "race" ? ["#f9a8d4", "#be185d"] : ["#fda4af", "#be123c"]);
            if (b.hitT > 0) c = ["#ffffff", "#fda4af"];

            ctx.save();
            ctx.translate(b.x, b.y);

            ctx.strokeStyle = c[1];
            ctx.lineWidth = 1.7;
            ctx.lineCap = "round";
            ctx.beginPath();
            for (var i = -1; i <= 1; i++) {
                var ly = i * b.r * 0.42;
                ctx.moveTo(-b.r * 0.5, ly);
                ctx.lineTo(-b.r * 1.1, ly + i * 4 + wig);
                ctx.moveTo(b.r * 0.5, ly);
                ctx.lineTo(b.r * 1.1, ly + i * 4 - wig);
            }
            ctx.moveTo(-b.r * 0.22, -b.r * 0.9);
            ctx.lineTo(-b.r * 0.55, -b.r * 1.4 + wig * 0.4);
            ctx.moveTo(b.r * 0.22, -b.r * 0.9);
            ctx.lineTo(b.r * 0.55, -b.r * 1.4 - wig * 0.4);
            ctx.stroke();

            var shell = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 1, 0, 0, b.r * 1.1);
            shell.addColorStop(0, c[0]);
            shell.addColorStop(1, c[1]);
            ctx.fillStyle = shell;
            ctx.beginPath();
            ctx.ellipse(0, 0, b.r * 0.78, b.r, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -b.r * 0.86, b.r * 0.42, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(0, 0, 0, .3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -b.r * 0.5);
            ctx.lineTo(0, b.r * 0.95);
            ctx.stroke();

            // the big ones show how many hits they have left
            if (b.type === "legacy") {
                ctx.fillStyle = "rgba(255, 255, 255, .85)";
                for (var h = 0; h < b.hp; h++) {
                    ctx.beginPath();
                    ctx.arc((h - (b.hp - 1) / 2) * 7, -b.r - 16, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();

            ctx.font = "600 " + (b.type === "legacy" ? 11 : 10) + "px ui-monospace, SFMono-Regular, Consolas, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "rgba(255, 255, 255, .8)";
            ctx.fillText(b.label, b.x, b.y + b.r + 14);
        }

        function drawShip(p) {
            if (p.hurt > 0 && Math.floor(p.hurt * 12) % 2) return;     // blink while recovering
            ctx.save();
            ctx.translate(p.x, p.y);

            var f = 7 + Math.random() * 6;
            var flame = ctx.createLinearGradient(0, 10, 0, 16 + f);
            flame.addColorStop(0, "rgba(199, 210, 254, .95)");
            flame.addColorStop(1, "rgba(99, 102, 241, 0)");
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.moveTo(-5.5, 10);
            ctx.lineTo(0, 16 + f);
            ctx.lineTo(5.5, 10);
            ctx.fill();

            var hull = ctx.createLinearGradient(0, -20, 0, 14);
            hull.addColorStop(0, "#e0e7ff");
            hull.addColorStop(0.45, "#6366f1");
            hull.addColorStop(1, "#312e81");
            ctx.fillStyle = hull;
            ctx.beginPath();
            ctx.moveTo(0, -21);
            ctx.lineTo(16, 12);
            ctx.lineTo(5, 7);
            ctx.lineTo(0, 12);
            ctx.lineTo(-5, 7);
            ctx.lineTo(-16, 12);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(0, -5, 2.6, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            if (g.triple > 0) {
                ctx.strokeStyle = "rgba(74, 222, 128, " + (0.35 + 0.25 * Math.sin(g.time * 9)).toFixed(2) + ")";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, -2, 26, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        function drawDrop(d) {
            var tests = d.kind === "tests";
            var label = tests ? "TESTS" : "GIT";
            ctx.font = "700 10px ui-monospace, SFMono-Regular, Consolas, monospace";
            var w = ctx.measureText(label).width + 18;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.shadowColor = tests ? "#4ade80" : "#818cf8";
            ctx.shadowBlur = 16;
            ctx.fillStyle = tests ? "#4ade80" : "#818cf8";
            roundRect(-w / 2, -10, w, 20, 10);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = tests ? "#052e16" : "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, 0, 1);
            ctx.restore();
        }

        function draw() {
            ctx.save();
            if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);

            var sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, "#0b1233");
            sky.addColorStop(1, "#04060f");
            ctx.fillStyle = sky;
            ctx.fillRect(-20, -20, W + 40, H + 40);

            g.stars.forEach(function (s) {
                ctx.fillStyle = "rgba(255, 255, 255, " + (0.25 + s.r * 0.35).toFixed(2) + ")";
                ctx.fillRect(s.x, s.y, s.r, s.r * 2.2);
            });

            // the line the bugs must not cross
            ctx.strokeStyle = "rgba(251, 113, 133, .4)";
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, H - 8);
            ctx.lineTo(W, H - 8);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = "600 9px ui-monospace, SFMono-Regular, Consolas, monospace";
            ctx.textAlign = "right";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "rgba(251, 113, 133, .6)";
            ctx.fillText("PRODUCTION", W - 10, H - 14);

            g.drops.forEach(drawDrop);
            g.bugs.forEach(drawBug);

            ctx.lineCap = "round";
            g.bullets.forEach(function (b) {
                ctx.strokeStyle = "rgba(129, 140, 248, .4)";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016);
                ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            drawShip(g.player);

            g.parts.forEach(function (q) {
                ctx.globalAlpha = Math.max(0, q.life / q.max);
                ctx.fillStyle = q.c;
                ctx.beginPath();
                ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            ctx.textAlign = "center";
            ctx.font = "700 13px 'Space Grotesk', system-ui, sans-serif";
            g.texts.forEach(function (t) {
                ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 1.6));
                ctx.fillStyle = t.c;
                var half = ctx.measureText(t.text).width / 2 + 10;      // keep the whole line on screen
                ctx.fillText(t.text, clamp(t.x, half, W - half), t.y);
            });
            ctx.globalAlpha = 1;

            // status in the top corner: combo and triple shot
            ctx.textAlign = "left";
            ctx.font = "700 11px ui-monospace, SFMono-Regular, Consolas, monospace";
            var y = 22;
            if (g.combo >= 5) {
                ctx.fillStyle = "#c7d2fe";
                ctx.fillText("COMBO ×" + Math.min(1 + Math.floor(g.combo / 5), 4) + "  (" + g.combo + ")", 14, y);
                y += 18;
            }
            if (g.triple > 0) {
                ctx.fillStyle = "#86efac";
                ctx.fillText("TRIPLE SHOT", 14, y);
                ctx.fillStyle = "rgba(134, 239, 172, .25)";
                ctx.fillRect(14, y + 6, 90, 3);
                ctx.fillStyle = "#86efac";
                ctx.fillRect(14, y + 6, 90 * (g.triple / 7), 3);
            }
            ctx.restore();

            if (g.flash > 0) {
                ctx.fillStyle = "rgba(251, 113, 133, " + (g.flash * 0.18).toFixed(3) + ")";
                ctx.fillRect(0, 0, W, H);
            }
        }

        // a still scene behind the start screen
        function drawIdle() {
            g = newGame(3);
            g.bugs.push({ type: "bug", r: 16, x: W * 0.28, y: H * 0.3, hp: 1, phase: 0, sway: 0, hitT: 0, label: "undefined" });
            g.bugs.push({ type: "legacy", r: 24, x: W * 0.7, y: H * 0.22, hp: 3, phase: 1, sway: 0, hitT: 0, label: "legacy" });
            g.bugs.push({ type: "race", r: 12, x: W * 0.55, y: H * 0.48, hp: 1, phase: 2, sway: 0, hitT: 0, label: "race" });
            draw();
        }

        function syncHud() {
            if (shown.score !== g.score) {
                scoreEl.textContent = g.score;
                shown.score = g.score;
            }
            if (shown.lives !== g.lives) {
                livesEl.innerHTML = new Array(Math.max(0, g.lives) + 1).join('<i class="life"></i>');
                livesEl.setAttribute("aria-label", Math.max(0, g.lives) + " lives");
                shown.lives = g.lives;
            }
        }

        function frame(now) {
            if (!running) return;
            var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
            last = now;
            if (!paused) update(dt);
            if (!running) return;            // the game may have ended inside update
            draw();
            syncHud();
            rafId = requestAnimationFrame(frame);
        }

        /* Arcade - flow between screens */
        function show(name) {
            Object.keys(screens).forEach(function (k) {
                if (screens[k]) screens[k].hidden = k !== name;
            });
        }

        function start() {
            size();
            g = newGame(cheat ? 5 : 3);
            cheat = false;
            shown = {};
            show(null);
            running = true;
            paused = false;
            last = 0;
            syncHud();
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(frame);
            canvas.focus();
        }

        function setPaused(on) {
            if (!running) return;
            paused = on;
            last = 0;
            show(on ? "pause" : null);
            if (on) $("arcadeResume").focus();
            else canvas.focus();
        }

        function gameOver() {
            running = false;
            cancelAnimationFrame(rafId);
            draw();
            syncHud();
            sound.play("over");

            var isBest = g.score > state.best;
            state.best = Math.max(state.best, g.score);
            state.bestKills = Math.max(state.bestKills, g.kills);
            save();
            bestEl.textContent = state.best;

            var rank = RANKS[0][1];
            RANKS.forEach(function (r) { if (g.score >= r[0]) rank = r[1]; });
            $("arcadeRank").textContent = rank;
            $("overScore").textContent = g.score;
            $("overKills").textContent = g.kills;
            $("overAcc").textContent = (g.shots ? Math.round(g.hits / g.shots * 100) : 0) + "%";
            $("overBest").textContent = state.best;

            var goal = QUEST.arcade.goal;
            var note = isBest && g.score > 0 ? "New best score! " : "";
            if (g.kills >= goal) note += state.done.arcade ? "Bug hunter, through and through." : "That completes the Bug hunter quest.";
            else note += "Squash " + goal + " bugs in one game for the Bug hunter quest — you got " + g.kills + ".";
            $("overNote").textContent = note;

            show("over");
            $("arcadeAgain").focus();
            if (g.kills >= goal) complete("arcade");
            else renderLog();
        }

        function open(opts) {
            if (opened) return;
            opened = true;
            if (toastBox) Array.prototype.slice.call(toastBox.children).forEach(dismiss);
            cheat = !!(opts && opts.cheat);
            openedFrom = document.activeElement;
            box.hidden = false;
            root.classList.add("is-overlay");
            $("arcadeCheat").hidden = !cheat;
            bestEl.textContent = state.best;
            scoreEl.textContent = 0;
            livesEl.innerHTML = new Array((cheat ? 5 : 3) + 1).join('<i class="life"></i>');
            show("start");
            size();
            drawIdle();
            requestAnimationFrame(function () { box.classList.add("is-open"); });
            $("arcadeStartBtn").focus();
        }

        function close(goTo) {
            if (!opened) return;
            opened = false;
            running = false;
            paused = false;
            keys.left = keys.right = false;
            cancelAnimationFrame(rafId);
            box.classList.remove("is-open");
            root.classList.remove("is-overlay");
            setTimeout(function () { box.hidden = true; }, 300);
            if (goTo) {
                var el = document.querySelector(goTo);
                if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
            } else if (openedFrom && openedFrom.focus) {
                openedFrom.focus();
            }
        }

        $("arcadeStartBtn").addEventListener("click", start);
        $("arcadeAgain").addEventListener("click", start);
        $("arcadeResume").addEventListener("click", function () { setPaused(false); });
        $("arcadePauseBtn").addEventListener("click", function () {
            if (running) setPaused(!paused);
        });

        box.addEventListener("click", function (e) {
            var closer = e.target.closest("[data-arcade-close]");
            if (!closer) return;
            var href = closer.getAttribute("href");
            if (href && href.charAt(0) === "#") e.preventDefault();
            close(href && href.charAt(0) === "#" ? href : null);
        });

        // the pointer steers: a mouse just moves, a finger drags
        function steer(e) {
            if (!g) return;
            var r = canvas.getBoundingClientRect();
            g.player.tx = clamp((e.clientX - r.left) * (W / r.width), 22, W - 22);
        }
        canvas.addEventListener("pointermove", steer);
        canvas.addEventListener("pointerdown", function (e) {
            steer(e);
            if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
        });

        document.addEventListener("keydown", function (e) {
            if (!opened) return;
            var k = e.key;
            if (k === "Escape") { e.preventDefault(); close(); return; }
            if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = true; if (running) e.preventDefault(); }
            if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = true; if (running) e.preventDefault(); }
            if ((k === "p" || k === "P") && running) setPaused(!paused);

            // keep Tab inside the game window
            if (k === "Tab") {
                var stops = Array.prototype.filter.call(box.querySelectorAll("button, a[href], canvas"), function (el) {
                    return el.offsetParent !== null;
                });
                if (!stops.length) return;
                var first = stops[0], end = stops[stops.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
                else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
            }
        });
        document.addEventListener("keyup", function (e) {
            var k = e.key;
            if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
            if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden && running && !paused) setPaused(true);
        });

        window.addEventListener("resize", function () {
            if (!opened) return;
            size();
            if (!running && g) draw();
        });

        return { open: open, isOpen: function () { return opened; } };
    })();


    /* Escape closes whichever layer is on top */
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape" || arcade.isOpen()) return;
        if (victory && !victory.hidden) closeVictory();
        else if (log && !log.hidden) closeLog();
    });


    /* Start - once the preloader has finished */
    function begin() {
        hud.hidden = false;
        renderHud();
        renderLog();
        paintSound();
        placeShards();
        watchSectors();
        requestAnimationFrame(function () { hud.classList.add("is-on"); });

        window.addEventListener("scroll", checkLaunch, { passive: true });
        checkLaunch();

        if (!state.briefed) {
            state.briefed = true;
            save();
            setTimeout(function () {
                toast({
                    kind: "Mission briefing",
                    title: "Explore to earn XP and level up. Five star shards are hidden on this page.",
                    icon: "rocket",
                    life: 9000,
                    wide: true,
                    action: { label: "Open the quest log", run: openLog }
                });
            }, 1400);
        }
    }

    if (body.classList.contains("is-ready")) {
        begin();
    } else if ("MutationObserver" in window) {
        var readyObs = new MutationObserver(function () {
            if (!body.classList.contains("is-ready")) return;
            readyObs.disconnect();
            begin();
        });
        readyObs.observe(body, { attributes: true, attributeFilter: ["class"] });
    } else {
        window.addEventListener("load", begin);
    }
})();
