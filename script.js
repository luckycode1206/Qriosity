/**
 * ============================================================================
 * Qriosity — Dynamic Trivia Quiz
 * Plain Vanilla JavaScript (ES6+) Implementation
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. Constants
   ---------------------------------------------------------------------------- */
const CATEGORIES_API_URL = "https://opentdb.com/api_category.php";
const QUESTIONS_API_URL = "https://opentdb.com/api.php";
const TOTAL_QUESTIONS = 10;
const TIME_LIMIT = 15; // 15 seconds per question
const STORAGE_KEY = "triviaQuizHighScores";
const MAX_HIGH_SCORES = 5;

/* ----------------------------------------------------------------------------
   2. State Object
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
  timerId: null,
  timeLeft: TIME_LIMIT,
  answered: false,
};

/* ----------------------------------------------------------------------------
   3. DOM References (Cached once at top)
   ---------------------------------------------------------------------------- */
// Screen sections & headings
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startHeading = document.getElementById("start-heading");
const resultHeading = document.getElementById("result-heading");

// Start Screen Controls & Elements
const categorySelect = document.getElementById("category-select");
const categoryStatus = document.getElementById("category-status");
const categoryError = document.getElementById("category-error");
const retryCategoriesBtn = document.getElementById("retry-categories-btn");
const difficultySelect = document.getElementById("difficulty-select");
const startBtn = document.getElementById("start-btn");
const startError = document.getElementById("start-error");
const startErrorMessage = document.getElementById("start-error-message");
const startRetryBtn = document.getElementById("start-retry-btn");
const startLoading = document.getElementById("start-loading");
const startHighScoresList = document.getElementById("start-high-scores-list");

// Quiz Screen Controls & Elements
const quizCategoryBadge = document.getElementById("quiz-category-badge");
const quizDifficultyBadge = document.getElementById("quiz-difficulty-badge");
const progressText = document.getElementById("progress-text");
const progressBarFill = document.getElementById("progress-bar-fill");
const timerContainer = document.querySelector(".timer-container");
const timerText = document.getElementById("timer-text");
const timerBarFill = document.getElementById("timer-bar-fill");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const quizFeedback = document.getElementById("quiz-feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackText = document.getElementById("feedback-text");
const nextBtn = document.getElementById("next-btn");
const nextBtnText = document.getElementById("next-btn-text");

// Result Screen Controls & Elements
const scoreDigits = document.getElementById("score-digits");
const scorePercent = document.getElementById("score-percent");
const scoreDetails = document.getElementById("score-details");
const resultMessage = document.getElementById("result-message");
const playAgainBtn = document.getElementById("play-again-btn");
const reviewList = document.getElementById("review-list");
const resultHighScoresList = document.getElementById("result-high-scores-list");

/* ----------------------------------------------------------------------------
   4. Utility Functions
   ---------------------------------------------------------------------------- */

/**
 * Decodes HTML entities safely using the browser's DOMParser.
 * @param {string} str - Raw string potentially containing HTML entities.
 * @returns {string} Plain text with decoded entities.
 */
function decodeHTML(str) {
  if (!str) return "";
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent || "";
}

/**
 * Fisher-Yates array shuffle.
 * @param {Array} array - Input array to shuffle.
 * @returns {Array} Shuffled copy of the array.
 */
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - Input string.
 * @returns {string} String with first letter capitalized.
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats an ISO date string into a friendly localized display.
 * @param {string} isoString - ISO date string.
 * @returns {string} Formatted date.
 */
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* ----------------------------------------------------------------------------
   5. API Functions
   ---------------------------------------------------------------------------- */

/**
 * Fetches trivia categories from Open Trivia DB and populates the select element.
 */
async function fetchCategories() {
  categoryStatus.textContent = "Loading categories...";
  categoryStatus.classList.remove("hidden");
  categoryError.classList.add("hidden");
  categorySelect.disabled = true;
  startBtn.disabled = true;

  try {
    const response = await fetch(CATEGORIES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();

    if (!data.trivia_categories || !Array.isArray(data.trivia_categories)) {
      throw new Error("Invalid categories format");
    }

    // Sort categories alphabetically
    const sortedCategories = [...data.trivia_categories].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    state.categories = sortedCategories;

    // Populate dropdown
    categorySelect.innerHTML = '<option value="">Any Category</option>';
    sortedCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });

    categoryStatus.textContent = "";
    categoryStatus.classList.add("hidden");
    categorySelect.disabled = false;
    startBtn.disabled = false;
  } catch (err) {
    categoryStatus.textContent = "Error loading";
    categoryError.classList.remove("hidden");
    categorySelect.disabled = true;
    startBtn.disabled = true;
  }
}

