/* Interactive parts of the revision technique pages:
   1. Flashcard decks   2. Self-check answer boxes   3. Blurt checklists */
(function () {

  /* ---------- 1. Flashcard decks ---------- */
  document.querySelectorAll(".deck").forEach(function (deck) {
    var all = JSON.parse(deck.querySelector("script[type='application/json']").textContent);
    var cards = all.slice(), i = 0, showingBack = false, got = 0, notYet = [];
    var face = deck.querySelector(".fc"), side = face.querySelector(".side"), txt = face.querySelector(".txt");
    var status = deck.querySelector(".deck-status");
    var flipBtn = deck.querySelector("[data-act='flip']");
    var gotBtn = deck.querySelector("[data-act='got']");
    var notBtn = deck.querySelector("[data-act='not']");
    var restartBtn = deck.querySelector("[data-act='restart']");
    var shuffleBtn = deck.querySelector("[data-act='shuffle']");

    function render() {
      if (i >= cards.length) {
        face.className = "fc back";
        side.textContent = "Round finished";
        txt.textContent = "You knew " + got + " of " + cards.length + ". " +
          (notYet.length ? "Go round again with the " + notYet.length + " you didn't know yet." : "Well done – try the whole deck again in a few days.");
        flipBtn.disabled = gotBtn.disabled = notBtn.disabled = true;
        restartBtn.textContent = notYet.length ? "Practise the 'not yet' cards" : "Start again";
        status.textContent = "";
        return;
      }
      var c = cards[i];
      face.className = "fc " + (showingBack ? "back" : "front");
      side.textContent = showingBack ? "Answer" : "Question";
      txt.textContent = showingBack ? c.a : c.q;
      flipBtn.textContent = showingBack ? "Show question" : "Show answer";
      flipBtn.disabled = false;
      gotBtn.disabled = notBtn.disabled = !showingBack;
      status.textContent = "Card " + (i + 1) + " of " + cards.length + " • Known: " + got + " • Not yet: " + notYet.length;
    }
    function next(knew) {
      if (knew) got++; else notYet.push(cards[i]);
      i++; showingBack = false; render();
    }
    function shuffle(arr) {
      for (var k = arr.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = arr[k]; arr[k] = arr[j]; arr[j] = t; }
      return arr;
    }
    flipBtn.addEventListener("click", function () { showingBack = !showingBack; render(); });
    face.addEventListener("click", function () { if (i < cards.length) { showingBack = !showingBack; render(); } });
    gotBtn.addEventListener("click", function () { next(true); });
    notBtn.addEventListener("click", function () { next(false); });
    restartBtn.addEventListener("click", function () {
      cards = (i >= cards.length && notYet.length) ? notYet.slice() : all.slice();
      i = 0; got = 0; notYet = []; showingBack = false; restartBtn.textContent = "Restart deck"; render();
    });
    shuffleBtn.addEventListener("click", function () {
      cards = shuffle(all.slice()); i = 0; got = 0; notYet = []; showingBack = false; render();
    });
    render();
  });

  /* ---------- 2. Self-check answer boxes ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/[\s,]+/g, "").replace(/[−–]/g, "-"); }
  document.querySelectorAll(".check-block").forEach(function (block) {
    var btn = block.querySelector(".check-btn");
    var out = block.querySelector(".feedback");
    var showBtn = block.querySelector(".show-btn");
    if (btn) btn.addEventListener("click", function () {
      var inputs = block.querySelectorAll("input[data-answer]"), right = 0;
      inputs.forEach(function (inp) {
        var ok = inp.dataset.answer.split("|").some(function (a) { return norm(a) === norm(inp.value); });
        inp.classList.toggle("ok", ok); inp.classList.toggle("bad", !ok);
        inp.setAttribute("aria-invalid", ok ? "false" : "true");
        if (ok) right++;
      });
      out.className = "feedback " + (right === inputs.length ? "ok" : "bad");
      out.textContent = right === inputs.length
        ? "All " + inputs.length + " correct – well done!"
        : right + " of " + inputs.length + " correct. Red boxes need another look – check your working step by step.";
    });
    if (showBtn) showBtn.addEventListener("click", function () {
      block.querySelectorAll("input[data-answer]").forEach(function (inp) {
        inp.value = inp.dataset.answer.split("|")[0]; inp.classList.remove("bad"); inp.classList.add("ok");
      });
      out.className = "feedback"; out.textContent = "Answers shown. Cover them up and try again tomorrow.";
    });
  });

  /* ---------- 3. Blurt checklists ---------- */
  document.querySelectorAll(".checklist[data-score]").forEach(function (list) {
    var out = document.getElementById(list.dataset.score);
    function update() {
      var boxes = list.querySelectorAll("input[type='checkbox']"), n = 0;
      boxes.forEach(function (b) { if (b.checked) n++; });
      if (list.dataset.mode === "marks") {
        out.textContent = "You gave yourself " + n + " out of " + boxes.length + " marks." +
          (n < boxes.length ? " Read the model answer and the improvement tips, then rewrite your answer." : " Full marks!");
      } else if (list.dataset.mode === "ready") {
        out.textContent = "You have ticked " + n + " of " + boxes.length + "." +
          (n < boxes.length ? " Work on the unticked ones next." : " All ticked – you are ready for the next step!");
      } else {
        out.textContent = "You remembered " + n + " of " + boxes.length + " key points." +
          (n < boxes.length ? " Add the ones you missed in a different colour, then blurt again in a few days." : " Excellent!");
      }
    }
    list.addEventListener("change", update); update();
  });
  /* ---------- 4. Auto-marked quizzes (multiple choice and short answer) ---------- */
  document.querySelectorAll(".quiz-block").forEach(function (block) {
    var btn = block.querySelector(".quiz-check"), out = block.querySelector(".quiz-score");
    var reset = block.querySelector(".quiz-reset");
    btn.addEventListener("click", function () {
      var qs = block.querySelectorAll(".q"), right = 0;
      qs.forEach(function (q) {
        var ok;
        var radio = q.querySelector("input[type='radio']");
        if (radio) {
          var sel = q.querySelector("input[type='radio']:checked");
          ok = !!sel && sel.value === q.dataset.answer;
        } else {
          var inp = q.querySelector("input[type='text']");
          ok = inp.dataset.answer.split("|").some(function (a) { return norm(a) === norm(inp.value); });
        }
        q.classList.toggle("q-ok", ok); q.classList.toggle("q-bad", !ok);
        var ex = q.querySelector(".explain");
        if (ex) {
          ex.hidden = false;
          ex.querySelector(".verdict").textContent = ok ? "✔ Correct. " : "✘ Not quite. ";
        }
        if (ok) right++;
      });
      out.textContent = "You scored " + right + " out of " + qs.length + "." +
        (right === qs.length ? " Excellent!" : " Read the feedback under each red question, then try again.");
    });
    if (reset) reset.addEventListener("click", function () {
      block.querySelectorAll(".q").forEach(function (q) {
        q.classList.remove("q-ok", "q-bad");
        q.querySelectorAll("input[type='radio']").forEach(function (r) { r.checked = false; });
        q.querySelectorAll("input[type='text']").forEach(function (t) { t.value = ""; });
        var ex = q.querySelector(".explain"); if (ex) ex.hidden = true;
      });
      out.textContent = "";
    });
  });
})();
