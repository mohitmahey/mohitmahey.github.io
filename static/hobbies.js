/* Hobbies map.
 *
 * The land in hobbies.html was drawn with the Natural Earth I projection.
 * projectPoint below is that same projection, with the same scale and the
 * same translation, so a pin computed here lands exactly on the coastline
 * drawn there. Change one and you must change the other.
 *
 * No map library, no tile server, no third-party request: the site loads
 * nothing it does not host, and this page keeps that promise.
 */
(function () {
  'use strict';

  var K = 200, TX = 547.2, TY = 274.4;
  // The viewBox the map is drawn in. Must match hobbies.html.
  var MAP_W = 1094, MAP_H = 470;

  function projectPoint(lon, lat) {
    var lam = lon * Math.PI / 180, phi = lat * Math.PI / 180;
    var p2 = phi * phi, p4 = p2 * p2;
    var x = lam * (0.8707 - 0.131979 * p2 +
            p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    var y = phi * (1.007226 + p2 * (0.015085 +
            p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [K * x + TX, TY - K * y];
  }

  // CHAIN, PLACES and PHOTOS all come from places.js.
  var THUMB_W = 168, THUMB_H = 126, GAP = 14;

  var NS = "http://www.w3.org/2000/svg";
  function make(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  var atlas = document.querySelector(".atlas");
  var svg = atlas && atlas.querySelector("svg");
  if (!svg) return;

  var routes = make("g", { class: "routes" });
  var leaders = make("g", { class: "leaders" });
  var pinLayer = make("g", { class: "pins" });
  // One text node in a layer of its own, above every pin. Raising the hovered
  // pin instead would restart its arrival animation on each pass.
  var hoverName = make("text", { class: "hovername" });

  // One reused thumbnail. Its href is set at the moment of hover, so no
  // photograph is fetched until somebody asks for one.
  // Two nested groups on purpose. A CSS transform on an element beats its
  // transform attribute outright, so the placement lives on the outer group
  // and the entrance on the inner one.
  var thumbPos = make("g", { class: "thumb-pos" });
  var thumb = make("g", { class: "thumb" });
  thumbPos.appendChild(thumb);
  var thumbFrame = make("rect", { class: "thumb-frame", width: THUMB_W, height: THUMB_H, rx: 3 });
  var thumbImg = make("image", {
    width: THUMB_W, height: THUMB_H, preserveAspectRatio: "xMidYMid slice"
  });
  var clipId = "thumb-clip";
  var defs = make("defs");
  var clip = make("clipPath", { id: clipId });
  var clipRect = make("rect", { width: THUMB_W, height: THUMB_H, rx: 3 });
  clip.appendChild(clipRect); defs.appendChild(clip); svg.appendChild(defs);
  thumbImg.setAttribute("clip-path", "url(#" + clipId + ")");
  thumb.appendChild(thumbImg);
  thumb.appendChild(thumbFrame);

  svg.appendChild(routes);
  svg.appendChild(leaders);
  svg.appendChild(pinLayer);
  svg.appendChild(thumbPos);
  svg.appendChild(hoverName);

  // The thumbnail prefers to sit above and right of its pin, and flips
  // wherever the map edge is closer than the picture is wide.
  function placeThumb(x, y) {
    var tx = x + GAP;
    var ty = y - GAP - THUMB_H;
    if (tx + THUMB_W > MAP_W - 4) tx = x - GAP - THUMB_W;
    if (tx < 4) tx = 4;
    if (ty < 4) ty = y + GAP;
    if (ty + THUMB_H > MAP_H - 4) ty = MAP_H - 4 - THUMB_H;
    thumbPos.setAttribute("transform", "translate(" + tx.toFixed(1) + " " + ty.toFixed(1) + ")");
    clipRect.setAttribute("x", 0); clipRect.setAttribute("y", 0);
  }

  var current = null;
  var byName = {};

  function show(pin, place) {
    if (current && current !== pin) current.classList.remove("is-on");
    current = pin;
    if (!pin) {
      hoverName.textContent = "";
      thumb.classList.remove("is-on");
      return;
    }
    pin.classList.add("is-on");
    var p = byName[place[0]];

    var file = PHOTOS[place[0]];
    if (file) {
      thumbImg.setAttribute("href", "/static/photos/" + file + ".jpg");
      thumbImg.setAttribute("aria-label", place[0]);
      placeThumb(p.x, p.y);
      thumb.classList.add("is-on");
    } else {
      thumb.classList.remove("is-on");
    }

    // A pin that already prints its name does not need a second one.
    if (SHOW_LABELS && place[5]) { hoverName.textContent = ""; return; }
    // Beside the head of the teardrop, not the point it stands on: the point
    // is underneath the pin.
    var r = place[5] ? R_NAMED : R_PLAIN;
    var right = p.x > 800;
    hoverName.setAttribute("x", p.x + (right ? -(r + 5) : r + 5));
    hoverName.setAttribute("y", p.y - r * 1.9 + 3.5);
    hoverName.setAttribute("text-anchor", right ? "end" : "start");
    hoverName.textContent = place[0];
  }

  /* A teardrop with its point at the origin, so the coordinate a pin marks is
     the coordinate it stands on. Built from the head radius rather than typed
     out, because the named places and the rest are drawn at two sizes. */
  function dropPath(r) {
    var cy = -r * 1.9;
    return "M0 0" +
      "C" + (-r * 0.9).toFixed(2) + " " + (cy * 0.6).toFixed(2) +
       " " + (-r).toFixed(2) + " " + (cy * 0.85).toFixed(2) +
       " " + (-r).toFixed(2) + " " + cy.toFixed(2) +
      "A" + r + " " + r + " 0 1 1 " + r + " " + cy.toFixed(2) +
      "C" + r.toFixed(2) + " " + (cy * 0.85).toFixed(2) +
       " " + (r * 0.9).toFixed(2) + " " + (cy * 0.6).toFixed(2) + " 0 0Z";
  }

  var R_NAMED = 6.6, R_PLAIN = 2.6;

  // Names printed on the map, or only on hover. One word to change it back.
  var SHOW_LABELS = true;

  /* The named places fall first and slowly, one at a time, so their labels can
     be read as they land. The rest come in behind them, quickly, and fill the
     map. */
  var named = [], plain = [];
  PLACES.forEach(function (p) { (p[5] ? named : plain).push(p); });

  var STEP_NAMED = 0.18, STEP_PLAIN = 0.035;
  // The small pins wait for the last named one to land, so the two halves of
  // the sequence read as two sentences rather than one crowd.
  var PLAIN_FROM = 0.5 + named.length * STEP_NAMED + 0.6;

  var pins = [];

  function addPin(place, delay) {
    var point = projectPoint(place[2], place[1]);
    var x = point[0], y = point[1];
    var label = place[5];
    var r = label ? R_NAMED : R_PLAIN;
    byName[place[0]] = { x: x, y: y };

    // Position on the outer group, motion on the inner one: a CSS transform
    // on an element overrides its transform attribute outright.
    var at = make("g", {
      class: "pin-at" + (label ? " is-named" : ""),
      transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")",
      tabindex: "0", role: "button",
      "aria-label": place[0] + ", " + place[3]
    });
    var pin = make("g", { class: "pin" });
    pin.appendChild(make("circle", { class: "hit", cx: 0, cy: -r * 1.4, r: r * 2.4 }));
    // The ripple is left at the tip, where the pin actually hits the map.
    pin.appendChild(make("circle", { class: "halo", cx: 0, cy: 0, r: 2 }));
    pin.appendChild(make("path", { class: "drop", d: dropPath(r) }));
    at.appendChild(pin);

    var leader = null;
    if (label && SHOW_LABELS) {
      var lx = label[0], ly = label[1];
      if (Math.abs(lx - x) > 18 || Math.abs(ly - y) > 14) {
        leader = make("path", {
          class: "leader",
          // From the head of the pin, not the tip: a line out of the point
          // would cross the drop itself.
          d: "M" + x.toFixed(1) + " " + (y - r * 1.9).toFixed(1) +
             "L" + (lx + (label[2] === "end" ? 3 : -3)) + " " + (ly - 3)
        });
        leaders.appendChild(leader);
      }
      var text = make("text", {
        class: "lbl", x: (lx - x).toFixed(1), y: (ly - y).toFixed(1),
        "text-anchor": label[2]
      });
      text.textContent = place[0];
      at.appendChild(text);
    }

    at.style.setProperty("--t", delay.toFixed(3) + "s");
    if (leader) leader.style.setProperty("--t", (delay + 0.35).toFixed(3) + "s");

    at.addEventListener("focus", function () { show(at, place); });
    at.addEventListener("click", function () { show(at, place); });
    at.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(at, place); }
    });

    pins.push({ at: at, place: place, x: x, y: y });
    return at;
  }

  named.forEach(function (p, i) { pinLayer.appendChild(addPin(p, 0.5 + i * STEP_NAMED)); });
  plain.forEach(function (p, i) { pinLayer.appendChild(addPin(p, PLAIN_FROM + i * STEP_PLAIN)); });

  // Southern pins last, so a teardrop always overlaps the one behind it rather
  // than being sliced by it.
  Array.prototype.slice.call(pinLayer.children)
    .sort(function (a, b) {
      return parseFloat(a.getAttribute("transform").split(" ")[1]) -
             parseFloat(b.getAttribute("transform").split(" ")[1]);
    })
    .forEach(function (n) { pinLayer.appendChild(n); });

  /* Highlighting follows the pointer rather than waiting for it to land on a
     shape. With fifty teardrops overlapping around the Great Lakes, hitting
     one exactly is a game; the nearest pin within reach is what the reader
     means. */
  var REACH = 26;
  svg.addEventListener("pointermove", function (e) {
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var m = svg.getScreenCTM();
    if (!m) return;
    var loc = pt.matrixTransform(m.inverse());
    var best = null, bestD = REACH * REACH;
    pins.forEach(function (p) {
      // Measured to the head of the drop, which is the part under the cursor.
      var dx = loc.x - p.x, dy = loc.y - (p.y - (p.place[5] ? R_NAMED : R_PLAIN) * 1.9);
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    });
    if (best) show(best.at, best.place); else show(null);
  });

  // The route is laid after the pins, because every leg is looked up by name.
  // It bows north: a straight line between two cities on a flat projection is
  // not the way anybody flies, and the curve says "journey" where a chord
  // says "chart".
  CHAIN.slice(1).forEach(function (name, i) {
    var a = byName[CHAIN[i]], b = byName[name];
    if (!a || !b) return;
    var dx = b.x - a.x, dy = b.y - a.y;
    var bow = Math.sqrt(dx * dx + dy * dy) * 0.2;
    var leg = make("path", {
      class: "route",
      pathLength: 1,
      d: "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) +
         "Q" + ((a.x + b.x) / 2).toFixed(1) + " " + ((a.y + b.y) / 2 - bow).toFixed(1) +
         " " + b.x.toFixed(1) + " " + b.y.toFixed(1)
    });
    leg.style.setProperty("--t", (0.6 + i * 0.3).toFixed(2) + "s");
    routes.appendChild(leg);
  });

  svg.addEventListener("pointerleave", function () { show(null); });
  atlas.addEventListener("focusout", function (e) {
    if (!atlas.contains(e.relatedTarget)) show(null);
  });

  // The reveal runs once. Re-running it on every scroll past would make the
  // map restless on a page a reader scrolls up and down.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        atlas.classList.add("is-in");
        io.disconnect();
      });
    }, { threshold: 0.25 });
    io.observe(atlas);
  } else {
    atlas.classList.add("is-in");
  }
})();
