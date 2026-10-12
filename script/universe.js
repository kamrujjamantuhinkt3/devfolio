/* Kamrujjaman Tuhin — Portfolio universe
   The portfolio as a game. A visitor pilots a small ship between worlds,
   one for each part of the career, and lands on them to read about it.
   Every word shown on a world is read from the classic page, so the two
   versions never drift apart, and the classic page is one click away. */
(function () {
    "use strict";

    var root = document.documentElement;
    var body = document.body;
    var uni = document.getElementById("universe");
    var canvas = document.getElementById("uniCanvas");
    if (!uni || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var touchFirst = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    function $(id) { return document.getElementById(id); }
    function all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function text(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
    function attr(el, name) { return el ? (el.getAttribute(name) || "") : ""; }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    // the same layout for every visitor, so the universe is a place, not a dice roll
    function seeded(seed) {
        return function () {
            seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hexToRgb(hex) {
        var h = hex.replace("#", "");
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgba(hex, a) {
        var c = hexToRgb(hex);
        return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
    }

    function initials(name) {
        return name.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); })
            .map(function (w) { return w.charAt(0); }).join("");
    }

    // a number that the classic page counts up from zero: read its target instead
    function finalText(el) {
        if (!el) return "";
        var copy = el.cloneNode(true);
        all("[data-count]", copy).forEach(function (n) { n.textContent = n.getAttribute("data-count"); });
        if (copy.hasAttribute && copy.hasAttribute("data-count")) copy.textContent = copy.getAttribute("data-count");
        return text(copy);
    }


    /* Content - read from the classic page */
    function picture(el) { return el ? { src: attr(el, "src"), alt: attr(el, "alt") } : null; }
    function section(id) { return document.getElementById(id) || document.createElement("div"); }
    function ledeOf(sec) { return text(sec.querySelector(".section__lede")); }

    var C = (function () {
        var c = {};

        c.portrait = picture(section("home").querySelector(".portrait__frame img"));

        var about = section("about");
        c.about = {
            lede: ledeOf(about),
            lead: (about.querySelector(".about__lead") || { innerHTML: "" }).innerHTML.trim(),
            paras: all(".about__text", about).map(text),
            photo: picture(about.querySelector(".about__photo img")),
            cgpa: finalText(about.querySelector(".about__badge-value")),
            facts: all(".fact", about).map(function (f) {
                return { label: text(f.querySelector(".fact__label")), value: text(f.querySelector(".fact__value")) };
            })
        };

        var edu = section("education");
        c.education = {
            lede: ledeOf(edu),
            schools: all(".tl", edu).map(function (li) {
                var years = li.querySelector(".tl__years");
                var y = years ? years.cloneNode(true) : null;
                var badge = y ? y.querySelector(".tl__badge") : null;
                var badgeText = text(badge);
                if (badge) badge.remove();
                var school = text(li.querySelector(".tl__school"));
                return {
                    logo: picture(li.querySelector(".tl__logo img")),
                    years: text(y), badge: badgeText, school: school, short: initials(school),
                    degree: text(li.querySelector(".tl__degree")), meta: text(li.querySelector(".tl__meta"))
                };
            })
        };

        var sk = section("skills");
        var ai = sk.querySelector(".ai");
        c.skills = {
            lede: ledeOf(sk),
            list: all(".sat", sk).map(function (b) {
                return {
                    name: attr(b, "data-name"), cat: attr(b, "data-cat"), icon: attr(b, "data-icon"),
                    exp: attr(b, "data-exp"), acc: (b.style.getPropertyValue("--acc") || "#818cf8").trim()
                };
            }),
            ai: ai ? {
                badge: text(ai.querySelector(".ai__badge")),
                title: text(ai.querySelector(".ai__title")),
                quote: text(ai.querySelector(".quote__text")),
                by: text(ai.querySelector(".quote__by")),
                text: text(ai.querySelector(".ai__text")),
                practices: all(".practice__item", ai).map(function (p) {
                    return { name: text(p.querySelector(".practice__name")), text: text(p.querySelector(".practice__text")) };
                })
            } : null
        };

        var pr = section("projects");
        c.projects = {
            lede: ledeOf(pr),
            list: all(".proj", pr).map(function (p) {
                var cover = p.querySelector(".proj__cover");
                var tpl = p.querySelector("template.proj__detail");
                var d = tpl ? tpl.content : null;
                var shot = cover ? cover.querySelector("img") : null;
                var blurb = text(p.querySelector(".proj__blurb"));
                var tags = all(".proj__tags i", p).map(text);
                return {
                    name: text(p.querySelector(".proj__name")), cat: p.getAttribute("data-cat") || "",
                    blurb: blurb, tags: tags,
                    c1: cover ? (cover.style.getPropertyValue("--c1") || "#4338ca").trim() : "#4338ca",
                    c2: cover ? (cover.style.getPropertyValue("--c2") || "#1e40af").trim() : "#1e40af",
                    shot: shot ? attr(shot, "src") : "",
                    repo: p.getAttribute("data-repo") || "", demo: p.getAttribute("data-demo") || "",
                    lede: d ? text(d.querySelector(".sheet__lede")) : blurb,
                    highlights: d ? all(".sheet__list li", d).map(text) : [],
                    stack: d ? all(".sheet__stack span", d).map(text) : tags
                };
            })
        };

        var xp = section("experience");
        c.experience = {
            lede: ledeOf(xp),
            roles: all(".xp", xp).map(function (a) {
                var logo = a.querySelector(".xp__logo img");
                return {
                    logo: picture(logo), mark: attr(logo, "data-fallback") || "",
                    role: text(a.querySelector(".xp__role")), org: text(a.querySelector(".xp__org")),
                    when: text(a.querySelector(".xp__when")), kind: text(a.querySelector(".xp__kind")),
                    now: !!a.querySelector(".xp__now"),
                    summary: text(a.querySelector(".xp__summary")),
                    list: all(".xp__list li", a).map(text),
                    stack: all(".xp__stack span", a).map(text)
                };
            })
        };

        var ho = section("achievements");
        c.achievements = {
            lede: ledeOf(ho),
            stats: all(".stat", ho).map(function (s) {
                return { num: finalText(s.querySelector(".stat__num")), label: text(s.querySelector(".stat__label")), note: text(s.querySelector(".stat__note")) };
            }),
            awards: all(".award", ho).map(function (a) {
                return {
                    img: picture(a.querySelector(".award__coin img")),
                    year: text(a.querySelector(".award__meta time")),
                    title: text(a.querySelector(".award__title")),
                    by: text(a.querySelector(".award__by")),
                    text: text(a.querySelector(".award__text")),
                    facts: all(".award__facts > div", a).map(function (f) {
                        return { label: text(f.querySelector("dt")), value: text(f.querySelector("dd")), key: f.classList.contains("is-key") };
                    })
                };
            }),
            creed: (ho.querySelector(".creed__text") || { innerHTML: "" }).innerHTML.trim(),
            values: all(".creed__values li", ho).map(text)
        };

        var ac = section("activities");
        c.activities = {
            lede: ledeOf(ac),
            summary: all(".clubx__summary li", ac).map(function (li) { return li.innerHTML.trim(); }),
            clubs: all(".clubx__tab", ac).map(function (t) {
                var story = document.getElementById(attr(t, "aria-controls")) || document.createElement("div");
                var icon = t.querySelector(".club__icon svg");
                return {
                    role: text(t.querySelector(".clubx__role")), name: text(t.querySelector(".clubx__name")),
                    icon: icon ? icon.innerHTML : "",
                    org: text(story.querySelector(".cstory__org")),
                    lede: text(story.querySelector(".cstory__lede")),
                    steps: all(".cstory__step", story).map(function (s) {
                        return { tag: text(s.querySelector(".cstory__tag")), text: text(s.querySelector(".cstory__text")) };
                    }),
                    chips: all(".cstory__chips li", story).map(text)
                };
            })
        };

        var co = section("contact");
        var lines = co.querySelector(".lines") || co;
        c.contact = {
            lede: ledeOf(co),
            email: text($("mailValue")) || "kamrujjamantuhinkt3@gmail.com",
            linkedin: attr(lines.querySelector('a[href*="linkedin"]'), "href"),
            github: attr(lines.querySelector('a[href*="github"]'), "href")
        };
        return c;
    })();


    /* Icons for the HUD and the panels */
    var ICON = {
        user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6"/>',
        cap: '<path d="M2.5 9.5 12 4.8l9.5 4.7L12 14.2 2.5 9.5Z"/><path d="M6.5 11.8v4c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4"/>',
        chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
        build: '<path d="m14.5 6.5 3-3 3 3-3 3M3.5 20.5l9-9M12.5 8.5l3 3M8 4.5l-4 4 2 2 4-4z"/>',
        case: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
        medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3h4l2 4 2-4h4l-2.5 7"/><path d="m12 12.2.9 1.6 1.7.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.7-.3z"/>',
        flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
        signal: '<path d="M4.5 10a11 11 0 0 1 15 0M7.5 13.5a6.5 6.5 0 0 1 9 0M10.5 17a2 2 0 0 1 3 0"/>',
        arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
        back: '<path d="M19 12H6M11 6l-6 6 6 6"/>',
        out: '<path d="M7 17 17 7M9 7h8v8"/>',
        copy: '<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M15 6.2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1.2"/>',
        check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        mail: '<rect x="2.6" y="4.8" width="18.8" height="14.4" rx="2.6"/><path d="M3.3 7.1 12 13.4l8.7-6.3"/>',
        pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
        down: '<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 18.5h15"/>',
        star: '<path d="M12 2.5l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 16.9 6.3 20l1.2-6.4-4.7-4.4 6.4-.8Z"/>',
        linkedin: '<path fill="currentColor" stroke="none" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.2 9h3.6v12H3.2zM9.2 9h3.45v1.64h.05c.48-.9 1.66-1.85 3.42-1.85 3.66 0 4.33 2.4 4.33 5.52V21h-3.6v-5.02c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65V21H9.2z"/>',
        github: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>'
    };
    function icon(name) { return '<svg class="ui-i" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || "") + "</svg>"; }


    /* Worlds - one per part of the career, in the order the route visits them */
    var WORLDS = [
        { id: "about",        name: "Origin",             kicker: "About me",     icon: "user",   x: 0,     y: 0,
          says: "Welcome aboard. I'm Kamrujjaman, a full-stack developer from Savar, Dhaka. Land on Origin to meet the pilot." },
        { id: "education",    name: "Academy",            kicker: "Education",    icon: "cap",    x: 1180,  y: -620,
          says: "Academy ahead: three schools and one stubborn curiosity. Each moon is a school I studied at." },
        { id: "skills",       name: "Tech Nebula",        kicker: "Skills",       icon: "chip",   x: 2420,  y: 60,
          says: "Entering the Tech Nebula. Fly through the crystals to collect my stack, then land on the core." },
        { id: "projects",     name: "Shipyard",           kicker: "Projects",     icon: "build",  x: 1820,  y: 1380,
          says: "The Shipyard. Everything I have built is docked here. Dock at any station to inspect it." },
        { id: "experience",   name: "Career Belt",        kicker: "Experience",   icon: "case",   x: 230,   y: 1860,
          says: "The Career Belt: two companies, real users and real deadlines. Land on both planets." },
        { id: "achievements", name: "Hall of Honours",    kicker: "Achievements", icon: "medal",  x: -1500, y: 860,
          says: "The Hall of Honours. Long before my first commit, there was Scouting." },
        { id: "activities",   name: "Club Constellation", kicker: "Activities",   icon: "flag",   x: -1420, y: -680,
          says: "Club Constellation, where I practised leading outside the lecture hall. Each satellite is a club." },
        { id: "contact",      name: "Comm Beacon",        kicker: "Contact",      icon: "signal", x: -160,  y: -1560,
          says: "The Comm Beacon. Every good mission ends with a conversation. Land and send me a signal." }
    ];
    var WORLD = {};
    WORLDS.forEach(function (w, i) { w.index = i; w.mains = []; WORLD[w.id] = w; });


    /* Bodies - everything a ship can land on */
    var bodies = [];
    var BODY = {};

    function addBody(o) {
        o.x = o.x || 0;
        o.y = o.y || 0;
        bodies.push(o);
        BODY[o.id] = o;
        if (o.main) WORLD[o.world].mains.push(o);
        return o;
    }

    function orbit(parent, radius, speed, phase) {
        return { parent: parent, radius: radius, speed: speed, phase: phase };
    }

    // Origin
    addBody({ id: "origin", world: "about", main: true, kind: "planet", name: "Origin", r: 108,
              look: { c1: "#c7d2fe", c2: "#6366f1", c3: "#1e1b4b", glow: "#818cf8", ring: "#a5b4fc", bands: 7, seed: 11 } });

    // Academy and its moons, one per school
    var academy = addBody({ id: "academy", world: "education", main: true, kind: "planet", name: "Academy", r: 88,
                            look: { c1: "#bae6fd", c2: "#0ea5e9", c3: "#0c1e4a", glow: "#38bdf8", bands: 5, seed: 23 } });
    C.education.schools.forEach(function (s, i) {
        addBody({ id: "school-" + i, world: "education", kind: "moon", name: s.short || s.school, r: 21, ref: i,
                  orbit: orbit(academy, 182, 0.09, i * (Math.PI * 2 / 3) + 0.4),
                  look: { c1: "#e2e8f0", c2: "#94a3b8", c3: "#1e293b", glow: "#cbd5e1", craters: 5, seed: 40 + i } });
    });

    // Tech Nebula - the core holds the whole stack; the crystals are collected in flight
    addBody({ id: "core", world: "skills", main: true, kind: "core", name: "AI Core", r: 54 });

    // Shipyard and a station for every project
    var yard = addBody({ id: "shipyard", world: "projects", main: true, kind: "hub", name: "Shipyard", r: 70 });
    C.projects.list.forEach(function (p, i, list) {
        addBody({ id: "project-" + i, world: "projects", kind: "station", name: p.name, r: 24, ref: i,
                  c1: p.c1, c2: p.c2, spin: (i % 2 ? 1 : -1) * 0.25,
                  orbit: orbit(yard, 268, 0.035, i * (Math.PI * 2 / list.length)) });
    });

    // Career Belt - a planet for each company, oldest first
    var roles = C.experience.roles.slice().reverse();
    var RolePos = [[780, 1990], [-330, 1760]];
    roles.forEach(function (r, i) {
        var pos = RolePos[i] || [230 + i * 300, 1900];
        addBody({ id: "role-" + i, world: "experience", main: true, kind: "planet", name: r.org, r: r.now ? 92 : 80,
                  ref: C.experience.roles.indexOf(r), x: pos[0], y: pos[1], current: r.now,
                  look: r.now
                      ? { c1: "#a7f3d0", c2: "#4f46e5", c3: "#111a46", glow: "#34d399", bands: 6, ring: "#6ee7b7", seed: 61 }
                      : { c1: "#99f6e4", c2: "#2563eb", c3: "#0b1640", glow: "#22d3ee", bands: 8, seed: 67 } });
    });

    // Hall of Honours and a medal for each award
    var hall = addBody({ id: "hall", world: "achievements", main: true, kind: "planet", name: "Hall of Honours", r: 84,
                         look: { c1: "#fef3c7", c2: "#f59e0b", c3: "#4a2306", glow: "#fbbf24", bands: 6, ring: "#fde68a", seed: 77 } });
    C.achievements.awards.forEach(function (a, i) {
        addBody({ id: "award-" + i, world: "achievements", kind: "medal", name: a.title, r: 20, ref: i, gold: i === 0,
                  orbit: orbit(hall, 158, 0.12, i * Math.PI + 1) });
    });

    // Club Constellation and a satellite for each club
    var clubHub = addBody({ id: "clubs", world: "activities", main: true, kind: "clubhub", name: "Club Constellation", r: 58 });
    C.activities.clubs.forEach(function (c, i, list) {
        addBody({ id: "club-" + i, world: "activities", kind: "sat", name: c.name, r: 19, ref: i,
                  orbit: orbit(clubHub, 176, 0.07, i * (Math.PI * 2 / list.length)) });
    });

    // Comm Beacon
    addBody({ id: "beacon", world: "contact", main: true, kind: "beacon", name: "Comm Beacon", r: 56 });

    // anchor every world at its main body; the belt sits between its two planets
    bodies.forEach(function (b) {
        if (b.main && !b.orbit && b.kind !== "planet") { b.x = WORLD[b.world].x; b.y = WORLD[b.world].y; }
        if (b.main && b.kind === "planet" && b.world !== "experience") { b.x = WORLD[b.world].x; b.y = WORLD[b.world].y; }
    });

    function placeOrbits(t) {
        bodies.forEach(function (b) {
            if (!b.orbit) return;
            var a = b.orbit.phase + t * b.orbit.speed;
            b.x = b.orbit.parent.x + Math.cos(a) * b.orbit.radius;
            b.y = b.orbit.parent.y + Math.sin(a) * b.orbit.radius;
        });
    }
    placeOrbits(0);


    /* Crystals - the stack, scattered through the Tech Nebula */
    var crystals = C.skills.list.map(function (s, i) {
        var a = i * 2.39996 + 0.6;                  // the golden angle keeps them evenly spread
        var d = 175 + i * 22;
        return {
            skill: s, i: i, r: 21,
            x: WORLD.skills.x + Math.cos(a) * d,
            y: WORLD.skills.y + Math.sin(a) * d * 0.82,
            bob: i * 0.7, taken: false, fly: 0
        };
    });


    /* Progress - kept in this browser, so a returning visitor carries on */
    var KEY = "kt-universe-v1";
    var state = (function () {
        var s = { explored: {}, visited: {}, crystals: {}, heard: {}, sound: false, started: 0, finished: 0 };
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || "null");
            if (saved) Object.keys(s).forEach(function (k) { if (k in saved) s[k] = saved[k]; });
        } catch (e) { /* private mode: progress lasts for this visit */ }
        return s;
    })();
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

    crystals.forEach(function (c) { if (state.crystals[c.skill.name]) c.taken = true; });

    function exploredCount() { return WORLDS.filter(function (w) { return state.explored[w.id]; }).length; }
    function crystalCount() { return crystals.filter(function (c) { return c.taken; }).length; }
    function nextWorld() {
        for (var i = 0; i < WORLDS.length; i++) if (!state.explored[WORLDS[i].id]) return WORLDS[i];
        return null;
    }
    // where "Next" should take the ship inside a world: its first main body not yet landed on
    function nextBodyOf(w) {
        var left = w.mains.filter(function (b) { return !state.visited[b.id]; });
        return left[0] || w.mains[0];
    }


    /* Sound - small tones made on the fly. Off until the visitor turns it on. */
    var sound = (function () {
        var ac = null;
        function ensure() {
            if (!ac) {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                ac = new AC();
            }
            if (ac.state === "suspended") ac.resume();
            return ac;
        }
        function tone(f, start, dur, type, vol, to) {
            var a = ensure();
            if (!a) return;
            var t0 = a.currentTime + start;
            var o = a.createOscillator(), g = a.createGain();
            o.type = type || "sine";
            o.frequency.setValueAtTime(f, t0);
            if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g);
            g.connect(a.destination);
            o.start(t0);
            o.stop(t0 + dur + 0.03);
        }
        var S = {
            land:    function () { tone(392, 0, .18, "triangle"); tone(587, .12, .26, "triangle"); },
            launch:  function () { tone(180, 0, .5, "sawtooth", .03, 520); },
            crystal: function () { tone(1180, 0, .1, "sine", .05); tone(1580, .06, .14, "sine", .045); tone(2100, .12, .2, "sine", .035); },
            world:   function () { [523, 659, 784].forEach(function (f, i) { tone(f, i * .1, .26, "triangle", .06); }); },
            comms:   function () { tone(880, 0, .06, "square", .02); tone(880, .1, .06, "square", .02); },
            finale:  function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * .11, .34, "triangle", .06); }); },
            click:   function () { tone(660, 0, .05, "triangle", .03); }
        };
        return {
            play: function (n) { if (state.sound && S[n]) { try { S[n](); } catch (e) { /* audio is a nicety */ } } },
            unlock: ensure
        };
    })();


    /* Sprites - drawn once into their own canvases, then stamped every frame */
    var SPRITE_SCALE = 2;

    function sprite(half, paint) {
        var c = document.createElement("canvas");
        c.width = c.height = Math.ceil(half * 2 * SPRITE_SCALE);
        var g = c.getContext("2d");
        g.scale(SPRITE_SCALE, SPRITE_SCALE);
        g.translate(half, half);
        paint(g);
        c.half = half;
        return c;
    }

    function paintPlanet(g, r, o) {
        var R = seeded(o.seed || 1);

        var glow = g.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.5);
        glow.addColorStop(0, rgba(o.glow, 0.42));
        glow.addColorStop(1, rgba(o.glow, 0));
        g.fillStyle = glow;
        g.beginPath();
        g.arc(0, 0, r * 1.5, 0, Math.PI * 2);
        g.fill();

        if (o.ring) ringHalf(g, r, o.ring, true);

        g.save();
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.clip();

        var base = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
        base.addColorStop(0, o.c1);
        base.addColorStop(0.45, o.c2);
        base.addColorStop(1, o.c3);
        g.fillStyle = base;
        g.fillRect(-r, -r, r * 2, r * 2);

        // soft bands of weather, light and dark in turn
        for (var i = 0; i < (o.bands || 0); i++) {
            var y = -r + (i + 0.5) * (r * 2 / o.bands) + (R() - 0.5) * r * 0.12;
            g.fillStyle = i % 2 ? "rgba(255,255,255," + (0.05 + R() * 0.07).toFixed(3) + ")"
                                : "rgba(0,0,0," + (0.06 + R() * 0.08).toFixed(3) + ")";
            g.beginPath();
            g.ellipse(0, y, r * 1.3, r * (0.05 + R() * 0.07), (R() - 0.5) * 0.18, 0, Math.PI * 2);
            g.fill();
        }

        for (var k = 0; k < (o.craters || 0); k++) {
            var a = R() * Math.PI * 2, d = R() * r * 0.7, cr = r * (0.08 + R() * 0.14);
            var cx = Math.cos(a) * d, cy = Math.sin(a) * d;
            g.fillStyle = "rgba(15,23,42,.28)";
            g.beginPath();
            g.arc(cx, cy, cr, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = "rgba(255,255,255,.18)";
            g.lineWidth = r * 0.02;
            g.beginPath();
            g.arc(cx - cr * 0.12, cy - cr * 0.12, cr, Math.PI * 0.9, Math.PI * 1.7);
            g.stroke();
        }

        // night side and a thin rim of light on the day side
        var shade = g.createRadialGradient(r * 0.55, r * 0.6, r * 0.2, r * 0.3, r * 0.35, r * 1.45);
        shade.addColorStop(0, "rgba(2,4,16,0)");
        shade.addColorStop(0.55, "rgba(2,4,16,.18)");
        shade.addColorStop(1, "rgba(2,4,16,.72)");
        g.fillStyle = shade;
        g.fillRect(-r, -r, r * 2, r * 2);
        g.restore();

        g.strokeStyle = rgba(o.glow, 0.55);
        g.lineWidth = r * 0.03;
        g.beginPath();
        g.arc(0, 0, r - r * 0.015, Math.PI * 0.95, Math.PI * 1.75);
        g.stroke();

        if (o.ring) ringHalf(g, r, o.ring, false);
    }

    // a ring is drawn in two halves: the far one behind the planet, the near one in front
    function ringHalf(g, r, colour, back) {
        g.save();
        g.rotate(-0.38);
        g.lineCap = "round";
        [[1.62, 0.09, 0.5], [1.86, 0.05, 0.3]].forEach(function (band) {
            g.strokeStyle = rgba(colour, back ? band[2] * 0.6 : band[2]);
            g.lineWidth = r * band[1];
            g.beginPath();
            g.ellipse(0, 0, r * band[0], r * band[0] * 0.26, 0, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI);
            g.stroke();
        });
        g.restore();
    }

    function paintStation(g, s, c1, c2) {
        // solar wings either side of a short truss
        g.strokeStyle = "rgba(203,213,225,.7)";
        g.lineWidth = s * 0.08;
        g.beginPath();
        g.moveTo(-s * 1.55, 0);
        g.lineTo(s * 1.55, 0);
        g.stroke();
        [-1, 1].forEach(function (side) {
            var px = side < 0 ? -s * 1.62 : s * 0.62;
            var panel = g.createLinearGradient(px, -s * 0.36, px + s, s * 0.36);
            panel.addColorStop(0, c1);
            panel.addColorStop(1, c2);
            g.fillStyle = panel;
            g.fillRect(px, -s * 0.36, s, s * 0.72);
            g.strokeStyle = "rgba(255,255,255,.35)";
            g.lineWidth = s * 0.035;
            for (var i = 1; i < 4; i++) {
                g.beginPath();
                g.moveTo(px + i * s / 4, -s * 0.36);
                g.lineTo(px + i * s / 4, s * 0.36);
                g.stroke();
            }
        });
        // the module
        var hull = g.createLinearGradient(0, -s * 0.6, 0, s * 0.6);
        hull.addColorStop(0, "#e2e8f0");
        hull.addColorStop(1, "#475569");
        g.fillStyle = hull;
        g.beginPath();
        for (var k = 0; k < 6; k++) {
            var a = k * Math.PI / 3 + Math.PI / 6;
            g[k ? "lineTo" : "moveTo"](Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6);
        }
        g.closePath();
        g.fill();
        g.fillStyle = c2;
        g.beginPath();
        g.arc(0, 0, s * 0.24, 0, Math.PI * 2);
        g.fill();
    }

    function paintMoon(g, r, o) { paintPlanet(g, r, o); }

    function paintMedal(g, r, gold) {
        var halo = g.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.6);
        halo.addColorStop(0, gold ? "rgba(251,191,36,.45)" : "rgba(165,180,252,.45)");
        halo.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = halo;
        g.beginPath();
        g.arc(0, 0, r * 1.6, 0, Math.PI * 2);
        g.fill();
        // ribbon tails
        g.fillStyle = gold ? "#4f46e5" : "#0f766e";
        g.beginPath();
        g.moveTo(-r * 0.55, r * 0.2); g.lineTo(-r * 0.15, r * 0.2); g.lineTo(-r * 0.35, r * 1.5); g.lineTo(-r * 0.62, r * 1.25); g.closePath();
        g.moveTo(r * 0.55, r * 0.2); g.lineTo(r * 0.15, r * 0.2); g.lineTo(r * 0.35, r * 1.5); g.lineTo(r * 0.62, r * 1.25); g.closePath();
        g.fill();
        var coin = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        coin.addColorStop(0, gold ? "#fef3c7" : "#f1f5f9");
        coin.addColorStop(0.5, gold ? "#f59e0b" : "#94a3b8");
        coin.addColorStop(1, gold ? "#92400e" : "#334155");
        g.fillStyle = coin;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,255,255,.9)";
        g.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.24 : r * 0.55;
            g[i ? "lineTo" : "moveTo"](Math.cos(a) * d, Math.sin(a) * d);
        }
        g.closePath();
        g.fill();
    }

    function paintSat(g, r) {
        g.fillStyle = "#6366f1";
        g.fillRect(-r * 1.5, -r * 0.3, r * 0.85, r * 0.6);
        g.fillRect(r * 0.65, -r * 0.3, r * 0.85, r * 0.6);
        var hull = g.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r * 0.7);
        hull.addColorStop(0, "#e0e7ff");
        hull.addColorStop(1, "#4338ca");
        g.fillStyle = hull;
        g.beginPath();
        g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
        g.fill();
    }

    function paintGem(g, r, colour) {
        var halo = g.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
        halo.addColorStop(0, rgba(colour, 0.55));
        halo.addColorStop(1, rgba(colour, 0));
        g.fillStyle = halo;
        g.beginPath();
        g.arc(0, 0, r * 1.7, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        for (var i = 0; i < 6; i++) {
            var a = i * Math.PI / 3 - Math.PI / 2;
            g[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
        var face = g.createLinearGradient(-r, -r, r, r);
        face.addColorStop(0, "rgba(255,255,255,.95)");
        face.addColorStop(0.35, rgba(colour, 0.55));
        face.addColorStop(1, "rgba(15,23,42,.92)");
        g.fillStyle = face;
        g.fill();
        g.strokeStyle = rgba(colour, 0.95);
        g.lineWidth = r * 0.08;
        g.stroke();
    }

    function paintCloud(g, half, colour) {
        var c = g.createRadialGradient(0, 0, 0, 0, 0, half);
        c.addColorStop(0, rgba(colour, 0.5));
        c.addColorStop(0.45, rgba(colour, 0.18));
        c.addColorStop(1, rgba(colour, 0));
        g.fillStyle = c;
        g.fillRect(-half, -half, half * 2, half * 2);
    }

    function paintRock(g, r, seed) {
        var R = seeded(seed);
        g.beginPath();
        for (var i = 0; i < 9; i++) {
            var a = i * Math.PI * 2 / 9, d = r * (0.7 + R() * 0.3);
            g[i ? "lineTo" : "moveTo"](Math.cos(a) * d, Math.sin(a) * d);
        }
        g.closePath();
        var f = g.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
        f.addColorStop(0, "#94a3b8");
        f.addColorStop(1, "#1e293b");
        g.fillStyle = f;
        g.fill();
    }

    bodies.forEach(function (b) {
        if (b.kind === "planet") b.sprite = sprite(b.r * 2.1, function (g) { paintPlanet(g, b.r, b.look); });
        else if (b.kind === "moon") b.sprite = sprite(b.r * 1.6, function (g) { paintMoon(g, b.r, b.look); });
        else if (b.kind === "station") b.sprite = sprite(b.r * 1.8, function (g) { paintStation(g, b.r, b.c1, b.c2); });
        else if (b.kind === "medal") b.sprite = sprite(b.r * 1.7, function (g) { paintMedal(g, b.r, b.gold); });
        else if (b.kind === "sat") b.sprite = sprite(b.r * 1.6, function (g) { paintSat(g, b.r); });
    });

    crystals.forEach(function (c) {
        c.sprite = sprite(c.r * 1.8, function (g) { paintGem(g, c.r, c.skill.acc.charAt(0) === "#" ? c.skill.acc : "#818cf8"); });
    });

    var CLOUDS = [
        { x: 2420, y: 60, size: 1500, colour: "#7c3aed", sprite: null },
        { x: 2620, y: 280, size: 1100, colour: "#2563eb" },
        { x: 2200, y: -160, size: 900, colour: "#db2777" },
        { x: 1180, y: -620, size: 1000, colour: "#0284c7" },
        { x: -1500, y: 860, size: 1000, colour: "#b45309" },
        { x: -1420, y: -680, size: 900, colour: "#6d28d9" },
        { x: 0, y: 0, size: 1300, colour: "#4f46e5" },
        { x: 230, y: 1860, size: 1300, colour: "#0f766e" },
        { x: 1820, y: 1380, size: 1000, colour: "#4338ca" },
        { x: -160, y: -1560, size: 900, colour: "#4338ca" }
    ];
    var cloudSprites = {};
    CLOUDS.forEach(function (c) {
        if (!cloudSprites[c.colour]) cloudSprites[c.colour] = sprite(128, function (g) { paintCloud(g, 128, c.colour); });
    });

    // the asteroid belt arcs between the two company planets; a few loose rocks elsewhere
    var rocks = (function () {
        var R = seeded(91), out = [];
        var a = BODY["role-0"], b = BODY["role-1"];
        if (a && b) {
            for (var i = 0; i < 70; i++) {
                var t = R();
                var bow = Math.sin(t * Math.PI) * 260;
                out.push({
                    x: lerp(b.x, a.x, t) + (R() - 0.5) * 140,
                    y: lerp(b.y, a.y, t) + bow + (R() - 0.5) * 120,
                    r: 3 + R() * 9, spin: (R() - 0.5) * 0.8, a: R() * 6, seed: 100 + i
                });
            }
        }
        for (var k = 0; k < 46; k++) {
            var x = (R() - 0.5) * 6200 + 400, y = (R() - 0.5) * 4800 + 200;
            var near = bodies.some(function (bd) { return Math.hypot(bd.x - x, bd.y - y) < 420; });
            if (!near) out.push({ x: x, y: y, r: 4 + R() * 12, spin: (R() - 0.5) * 0.6, a: R() * 6, seed: 300 + k });
        }
        out.forEach(function (rk) { rk.sprite = sprite(rk.r * 1.1, function (g) { paintRock(g, rk.r, rk.seed); }); });
        return out;
    })();

    // star tiles: three layers drifting at different speeds give the sky depth
    var TILE = 1024;
    var starLayers = [0.12, 0.3, 0.55].map(function (p, li) {
        var R = seeded(500 + li);
        var c = document.createElement("canvas");
        c.width = c.height = TILE;
        var g = c.getContext("2d");
        var n = [360, 160, 60][li];
        for (var i = 0; i < n; i++) {
            var s = (li + 1) * 0.55 + R() * 0.9;
            g.fillStyle = R() < 0.18 ? "rgba(165,180,252," + (0.5 + R() * 0.4) + ")" : "rgba(255,255,255," + (0.35 + R() * 0.5) + ")";
            g.beginPath();
            g.arc(R() * TILE, R() * TILE, s * 0.6, 0, Math.PI * 2);
            g.fill();
        }
        return { canvas: c, parallax: p };
    });

    // the logos inside the crystals come from the page's own icon sprite
    crystals.forEach(function (c) {
        var sym = document.getElementById(c.skill.icon);
        if (!sym) return;
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (sym.getAttribute("viewBox") || "0 0 24 24") +
                  '" width="96" height="96" font-family="Arial, sans-serif">' + sym.innerHTML + "</svg>";
        var im = new Image();
        im.onload = function () { c.logo = im; };
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });


    /* The ship */
    var START = { x: -40, y: 250 };
    var ship = {
        x: START.x, y: START.y, vx: 0, vy: 0, angle: -Math.PI / 2,
        thrust: 0, scale: 1, state: "flying", t: 0, from: null, at: null
    };
    var MAX_SPEED = 420, BOOST_SPEED = 820, ACCEL = 1150, DRAG = 1.9;
    var WARP_SPEED = 1300;      // the autopilot cruises faster than a hand on the keys
    var BOUND = { x: 500, y: 200, r: 3900 };

    var auto = null;            // autopilot: { x, y } or { body, land: true }
    var keys = { up: false, down: false, left: false, right: false, boost: false };
    var steer = null;           // a pointer held down: { sx, sy }
    var particles = [];


    /* Camera */
    var W = 0, H = 0, DPR = 1, zoomBase = 1;
    var cam = { x: START.x, y: START.y - 60, zoom: 1 };

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        zoomBase = clamp(Math.min(W, H * 1.2) / 900, 0.56, 1.08);
        drawMini(true);
    }

    function toWorld(sx, sy) {
        return { x: cam.x + (sx - W / 2) / cam.zoom, y: cam.y + (sy - H / 2) / cam.zoom };
    }
    function toScreen(x, y) {
        return { x: (x - cam.x) * cam.zoom + W / 2, y: (y - cam.y) * cam.zoom + H / 2 };
    }


    /* Flight */
    var landed = null;          // the body the ship is resting on, with its panel open
    var near = null;            // the closest body in landing range

    function bodyAt(wx, wy, pad) {
        var best = null, bestD = Infinity;
        bodies.forEach(function (b) {
            var d = Math.hypot(b.x - wx, b.y - wy);
            if (d < b.r + (pad || 24) && d < bestD) { best = b; bestD = d; }
        });
        return best;
    }

    function landRange(b) { return b.r + (b.r > 40 ? 130 : 70); }

    function flyTo(target, landWhenThere) {
        if (!target) return;
        if (landed) takeOff(true);
        auto = target.r ? { body: target, land: landWhenThere !== false } : { x: target.x, y: target.y };
    }

    function land(b) {
        if (ship.state !== "flying") return;
        auto = null;
        steer = null;
        ship.state = "landing";
        ship.t = 0;
        ship.from = { x: ship.x, y: ship.y };
        ship.at = b;
        ship.vx = ship.vy = 0;
        sound.play("land");
        hidePrompt();
    }

    function takeOff(quick) {
        if (!landed) return;
        var b = landed;
        landed = null;
        closePanel();
        // leave on the side facing the next world, so the route keeps moving forwards
        var nw = nextWorld();
        var nb = auto && auto.body ? auto.body : (nw ? nextBodyOf(nw) : null);
        var a = nb && nb !== b ? Math.atan2(nb.y - b.y, nb.x - b.x) : -Math.PI / 2;
        ship.state = "launching";
        ship.t = quick ? 0.6 : 0;
        ship.from = { x: b.x, y: b.y, a: a, r: b.r };
        ship.angle = a;
        sound.play("launch");
        canvas.focus({ preventScroll: true });
    }

    function update(dt, t) {
        placeOrbits(t);

        if (ship.state === "landing") {
            ship.t = Math.min(1, ship.t + dt / 0.75);
            var e = ease(ship.t), b = ship.at;
            ship.x = lerp(ship.from.x, b.x, e);
            ship.y = lerp(ship.from.y, b.y, e);
            ship.scale = 1 - e * 0.75;
            ship.angle += dt * 4 * (1 - e);
            if (ship.t >= 1) {
                ship.state = "landed";
                landed = b;
                openBody(b);
            }
        } else if (ship.state === "landed" && landed) {
            ship.x = landed.x;
            ship.y = landed.y;
        } else if (ship.state === "launching") {
            ship.t = Math.min(1, ship.t + dt / 0.6);
            var k = ease(ship.t), f = ship.from;
            var reach = f.r + 70;
            ship.x = f.x + Math.cos(f.a) * reach * k;
            ship.y = f.y + Math.sin(f.a) * reach * k;
            ship.scale = 0.25 + 0.75 * k;
            ship.vx = Math.cos(f.a) * 140 * k;
            ship.vy = Math.sin(f.a) * 140 * k;
            ship.thrust = 1;
            if (ship.t >= 1) ship.state = "flying";
        } else {
            fly(dt);
        }

        // engine exhaust
        if (!reduced && ship.thrust > 0.15 && ship.state !== "landed" && particles.length < 260) {
            var back = ship.angle + Math.PI;
            for (var i = 0; i < 2; i++) {
                particles.push({
                    x: ship.x + Math.cos(back) * 15 * ship.scale, y: ship.y + Math.sin(back) * 15 * ship.scale,
                    vx: Math.cos(back + (Math.random() - 0.5) * 0.6) * (60 + Math.random() * 90) + ship.vx * 0.3,
                    vy: Math.sin(back + (Math.random() - 0.5) * 0.6) * (60 + Math.random() * 90) + ship.vy * 0.3,
                    life: 0.4 + Math.random() * 0.3, max: 0.7, r: 1.4 + Math.random() * 2,
                    c: Math.random() < 0.5 ? "199,210,254" : "129,140,248"
                });
            }
        }
        particles.forEach(function (p) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life -= dt;
        });
        particles = particles.filter(function (p) { return p.life > 0; });

        collectCrystals(dt);
        checkProximity();
        checkTransmissions();

        // the camera leads the ship a little, and leans in while it is landed
        var lead = 0.35;
        var tx = ship.x + ship.vx * lead, ty = ship.y + ship.vy * lead;
        var zoom = zoomBase;
        if (landed) {
            zoom = zoomBase * 1.18;
            tx = landed.x;
            ty = landed.y;
            // keep the world in view beside the panel rather than behind it
            if (W > 900) tx += (Math.min(460, W * 0.42) / 2) / zoom;
            else ty += (H * 0.28) / zoom;
        }
        var k2 = 1 - Math.exp(-dt * (landed ? 3 : 4.5));
        cam.x = lerp(cam.x, tx, k2);
        cam.y = lerp(cam.y, ty, k2);
        cam.zoom = lerp(cam.zoom, zoom, 1 - Math.exp(-dt * 2.5));
    }

    function fly(dt) {
        var ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        var iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
        var ax = 0, ay = 0, max = keys.boost ? BOOST_SPEED : MAX_SPEED;
        var input = false;

        if (ix || iy) {
            var l = Math.hypot(ix, iy);
            ax = ix / l * ACCEL;
            ay = iy / l * ACCEL;
            input = true;
            auto = null;
        } else if (steer) {
            var p = toWorld(steer.sx, steer.sy);
            var dx = p.x - ship.x, dy = p.y - ship.y, d = Math.hypot(dx, dy);
            if (d > 12) {
                var pull = clamp(d / 220, 0.25, 1);
                ax = dx / d * ACCEL * pull;
                ay = dy / d * ACCEL * pull;
                input = true;
            }
            auto = null;
        } else if (auto) {
            var tx = auto.body ? auto.body.x : auto.x, ty = auto.body ? auto.body.y : auto.y;
            var ex = tx - ship.x, ey = ty - ship.y, dist = Math.hypot(ex, ey);
            var stop = auto.body ? auto.body.r + 40 : 10;
            var far = dist - stop;
            if (auto.body && auto.land && dist < landRange(auto.body) - 30) {
                land(auto.body);
                return;
            }
            if (far <= 4 && !auto.body) {
                auto = null;
            } else {
                // cruise across open space, then ease off in proportion to what is left
                max = WARP_SPEED;
                var want = Math.min(WARP_SPEED, Math.max(60, far * 1.9));
                var dvx = ex / (dist || 1) * want - ship.vx, dvy = ey / (dist || 1) * want - ship.vy;
                var dl = Math.hypot(dvx, dvy);
                var cap = ACCEL * 1.8;
                ax = dl > cap ? dvx / dl * cap : dvx * 4;
                ay = dl > cap ? dvy / dl * cap : dvy * 4;
                input = true;
            }
        }

        ship.vx += ax * dt;
        ship.vy += ay * dt;
        if (!input) {
            var drag = Math.exp(-DRAG * dt);
            ship.vx *= drag;
            ship.vy *= drag;
        }
        var sp = Math.hypot(ship.vx, ship.vy);
        if (sp > max) {
            ship.vx = ship.vx / sp * lerp(sp, max, 0.2);
            ship.vy = ship.vy / sp * lerp(sp, max, 0.2);
        }

        // the edge of the known universe turns the ship gently around
        var ox = ship.x - BOUND.x, oy = ship.y - BOUND.y, od = Math.hypot(ox, oy);
        if (od > BOUND.r) {
            ship.vx -= ox / od * 900 * dt;
            ship.vy -= oy / od * 900 * dt;
            if (!edgeWarned) { edgeWarned = true; transmit("You have reached the edge of the known universe. Turning you back towards the worlds."); }
        } else if (od < BOUND.r - 400) {
            edgeWarned = false;
        }

        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;
        ship.thrust = lerp(ship.thrust, input ? (max > MAX_SPEED ? 1 : 0.7) : 0, 1 - Math.exp(-dt * 8));
        ship.scale = 1;

        if (sp > 20) {
            var want2 = Math.atan2(ship.vy, ship.vx);
            var diff = Math.atan2(Math.sin(want2 - ship.angle), Math.cos(want2 - ship.angle));
            ship.angle += diff * (1 - Math.exp(-dt * 9));
        }
    }
    var edgeWarned = false;


    /* Crystals - flown through, not landed on */
    function collectCrystals(dt) {
        crystals.forEach(function (c) {
            if (c.taken) {
                if (c.fly > 0) c.fly = Math.max(0, c.fly - dt * 2.4);
                return;
            }
            if (ship.state !== "flying") return;
            if (Math.hypot(c.x - ship.x, c.y - ship.y) < c.r + 26) {
                c.taken = true;
                c.fly = 1;
                c.fx = c.x;
                c.fy = c.y;
                state.crystals[c.skill.name] = true;
                save();
                burst(c.x, c.y, c.skill.acc, 18);
                sound.play("crystal");
                notify(c.skill.name + " collected", crystalCount() + " of " + crystals.length + " skills", c.skill.icon);
                renderHud();
            }
        });
    }

    function burst(x, y, colour, n) {
        if (reduced) return;
        var rgb = hexToRgb(colour && colour.charAt(0) === "#" ? colour : "#a5b4fc").join(",");
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 220;
            particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.5, max: 1,
                             r: 1.5 + Math.random() * 2.5, c: i % 3 ? rgb : "255,255,255" });
        }
    }


    /* Landing range and the prompt */
    var prompt = $("uniPrompt");
    var promptName = $("uniPromptName");

    function checkProximity() {
        if (ship.state !== "flying") { near = null; return; }
        var best = null, bestD = Infinity;
        bodies.forEach(function (b) {
            var d = Math.hypot(b.x - ship.x, b.y - ship.y);
            if (d < landRange(b) && d - b.r < bestD) { best = b; bestD = d - b.r; }
        });
        if (best !== near) {
            near = best;
            if (near) showPrompt(near);
            else hidePrompt();
        }
    }

    function showPrompt(b) {
        promptName.textContent = b.main ? WORLD[b.world].name : b.name;
        prompt.hidden = false;
        requestAnimationFrame(function () { prompt.classList.add("is-on"); });
    }
    function hidePrompt() {
        prompt.classList.remove("is-on");
        prompt.hidden = true;
    }
    prompt.addEventListener("click", function () { if (near) land(near); });


    /* Transmissions - a line from the pilot as each world comes into range */
    var comms = $("uniComms");
    var commsText = $("uniCommsText");
    var commsTimer = null, typeTimer = null;

    function transmit(line) {
        clearTimeout(commsTimer);
        clearInterval(typeTimer);
        comms.hidden = false;
        requestAnimationFrame(function () { comms.classList.add("is-on"); });
        sound.play("comms");
        if (reduced) {
            commsText.textContent = line;
        } else {
            var i = 0;
            commsText.textContent = "";
            typeTimer = setInterval(function () {
                i += 2;
                commsText.textContent = line.slice(0, i);
                if (i >= line.length) clearInterval(typeTimer);
            }, 22);
        }
        commsTimer = setTimeout(hideComms, 3200 + line.length * 45);
    }

    function hideComms() {
        clearTimeout(commsTimer);
        clearInterval(typeTimer);
        comms.classList.remove("is-on");
        setTimeout(function () { if (!comms.classList.contains("is-on")) comms.hidden = true; }, 400);
    }

    function checkTransmissions() {
        if (ship.state !== "flying" || !started) return;
        WORLDS.forEach(function (w) {
            if (state.heard[w.id]) return;
            // early enough that the line is read before the autopilot touches down
            if (Math.hypot(w.x - ship.x, w.y - ship.y) < 1150) {
                state.heard[w.id] = true;
                save();
                transmit(w.says);
            }
        });
    }


    /* Toasts - a crystal collected, a world explored */
    var toast = $("uniToast");
    var toastTimer = null;

    function notify(title, sub, iconId) {
        clearTimeout(toastTimer);
        $("uniToastTitle").textContent = title;
        $("uniToastSub").textContent = sub;
        var mark = $("uniToastIcon");
        mark.innerHTML = iconId && document.getElementById(iconId)
            ? '<svg viewBox="0 0 24 24"><use href="#' + iconId + '"></use></svg>'
            : icon(iconId && ICON[iconId] ? iconId : "star");
        toast.hidden = false;
        toast.classList.remove("is-on");
        void toast.offsetWidth;
        toast.classList.add("is-on");
        toastTimer = setTimeout(function () {
            toast.classList.remove("is-on");
            setTimeout(function () { if (!toast.classList.contains("is-on")) toast.hidden = true; }, 400);
        }, 2600);
    }


    /* Rendering */
    var t0 = 0;

    function drawStars() {
        starLayers.forEach(function (layer) {
            var p = layer.parallax;
            var ox = -((cam.x * p * cam.zoom) % TILE + TILE) % TILE;
            var oy = -((cam.y * p * cam.zoom) % TILE + TILE) % TILE;
            for (var x = ox; x < W; x += TILE) {
                for (var y = oy; y < H; y += TILE) ctx.drawImage(layer.canvas, x, y);
            }
        });
    }

    function onScreen(x, y, pad) {
        var s = toScreen(x, y), m = pad * cam.zoom;
        return s.x > -m && s.x < W + m && s.y > -m && s.y < H + m;
    }

    function stamp(spr, x, y, rot, scale, alpha) {
        var h = spr.half * (scale || 1);
        ctx.save();
        ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        if (alpha != null) ctx.globalAlpha = alpha;
        ctx.drawImage(spr, -h, -h, h * 2, h * 2);
        ctx.restore();
    }

    function drawRoute(t) {
        var pts = [];
        WORLDS.forEach(function (w) {
            if (w.id === "experience") w.mains.forEach(function (b) { pts.push({ x: b.x, y: b.y, w: w.id }); });
            else pts.push({ x: w.x, y: w.y, w: w.id });
        });
        ctx.save();
        ctx.lineWidth = 2 / cam.zoom;
        ctx.setLineDash([10 / cam.zoom, 14 / cam.zoom]);
        if (!reduced) ctx.lineDashOffset = -t * 40 / cam.zoom;
        for (var i = 0; i < pts.length - 1; i++) {
            var a = pts[i], b = pts[i + 1];
            var done = state.explored[a.w] && state.explored[b.w];
            ctx.strokeStyle = done ? "rgba(165,180,252,.45)" : "rgba(129,140,248,.18)";
            var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            var nx = -(b.y - a.y) * 0.18, ny = (b.x - a.x) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(mx + nx, my + ny, b.x, b.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawOrbitPaths() {
        ctx.save();
        ctx.strokeStyle = "rgba(165,180,252,.12)";
        ctx.lineWidth = 1 / cam.zoom;
        var seen = {};
        bodies.forEach(function (b) {
            if (!b.orbit) return;
            var key = b.orbit.parent.id + b.orbit.radius;
            if (seen[key]) return;
            seen[key] = true;
            ctx.beginPath();
            ctx.arc(b.orbit.parent.x, b.orbit.parent.y, b.orbit.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.restore();
    }

    function drawHub(b, t) {
        // a ring station that turns slowly, spokes to a central module
        ctx.save();
        ctx.translate(b.x, b.y);
        var glow = ctx.createRadialGradient(0, 0, b.r * 0.5, 0, 0, b.r * 1.9);
        glow.addColorStop(0, "rgba(99,102,241,.35)");
        glow.addColorStop(1, "rgba(99,102,241,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(t * 0.15);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = b.r * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.82, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = b.r * 0.05;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = b.r * 0.06;
        ctx.strokeStyle = "#64748b";
        for (var i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(i * Math.PI / 2) * b.r * 0.75, Math.sin(i * Math.PI / 2) * b.r * 0.75);
            ctx.stroke();
        }
        // windows round the ring
        for (var k = 0; k < 16; k++) {
            var a = k * Math.PI / 8;
            ctx.fillStyle = k % 3 ? "rgba(165,180,252,.9)" : "rgba(253,230,138,.9)";
            ctx.fillRect(Math.cos(a) * b.r * 0.82 - 1.5, Math.sin(a) * b.r * 0.82 - 1.5, 3, 3);
        }
        var core = ctx.createRadialGradient(-b.r * 0.1, -b.r * 0.1, 1, 0, 0, b.r * 0.32);
        core.addColorStop(0, "#e0e7ff");
        core.addColorStop(1, "#4338ca");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawClubHub(b, t) {
        ctx.save();
        ctx.translate(b.x, b.y);
        var glow = ctx.createRadialGradient(0, 0, b.r * 0.4, 0, 0, b.r * 2);
        glow.addColorStop(0, "rgba(139,92,246,.4)");
        glow.addColorStop(1, "rgba(139,92,246,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(-t * 0.12);
        ctx.strokeStyle = "#a5b4fc";
        ctx.lineWidth = b.r * 0.07;
        for (var i = 0; i < 6; i++) {
            var a = i * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * b.r * 0.4, Math.sin(a) * b.r * 0.4);
            ctx.lineTo(Math.cos(a) * b.r, Math.sin(a) * b.r);
            ctx.stroke();
            ctx.fillStyle = Math.sin(t * 3 + i) > 0 ? "#c4b5fd" : "#6d28d9";
            ctx.beginPath();
            ctx.arc(Math.cos(a) * b.r, Math.sin(a) * b.r, b.r * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        var core = ctx.createLinearGradient(0, -b.r * 0.5, 0, b.r * 0.5);
        core.addColorStop(0, "#ede9fe");
        core.addColorStop(1, "#5b21b6");
        ctx.fillStyle = core;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) {
            var ang = k * Math.PI / 3 + Math.PI / 6;
            ctx[k ? "lineTo" : "moveTo"](Math.cos(ang) * b.r * 0.5, Math.sin(ang) * b.r * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawCore(b, t) {
        ctx.save();
        ctx.translate(b.x, b.y);
        var pulse = reduced ? 1 : 1 + Math.sin(t * 2) * 0.06;
        var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r * 2.6 * pulse);
        glow.addColorStop(0, "rgba(255,255,255,.95)");
        glow.addColorStop(0.18, "rgba(199,210,254,.85)");
        glow.addColorStop(0.45, "rgba(129,140,248,.35)");
        glow.addColorStop(1, "rgba(79,70,229,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 2.6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        [[1.15, 0.5, 1], [1.5, 0.3, -0.7]].forEach(function (ring, i) {
            ctx.save();
            ctx.rotate(t * 0.4 * ring[2] + i);
            ctx.strokeStyle = "rgba(199,210,254,.6)";
            ctx.lineWidth = 1.6 / cam.zoom;
            ctx.beginPath();
            ctx.ellipse(0, 0, b.r * ring[0], b.r * ring[0] * ring[1], 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
        ctx.restore();
    }

    function drawBeacon(b, t) {
        ctx.save();
        ctx.translate(b.x, b.y);
        // signal rings travelling outwards
        if (!reduced) {
            for (var i = 0; i < 3; i++) {
                var p = ((t * 0.45) + i / 3) % 1;
                ctx.strokeStyle = "rgba(165,180,252," + (0.5 * (1 - p)).toFixed(3) + ")";
                ctx.lineWidth = 2 / cam.zoom;
                ctx.beginPath();
                ctx.arc(0, 0, b.r * (0.8 + p * 2.6), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        var base = ctx.createRadialGradient(-b.r * 0.2, -b.r * 0.2, 1, 0, 0, b.r);
        base.addColorStop(0, "#c7d2fe");
        base.addColorStop(0.5, "#4f46e5");
        base.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.62, 0, Math.PI * 2);
        ctx.fill();
        // the dish and its mast
        ctx.strokeStyle = "#e0e7ff";
        ctx.lineWidth = b.r * 0.07;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, -b.r * 0.1);
        ctx.lineTo(0, -b.r * 0.95);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -b.r * 0.55, b.r * 0.42, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.fillStyle = Math.sin(t * 5) > 0 || reduced ? "#ffffff" : "#818cf8";
        ctx.beginPath();
        ctx.arc(0, -b.r * 0.98, b.r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawBody(b, t) {
        if (!onScreen(b.x, b.y, b.r * 3)) return;
        if (b.kind === "hub") drawHub(b, t);
        else if (b.kind === "clubhub") drawClubHub(b, t);
        else if (b.kind === "core") drawCore(b, t);
        else if (b.kind === "beacon") drawBeacon(b, t);
        else if (b.sprite) {
            var rot = b.kind === "station" ? t * b.spin : (b.kind === "sat" ? Math.sin(t + b.ref) * 0.4 : 0);
            stamp(b.sprite, b.x, b.y, rot);
        }
        if (b.current && !reduced) {
            // the current job keeps a slow green pulse
            var p = (t * 0.5) % 1;
            ctx.strokeStyle = "rgba(52,211,153," + (0.55 * (1 - p)).toFixed(3) + ")";
            ctx.lineWidth = 2 / cam.zoom;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * (1.05 + p * 0.7), 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function label(x, y, title, sub, opts) {
        var z = cam.zoom;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        if ("letterSpacing" in ctx) ctx.letterSpacing = (opts.big ? 2.5 : 1.2) / z + "px";
        ctx.font = "700 " + ((opts.big ? 15 : 11) / z) + "px 'Space Grotesk', system-ui, sans-serif";
        ctx.shadowColor = "rgba(2,4,16,.9)";
        ctx.shadowBlur = 8 / z;
        ctx.fillStyle = opts.dim ? "rgba(234,237,251,.6)" : "#eaedfb";
        ctx.fillText(opts.big ? title.toUpperCase() : title, x, y);
        if (sub) {
            if ("letterSpacing" in ctx) ctx.letterSpacing = 1.6 / z + "px";
            ctx.font = "600 " + (10.5 / z) + "px 'Space Grotesk', system-ui, sans-serif";
            ctx.fillStyle = opts.done ? "#a5b4fc" : "rgba(148,158,198,.95)";
            ctx.fillText(sub.toUpperCase(), x, y + (opts.big ? 21 : 15) / z);
        }
        ctx.restore();
    }

    function drawLabels() {
        if (!started) return;                        // the title screen is enough until then
        WORLDS.forEach(function (w) {
            var done = state.explored[w.id];
            if (w.id === "experience") {
                if (!onScreen(w.x, w.y, 900)) return;
                label(w.x, w.y - 40, w.name, done ? "✓ " + w.kicker : w.kicker, { big: true, done: done });
                w.mains.forEach(function (b) {
                    var r = C.experience.roles[b.ref];
                    label(b.x, b.y + b.r + 16 / cam.zoom, b.name, r ? r.when : "", { big: false, done: state.visited[b.id] });
                });
                return;
            }
            var main = w.mains[0];
            if (!main || !onScreen(main.x, main.y, 600)) return;
            var y = main.y + main.r * (main.kind === "core" ? 1.6 : 1.15) + 18 / cam.zoom;
            label(main.x, y, w.name, done ? "✓ " + w.kicker : w.kicker, { big: true, done: done });
        });

        // the smaller bodies are named once the ship is close
        bodies.forEach(function (b) {
            if (b.main) return;
            if (Math.hypot(b.x - ship.x, b.y - ship.y) > 520 || !onScreen(b.x, b.y, 200)) return;
            label(b.x, b.y + b.r + 10 / cam.zoom, b.name, state.visited[b.id] ? "✓ visited" : "", { big: false, dim: false, done: true });
        });

        crystals.forEach(function (c) {
            if (c.taken || Math.hypot(c.x - ship.x, c.y - ship.y) > 420) return;
            label(c.x, c.y + c.r + 12 / cam.zoom, c.skill.name, "", { big: false });
        });
    }

    function drawCrystals(t) {
        crystals.forEach(function (c) {
            if (!onScreen(c.x, c.y, 80)) return;
            if (c.taken) {
                if (c.fly <= 0) return;
                // a collected crystal is pulled into the ship
                var k = 1 - c.fly;
                stamp(c.sprite, lerp(c.fx, ship.x, k), lerp(c.fy, ship.y, k), 0, 1 - k * 0.8, c.fly);
                return;
            }
            var y = c.y + (reduced ? 0 : Math.sin(t * 1.6 + c.bob) * 6);
            stamp(c.sprite, c.x, y, reduced ? 0 : Math.sin(t * 0.8 + c.bob) * 0.15);
            if (c.logo) ctx.drawImage(c.logo, c.x - c.r * 0.55, y - c.r * 0.55, c.r * 1.1, c.r * 1.1);
        });
    }

    function drawShip(t) {
        if (ship.state === "landed") return;
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle + Math.PI / 2);
        ctx.scale(ship.scale, ship.scale);

        if (ship.thrust > 0.05) {
            var f = (14 + ship.thrust * 26) * (reduced ? 1 : 0.85 + Math.random() * 0.3);
            var flame = ctx.createLinearGradient(0, 10, 0, 12 + f);
            flame.addColorStop(0, "rgba(224,231,255,.95)");
            flame.addColorStop(0.4, "rgba(129,140,248,.7)");
            flame.addColorStop(1, "rgba(79,70,229,0)");
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.moveTo(-6, 10);
            ctx.quadraticCurveTo(0, 14 + f * 1.1, 6, 10);
            ctx.fill();
        }

        var hull = ctx.createLinearGradient(0, -24, 0, 14);
        hull.addColorStop(0, "#f8fafc");
        hull.addColorStop(0.45, "#818cf8");
        hull.addColorStop(1, "#312e81");
        ctx.fillStyle = hull;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.bezierCurveTo(6, -14, 8, -2, 8, 6);
        ctx.lineTo(19, 14);
        ctx.lineTo(19, 17);
        ctx.lineTo(6, 13);
        ctx.lineTo(0, 15);
        ctx.lineTo(-6, 13);
        ctx.lineTo(-19, 17);
        ctx.lineTo(-19, 14);
        ctx.lineTo(-8, 6);
        ctx.bezierCurveTo(-8, -2, -6, -14, 0, -24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        var glass = ctx.createLinearGradient(0, -14, 0, 0);
        glass.addColorStop(0, "#e0f2fe");
        glass.addColorStop(1, "#38bdf8");
        ctx.fillStyle = glass;
        ctx.beginPath();
        ctx.ellipse(0, -8, 3.2, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // navigation lights on the wing tips
        var blink = reduced || Math.sin(t * 6) > 0;
        ctx.fillStyle = blink ? "#f87171" : "rgba(248,113,113,.3)";
        ctx.fillRect(-19.5, 13.5, 2.5, 2.5);
        ctx.fillStyle = blink ? "#4ade80" : "rgba(74,222,128,.3)";
        ctx.fillRect(17, 13.5, 2.5, 2.5);
        ctx.restore();
    }

    function drawParticles() {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        particles.forEach(function (p) {
            ctx.fillStyle = "rgba(" + p.c + "," + Math.max(0, p.life / p.max).toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // a lock-on reticle round the autopilot's target, and a pulse round anything in range
    function drawMarkers(t) {
        var target = auto && auto.body ? auto.body : null;
        [target, near].forEach(function (b, i) {
            if (!b || (i === 1 && b === target)) return;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(reduced ? 0 : t * (i ? -0.6 : 0.9));
            ctx.strokeStyle = i ? "rgba(52,211,153,.75)" : "rgba(199,210,254,.8)";
            ctx.lineWidth = 2 / cam.zoom;
            var rr = b.r * (b.kind === "core" ? 1.5 : 1) + 16 / cam.zoom;
            for (var k = 0; k < 4; k++) {
                ctx.beginPath();
                ctx.arc(0, 0, rr, k * Math.PI / 2 + 0.2, k * Math.PI / 2 + Math.PI / 2 - 0.2);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    function render(t) {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        var sky = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
        sky.addColorStop(0, "#0a1030");
        sky.addColorStop(1, "#02040d");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        drawStars();

        // the world, through the camera
        var z = cam.zoom;
        ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 - cam.x * z), DPR * (H / 2 - cam.y * z));

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        CLOUDS.forEach(function (c) {
            if (!onScreen(c.x, c.y, c.size)) return;
            var spr = cloudSprites[c.colour];
            ctx.globalAlpha = 0.55;
            ctx.drawImage(spr, c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
        });
        ctx.restore();

        drawRoute(t);
        drawOrbitPaths();
        rocks.forEach(function (rk) {
            if (onScreen(rk.x, rk.y, 40)) stamp(rk.sprite, rk.x, rk.y, rk.a + t * rk.spin);
        });
        bodies.forEach(function (b) { drawBody(b, t); });
        drawCrystals(t);
        drawMarkers(t);
        drawLabels();
        drawParticles();
        drawShip(t);

        // warp streaks while the autopilot is boosting across open space
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        var sp = Math.hypot(ship.vx, ship.vy);
        if (!reduced && sp > MAX_SPEED * 1.15) {
            var k = clamp((sp - MAX_SPEED * 1.15) / (WARP_SPEED - MAX_SPEED * 1.15), 0, 1);
            var dir = Math.atan2(ship.vy, ship.vx) + Math.PI;
            ctx.strokeStyle = "rgba(199,210,254," + (0.25 * k).toFixed(3) + ")";
            ctx.lineWidth = 1.2;
            for (var i = 0; i < 26; i++) {
                var R = seeded(i * 7 + Math.floor(t * 12));
                var sx = R() * W, sy = R() * H, len = 40 + R() * 120 * k;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + Math.cos(dir) * len, sy + Math.sin(dir) * len);
                ctx.stroke();
            }
        }
    }


    /* Minimap */
    var mini = $("uniMini");
    var mctx = mini ? mini.getContext("2d") : null;
    var MAP = (function () {
        var xs = WORLDS.map(function (w) { return w.x; }), ys = WORLDS.map(function (w) { return w.y; });
        bodies.forEach(function (b) { if (b.main) { xs.push(b.x); ys.push(b.y); } });
        var pad = 420;
        return { x0: Math.min.apply(null, xs) - pad, x1: Math.max.apply(null, xs) + pad,
                 y0: Math.min.apply(null, ys) - pad, y1: Math.max.apply(null, ys) + pad };
    })();
    var miniW = 0, miniH = 0;

    function miniPoint(x, y) {
        var s = Math.min(miniW / (MAP.x1 - MAP.x0), miniH / (MAP.y1 - MAP.y0));
        var ox = (miniW - (MAP.x1 - MAP.x0) * s) / 2, oy = (miniH - (MAP.y1 - MAP.y0) * s) / 2;
        return { x: ox + (x - MAP.x0) * s, y: oy + (y - MAP.y0) * s, s: s };
    }

    function drawMini(sizeOnly) {
        if (!mini || !mctx) return;
        var r = mini.getBoundingClientRect();
        if (!r.width) return;
        if (sizeOnly || miniW !== r.width) {
            miniW = r.width;
            miniH = r.height;
            mini.width = Math.round(miniW * 2);
            mini.height = Math.round(miniH * 2);
        }
        mctx.setTransform(2, 0, 0, 2, 0, 0);
        mctx.clearRect(0, 0, miniW, miniH);

        var nw = nextWorld();

        // the route, faint, so the dots read as a journey rather than a scatter
        mctx.strokeStyle = "rgba(129,140,248,.28)";
        mctx.lineWidth = 1;
        mctx.setLineDash([3, 3]);
        mctx.beginPath();
        var firstPt = true;
        WORLDS.forEach(function (w) {
            (w.id === "experience" ? w.mains : [{ x: w.x, y: w.y }]).forEach(function (s) {
                var p = miniPoint(s.x, s.y);
                if (firstPt) { mctx.moveTo(p.x, p.y); firstPt = false; }
                else mctx.lineTo(p.x, p.y);
            });
        });
        mctx.stroke();
        mctx.setLineDash([]);

        WORLDS.forEach(function (w) {
            var spots = w.id === "experience" ? w.mains : [{ x: w.x, y: w.y }];
            spots.forEach(function (s) {
                var p = miniPoint(s.x, s.y);
                var done = state.explored[w.id];
                mctx.fillStyle = done ? "#a5b4fc" : "rgba(148,158,198,.55)";
                mctx.beginPath();
                mctx.arc(p.x, p.y, done ? 3.4 : 2.6, 0, Math.PI * 2);
                mctx.fill();
                if (nw === w) {
                    mctx.strokeStyle = "rgba(52,211,153,.9)";
                    mctx.lineWidth = 1.2;
                    mctx.beginPath();
                    mctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                    mctx.stroke();
                }
            });
        });
        crystals.forEach(function (c) {
            if (c.taken) return;
            var p = miniPoint(c.x, c.y);
            mctx.fillStyle = rgba(c.skill.acc.charAt(0) === "#" ? c.skill.acc : "#818cf8", 0.8);
            mctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
        });

        // what the camera can see, and the ship
        var tl = miniPoint(cam.x - W / 2 / cam.zoom, cam.y - H / 2 / cam.zoom);
        var br = miniPoint(cam.x + W / 2 / cam.zoom, cam.y + H / 2 / cam.zoom);
        mctx.strokeStyle = "rgba(165,180,252,.35)";
        mctx.lineWidth = 1;
        mctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        var sp = miniPoint(ship.x, ship.y);
        mctx.save();
        mctx.translate(sp.x, sp.y);
        mctx.rotate(ship.angle + Math.PI / 2);
        mctx.fillStyle = "#ffffff";
        mctx.beginPath();
        mctx.moveTo(0, -5);
        mctx.lineTo(3.5, 4);
        mctx.lineTo(-3.5, 4);
        mctx.closePath();
        mctx.fill();
        mctx.restore();
    }

    if (mini) {
        mini.addEventListener("click", function (e) {
            var r = mini.getBoundingClientRect();
            var px = e.clientX - r.left, py = e.clientY - r.top;
            var best = null, bestD = 18;
            WORLDS.forEach(function (w) {
                var spots = w.id === "experience" ? w.mains : [w.mains[0]];
                spots.forEach(function (b) {
                    if (!b) return;
                    var p = miniPoint(b.x, b.y);
                    var d = Math.hypot(p.x - px, p.y - py);
                    if (d < bestD) { best = b; bestD = d; }
                });
            });
            if (best) flyTo(best, true);
            else {
                var s = miniPoint(0, 0).s, o = miniPoint(MAP.x0, MAP.y0);
                flyTo({ x: MAP.x0 + (px - o.x) / s, y: MAP.y0 + (py - o.y) / s });
            }
        });
    }


    /* HUD */
    var dots = $("uniDots");
    var nextBtn = $("uniNext");
    var compass = $("uniCompass");

    dots.innerHTML = WORLDS.map(function (w) {
        return '<li><button class="uni__dot" type="button" data-world="' + w.id + '" title="' + esc(w.name + " · " + w.kicker) + '">' +
               icon(w.icon) + '<span class="sr-only">' + esc(w.name + ", " + w.kicker) + "</span></button></li>";
    }).join("");

    function renderHud() {
        var n = exploredCount();
        $("uniCount").textContent = n + "/" + WORLDS.length;
        all(".uni__dot", dots).forEach(function (d) {
            var on = !!state.explored[d.getAttribute("data-world")];
            d.classList.toggle("is-on", on);
            d.setAttribute("aria-pressed", String(on));
        });
        var nw = nextWorld();
        $("uniNextLabel").textContent = nw ? nw.name : "Mission report";
        $("uniNextKicker").textContent = nw ? "Next · " + nw.kicker : "Universe explored";
        $("uniCrystals").textContent = crystalCount() + "/" + crystals.length;
        renderMapList();
    }

    dots.addEventListener("click", function (e) {
        var d = e.target.closest(".uni__dot");
        if (!d) return;
        var w = WORLD[d.getAttribute("data-world")];
        flyTo(nextBodyOf(w), true);
    });

    nextBtn.addEventListener("click", function () {
        sound.play("click");
        var nw = nextWorld();
        if (!nw) { openFinale(); return; }
        flyTo(nextBodyOf(nw), true);
    });

    function updateCompass() {
        var nw = nextWorld();
        var target = auto && auto.body ? auto.body : (nw ? nextBodyOf(nw) : null);
        if (!target || landed || !started) { compass.hidden = true; return; }
        var s = toScreen(target.x, target.y);
        var m = 70;
        if (s.x > m && s.x < W - m && s.y > m && s.y < H - m) { compass.hidden = true; return; }
        var cx = W / 2, cy = H / 2, dx = s.x - cx, dy = s.y - cy;
        var k = Math.min((W / 2 - m) / Math.abs(dx || 1), (H / 2 - m) / Math.abs(dy || 1));
        compass.hidden = false;
        compass.style.transform = "translate(" + (cx + dx * k) + "px," + (cy + dy * k) + "px)";
        $("uniCompassArrow").style.transform = "rotate(" + Math.atan2(dy, dx) + "rad)";
        var w = WORLD[target.world];
        $("uniCompassName").textContent = target.main ? (w.id === "experience" ? target.name : w.name) : target.name;
        $("uniCompassDist").textContent = (Math.hypot(target.x - ship.x, target.y - ship.y) / 100).toFixed(1) + " ly";
    }


    /* Map - every world as a list, for a quick jump or a keyboard */
    var mapEl = $("uniMap");
    var mapList = $("uniMapList");

    function renderMapList() {
        mapList.innerHTML = WORLDS.map(function (w) {
            var done = state.explored[w.id];
            return '<li><button class="uni-map__item' + (done ? " is-on" : "") + '" type="button" data-world="' + w.id + '">' +
                '<span class="uni-map__icon">' + icon(done ? "check" : w.icon) + "</span>" +
                '<span class="uni-map__copy"><b>' + esc(w.name) + "</b><span>" + esc(w.kicker) + "</span></span>" +
                '<span class="uni-map__go">' + (done ? "Revisit" : "Fly here") + icon("arrow") + "</span></button></li>";
        }).join("");
    }

    function openMap() {
        mapEl.hidden = false;
        requestAnimationFrame(function () { mapEl.classList.add("is-open"); });
        var first = mapList.querySelector("button");
        if (first) first.focus();
    }
    function closeMap() {
        mapEl.classList.remove("is-open");
        setTimeout(function () { mapEl.hidden = true; }, 250);
    }
    $("uniMapBtn").addEventListener("click", function () { if (mapEl.hidden) openMap(); else closeMap(); });
    mapEl.addEventListener("click", function (e) {
        if (e.target.closest("[data-map-close]")) { closeMap(); return; }
        var item = e.target.closest(".uni-map__item");
        if (!item) return;
        closeMap();
        flyTo(nextBodyOf(WORLD[item.getAttribute("data-world")]), true);
    });


    /* The landing panel */
    var panel = $("uniPanel");
    var panelBody = $("uniPanelBody");

    function openBody(b) {
        state.visited[b.id] = true;
        var w = WORLD[b.world];
        var wasExplored = state.explored[w.id];
        if (w.mains.every(function (m) { return state.visited[m.id]; })) state.explored[w.id] = true;
        if (!state.started) state.started = Date.now();
        save();

        showView(b, viewFor(b));
        panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add("is-open"); });
        uni.classList.add("is-landed");
        var close = $("uniPanelClose");
        if (close) close.focus({ preventScroll: true });

        if (!wasExplored && state.explored[w.id]) {
            sound.play("world");
            notify(w.name + " explored", exploredCount() + " of " + WORLDS.length + " worlds", w.icon);
        }
        renderHud();
    }

    function closePanel() {
        panel.classList.remove("is-open");
        uni.classList.remove("is-landed");
        setTimeout(function () { if (!panel.classList.contains("is-open")) panel.hidden = true; }, 350);
        if (exploredCount() === WORLDS.length && !state.finished) {
            state.finished = Date.now();
            save();
            setTimeout(openFinale, 900);
        }
    }

    // the panel holds a view; some views open a second one with a way back
    var viewStack = [];

    function showView(b, view, push) {
        if (push) viewStack.push(view);
        else viewStack = [view];
        var w = WORLD[b.world];
        $("uniPanelKicker").textContent = view.kicker || w.kicker;
        $("uniPanelTitle").textContent = view.title;
        panelBody.innerHTML = (viewStack.length > 1
            ? '<button class="up-back" type="button" data-back>' + icon("back") + "<span>" + esc(viewStack[viewStack.length - 2].title) + "</span></button>"
            : "") + view.html;
        panelBody.scrollTop = 0;
        panel.setAttribute("data-world", w.id);
        wireImages(panelBody);

        var prev = WORLDS[w.index - 1];
        var pb = $("uniPrev"), nb = $("uniNextWorld");
        var ahead = stepAfter(b);
        pb.hidden = !prev;
        nb.hidden = !ahead;
        if (prev) pb.querySelector("span").textContent = prev.name;
        if (ahead) nb.querySelector("span").textContent = ahead.main && ahead.world !== "experience" ? WORLD[ahead.world].name : ahead.name;
        $("uniClassic").setAttribute("data-to", "#" + w.id);
    }

    panelBody.addEventListener("click", function (e) {
        var t = e.target;
        var b = landed;
        if (!b) return;
        if (t.closest("[data-back]")) {
            viewStack.pop();
            var prev = viewStack.pop();
            showView(b, prev, viewStack.length > 0);
            if (viewStack.length === 0) viewStack = [prev];
            return;
        }
        var proj = t.closest("[data-project]");
        if (proj) { showView(b, projectView(+proj.getAttribute("data-project")), true); return; }
        var club = t.closest("[data-club]");
        if (club) { showView(b, clubView(+club.getAttribute("data-club")), true); return; }
        var skill = t.closest("[data-skill]");
        if (skill) { showSkill(+skill.getAttribute("data-skill")); return; }
        var fly = t.closest("[data-fly]");
        if (fly) { flyTo(BODY[fly.getAttribute("data-fly")], true); return; }
        var copy = t.closest("[data-copy]");
        if (copy) { copyText(copy.getAttribute("data-copy"), copy); return; }
        var classic = t.closest("[data-classic]");
        if (classic) { e.preventDefault(); switchView("classic", classic.getAttribute("data-classic")); }
    });

    $("uniPanelClose").addEventListener("click", function () { takeOff(); });
    $("uniPrev").addEventListener("click", function () {
        var w = WORLDS[WORLD[landed ? landed.world : "about"].index - 1];
        if (w) flyTo(nextBodyOf(w), true);
    });
    $("uniNextWorld").addEventListener("click", function () {
        if (landed) flyTo(stepAfter(landed), true);
    });

    // the next stop on the route: the rest of this world first, then the next world
    function stepAfter(b) {
        var w = WORLD[b.world];
        var left = w.mains.filter(function (m) { return m !== b && !state.visited[m.id]; });
        if (left.length) return left[0];
        var next = WORLDS[w.index + 1];
        return next ? nextBodyOf(next) : null;
    }
    $("uniClassic").addEventListener("click", function () { switchView("classic", this.getAttribute("data-to")); });

    function copyText(value, btn) {
        function done() {
            btn.classList.add("is-done");
            var label = btn.querySelector("[data-copy-label]");
            if (label) label.textContent = "Copied";
            setTimeout(function () {
                btn.classList.remove("is-done");
                if (label) label.textContent = "Copy";
            }, 1800);
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(done, function () { fallback(); });
        } else {
            fallback();
        }
        function fallback() {
            var ta = document.createElement("textarea");
            ta.value = value;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            uni.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); done(); } catch (e) { /* give up quietly */ }
            ta.remove();
        }
    }

    // a picture that is not uploaded yet becomes a tidy emblem instead of a broken image
    function wireImages(scope) {
        all("img[data-fallback]", scope).forEach(function (im) {
            function swap() {
                var mark = document.createElement("span");
                mark.className = "up-emblem";
                mark.setAttribute("aria-hidden", "true");
                var f = im.getAttribute("data-fallback");
                mark.innerHTML = ICON[f] ? icon(f) : esc(f);
                im.replaceWith(mark);
            }
            if (im.complete && !im.naturalWidth) swap();
            else im.addEventListener("error", swap);
        });
    }

    function imgTag(p, fallback, cls) {
        if (!p || !p.src) return '<span class="up-emblem' + (cls ? " " + cls : "") + '" aria-hidden="true">' + (ICON[fallback] ? icon(fallback) : esc(fallback)) + "</span>";
        return '<img class="' + (cls || "") + '" src="' + esc(p.src) + '" alt="' + esc(p.alt || "") + '" data-fallback="' + esc(fallback) + '" loading="lazy">';
    }

    function chips(list, cls) {
        return '<ul class="up-chips' + (cls ? " " + cls : "") + '">' + list.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>";
    }

    function ticks(list) {
        return '<ul class="up-ticks">' + list.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>";
    }

    function cvLink() {
        var cv = $("cvContact");
        var ready = cv && !cv.classList.contains("is-missing") && cv.getAttribute("href");
        return ready
            ? '<a class="up-btn up-btn--ghost" href="' + esc(cv.getAttribute("href")) + '" download>' + icon("down") + "<span>Download CV</span></a>"
            : '<span class="up-btn up-btn--ghost is-off" title="CV will be available shortly">' + icon("down") + "<span>Download CV</span></span>";
    }

    /* Panel views */
    function viewFor(b) {
        if (b.world === "about") return aboutView();
        if (b.world === "education") return b.main ? educationView() : schoolView(b.ref);
        if (b.world === "skills") return skillsView();
        if (b.world === "projects") return b.main ? projectsView() : projectView(b.ref);
        if (b.world === "experience") return roleView(b.ref);
        if (b.world === "achievements") return b.main ? honoursView() : awardView(b.ref);
        if (b.world === "activities") return b.main ? clubsView() : clubView(b.ref);
        return contactView();
    }

    function aboutView() {
        var a = C.about;
        return {
            title: "Meet the pilot",
            html:
                '<div class="up-about">' +
                    '<figure class="up-photo">' + imgTag(a.photo, "user") +
                        (a.cgpa ? '<figcaption><b>' + esc(a.cgpa) + "</b><span>Current CGPA</span></figcaption>" : "") +
                    "</figure>" +
                    '<p class="up-lead">' + a.lead + "</p>" +
                "</div>" +
                a.paras.map(function (p) { return '<p class="up-text">' + esc(p) + "</p>"; }).join("") +
                '<dl class="up-facts">' + a.facts.map(function (f) {
                    return "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>";
                }).join("") + "</dl>" +
                '<blockquote class="up-quote">' + esc(a.lede) + "</blockquote>" +
                '<div class="up-btns">' +
                    '<a class="up-btn" href="' + esc(C.contact.linkedin) + '" target="_blank" rel="noopener">' + icon("linkedin") + "<span>LinkedIn</span></a>" +
                    '<a class="up-btn up-btn--ghost" href="' + esc(C.contact.github) + '" target="_blank" rel="noopener">' + icon("github") + "<span>GitHub</span></a>" +
                    cvLink() +
                "</div>"
        };
    }

    function schoolCard(s, i) {
        return '<li class="up-school">' +
            '<span class="up-logo">' + imgTag(s.logo, "cap") + "</span>" +
            '<div><p class="up-years">' + esc(s.years) + (s.badge ? ' <span class="up-live">' + esc(s.badge) + "</span>" : "") + "</p>" +
            "<h3>" + esc(s.school) + "</h3>" +
            '<p class="up-sub">' + esc(s.degree) + "</p>" +
            '<p class="up-meta">' + esc(s.meta) + "</p></div>" +
            (i != null ? '<button class="up-mini" type="button" data-fly="school-' + i + '">Visit moon</button>' : "") +
            "</li>";
    }

    function educationView() {
        var e = C.education;
        return {
            title: "Where the foundation was built",
            html: '<p class="up-text">' + esc(e.lede) + "</p>" +
                  '<ol class="up-schools">' + e.schools.map(function (s, i) { return schoolCard(s, i); }).join("") + "</ol>"
        };
    }

    function schoolView(i) {
        var s = C.education.schools[i];
        return {
            kicker: "Education · " + s.short,
            title: s.school,
            html: '<ol class="up-schools up-schools--one">' + schoolCard(s) + "</ol>" +
                  '<p class="up-text">One of the three schools on my journey. Land on Academy for the whole timeline.</p>' +
                  '<div class="up-btns"><button class="up-btn up-btn--ghost" type="button" data-fly="academy">' + icon("cap") + "<span>Fly to Academy</span></button></div>"
        };
    }

    function skillsView() {
        var s = C.skills, got = crystalCount();
        var ai = s.ai;
        return {
            title: "The tools I build with",
            html:
                '<p class="up-text">' + esc(s.lede.replace(/ Filter by discipline.*$/, "")) + "</p>" +
                '<p class="up-meter"><b>' + got + " of " + crystals.length + "</b> skill crystals collected" +
                (got < crystals.length ? " &mdash; fly through the nebula to collect the rest." : ". Every one of them.") + "</p>" +
                '<ul class="up-skills">' + s.list.map(function (k, i) {
                    var have = crystals[i] && crystals[i].taken;
                    return '<li><button type="button" class="up-skill' + (have ? " is-on" : "") + '" data-skill="' + i + '" style="--acc:' + esc(k.acc) + '">' +
                           '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + esc(k.icon) + '"></use></svg>' +
                           "<b>" + esc(k.name) + "</b><span>" + esc(k.cat) + "</span></button></li>";
                }).join("") + "</ul>" +
                '<div class="up-skill-note" id="uniSkillNote" aria-live="polite">Pick any skill to see where it fits.</div>' +
                (ai ? '<section class="up-ai">' +
                        '<p class="up-kick">' + esc(ai.badge) + "</p>" +
                        "<h3>" + esc(ai.title) + "</h3>" +
                        '<blockquote class="up-quote">' + esc(ai.quote) + "<cite>" + esc(ai.by) + "</cite></blockquote>" +
                        '<p class="up-text">' + esc(ai.text) + "</p>" +
                        '<ul class="up-practice">' + ai.practices.map(function (p) {
                            return "<li><b>" + esc(p.name) + "</b><span>" + esc(p.text) + "</span></li>";
                        }).join("") + "</ul></section>" : "")
        };
    }

    function showSkill(i) {
        var k = C.skills.list[i];
        var note = $("uniSkillNote");
        if (!k || !note) return;
        all(".up-skill", panelBody).forEach(function (b, j) { b.classList.toggle("is-picked", j === i); });
        note.innerHTML = "<b>" + esc(k.name) + "</b> <span>" + esc(k.cat) + "</span><p>" + esc(k.exp) + "</p>";
    }

    function projectThumb(p, big) {
        return '<span class="up-thumb' + (big ? " up-thumb--big" : "") + '" style="--c1:' + esc(p.c1) + ";--c2:" + esc(p.c2) + '">' +
               (p.shot ? '<img src="' + esc(p.shot) + '" alt="" loading="lazy" onerror="this.remove()">' : "") +
               "<i>" + esc(initials(p.name) || p.name.charAt(0)) + "</i></span>";
    }

    function projectsView() {
        var list = C.projects.list;
        return {
            title: "Things I have built",
            html: '<p class="up-text">' + esc(C.projects.lede.replace(/ Open any card.*$/, "")) + "</p>" +
                  '<p class="up-meter">Every station orbiting the Shipyard is a project. Dock at one, or pick it here.</p>' +
                  '<ul class="up-projects">' + list.map(function (p, i) {
                      return '<li><button type="button" class="up-project" data-project="' + i + '">' + projectThumb(p) +
                             '<span class="up-project__copy"><span class="up-kick">' + esc(p.cat) + (p.demo ? ' <em class="up-live">Live</em>' : "") + "</span>" +
                             "<b>" + esc(p.name) + "</b><span>" + esc(p.blurb) + "</span></span></button></li>";
                  }).join("") + "</ul>"
        };
    }

    function projectView(i) {
        var p = C.projects.list[i];
        return {
            kicker: "Projects · " + p.cat,
            title: p.name,
            html: projectThumb(p, true) +
                  '<p class="up-lead">' + esc(p.lede) + "</p>" +
                  (p.highlights.length ? '<h4 class="up-h">Highlights</h4>' + ticks(p.highlights) : "") +
                  '<h4 class="up-h">Built with</h4>' + chips(p.stack) +
                  '<div class="up-btns">' +
                      (p.demo ? '<a class="up-btn" href="' + esc(p.demo) + '" target="_blank" rel="noopener">' + icon("out") + "<span>Live demo</span></a>"
                              : '<span class="up-btn is-off" title="Not deployed yet">' + icon("out") + "<span>Live demo</span></span>") +
                      (p.repo ? '<a class="up-btn up-btn--ghost" href="' + esc(p.repo) + '" target="_blank" rel="noopener">' + icon("github") + "<span>View code</span></a>" : "") +
                  "</div>"
        };
    }

    function roleView(ref) {
        var r = C.experience.roles[ref];
        var others = bodies.filter(function (b) { return b.world === "experience" && b.ref !== ref; });
        return {
            kicker: "Experience · " + r.when,
            title: r.role,
            html: '<header class="up-company">' +
                      '<span class="up-logo up-logo--square">' + imgTag(r.logo, r.mark || initials(r.org)) + "</span>" +
                      "<div><b>" + esc(r.org) + "</b><span>" + esc(r.when) + " &middot; " + esc(r.kind) + "</span></div>" +
                      (r.now ? '<span class="up-live">Current</span>' : "") +
                  "</header>" +
                  '<p class="up-lead">' + esc(r.summary) + "</p>" +
                  ticks(r.list) +
                  '<h4 class="up-h">Stack</h4>' + chips(r.stack) +
                  others.map(function (o) {
                      var or = C.experience.roles[o.ref];
                      return '<button class="up-next" type="button" data-fly="' + o.id + '"><span class="up-kick">Also in the Career Belt</span>' +
                             "<b>" + esc(or.role) + " at " + esc(or.org) + "</b>" + icon("arrow") + "</button>";
                  }).join("")
        };
    }

    function awardCard(a, i) {
        return '<article class="up-award">' +
            '<span class="up-medal">' + imgTag(a.img, "medal") + "</span>" +
            '<div><p class="up-kick">' + esc(a.year) + " &middot; " + esc(a.by) + "</p>" +
            "<h3>" + esc(a.title) + "</h3>" +
            '<p class="up-text">' + esc(a.text) + "</p>" +
            '<dl class="up-facts up-facts--tight">' + a.facts.map(function (f) {
                return '<div class="' + (f.key ? "is-key" : "") + '"><dt>' + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>";
            }).join("") + "</dl></div>" +
            (i != null ? "" : "") +
            "</article>";
    }

    function honoursView() {
        var h = C.achievements;
        return {
            title: "Earned long before the first commit",
            html: '<p class="up-text">' + esc(h.lede) + "</p>" +
                  '<ul class="up-stats">' + h.stats.map(function (s) {
                      return "<li><b>" + esc(s.num) + "</b><span>" + esc(s.label) + "</span><small>" + esc(s.note) + "</small></li>";
                  }).join("") + "</ul>" +
                  h.awards.map(function (a) { return awardCard(a); }).join("") +
                  '<p class="up-text up-creed">' + h.creed + "</p>" + chips(h.values)
        };
    }

    function awardView(i) {
        var a = C.achievements.awards[i];
        return {
            kicker: "Achievements · " + a.year,
            title: a.title,
            html: awardCard(a, i) +
                  '<div class="up-btns"><button class="up-btn up-btn--ghost" type="button" data-fly="hall">' + icon("medal") + "<span>Fly to the Hall of Honours</span></button></div>"
        };
    }

    function clubsView() {
        var a = C.activities;
        return {
            title: "Leading outside the lecture hall",
            html: '<p class="up-text">' + esc(a.lede.replace(/ Pick any club.*$/, "")) + "</p>" +
                  '<ul class="up-chips up-chips--bold">' + a.summary.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>" +
                  '<ul class="up-clubs">' + a.clubs.map(function (c, i) {
                      return '<li><button type="button" class="up-club" data-club="' + i + '">' +
                             '<span class="up-club__icon"><svg class="ui-i" viewBox="0 0 24 24" aria-hidden="true">' + c.icon + "</svg></span>" +
                             '<span class="up-club__copy"><span class="up-kick">' + esc(c.role) + "</span><b>" + esc(c.name) + "</b></span>" +
                             icon("arrow") + "</button></li>";
                  }).join("") + "</ul>"
        };
    }

    function clubView(i) {
        var c = C.activities.clubs[i];
        return {
            kicker: "Activities · " + c.role,
            title: c.name,
            html: '<header class="up-company">' +
                      '<span class="up-club__icon up-club__icon--big"><svg class="ui-i" viewBox="0 0 24 24" aria-hidden="true">' + c.icon + "</svg></span>" +
                      "<div><b>" + esc(c.role) + "</b><span>" + esc(c.org) + "</span></div>" +
                  "</header>" +
                  '<p class="up-lead">' + esc(c.lede) + "</p>" +
                  '<ol class="up-steps">' + c.steps.map(function (s) {
                      return "<li><b>" + esc(s.tag) + "</b><span>" + esc(s.text) + "</span></li>";
                  }).join("") + "</ol>" +
                  '<h4 class="up-h">Highlights</h4>' + chips(c.chips)
        };
    }

    function contactView() {
        var c = C.contact;
        var time = "";
        try {
            time = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date());
        } catch (e) { /* the clock is a nicety */ }
        var subject = encodeURIComponent("Hello from your portfolio");
        return {
            title: "Let’s build something",
            html: '<p class="up-text">' + esc(c.lede) + "</p>" +
                  '<ul class="up-reach">' +
                      '<li><span class="up-reach__icon">' + icon("mail") + "</span><span><small>Email</small><b>" + esc(c.email) + "</b></span>" +
                          '<button class="up-mini" type="button" data-copy="' + esc(c.email) + '"><span data-copy-label>Copy</span></button></li>' +
                      '<li><span class="up-reach__icon">' + icon("linkedin") + "</span><span><small>LinkedIn</small><b>" + esc(c.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")) + "</b></span>" +
                          '<a class="up-mini" href="' + esc(c.linkedin) + '" target="_blank" rel="noopener">Open</a></li>' +
                      '<li><span class="up-reach__icon">' + icon("github") + "</span><span><small>GitHub</small><b>" + esc(c.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")) + "</b></span>" +
                          '<a class="up-mini" href="' + esc(c.github) + '" target="_blank" rel="noopener">Open</a></li>' +
                      '<li><span class="up-reach__icon">' + icon("pin") + "</span><span><small>Based in</small><b>Savar, Dhaka" + (time ? " &middot; " + esc(time) + " local" : "") + "</b></span></li>" +
                  "</ul>" +
                  '<div class="up-btns">' +
                      '<a class="up-btn" href="mailto:' + esc(c.email) + "?subject=" + subject + '">' + icon("mail") + "<span>Send an email</span></a>" +
                      cvLink() +
                      '<a class="up-btn up-btn--ghost" href="#contact" data-classic="#contact">' + icon("signal") + "<span>Write a message</span></a>" +
                  "</div>"
        };
    }


    /* Input - keys to fly, a pointer to steer or to pick a destination */
    function typing() {
        var a = document.activeElement;
        return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
    }

    function setKey(e, down) {
        var k = e.key, c = e.code;
        if (k === "ArrowUp" || c === "KeyW") keys.up = down;
        else if (k === "ArrowDown" || c === "KeyS") keys.down = down;
        else if (k === "ArrowLeft" || c === "KeyA") keys.left = down;
        else if (k === "ArrowRight" || c === "KeyD") keys.right = down;
        else if (k === "Shift") keys.boost = down;
        else return false;
        return true;
    }

    document.addEventListener("keydown", function (e) {
        if (mode !== "game" || typing()) return;
        if (e.key === "Escape") {
            if (!finale.hidden) closeFinale();
            else if (!mapEl.hidden) closeMap();
            else if (landed) takeOff();
            return;
        }
        if (!finale.hidden || !mapEl.hidden) return;
        if (landed) return;                          // the panel has the keyboard while landed
        if (setKey(e, true)) {
            if (started) e.preventDefault();
            return;
        }
        var onStage = e.target === document.body || e.target === canvas;
        if (near && (e.code === "KeyE" || ((e.key === " " || e.key === "Enter") && onStage))) {
            e.preventDefault();
            land(near);
        } else if (e.code === "KeyN" && !e.ctrlKey && !e.metaKey) {
            nextBtn.click();
        } else if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey) {
            openMap();
        }
    });
    document.addEventListener("keyup", function (e) { setKey(e, false); });
    window.addEventListener("blur", function () { keys.up = keys.down = keys.left = keys.right = keys.boost = false; steer = null; });

    var press = null;
    canvas.addEventListener("pointerdown", function (e) {
        press = { x: e.clientX, y: e.clientY, at: performance.now(), id: e.pointerId };
        if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
        // holding still steers after a moment; a quick tap picks a destination instead
        press.timer = setTimeout(function () {
            if (press && !landed) steer = { sx: press.x, sy: press.y };
        }, 200);
    });
    canvas.addEventListener("pointermove", function (e) {
        if (press) {
            press.x = e.clientX;
            press.y = e.clientY;
            if (steer) { steer.sx = e.clientX; steer.sy = e.clientY; }
        }
        // a hand cursor over anything that can be visited
        var p = toWorld(e.clientX, e.clientY);
        canvas.style.cursor = bodyAt(p.x, p.y, 30) ? "pointer" : (steer ? "grabbing" : "crosshair");
    });
    function release(e) {
        if (!press) return;
        clearTimeout(press.timer);
        var tap = !steer && performance.now() - press.at < 260;
        if (tap) {
            var p = toWorld(e.clientX, e.clientY);
            var b = bodyAt(p.x, p.y, 34);
            // while landed, only another world is worth leaving for
            if (b && b !== landed) flyTo(b, true);
            else if (!b && !landed) flyTo({ x: p.x, y: p.y });
        }
        steer = null;
        press = null;
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", function () { if (press) clearTimeout(press.timer); press = null; steer = null; });


    /* Starting, and the finale */
    var finale = $("uniFinale");
    var started = false;

    // every switch between the views goes out as one event, which the classic
    // page hears too, so the two always agree on which one is showing
    function switchView(m, to) {
        document.dispatchEvent(new CustomEvent("kt:mode", { detail: { mode: m, to: to } }));
    }

    function startGame() {
        started = true;
        uni.classList.add("is-playing");
        if (state.sound) sound.unlock();
        canvas.focus({ preventScroll: true });
        if (!state.heard.welcome) {
            state.heard.welcome = true;
            save();
            setTimeout(function () {
                transmit(touchFirst
                    ? "Welcome aboard. Tap anywhere to fly there, or tap a world to land on it. Origin is right ahead."
                    : "Welcome aboard. Fly with WASD or the arrow keys, or click anywhere to set a course. Origin is right ahead.");
            }, 700);
        } else {
            setTimeout(function () { transmit("Welcome back, pilot. " + exploredCount() + " of " + WORLDS.length + " worlds explored so far."); }, 600);
        }
    }

    all("[data-uni-classic]").forEach(function (b) {
        b.addEventListener("click", function () { switchView("classic", "#home"); });
    });

    function openFinale() {
        var ms = state.finished && state.started ? state.finished - state.started : 0;
        var row = $("uniFinaleTimeRow");
        if (ms > 0 && ms < 3 * 3600 * 1000) {
            var s = Math.round(ms / 1000);
            $("uniFinaleTime").textContent = (s >= 60 ? Math.floor(s / 60) + "m " : "") + (s % 60) + "s";
            row.hidden = false;
        } else {
            row.hidden = true;
        }
        $("uniFinaleSkills").textContent = crystalCount() + "/" + crystals.length;
        finale.hidden = false;
        requestAnimationFrame(function () { finale.classList.add("is-open"); });
        sound.play("finale");
        var first = finale.querySelector(".up-btn");
        if (first) first.focus();
        burst(ship.x, ship.y, "#fbbf24", 40);
    }
    function closeFinale() {
        finale.classList.remove("is-open");
        setTimeout(function () { finale.hidden = true; }, 350);
    }
    finale.addEventListener("click", function (e) {
        var t = e.target;
        if (t.closest("[data-finale-close]")) { closeFinale(); return; }
        if (t.closest("[data-finale-contact]")) { closeFinale(); flyTo(BODY.beacon, true); return; }
        var classic = t.closest("[data-classic]");
        if (classic) { e.preventDefault(); closeFinale(); switchView("classic", classic.getAttribute("data-classic")); }
    });


    /* Sound toggle */
    var soundBtn = $("uniSound");
    function paintSound() {
        soundBtn.setAttribute("aria-pressed", String(!!state.sound));
        soundBtn.classList.toggle("is-on", !!state.sound);
        soundBtn.title = state.sound ? "Sound on" : "Sound off";
    }
    soundBtn.addEventListener("click", function () {
        state.sound = !state.sound;
        save();
        paintSound();
        if (state.sound) { sound.unlock(); sound.play("click"); }
    });
    paintSound();


    /* Modes - the universe, or the classic page */
    var mode = "classic";
    var enterBtn = $("uniEnter");
    var classicParts = all("body > .nav, body > main, body > footer, body > .mobile, body > .mobile__scrim, body > .scroll-progress");

    function setMode(m, to) {
        mode = m;
        try { localStorage.setItem("kt-mode", m); } catch (e) { /* ignore */ }
        var game = m === "game";
        uni.hidden = !game;
        root.classList.toggle("is-universe", game);
        classicParts.forEach(function (el) {
            if (game) el.setAttribute("inert", "");
            else el.removeAttribute("inert");
        });
        if (enterBtn) enterBtn.hidden = game;

        if (game) {
            resize();
            run();
            if (!started) startGame();
            else canvas.focus({ preventScroll: true });
        } else {
            stop();
            if (landed) { landed = null; ship.state = "flying"; closePanel(); }
            if (to) {
                var el = document.querySelector(to);
                if (el) setTimeout(function () { el.scrollIntoView(); }, 30);
            }
        }
    }

    if (enterBtn) enterBtn.addEventListener("click", function () { switchView("game"); });


    /* The loop */
    var running = false, rafId = 0, last = 0, clock = 0, miniTick = 0;

    function frame(now) {
        if (!running) return;
        var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
        last = now;
        clock += dt;
        update(dt, clock);
        render(clock);
        updateCompass();
        if ((miniTick = (miniTick + 1) % 3) === 0) drawMini();
        rafId = requestAnimationFrame(frame);
    }
    function run() {
        if (running) return;
        running = true;
        last = 0;
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
    }

    window.addEventListener("resize", function () { if (mode === "game") resize(); });
    document.addEventListener("visibilitychange", function () {
        if (mode !== "game") return;
        if (document.hidden) stop();
        else run();
    });


    /* Start - the universe waits to be chosen. The welcome screen, the
       "Explore as a game" button and the buttons in here all send the same
       kt:mode event, and this is where it is answered. */
    renderHud();
    all(".uni__face").forEach(function (im) { if (C.portrait && C.portrait.src) im.src = C.portrait.src; });
    $("uniHintKeys").hidden = touchFirst;
    $("uniHintTouch").hidden = !touchFirst;

    document.addEventListener("kt:mode", function (e) {
        var d = e.detail || {};
        setMode(d.mode === "game" ? "game" : "classic", d.to);
    });
})();
