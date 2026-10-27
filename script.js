/**
 * ============================================================================
 * Qriocity — Cyber-Arcade Neon Trivia Matrix
 * Plain Vanilla JavaScript (ES6+) Implementation
 * Strictly Client-Side, Free Open Trivia DB API, Zero External Backend
 * ============================================================================
 */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------------
     1. Constants & Configuration
     ---------------------------------------------------------------------------- */
  const OPENTDB_CATEGORIES_URL = "https://opentdb.com/api_category.php";
  const OPENTDB_QUESTIONS_URL = "https://opentdb.com/api.php";
  const TOTAL_QUESTIONS = 10;
  const QUESTION_TIME_LIMIT = 15; // 15 seconds per question
  const HIGH_SCORE_STORAGE_KEY = "qriocity_lifetime_high_score";

  /* ----------------------------------------------------------------------------
     2. Game State
     ---------------------------------------------------------------------------- */
  const state = {
    categories: [],
    questions: [],
    currentIndex: 0,
    score: 0,
    userAnswers: [], // Array of { question, selectedOption, correctOption, isCorrect, timedOut }
    selectedCategoryId: "",
    selectedCategoryName: "Any Category",
    selectedDifficulty: "Any Difficulty",
    timerInterval: null,
    timeLeftMs: QUESTION_TIME_LIMIT * 1000,
    isAnswered: false,
    lifetimeHighScore: 0,
    isNewHighScore: false,
  };

  /* ----------------------------------------------------------------------------
     3. DOM Elements Cache
     ---------------------------------------------------------------------------- */
  // Panels
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");

  // Start Screen Elements
  const startHighScoreVal = document.getElementById("start-high-score-val");
  const startHighScoreMeta = document.getElementById("start-high-score-meta");
  const categorySelect = document.getElementById("category-select");
  const categoryStatus = document.getElementById("category-status");
  const categoryError = document.getElementById("category-error");
  const retryCategoriesBtn = document.getElementById("retry-categories-btn");
  const difficultySelect = document.getElementById("difficulty-select");
  const startBtn = document.getElementById("start-btn");
  const startError = document.getElementById("start-error");
  const startErrorMessage = document.getElementById("start-error-message");
  const startRetryBtn = document.getElementById("start-retry-btn");

  // Quiz Screen Elements
  const quizProgressText = document.getElementById("quiz-progress-text");
  const quizCategoryBadge = document.getElementById("quiz-category-badge");
  const quizDifficultyBadge = document.getElementById("quiz-difficulty-badge");
  const hudCurrentScore = document.getElementById("hud-current-score");
  const timerNumber = document.getElementById("timer-number");
  const timerFill = document.getElementById("timer-fill");
  const questionText = document.getElementById("question-text");
  const optionsGrid = document.getElementById("options-grid");
  const quizFeedback = document.getElementById("quiz-feedback");
  const feedbackIcon = document.getElementById("feedback-icon");
  const feedbackText = document.getElementById("feedback-text");
  const nextBtn = document.getElementById("next-btn");
  const nextBtnText = document.getElementById("next-btn-text");

  // Result Screen Elements
  const newHighScoreBadge = document.getElementById("new-high-score-badge");
  const scoreDigits = document.getElementById("score-digits");
  const scoreRankBadge = document.getElementById("score-rank-badge");
  const scoreDetails = document.getElementById("score-details");
  const lifetimeBestScore = document.getElementById("lifetime-best-score");
  const playAgainBtn = document.getElementById("play-again-btn");
  const reviewCounter = document.getElementById("review-counter");
  const reviewList = document.getElementById("review-list");

  // Confetti Canvas
  const confettiCanvas = document.getElementById("confetti-canvas");

  /* ----------------------------------------------------------------------------
     4. Helper Functions (Decoding, Shuffling, Formatting)
     ---------------------------------------------------------------------------- */

  /**
   * Robust HTML entity decoder using native DOMParser.
   * Accurately decodes &quot;, &#039;, &amp;, &eacute;, etc.
   */
  function decodeHtml(htmlString) {
    if (!htmlString) return "";
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    return doc.documentElement.textContent || "";
  }

  /**
   * Fisher-Yates Array Shuffle algorithm for truly random option placement.
   */
  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Capitalizes first letter of string.
   */
  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* ----------------------------------------------------------------------------
     5. High Score Tracking (localStorage)
     ---------------------------------------------------------------------------- */

  /**
   * Load lifetime high score record safely from localStorage.
   */
  function loadLifetimeHighScore() {
    try {
      const data = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.score === "number") {
          state.lifetimeHighScore = parsed.score;
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Unable to access localStorage for high score:", e);
    }
    state.lifetimeHighScore = 0;
    return null;
  }

  /**
   * Save lifetime high score record to localStorage if beaten.
   */
  function saveLifetimeHighScore(newScore, categoryName, difficulty) {
    try {
      const record = {
        score: newScore,
        total: TOTAL_QUESTIONS,
        category: categoryName,
        difficulty: difficulty,
        date: new Date().toLocaleDateString(),
      };
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(record));
      state.lifetimeHighScore = newScore;
    } catch (e) {
      console.warn("Unable to save to localStorage:", e);
    }
  }

  /**
   * Update Start Screen HUD with lifetime high score info.
   */
  function updateStartScreenHighScoreHUD() {
    const record = loadLifetimeHighScore();
    if (record && record.score > 0) {
      startHighScoreVal.textContent = `${record.score} / ${record.total || 10}`;
      startHighScoreMeta.textContent = `Set in ${record.category || "General"} (${record.difficulty || "Any"}) on ${record.date || "recently"}`;
    } else {
      startHighScoreVal.textContent = "-- / 10";
      startHighScoreMeta.textContent = "No record logged yet. Launch your first run!";
    }
  }

  /* ----------------------------------------------------------------------------
     6. Category Fetching & Initialization
     ---------------------------------------------------------------------------- */

  async function fetchCategories() {
    categoryStatus.textContent = "Connecting to matrix...";
    categoryError.classList.add("hidden");
    categorySelect.disabled = true;
    startBtn.disabled = true;

    try {
      const response = await fetch(OPENTDB_CATEGORIES_URL);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (!data.trivia_categories || !Array.isArray(data.trivia_categories)) {
        throw new Error("Invalid categories format");
      }

      state.categories = data.trivia_categories.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // Populate dropdown
      categorySelect.innerHTML = '<option value="">Any Category (General Matrix)</option>';
      state.categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });

      categoryStatus.textContent = "ONLINE // READY";
      categoryStatus.style.color = "var(--neon-emerald)";
      categorySelect.disabled = false;
      startBtn.disabled = false;
    } catch (err) {
      console.error("Categories fetch failed:", err);
      categoryStatus.textContent = "CONNECTION ERROR";
      categoryStatus.style.color = "var(--laser-crimson)";
      categoryError.classList.remove("hidden");
    }
  }

  /* ----------------------------------------------------------------------------
     7. Question Fetching (Open Trivia DB API)
     ---------------------------------------------------------------------------- */

  async function fetchQuestions(categoryId, difficulty) {
    let url = `${OPENTDB_QUESTIONS_URL}?amount=${TOTAL_QUESTIONS}&type=multiple`;

    if (categoryId) {
      url += `&category=${encodeURIComponent(categoryId)}`;
    }
    if (difficulty) {
      url += `&difficulty=${encodeURIComponent(difficulty)}`;
    }

    const response = await fetch(url);
    if (response.status === 429) {
      throw new Error("Neural rate limit reached. Please wait 5 seconds before retrying.");
    }
    if (!response.ok) {
      throw new Error(`Matrix server returned status ${response.status}`);
    }

    const data = await response.json();

    switch (data.response_code) {
      case 0: // Success
        if (!data.results || data.results.length === 0) {
          throw new Error("No trivia questions available for this combination. Please choose another.");
        }
        return processQuestionData(data.results);
      case 1: // No results
        throw new Error("Not enough questions in this category/difficulty. Try 'Any Difficulty' or another topic.");
      case 2: // Invalid parameter
        throw new Error("Invalid query parameters. Please reconfigure your quiz settings.");
      case 5: // Rate limit
        throw new Error("Rate limit encountered. Wait 5 seconds and click Start again.");
      default:
        throw new Error("Could not retrieve trivia questions. Please try again.");
    }
  }

  function processQuestionData(rawList) {
    return rawList.map((item) => {
      const decodedQuestion = decodeHtml(item.question);
      const decodedCorrect = decodeHtml(item.correct_answer);
      const decodedIncorrect = item.incorrect_answers.map((ans) => decodeHtml(ans));

      // Shuffled 4 options
      const allOptions = shuffleArray([decodedCorrect, ...decodedIncorrect]);

      return {
        category: decodeHtml(item.category),
        difficulty: item.difficulty,
        question: decodedQuestion,
        correctAnswer: decodedCorrect,
        options: allOptions,
      };
    });
  }

  /* ----------------------------------------------------------------------------
     8. Screen Transitions
     ---------------------------------------------------------------------------- */

  function switchScreen(targetScreen) {
    [startScreen, quizScreen, resultScreen].forEach((screen) => {
      screen.classList.add("hidden");
      screen.classList.remove("active");
    });

    targetScreen.classList.remove("hidden");
    targetScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ----------------------------------------------------------------------------
     9. Quiz Lifecycle & Gameplay
     ---------------------------------------------------------------------------- */

  async function startQuiz() {
    const catId = categorySelect.value;
    const diff = difficultySelect.value;

    state.selectedCategoryId = catId;
    state.selectedCategoryName = catId
      ? categorySelect.options[categorySelect.selectedIndex].text
      : "Any Category";
    state.selectedDifficulty = diff ? capitalize(diff) : "Any Difficulty";

    // Visual loading state
    startBtn.disabled = true;
    startBtn.querySelector(".btn-glitch-text").textContent = "INITIALIZING MATRIX...";
    startError.classList.add("hidden");

    try {
      const questions = await fetchQuestions(catId, diff);
      state.questions = questions;
      state.currentIndex = 0;
      state.score = 0;
      state.userAnswers = [];
      state.isNewHighScore = false;

      // Switch to Quiz Screen
      switchScreen(quizScreen);
      renderQuestion();
    } catch (err) {
      console.error("Start quiz error:", err);
      startErrorMessage.textContent = err.message || "Failed to load questions.";
      startError.classList.remove("hidden");
    } finally {
      startBtn.disabled = false;
      startBtn.querySelector(".btn-glitch-text").textContent = "START QUIZ";
    }
  }

  function renderQuestion() {
    const q = state.questions[state.currentIndex];
    state.isAnswered = false;

    // Reset feedback & next button
    quizFeedback.classList.add("hidden");
    quizFeedback.className = "feedback-banner hidden";
    nextBtn.classList.add("hidden");

    // Update HUD counters
    const currentNum = state.currentIndex + 1;
    quizProgressText.textContent = `Question ${currentNum} of ${TOTAL_QUESTIONS}`;
    quizCategoryBadge.textContent = q.category;
    quizDifficultyBadge.textContent = capitalize(q.difficulty);
    hudCurrentScore.textContent = state.score.toString();

    // Render Question Text
    questionText.textContent = q.question;
    questionText.focus();

    // Render 4 Options
    optionsGrid.innerHTML = "";
    const optionLabels = ["A", "B", "C", "D"];

    q.options.forEach((optText, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.setAttribute("aria-label", `Option ${optionLabels[index]}: ${optText}`);

      const badge = document.createElement("span");
      badge.className = "option-badge";
      badge.textContent = optionLabels[index];

      const textSpan = document.createElement("span");
      textSpan.className = "option-text";
      textSpan.textContent = optText;

      btn.appendChild(badge);
      btn.appendChild(textSpan);

      btn.addEventListener("click", () => handleOptionSelected(optText, btn));
      optionsGrid.appendChild(btn);
    });

    // Start 15-second countdown timer
    startQuestionTimer();
  }

  /* ----------------------------------------------------------------------------
     10. 15-Second Glowing Visual Countdown Timer
     ---------------------------------------------------------------------------- */

  function startQuestionTimer() {
    clearInterval(state.timerInterval);
    state.timeLeftMs = QUESTION_TIME_LIMIT * 1000;

    updateTimerDisplay(QUESTION_TIME_LIMIT, 100);

    const stepMs = 50; // High-precision smooth animation
    state.timerInterval = setInterval(() => {
      state.timeLeftMs -= stepMs;

      if (state.timeLeftMs <= 0) {
        clearInterval(state.timerInterval);
        state.timeLeftMs = 0;
        updateTimerDisplay(0, 0);
        handleQuestionTimeout();
      } else {
        const secondsRemaining = Math.ceil(state.timeLeftMs / 1000);
        const percentRemaining = (state.timeLeftMs / (QUESTION_TIME_LIMIT * 1000)) * 100;
        updateTimerDisplay(secondsRemaining, percentRemaining);
      }
    }, stepMs);
  }

  function stopQuestionTimer() {
    clearInterval(state.timerInterval);
  }

  function updateTimerDisplay(seconds, percent) {
    timerNumber.textContent = `${seconds}s`;
    timerFill.style.width = `${Math.max(0, percent)}%`;

    if (seconds <= 4) {
      timerNumber.classList.add("warning");
      timerFill.classList.add("warning");
    } else {
      timerNumber.classList.remove("warning");
      timerFill.classList.remove("warning");
    }
  }

  function handleQuestionTimeout() {
    if (state.isAnswered) return;
    state.isAnswered = true;

    const currentQ = state.questions[state.currentIndex];

    // Record timeout as wrong answer
    state.userAnswers.push({
      question: currentQ.question,
      selectedOption: "⏱️ Timed Out (No answer chosen)",
      correctOption: currentQ.correctAnswer,
      isCorrect: false,
      timedOut: true,
    });

    // Disable all options and highlight the correct answer in Neon Emerald Green
    const allButtons = optionsGrid.querySelectorAll(".option-btn");
    allButtons.forEach((btn) => {
      btn.disabled = true;
      const text = btn.querySelector(".option-text").textContent;
      if (text === currentQ.correctAnswer) {
        btn.classList.add("is-correct");
        btn.querySelector(".option-badge").textContent = "✓";
      } else {
        btn.classList.add("is-dimmed");
      }
    });

    // Show Timeout Feedback
    quizFeedback.className = "feedback-banner wrong";
    feedbackIcon.textContent = "⏱️";
    feedbackText.textContent = `Time expired! Correct answer was: "${currentQ.correctAnswer}"`;
    quizFeedback.classList.remove("hidden");

    revealNextButton();
  }

  /* ----------------------------------------------------------------------------
     11. Option Selection & Immediate Feedback (Emerald Green / Crimson Red)
     ---------------------------------------------------------------------------- */

  function handleOptionSelected(selectedOption, chosenButton) {
    if (state.isAnswered) return;
    state.isAnswered = true;

    // Immediately stop timer
    stopQuestionTimer();

    const currentQ = state.questions[state.currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;

    if (isCorrect) {
      state.score += 1;
      hudCurrentScore.textContent = state.score.toString();
    }

    // Record answer in state for review screen
    state.userAnswers.push({
      question: currentQ.question,
      selectedOption: selectedOption,
      correctOption: currentQ.correctAnswer,
      isCorrect: isCorrect,
      timedOut: false,
    });

    // Disable all option buttons immediately
    const allButtons = optionsGrid.querySelectorAll(".option-btn");
    allButtons.forEach((btn) => {
      btn.disabled = true;
      const text = btn.querySelector(".option-text").textContent;

      if (text === currentQ.correctAnswer) {
        // Requirement: Turn correct answer Neon Emerald Green
        btn.classList.add("is-correct");
        btn.querySelector(".option-badge").textContent = "✓";
      } else if (btn === chosenButton && !isCorrect) {
        // Requirement: Turn user's wrong choice Laser Crimson Red
        btn.classList.add("is-wrong");
        btn.querySelector(".option-badge").textContent = "✗";
      } else {
        btn.classList.add("is-dimmed");
      }
    });

    // Immediate Feedback Banner
    if (isCorrect) {
      quizFeedback.className = "feedback-banner correct";
      feedbackIcon.textContent = "✓";
      feedbackText.textContent = "Neural connection verified! Correct answer.";
    } else {
      quizFeedback.className = "feedback-banner wrong";
      feedbackIcon.textContent = "✗";
      feedbackText.textContent = `Incorrect! Correct answer was: "${currentQ.correctAnswer}"`;
    }
    quizFeedback.classList.remove("hidden");

    revealNextButton();
  }

  function revealNextButton() {
    const isLastQuestion = state.currentIndex === TOTAL_QUESTIONS - 1;
    nextBtnText.textContent = isLastQuestion ? "VIEW FINAL RESULTS" : "NEXT QUESTION";
    nextBtn.classList.remove("hidden");
    nextBtn.focus();
  }

  function handleNextQuestion() {
    if (state.currentIndex < TOTAL_QUESTIONS - 1) {
      state.currentIndex += 1;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }

  /* ----------------------------------------------------------------------------
     12. Final Score & Review Screen
     ---------------------------------------------------------------------------- */

  function finishQuiz() {
    stopQuestionTimer();

    // Check Lifetime High Score
    const previousBest = state.lifetimeHighScore;
    const isBeatRecord = state.score > previousBest;

    if (isBeatRecord) {
      state.isNewHighScore = true;
      saveLifetimeHighScore(state.score, state.selectedCategoryName, state.selectedDifficulty);
      newHighScoreBadge.classList.remove("hidden");
      triggerCelebratoryConfetti();
    } else {
      state.isNewHighScore = false;
      newHighScoreBadge.classList.add("hidden");
    }

    // Render Results Display
    scoreDigits.textContent = state.score.toString();
    scoreDetails.textContent = `You answered ${state.score} of ${TOTAL_QUESTIONS} questions correctly in "${state.selectedCategoryName}" (${state.selectedDifficulty}).`;

    // Dynamic Rank Title
    let rankTitle = "NEO RECRUIT";
    if (state.score === 10) {
      rankTitle = "⚡ SYNAPSE OVERLORD (10/10)";
    } else if (state.score >= 8) {
      rankTitle = "CYBER MASTER";
    } else if (state.score >= 6) {
      rankTitle = "NEURAL OPERATIVE";
    } else if (state.score >= 4) {
      rankTitle = "DATA RUNNER";
    }
    scoreRankBadge.textContent = rankTitle;

    // Lifetime Best display
    const currentLifetimeBest = Math.max(state.score, previousBest);
    lifetimeBestScore.textContent = `${currentLifetimeBest} / ${TOTAL_QUESTIONS}`;

    // Render Mistakes Review Section
    renderReviewSection();

    // Switch Screen
    switchScreen(resultScreen);
  }

  function renderReviewSection() {
    reviewList.innerHTML = "";
    const incorrectAnswers = state.userAnswers.filter((a) => !a.isCorrect);

    if (incorrectAnswers.length === 0) {
      reviewCounter.textContent = "0 Mistakes (Flawless Run)";
      reviewCounter.style.borderColor = "var(--neon-emerald)";
      reviewCounter.style.color = "var(--neon-emerald)";

      const perfectCard = document.createElement("div");
      perfectCard.className = "perfect-score-card";
      perfectCard.innerHTML = `
        <span class="perfect-score-icon" aria-hidden="true">🏆</span>
        <h4 class="perfect-score-title">FLAWLESS CYBER VICTORY!</h4>
        <p class="perfect-score-text">You answered all 10 questions with 100% accuracy. The knowledge matrix has been conquered.</p>
      `;
      reviewList.appendChild(perfectCard);
      return;
    }

    reviewCounter.textContent = `${incorrectAnswers.length} Question${incorrectAnswers.length > 1 ? "s" : ""} to Review`;
    reviewCounter.style.borderColor = "var(--laser-crimson)";
    reviewCounter.style.color = "#ff94b8";

    incorrectAnswers.forEach((ans, index) => {
      const card = document.createElement("div");
      card.className = "review-card";

      // Question title & text
      const qNum = document.createElement("div");
      qNum.className = "review-q-num";
      qNum.textContent = `MISSED QUERY #${index + 1}`;

      const qText = document.createElement("div");
      qText.className = "review-q-text";
      qText.textContent = ans.question;

      // Answers grid
      const answersGrid = document.createElement("div");
      answersGrid.className = "review-answers-grid";

      // User's wrong answer pill
      const wrongPill = document.createElement("div");
      wrongPill.className = "review-answer-pill wrong-choice";
      wrongPill.innerHTML = `
        <span class="pill-type-label">YOUR ANSWER:</span>
        <span>${ans.timedOut ? "⏱️ Time Expired (No answer)" : `✗ ${ans.selectedOption}`}</span>
      `;

      // Correct answer pill
      const correctPill = document.createElement("div");
      correctPill.className = "review-answer-pill correct-choice";
      correctPill.innerHTML = `
        <span class="pill-type-label">CORRECT ANSWER:</span>
        <span>✓ ${ans.correctOption}</span>
      `;

      answersGrid.appendChild(wrongPill);
      answersGrid.appendChild(correctPill);

      card.appendChild(qNum);
      card.appendChild(qText);
      card.appendChild(answersGrid);

      reviewList.appendChild(card);
    });
  }

  /* ----------------------------------------------------------------------------
     13. High Score Celebration Canvas Confetti (100% Vanilla JS)
     ---------------------------------------------------------------------------- */

  function triggerCelebratoryConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext("2d");
    if (!ctx) return;

    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ["#00f5ff", "#a855f7", "#00ff9d", "#ffdf00", "#ff007f", "#ffffff"];
    const particles = [];
    const particleCount = 120;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
        y: confettiCanvas.height / 3 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: Math.random() * 0.012 + 0.008,
      });
    }

    let animationId = null;

    function render() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let activeCount = 0;

      particles.forEach((p) => {
        if (p.opacity > 0) {
          activeCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // Gravity
          p.rotation += p.rotationSpeed;
          p.opacity -= p.decay;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        cancelAnimationFrame(animationId);
      }
    }

    render();
  }

  /* ----------------------------------------------------------------------------
     14. Reset & Event Listeners
     ---------------------------------------------------------------------------- */

  function resetQuizToStart() {
    stopQuestionTimer();
    state.currentIndex = 0;
    state.score = 0;
    state.questions = [];
    state.userAnswers = [];
    updateStartScreenHighScoreHUD();
    switchScreen(startScreen);
  }

  function initEventListeners() {
    // Start Quiz Button
    startBtn.addEventListener("click", startQuiz);

    // Retry Categories Fetch
    retryCategoriesBtn.addEventListener("click", fetchCategories);

    // Retry Start Questions Fetch
    startRetryBtn.addEventListener("click", startQuiz);

    // Next Question Button
    nextBtn.addEventListener("click", handleNextQuestion);

    // Play Again Button
    playAgainBtn.addEventListener("click", resetQuizToStart);

    // Handle Window Resize for Confetti Canvas
    window.addEventListener("resize", () => {
      if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
      }
    });

    // Keyboard navigation (Enter / Space on option buttons handled natively, 1-4 shortcut support)
    document.addEventListener("keydown", (e) => {
      if (!quizScreen.classList.contains("active") || state.isAnswered) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const buttons = optionsGrid.querySelectorAll(".option-btn");
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    });
  }

  /* ----------------------------------------------------------------------------
     15. Bootstrap Application
     ---------------------------------------------------------------------------- */
  function init() {
    updateStartScreenHighScoreHUD();
    initEventListeners();
    fetchCategories();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