/**
 * Fetches 10 questions from Open Trivia DB based on category and difficulty.
 * @param {string} categoryId - Selected category ID or empty string.
 * @param {string} difficulty - Selected difficulty or empty string.
 * @returns {Promise<Array>} Processed questions array.
 */
async function fetchQuestions(categoryId, difficulty) {
  const params = new URLSearchParams({
    amount: TOTAL_QUESTIONS.toString(),
    type: "multiple",
  });

  if (categoryId) {
    params.append("category", categoryId);
  }
  if (difficulty) {
    params.append("difficulty", difficulty);
  }

  const url = `${QUESTIONS_API_URL}?${params.toString()}`;

  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    throw new Error("Network connection error. Please check your internet connection.");
  }

  if (response.status === 429) {
    triggerRateLimitCooldown();
    throw new Error("Too many requests, please wait a few seconds and try again.");
  }

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}. Please try again.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse API response. Please try again.");
  }

  // Handle Open Trivia DB response_code values
  switch (data.response_code) {
    case 0: // Success
      if (!data.results || data.results.length === 0) {
        throw new Error("No questions returned. Please try another selection.");
      }
      return processQuestions(data.results);
    case 1: // Not enough questions
      throw new Error(
        "Not enough questions for this category and difficulty, please try another combination."
      );
    case 2: // Invalid parameter
      throw new Error("Invalid parameters provided to trivia API. Please reconfigure your quiz.");
    case 5: // Rate limited
      triggerRateLimitCooldown();
      throw new Error("Too many requests, please wait a few seconds and try again.");
    default:
      throw new Error("Could not retrieve quiz questions. Please try again.");
  }
}

/**
 * Handles API rate-limiting by temporarily disabling the Start button.
 */
function triggerRateLimitCooldown() {
  startBtn.disabled = true;
  let cooldownSeconds = 5;
  const originalLabel = startBtn.querySelector(".btn-text-label");
  const updateLabel = () => {
    if (originalLabel) {
      originalLabel.textContent = `Wait ${cooldownSeconds}s...`;
    }
  };
  updateLabel();

  const cooldownInterval = setInterval(() => {
    cooldownSeconds--;
    if (cooldownSeconds > 0) {
      updateLabel();
    } else {
      clearInterval(cooldownInterval);
      if (originalLabel) {
        originalLabel.textContent = "Start Quiz";
      }
      startBtn.disabled = false;
    }
  }, 1000);
}

/**
 * Decodes all HTML entities and shuffles options once per question.
 * @param {Array} rawQuestions - Raw question objects from the API.
 * @returns {Array} Processed questions.
 */
function processQuestions(rawQuestions) {
  return rawQuestions.map((q) => {
    const questionDecoded = decodeHTML(q.question);
    const correctDecoded = decodeHTML(q.correct_answer);
    const incorrectDecoded = (q.incorrect_answers || []).map(decodeHTML);
    const shuffledOptions = shuffle([correctDecoded, ...incorrectDecoded]);

    return {
      question: questionDecoded,
      correctAnswer: correctDecoded,
      incorrectAnswers: incorrectDecoded,
      options: shuffledOptions,
      category: decodeHTML(q.category),
      difficulty: q.difficulty || "medium",
    };
  });
}

/* ----------------------------------------------------------------------------
   6. Screen Management
   ---------------------------------------------------------------------------- */

/**
 * Toggles visibility of the three primary screens and updates accessibility focus.
 * @param {"start"|"quiz"|"result"} screenName - The target screen identifier.
 */
