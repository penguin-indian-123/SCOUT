(function () {
  "use strict";
  var DATA = null;

  function getToken(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function safe(name, fn) {
    try { fn(); } catch (e) {
      console.error("[scout] " + name + " failed:", e);
    }
  }

  function fmt(pair) {
    if (!pair) return "&mdash;";
    return pair[0].toFixed(2) + "&plusmn;" + pair[1].toFixed(2);
  }

  // ---------------- Hero stats ----------------
  function renderHero() {
    var wrap = document.getElementById("hero-stats");
    wrap.innerHTML =
      '<div><div class="v">96.46</div><div class="l">mean AUROC, ophthalmology (best baseline: TANL, 94.97)</div></div>' +
      '<div><div class="v">90.66</div><div class="l">mean AUROC, dermatology (best baseline: ANTS, 84.22)</div></div>' +
      '<div><div class="v">0</div><div class="l">trained parameters, OOD labels, or fine-tuning steps</div></div>';
  }

  // ---------------- Vocabulary ----------------
  function renderVocab(bench) {
    var v = DATA.vocabularies[bench];
    var wrap = document.getElementById("termsets");
    function list(terms) { return terms.map(function (t) { return "<li>" + t + "</li>"; }).join(""); }
    wrap.innerHTML =
      '<div class="termset known"><div class="th">T<sub>known</sub></div><ul>' + list(v.known) + '</ul></div>' +
      '<div class="termset unseen"><div class="th">T<sub>unknown</sub></div><ul>' + list(v.unknown) + '</ul></div>';
  }
  function initVocabToggle() {
    document.querySelectorAll("#vocab-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#vocab-toggle button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        renderVocab(b.getAttribute("data-vocab"));
      });
    });
  }

  // ---------------- Table 1 ----------------
  function renderTable1() {
    var t = DATA.table1;
    var body = document.getElementById("table1-body");
    var rows = [];
    ["ophthalmology", "dermatology"].forEach(function (bench) {
      var methods = t[bench];
      var names = Object.keys(methods);
      names.forEach(function (name, i) {
        var m = methods[name];
        var ours = name.indexOf("eval-informed") >= 0;
        rows.push(
          '<tr' + (ours ? ' class="ours"' : '') + '>' +
          (i === 0 ? '<td rowspan="' + names.length + '">' + (bench === "ophthalmology" ? "Ophthalmology" : "Dermatology") + '</td>' : '') +
          '<td>' + name + '</td>' +
          '<td>' + fmt(m.semantic.AUROC) + '</td><td>' + fmt(m.semantic.AUPR) + '</td><td>' + fmt(m.semantic.FPR95) + '</td>' +
          '<td>' + fmt(m.covariate.AUROC) + '</td><td>' + fmt(m.covariate.AUPR) + '</td><td>' + fmt(m.covariate.FPR95) + '</td>' +
          '<td>' + fmt(m.far_ood.AUROC) + '</td><td>' + fmt(m.far_ood.AUPR) + '</td><td>' + fmt(m.far_ood.FPR95) + '</td>' +
          '</tr>'
        );
      });
    });
    body.innerHTML = rows.join("");
  }

  // ---------------- Table 2 chart ----------------
  var t2Chart = null;
  var t2State = { bench: "ophthalmology", shift: "semantic", metric: "AUROC" };
  function renderT2() {
    var methods = DATA.table2[t2State.bench];
    var names = Object.keys(methods);
    var vals = names.map(function (n) { return methods[n][t2State.shift][t2State.metric][0]; });
    var errs = names.map(function (n) { return methods[n][t2State.shift][t2State.metric][1]; });
    var colors = names.map(function (n) { return n === "SCOUT" ? getToken("--accent") : getToken("--rule-strong"); });
    var ctx = document.getElementById("t2-chart").getContext("2d");
    if (t2Chart) t2Chart.destroy();
    t2Chart = new Chart(ctx, {
      type: "bar",
      data: { labels: names, datasets: [{ label: t2State.metric, data: vals, backgroundColor: colors, borderRadius: 3 }] },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) { return c.parsed.y.toFixed(2) + " ± " + errs[c.dataIndex].toFixed(2); }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, max: t2State.metric === "FPR95" ? 100 : 100, ticks: { color: getToken("--ink-soft") }, grid: { color: getToken("--rule") } },
          x: { ticks: { color: getToken("--ink-soft") }, grid: { display: false } }
        }
      }
    });
    var cap = document.getElementById("t2-caption");
    cap.textContent = "Measured, 5-seed mean, " + t2State.bench + " / " + t2State.shift.replace("_", "-") + " / " + t2State.metric + ". SCOUT highlighted.";
  }
  function initT2() {
    document.querySelectorAll("#t2-bench button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#t2-bench button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        t2State.bench = b.getAttribute("data-bench");
        renderT2();
      });
    });
    document.querySelectorAll("#t2-shift button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#t2-shift button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        t2State.shift = b.getAttribute("data-shift");
        renderT2();
      });
    });
    document.querySelectorAll("#t2-metric button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#t2-metric button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        t2State.metric = b.getAttribute("data-metric");
        renderT2();
      });
    });
    renderT2();
  }

  // ---------------- Mean AUROC chart ----------------
  function renderMeanChart() {
    var ctx = document.getElementById("mean-chart").getContext("2d");
    ["ophthalmology", "dermatology"].forEach(function () {});
    var benches = ["ophthalmology", "dermatology"];
    var methodsSet = {};
    benches.forEach(function (b) { Object.keys(DATA.table2[b]).forEach(function (m) { methodsSet[m] = true; }); });
    var methods = Object.keys(methodsSet);
    var datasets = benches.map(function (b, i) {
      return {
        label: b === "ophthalmology" ? "Ophthalmology" : "Dermatology",
        data: methods.map(function (m) { return DATA.table2[b][m] ? DATA.table2[b][m].mean_auroc : null; }),
        backgroundColor: i === 0 ? getToken("--vis") : getToken("--vocab"),
        borderRadius: 3
      };
    });
    new Chart(ctx, {
      type: "bar",
      data: { labels: methods, datasets: datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: "top", labels: { color: getToken("--ink-soft") } } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { color: getToken("--ink-soft") }, grid: { color: getToken("--rule") } },
          x: { ticks: { color: getToken("--ink-soft") }, grid: { display: false } }
        }
      }
    });
  }

  // ---------------- Embedding figures ----------------
  var EMBED_CAPTIONS = {
    ophthalmology: "Ophthalmology: all four groups form visually distinct clusters — far-OOD and covariate shift sit furthest from ID, semantic shift (AMD/glaucoma) overlaps ID moderately but remains separable.",
    dermatology: "Dermatology: ID (melanocytic nevi) and semantic shift (melanoma) overlap heavily in embedding space — visual evidence for why RNCD contributes negatively here (Table 3) while the vocabulary branch carries the detection."
  };
  function initEmbedFigures() {
    var img = document.getElementById("embed-figure-img");
    var cap = document.getElementById("embed-figure-caption");
    document.querySelectorAll("#embed-tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#embed-tabs button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var key = b.getAttribute("data-embed");
        img.src = "assets/figures/embed_" + key + ".png";
        cap.innerHTML = EMBED_CAPTIONS[key];
      });
    });
    cap.innerHTML = EMBED_CAPTIONS.ophthalmology;
  }

  var DIAG_CAPTIONS = {
    "1_score_distributions": "ID vs. semantic-shift distribution of $s_{rel}$, both benchmarks.",
    "2_visual_vocab_scatter": "$z_{vis}$ vs. $z_{vocab}$ scatter — shows how uncorrelated the two branches are, which is why max(·,·) works.",
    "3_roc_curves": "ROC curves, semantic shift, single seed (42).",
    "4_pr_curves": "Precision–recall curves, semantic shift.",
    "5_component_contribution": "Which branch drives the flag at the FPR95 operating threshold, per benchmark.",
    "6_ksrel_sweep": "SCOUT is flat across k=5–40 on both benchmarks — insensitive to this hyperparameter.",
    "7_lambda_sweep": "Ophthalmology gains monotonically as λ increases; dermatology is mildly decreasing — opposite slopes.",
    "8_paired_differences": "Paired bootstrap differences vs. kNN, both benchmarks, semantic shift."
  };
  function initDiagFigures() {
    var img = document.getElementById("diag-figure-img");
    var cap = document.getElementById("diag-figure-caption");
    document.querySelectorAll("#diag-tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#diag-tabs button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var key = b.getAttribute("data-fig");
        img.src = "assets/figures/diag/" + key + ".png";
        cap.innerHTML = DIAG_CAPTIONS[key];
        if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([cap]);
      });
    });
    cap.innerHTML = DIAG_CAPTIONS["1_score_distributions"];
  }

  // ---------------- Ablation ladder ----------------
  function renderLadder() {
    var rows = DATA.table3_ablation.rows;
    var ctx = document.getElementById("ladder-chart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: rows.map(function (r) { return r.method; }),
        datasets: [
          { label: "Ophthalmology", data: rows.map(function (r) { return r.ophthalmology; }), backgroundColor: getToken("--vis"), borderRadius: 3 },
          { label: "Dermatology", data: rows.map(function (r) { return r.dermatology; }), backgroundColor: getToken("--vocab"), borderRadius: 3 }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { legend: { position: "top", labels: { color: getToken("--ink-soft") } } },
        scales: {
          x: { beginAtZero: true, max: 100, ticks: { color: getToken("--ink-soft") }, grid: { color: getToken("--rule") } },
          y: { ticks: { color: getToken("--ink-soft") }, grid: { display: false } }
        }
      }
    });
  }

  // ---------------- FAQ ----------------
  function renderQA() {
    var wrap = document.getElementById("qa-list");
    wrap.innerHTML = DATA.qa.map(function (item, i) {
      return '<details class="qa-item"' + (i === 0 ? " open" : "") + '><summary>' + item.q + '</summary><div class="qa-body"><p>' + item.a + '</p></div></details>';
    }).join("");
  }

  // ---------------- Demo (hand-picked samples) ----------------
  var DEMO_SAMPLES = {
    id_normal:         { img: "demo/id_normal.jpg",          z_vis: 0.4,  z_vocab: -0.3, ood: false, note: "Both branches read this as comfortably in-distribution." },
    id_dr:             { img: "demo/id_dr.jpg",              z_vis: 0.9,  z_vocab: 0.6,  ood: false, note: "Diabetic retinopathy is one of the two known classes — mildly elevated, under threshold." },
    semantic_amd:      { img: "demo/semantic_amd.jpg",       z_vis: 0.26, z_vocab: 1.47, ood: true,  note: "Matches the worked example above: vision alone would miss this; vocabulary catches it." },
    covariate_uwf:     { img: "demo/covariate_uwf.jpg",      z_vis: 2.4,  z_vocab: 1.1,  ood: true,  note: "A different camera geometry, not a different disease — the visual branch reacts directly." },
    derm_id_nv:        { img: "demo/derm_id_nv.jpg",         z_vis: 0.1,  z_vocab: -0.4, ood: false, note: "Melanocytic nevus — the dermatology ID class." },
    derm_semantic_mel: { img: "demo/derm_semantic_mel.jpg",  z_vis: 0.3,  z_vocab: 1.6,  ood: true,  note: "Melanoma — dermatology's hardest case; the vocabulary branch is what carries detection (Table 3)." },
    far_ood_imagenet:  { img: "demo/far_ood_imagenet.jpg",   z_vis: 4.8,  z_vocab: 3.9,  ood: true,  note: "Not a medical image at all — both branches agree immediately and by a wide margin." }
  };
  function initDemo() {
    var img = document.getElementById("demo-img");
    var barVis = document.getElementById("demo-bar-vis");
    var barVocab = document.getElementById("demo-bar-vocab");
    var valVis = document.getElementById("demo-val-vis");
    var valVocab = document.getElementById("demo-val-vocab");
    var score = document.getElementById("demo-score");
    var formula = document.getElementById("demo-formula");
    var verdict = document.getElementById("demo-verdict");
    if (!img) return;
    function pct(z) { return Math.max(0, Math.min(100, (z + 2) / 16 * 100)); }
    function show(key) {
      var s = DEMO_SAMPLES[key];
      img.src = "assets/figures/" + s.img;
      barVis.style.width = pct(s.z_vis) + "%";
      barVocab.style.width = pct(s.z_vocab) + "%";
      valVis.textContent = s.z_vis.toFixed(2);
      valVocab.textContent = s.z_vocab.toFixed(2);
      var fused = Math.max(s.z_vis, s.z_vocab);
      score.textContent = fused.toFixed(2);
      formula.innerHTML = "S<sub>SCOUT</sub> = max(" + s.z_vis.toFixed(2) + ", " + s.z_vocab.toFixed(2) + ") &mdash; " + s.note;
      verdict.textContent = s.ood ? "Flagged out-of-distribution" : "Within in-distribution threshold";
      verdict.className = "verdict " + (s.ood ? "ood" : "id");
    }
    document.querySelectorAll("#demo-samples button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#demo-samples button").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        b.setAttribute("aria-selected", "true");
        show(b.getAttribute("data-sample"));
      });
    });
    show("id_normal");

    var GROUP_IMG = {
      id: { ophthalmology: "demo/id_normal.jpg", dermatology: "demo/derm_id_nv.jpg" },
      semantic: { ophthalmology: "demo/semantic_amd.jpg", dermatology: "demo/derm_semantic_mel.jpg" },
      covariate: { ophthalmology: "demo/covariate_uwf.jpg", dermatology: "demo/derm_covariate_padufes.jpg" },
      far_ood: { ophthalmology: "demo/far_ood_imagenet.jpg", dermatology: "demo/derm_far_ood.jpg" }
    };
    var GROUP_LABEL = { id: "in-distribution", semantic: "semantic shift", covariate: "covariate shift", far_ood: "far-OOD" };
    var playBtn = document.getElementById("demo-play");
    var playLabel = document.getElementById("demo-play-label");
    if (playBtn) {
      fetch("data/demo_samples.json").then(function (r) { return r.json(); }).then(function (rows) {
        playBtn.addEventListener("click", function () {
          document.querySelectorAll("#demo-samples button").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
          var r = rows[Math.floor(Math.random() * rows.length)];
          img.src = "assets/figures/" + (GROUP_IMG[r.group][r.benchmark] || GROUP_IMG[r.group].ophthalmology);
          barVis.style.width = pct(r.z_vis) + "%";
          barVocab.style.width = pct(r.z_vocab) + "%";
          valVis.textContent = r.z_vis.toFixed(2);
          valVocab.textContent = r.z_vocab.toFixed(2);
          score.textContent = r.fused.toFixed(2);
          formula.innerHTML = "S<sub>SCOUT</sub> = max(" + r.z_vis.toFixed(2) + ", " + r.z_vocab.toFixed(2) + ") &mdash; " + r.benchmark + " eval image #" + r.image_idx + ", " + GROUP_LABEL[r.group] + ", " + r.dominant + " branch dominant";
          verdict.textContent = r.flagged ? "Flagged out-of-distribution" : "Not flagged (below FPR95 threshold)";
          verdict.className = "verdict " + (r.flagged ? "ood" : "id");
          playLabel.textContent = "Real eval-set row, seed 42, " + r.benchmark + " #" + r.image_idx + " (" + GROUP_LABEL[r.group] + ")";
        });
      }).catch(function (e) { console.error("[scout] demo_samples.json:", e); });
    }
  }

  // ---------------- Boot ----------------
  fetch("data/results.json")
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      DATA = data;
      safe("renderHero", renderHero);
      safe("renderTable1", renderTable1);
      safe("initT2", initT2);
      safe("renderMeanChart", renderMeanChart);
      safe("initEmbedFigures", initEmbedFigures);
      safe("initDiagFigures", initDiagFigures);
      safe("renderLadder", renderLadder);
      safe("renderQA", renderQA);
      safe("initDemo", initDemo);
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function (e) { console.error("[scout] MathJax:", e); });
      }
    })
    .catch(function (err) { console.error("[scout] boot failed:", err); });
})();
