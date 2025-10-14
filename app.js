// app.js — Study Mode with panel hidden by default + toggle + submit anytime
(() => {
  const el = {
    card: document.getElementById("card"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    submitBtn: document.getElementById("submitBtn"),
    results: document.getElementById("results"),
    scoreLine: document.getElementById("scoreLine"),
    reviewList: document.getElementById("reviewList"),
    restartBtn: document.getElementById("restartBtn"),
    // Study panel
    statAnswered: document.getElementById("statAnswered"),
    statCorrect: document.getElementById("statCorrect"),
    statAccuracy: document.getElementById("statAccuracy"),
    quickReview: document.getElementById("quickReview"),
    checkBtn: document.getElementById("checkBtn"),
    toggleRevealBtn: document.getElementById("toggleRevealBtn"),
    // Panel toggle + layout
    panel: document.querySelector(".panel"),
    layout: document.querySelector(".layout"),
    panelToggleBtn: document.getElementById("panelToggleBtn"),
  };

  const QUESTIONS = window.QUESTIONS || [];
  let index = 0;                        // current question index
  const answers = new Array(QUESTIONS.length).fill(null); // store user selections (0-3)
  let revealOnCard = false;             // toggle showing correct answer on current card

  // Persist answers so refresh doesn’t lose work
  const KEY = "mcq-answers";
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (Array.isArray(saved) && saved.length === answers.length) {
    saved.forEach((v, i) => answers[i] = v);
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(answers));
  }

  function setProgress() {
    const total = QUESTIONS.length;
    const pct = total ? ((index + 1) / total) * 100 : 0;
    el.progressBar.style.width = `${pct}%`;
    el.progressText.textContent = `Question ${Math.min(index + 1, total)} of ${total}`;
  }

  function computeStats() {
    let answered = 0, correct = 0;
    answers.forEach((a, i) => {
      if (a !== null) {
        answered++;
        if (a === QUESTIONS[i].correctIndex) correct++;
      }
    });
    const total = QUESTIONS.length || 1;
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

    if (el.statAnswered) el.statAnswered.textContent = `${answered}/${total}`;
    if (el.statCorrect) el.statCorrect.textContent = `${correct}`;
    if (el.statAccuracy) el.statAccuracy.textContent = `${accuracy}%`;
  }

  function renderQuickReview() {
    if (!el.quickReview) return;
    el.quickReview.innerHTML = "";
    const letters = ["A","B","C","D"];
    answers.forEach((a, i) => {
      if (a === null) return;
      const q = QUESTIONS[i];
      const ok = a === q.correctIndex;
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div><strong>Q${i+1}.</strong> ${q.text}</div>
        <div>
          <span class="badge ${ok ? "ok" : "no"}">${ok ? "Correct" : "Incorrect"}</span>
        </div>
        <div><strong>Your:</strong> ${letters[a]}. ${q.options[a]}</div>
        <div><strong>Correct:</strong> ${letters[q.correctIndex]}. ${q.options[q.correctIndex]}</div>
      `;
      el.quickReview.appendChild(div);
    });
  }

  function updatePanel() {
    computeStats();
    renderQuickReview();
  }

  function renderQuestion() {
    const q = QUESTIONS[index];
    setProgress();
    if (!q) {
      el.card.innerHTML = `<p>No questions found. Please add some in <code>questions.js</code>.</p>`;
      el.nextBtn.disabled = true;
      el.prevBtn.disabled = true;
      el.submitBtn.disabled = true;
      if (el.checkBtn) el.checkBtn.disabled = true;
      return;
    }

    const letters = ["A", "B", "C", "D"];
    const selected = answers[index];

    const choicesHtml = q.options.map((opt, i) => {
      const inputId = `q${q.id}_opt${i}`;
      const checked = selected === i ? "checked" : "";
      return `
        <label class="choice" for="${inputId}">
          <input type="radio" id="${inputId}" name="q_${q.id}" value="${i}" ${checked} />
          <span class="choice__label">
            <span class="choice__tag">${letters[i]}</span>${opt}
          </span>
        </label>
      `;
    }).join("");

    el.card.innerHTML = `
      <div class="q-text">${q.text}</div>
      <form id="qForm" class="q-form" autocomplete="off">${choicesHtml}</form>
    `;

    el.prevBtn.disabled = index === 0;
    el.nextBtn.disabled = index === QUESTIONS.length - 1;

    // Selection handling
    const form = document.getElementById("qForm");
    form.addEventListener("change", (e) => {
      if (e.target && e.target.name === `q_${q.id}`) {
        answers[index] = Number(e.target.value);
        save();
        updatePanel();
        if (revealOnCard) markCardReveal();
      }
    });

    // If reveal is on, mark immediately
    if (revealOnCard) markCardReveal();
  }

  function markCardReveal() {
    const q = QUESTIONS[index];
    const labels = el.card.querySelectorAll(".choice");
    labels.forEach((lab, i) => {
      lab.classList.remove("correct","incorrect");
      if (i === q.correctIndex) lab.classList.add("correct");
      else if (answers[index] === i) lab.classList.add("incorrect");
    });
  }

  function next() {
    if (index < QUESTIONS.length - 1) {
      index++;
      renderQuestion();
    }
  }
  function prev() {
    if (index > 0) {
      index--;
      renderQuestion();
    }
  }

  // Submit ANYTIME: show current score + full review even if blanks
 // Submit ANYTIME: score over ANSWERED ONLY, still show full review
function submitAnytime() {
  const letters = ["A","B","C","D"];

  const answeredIdx = [];
  answers.forEach((a, i) => { if (a !== null) answeredIdx.push(i); });

  const answeredCount = answeredIdx.length;
  let correct = 0;
  answeredIdx.forEach(i => {
    if (answers[i] === QUESTIONS[i].correctIndex) correct++;
  });

  const pct = answeredCount ? Math.round((correct / answeredCount) * 100) : 0;
  const unanswered = QUESTIONS.length - answeredCount;

  el.scoreLine.textContent =
    `Score so far: ${correct} / ${answeredCount} (${pct}%).` +
    (unanswered ? ` (${unanswered} unanswered)` : "");

  // Full review (all questions) so you can study everything
  el.reviewList.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const user = answers[i];
    const isCorrect = user === q.correctIndex;
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div><strong>Q${i+1}.</strong> ${q.text}</div>
      <div>
        <span class="badge ${
          user === null ? "no" : (isCorrect ? "ok" : "no")
        }">${
          user === null ? "Unanswered" : (isCorrect ? "Correct" : "Incorrect")
        }</span>
      </div>
      <div><strong>Your answer:</strong> ${
        user != null ? `${letters[user]}. ${q.options[user]}` : "—"
      }</div>
      <div><strong>Correct answer:</strong> ${
        letters[q.correctIndex]
      }. ${q.options[q.correctIndex]}</div>
    `;
    el.reviewList.appendChild(item);
  });

  el.results.hidden = false;
  updatePanel();
  if (revealOnCard) markCardReveal();
}

  function restart() {
    for (let i = 0; i < answers.length; i++) answers[i] = null;
    localStorage.removeItem(KEY);
    index = 0;
    el.results.hidden = true;
    updatePanel();
    renderQuestion();
  }

  // --- Study Panel open/close (hidden by default, remembers choice) ---
  const PANEL_KEY = "mcq-panel-open";
  function setPanel(open) {
    el.panel.hidden = !open;
    el.layout.classList.toggle("panel-closed", !open);
    el.panelToggleBtn.setAttribute("aria-expanded", String(open));
    el.panelToggleBtn.textContent = open ? "Hide Study Panel" : "Show Study Panel";
    localStorage.setItem(PANEL_KEY, JSON.stringify(open));
  }
  const savedOpen = JSON.parse(localStorage.getItem(PANEL_KEY) || "false");
  setPanel(!!savedOpen);

  el.panelToggleBtn.addEventListener("click", () => {
    const open = el.panel.hidden; // if hidden, we want to open
    setPanel(open);
  });

  // --- Wire up main controls ---
  el.nextBtn.addEventListener("click", next);
  el.prevBtn.addEventListener("click", prev);
  el.submitBtn.addEventListener("click", submitAnytime);
  if (el.checkBtn) el.checkBtn.addEventListener("click", submitAnytime);
  el.restartBtn.addEventListener("click", restart);
  if (el.toggleRevealBtn) {
    el.toggleRevealBtn.addEventListener("click", () => {
      revealOnCard = !revealOnCard;
      el.toggleRevealBtn.setAttribute("aria-pressed", String(revealOnCard));
      el.toggleRevealBtn.textContent = revealOnCard ? "Hide Reveal on Card" : "Reveal Correct on Card";
      renderQuestion(); // re-render to apply/remove outlines
    });
  }

  // --- Init ---
  if (!QUESTIONS.length) {
    el.card.innerHTML = `<p>No questions found. Please add some in <code>questions.js</code>.</p>`;
    el.nextBtn.disabled = true;
    el.prevBtn.disabled = true;
    el.submitBtn.disabled = true;
    if (el.checkBtn) el.checkBtn.disabled = true;
  } else {
    renderQuestion();
  }
  updatePanel();
})();