function showScreen(screenName) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");

  if (screenName === "start") {
    startScreen.classList.remove("hidden");
    if (startHeading) {
      startHeading.focus();
    }
  } else if (screenName === "quiz") {
    quizScreen.classList.remove("hidden");
    if (questionText) {
      questionText.focus();
    }
  } else if (screenName === "result") {
    resultScreen.classList.remove("hidden");
    if (resultHeading) {
      resultHeading.focus();
    }
  }
}

/* ----------------------------------------------------------------------------
   7. Quiz Logic
   ---------------------------------------------------------------------------- */

/**
 * Initiates the quiz session after fetching questions based on user preferences.
 */
async function startQuiz() {
  hideStartError();

  const catId = categorySelect.value;
  const diff = difficultySelect.value;

  state.selectedCategoryId = catId;
  state.selectedCategoryName = catId
    ? categorySelect.options[categorySelect.selectedIndex].text
    : "Any Category";
  state.selectedDifficulty = diff ? capitalize(diff) : "Any Difficulty";

  // Visual loading state
  startBtn.disabled = true;
  categorySelect.disabled = true;
  difficultySelect.disabled = true;
  startLoading.classList.remove("hidden");

  try {
    const questions = await fetchQuestions(catId, diff);

    state.questions = questions;
    state.currentIndex = 0;
    state.score = 0;
    state.userAnswers = [];
    state.answered = false;

    startLoading.classList.add("hidden");
    categorySelect.disabled = false;
    difficultySelect.disabled = false;
    startBtn.disabled = false;

    showScreen("quiz");
    renderQuestion();
  } catch (error) {
    startLoading.classList.add("hidden");
    categorySelect.disabled = false;
    difficultySelect.disabled = false;
    // Do not enable startBtn if currently locked by rate-limiting cooldown
    if (!startBtn.querySelector(".btn-text-label").textContent.includes("Wait")) {
      startBtn.disabled = false;
    }
    showStartError(error.message || "Failed to load questions. Please try again.");
  }
}

/**
 * Displays an error banner on the start screen.
 * @param {string} message - Error description.
 */
function showStartError(message) {
  startErrorMessage.textContent = message;
  startError.classList.remove("hidden");
  startRetryBtn.classList.remove("hidden");
}

/**
 * Hides the start screen error banner.
 */
function hideStartError() {
  startError.classList.add("hidden");
  startRetryBtn.classList.add("hidden");
  startErrorMessage.textContent = "";
}

/**
 * Renders the current question and sets up option buttons and the countdown timer.
 */
function renderQuestion() {
  if (state.currentIndex >= state.questions.length) {
    endQuiz();
    return;
  }

  state.answered = false;
  stopTimer();

  // Reset feedback & next button
  quizFeedback.classList.add("hidden");
  quizFeedback.className = "feedback-banner hidden";
  nextBtn.classList.add("hidden");

  const q = state.questions[state.currentIndex];

  // Update progress text & progress bar
  const currentNum = state.currentIndex + 1;
  progressText.textContent = `Question ${currentNum} of ${TOTAL_QUESTIONS}`;
  const progressPct = (currentNum / TOTAL_QUESTIONS) * 100;
  progressBarFill.style.width = `${progressPct}%`;
  progressBarFill.parentElement.setAttribute("aria-valuenow", currentNum.toString());

  // Update badges
  quizCategoryBadge.textContent = q.category;
  quizDifficultyBadge.textContent = capitalize(q.difficulty);
  quizDifficultyBadge.className = `badge badge-difficulty ${q.difficulty.toLowerCase()}`;

  // Render question text safely with textContent
  questionText.textContent = q.question;

  // Render 4 answer option buttons
  optionsContainer.innerHTML = "";
  q.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";

    const labelSpan = document.createElement("span");
    labelSpan.className = "option-label";
    labelSpan.textContent = option; // safe textContent rendering

    const markerSpan = document.createElement("span");
    markerSpan.className = "option-marker";
    markerSpan.setAttribute("aria-hidden", "true");

    btn.appendChild(labelSpan);
    btn.appendChild(markerSpan);

    btn.addEventListener("click", () => handleAnswer(option, btn));
    optionsContainer.appendChild(btn);
  });

  // Start 15s timer
  startTimer();
}

/**
 * Handles user selection of an answer option.
 * @param {string} selectedOption - The option string chosen by the user.
 * @param {HTMLButtonElement} selectedBtn - The clicked button element.
 */
function handleAnswer(selectedOption, selectedBtn) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  const currentQ = state.questions[state.currentIndex];
  const isCorrect = selectedOption === currentQ.correctAnswer;

  if (isCorrect) {
    state.score++;
  }

  // Record user answer
  state.userAnswers.push({
    question: currentQ.question,
    selectedOption: selectedOption,
    correctOption: currentQ.correctAnswer,
    isCorrect: isCorrect,
    timedOut: false,
  });

  // Lock options and provide visual feedback
  const allOptionBtns = optionsContainer.querySelectorAll(".option-btn");
  allOptionBtns.forEach((btn) => {
    btn.disabled = true;
    const btnText = btn.querySelector(".option-label")?.textContent;
    const marker = btn.querySelector(".option-marker");

    if (btnText === currentQ.correctAnswer) {
      btn.classList.add("correct");
      if (marker) marker.textContent = "✓";
    }
  });

  if (!isCorrect && selectedBtn) {
    selectedBtn.classList.add("wrong");
    const marker = selectedBtn.querySelector(".option-marker");
    if (marker) marker.textContent = "✗";
  }

  // Show feedback announcement
  quizFeedback.classList.remove("hidden");
  if (isCorrect) {
    quizFeedback.className = "feedback-banner success";
    feedbackIcon.textContent = "✓";
    feedbackText.textContent = "Correct! Well done.";
  } else {
    quizFeedback.className = "feedback-banner error";
    feedbackIcon.textContent = "✗";
    feedbackText.textContent = `Incorrect! The correct answer was "${currentQ.correctAnswer}".`;
  }

  // Show Next / Finish button
  showNextButton();
}

/**
 * Starts the 15-second countdown timer for the current question.
 */
function startTimer() {
  stopTimer();
  state.timeLeft = TIME_LIMIT;

  timerText.textContent = `${state.timeLeft}s`;
  timerBarFill.style.width = "100%";
  timerContainer.classList.remove("warning");

  state.timerId = setInterval(() => {
    state.timeLeft--;
    const currentSeconds = Math.max(0, state.timeLeft);
    timerText.textContent = `${currentSeconds}s`;

    const pct = (currentSeconds / TIME_LIMIT) * 100;
    timerBarFill.style.width = `${pct}%`;

    if (currentSeconds <= 5) {
      timerContainer.classList.add("warning");
    }

    if (currentSeconds <= 0) {
      handleTimeout();
    }
  }, 1000);
}

/**
 * Stops and clears any active countdown interval.
 */
function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

/**
 * Handles expiration of the 15-second question timer.
 */
function handleTimeout() {
  stopTimer();
  if (state.answered) return;
  state.answered = true;

  const currentQ = state.questions[state.currentIndex];

  // Record timeout as incorrect with no chosen answer
  state.userAnswers.push({
    question: currentQ.question,
    selectedOption: null,
    correctOption: currentQ.correctAnswer,
    isCorrect: false,
    timedOut: true,
  });

  // Lock options and reveal correct answer in green
  const allOptionBtns = optionsContainer.querySelectorAll(".option-btn");
  allOptionBtns.forEach((btn) => {
    btn.disabled = true;
    const btnText = btn.querySelector(".option-label")?.textContent;
    const marker = btn.querySelector(".option-marker");

    if (btnText === currentQ.correctAnswer) {
      btn.classList.add("correct");
      if (marker) marker.textContent = "✓";
    }
  });

  // Feedback announcement
  quizFeedback.classList.remove("hidden");
  quizFeedback.className = "feedback-banner warning";
  feedbackIcon.textContent = "⏱️";
  feedbackText.textContent = `Time ran out! The correct answer was "${currentQ.correctAnswer}".`;

  showNextButton();
}

/**
 * Configures and displays the Next/Finish action button.
 */
function showNextButton() {
  const isLastQuestion = state.currentIndex === TOTAL_QUESTIONS - 1;
  nextBtnText.textContent = isLastQuestion ? "Finish" : "Next";
  nextBtn.classList.remove("hidden");
  nextBtn.focus();
}

/**
 * Advances to the next question or finishes the quiz.
 */
function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex < TOTAL_QUESTIONS) {
    renderQuestion();
  } else {
    endQuiz();
  }
}

/**
 * Ends the quiz, computes results, persists high score, and renders the result screen.
 */
function endQuiz() {
  stopTimer();

  // Save score to localStorage
  saveHighScore({
    score: state.score,
    total: TOTAL_QUESTIONS,
    category: state.selectedCategoryName,
    difficulty: state.selectedDifficulty,
    date: new Date().toISOString(),
  });

  renderResult();
  renderReview();
  renderHighScores();
  showScreen("result");
}

/* ----------------------------------------------------------------------------
   8. Storage Functions (localStorage with Try/Catch & JSON Validation)
   ---------------------------------------------------------------------------- */

/**
 * Loads high scores safely from localStorage.
 * @returns {Array} List of validated high score records.
 */
function loadHighScores() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return [];

    // Validate structure of each score object
    return parsed.filter(
      (item) =>
        item &&
        typeof item.score === "number" &&
        typeof item.total === "number" &&
        typeof item.category === "string" &&
        typeof item.difficulty === "string" &&
        typeof item.date === "string"
    );
  } catch (e) {
    // Return empty array if storage is disabled, quota exceeded, or corrupted
    return [];
  }
}

/**
 * Saves a new high score to localStorage, preserving top 5 sorted entries.
 * @param {Object} newEntry - New score record to insert.
 */
function saveHighScore(newEntry) {
  try {
    const scores = loadHighScores();
    scores.push(newEntry);

    // Sort by score descending; break ties with most recent date
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.date) - new Date(a.date);
    });

    // Keep top 5
    const topScores = scores.slice(0, MAX_HIGH_SCORES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
  } catch (e) {
    // Fail gracefully if localStorage is unavailable
  }
}

/**
 * Renders the top high scores in both the start screen and result screen lists.
 */
function renderHighScores() {
  const scores = loadHighScores();
  const lists = [startHighScoresList, resultHighScoresList];

  lists.forEach((list) => {
    if (!list) return;
    list.innerHTML = "";

    if (scores.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "high-scores-empty";
      emptyLi.textContent = "No high scores recorded yet. Complete your first quiz to set a score!";
      list.appendChild(emptyLi);
      return;
    }

    scores.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "high-score-item";

      const leftDiv = document.createElement("div");
      leftDiv.className = "high-score-left";

      const rankSpan = document.createElement("span");
      rankSpan.className = "high-score-rank";
      rankSpan.textContent = (index + 1).toString();

      const metaDiv = document.createElement("div");
      metaDiv.className = "high-score-meta";

      const catSpan = document.createElement("span");
      catSpan.className = "high-score-category";
      catSpan.textContent = item.category;

      const submetaSpan = document.createElement("span");
      submetaSpan.className = "high-score-submeta";
      const formattedDate = formatDate(item.date);
      submetaSpan.textContent = `${item.difficulty}${formattedDate ? ` • ${formattedDate}` : ""}`;

      metaDiv.appendChild(catSpan);
      metaDiv.appendChild(submetaSpan);
      leftDiv.appendChild(rankSpan);
      leftDiv.appendChild(metaDiv);

      const rightDiv = document.createElement("div");
      rightDiv.className = "high-score-right";

      const valSpan = document.createElement("span");
      valSpan.className = "high-score-val";
      valSpan.textContent = item.score.toString();

      const totalSpan = document.createElement("span");
      totalSpan.className = "high-score-total";
      totalSpan.textContent = `/${item.total}`;

      rightDiv.appendChild(valSpan);
      rightDiv.appendChild(totalSpan);

      li.appendChild(leftDiv);
      li.appendChild(rightDiv);
      list.appendChild(li);
    });
  });
}

/* ----------------------------------------------------------------------------
   9. Result and Review Rendering
   ---------------------------------------------------------------------------- */

/**
 * Computes and renders score statistics and customized result messaging.
 */
function renderResult() {
  const percentage = Math.round((state.score / TOTAL_QUESTIONS) * 100);

  scoreDigits.textContent = `${state.score} / ${TOTAL_QUESTIONS}`;
  scorePercent.textContent = `${percentage}%`;
  scoreDetails.textContent = `You answered ${state.score} of ${TOTAL_QUESTIONS} questions correctly in "${state.selectedCategoryName}" (${state.selectedDifficulty}).`;

  // Contextual feedback message based on score
  if (state.score === 10) {
    resultMessage.textContent = "Outstanding! A flawless 10/10 victory! 🏆";
  } else if (state.score >= 8) {
    resultMessage.textContent = "Impressive performance! You really know your trivia! 🌟";
  } else if (state.score >= 6) {
    resultMessage.textContent = "Solid effort! Good knowledge across the board! 👍";
  } else if (state.score >= 4) {
    resultMessage.textContent = "Not bad! With a bit of practice you'll be at the top! 💡";
  } else {
    resultMessage.textContent = "Tough challenge! Don't worry, try again to conquer it! 🚀";
  }
}

/**
 * Renders the review section containing only incorrectly answered or timed-out questions.
 */
function renderReview() {
  reviewList.innerHTML = "";

  const incorrectAnswers = state.userAnswers.filter((ans) => !ans.isCorrect);

  if (incorrectAnswers.length === 0) {
    const perfectDiv = document.createElement("div");
    perfectDiv.className = "review-perfect-state";
    perfectDiv.textContent = "🎉 Perfect score, nothing to review!";
    reviewList.appendChild(perfectDiv);
    return;
  }

  incorrectAnswers.forEach((ans) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = `review-item ${ans.timedOut ? "timed-out" : ""}`;

    // Question title
    const qTitle = document.createElement("h4");
    qTitle.className = "review-question";
    qTitle.textContent = ans.question; // safe textContent
    itemDiv.appendChild(qTitle);

    // Answers summary container
    const answersDiv = document.createElement("div");
    answersDiv.className = "review-answers";

    // User's answer or timeout status
    const userBadge = document.createElement("div");
    if (ans.timedOut) {
      userBadge.className = "review-badge user-timeout";
      userBadge.textContent = "⏱️ No answer: time ran out";
    } else {
      userBadge.className = "review-badge user-wrong";
      userBadge.textContent = `✗ Your answer: ${ans.selectedOption}`;
    }
    answersDiv.appendChild(userBadge);

    // Correct answer
    const correctBadge = document.createElement("div");
    correctBadge.className = "review-badge correct-answer";
    correctBadge.textContent = `✓ Correct answer: ${ans.correctOption}`;
    answersDiv.appendChild(correctBadge);

    itemDiv.appendChild(answersDiv);
    reviewList.appendChild(itemDiv);
  });
}

/**
 * Resets state for a new quiz while retaining already fetched categories.
 */
function resetQuizState() {
  stopTimer();
  state.questions = [];
  state.currentIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  state.answered = false;
  state.timeLeft = TIME_LIMIT;
  hideStartError();
}

/* ----------------------------------------------------------------------------
   10. Event Listeners and Init
   ---------------------------------------------------------------------------- */

/**
 * Initializes the application on DOM ready.
 */
function init() {
  // Render stored high scores on load
  renderHighScores();

  // Fetch categories from API
  fetchCategories();

  // Event Listeners
  retryCategoriesBtn.addEventListener("click", fetchCategories);
  startBtn.addEventListener("click", startQuiz);
  startRetryBtn.addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", nextQuestion);

  // Play Again: reset state and return to start screen without refetching categories
  playAgainBtn.addEventListener("click", () => {
    resetQuizState();
    renderHighScores();
    showScreen("start");
  });

  // Ensure start screen is initially visible
  showScreen("start");
}

document.addEventListener("DOMContentLoaded", init);
