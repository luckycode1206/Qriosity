/**
 * ============================================================================
 * Qriocity — Cyber-Arcade Neon Trivia Matrix
 * Plain Vanilla JavaScript (ES6+) Implementation
 * Strictly Client-Side, Free Open Trivia DB API, Zero External Backend
 * Resilient Offline Fallback & Graceful Degradation
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

  /**
   * Pre-loaded standard OpenTDB categories.
   * Guarantees the dropdown is populated and functional immediately on load,
   * even if the OpenTDB API is slow, rate-limited, or blocked by adblockers.
   */
  const FALLBACK_CATEGORIES = [
    { id: 9, name: "General Knowledge" },
    { id: 10, name: "Entertainment: Books" },
    { id: 11, name: "Entertainment: Film" },
    { id: 12, name: "Entertainment: Music" },
    { id: 13, name: "Entertainment: Musicals & Theatres" },
    { id: 14, name: "Entertainment: Television" },
    { id: 15, name: "Entertainment: Video Games" },
    { id: 16, name: "Entertainment: Board Games" },
    { id: 17, name: "Science & Nature" },
    { id: 18, name: "Science: Computers" },
    { id: 19, name: "Science: Mathematics" },
    { id: 20, name: "Mythology" },
    { id: 21, name: "Sports" },
    { id: 22, name: "Geography" },
    { id: 23, name: "History" },
    { id: 24, name: "Politics" },
    { id: 25, name: "Art" },
    { id: 26, name: "Celebrities" },
    { id: 27, name: "Animals" },
    { id: 28, name: "Vehicles" },
    { id: 29, name: "Entertainment: Comics" },
    { id: 30, name: "Science: Gadgets" },
    { id: 31, name: "Entertainment: Japanese Anime & Manga" },
    { id: 32, name: "Entertainment: Cartoon & Animations" }
  ];

  /**
   * Comprehensive Local Question Vault (30+ questions).
   * Ensures uninterrupted, production-ready gameplay if OpenTDB suffers rate limits,
   * network downtime, CORS issues, or returns response_code: 1 (no results for query).
   */
  const LOCAL_QUESTION_VAULT = [
    {
      category: "Science: Computers",
      categoryId: 18,
      difficulty: "medium",
      question: "In computer science, what does the acronym 'REST' stand for in RESTful API?",
      correct_answer: "Representational State Transfer",
      incorrect_answers: [
        "Remote Execution Service Terminal",
        "Redundant Element System Token",
        "Resource Encapsulation Standard Transit"
      ]
    },
    {
      category: "Science: Computers",
      categoryId: 18,
      difficulty: "easy",
      question: "Which language is known as the primary programming language for building web page interactivity?",
      correct_answer: "JavaScript",
      incorrect_answers: ["Python", "Rust", "C++"]
    },
    {
      category: "Science: Computers",
      categoryId: 18,
      difficulty: "medium",
      question: "Which port is used by default for encrypted web traffic (HTTPS)?",
      correct_answer: "443",
      incorrect_answers: ["80", "8080", "22"]
    },
    {
      category: "Science: Computers",
      categoryId: 18,
      difficulty: "hard",
      question: "What is the worst-case time complexity of the QuickSort algorithm?",
      correct_answer: "O(n²)",
      incorrect_answers: ["O(n log n)", "O(n)", "O(log n)"]
    },
    {
      category: "Science & Nature",
      categoryId: 17,
      difficulty: "easy",
      question: "What is the primary chemical element found in diamonds?",
      correct_answer: "Carbon",
      incorrect_answers: ["Silicon", "Oxygen", "Nitrogen"]
    },
    {
      category: "Science & Nature",
      categoryId: 17,
      difficulty: "medium",
      question: "How many protons are present in a single neutral atom of Oxygen?",
      correct_answer: "8",
      incorrect_answers: ["6", "10", "12"]
    },
    {
      category: "Science & Nature",
      categoryId: 17,
      difficulty: "hard",
      question: "What is the absolute zero temperature in degrees Celsius?",
      correct_answer: "-273.15°C",
      incorrect_answers: ["-250.00°C", "-300.15°C", "-212.00°C"]
    },
    {
      category: "Entertainment: Video Games",
      categoryId: 15,
      difficulty: "easy",
      question: "In which retro arcade classic did Nintendo's Mario make his first debut as 'Jumpman'?",
      correct_answer: "Donkey Kong",
      incorrect_answers: ["Super Mario Bros.", "Punch-Out!!", "Galaga"]
    },
    {
      category: "Entertainment: Video Games",
      categoryId: 15,
      difficulty: "medium",
      question: "What is the fictional cyberpunk city setting for CD Projekt Red's 'Cyberpunk 2077'?",
      correct_answer: "Night City",
      incorrect_answers: ["Neo Tokyo", "Rapture", "Midgar"]
    },
    {
      category: "Entertainment: Video Games",
      categoryId: 15,
      difficulty: "hard",
      question: "In 'The Legend of Zelda: Ocarina of Time', what is the name of the sage of the Spirit Temple?",
      correct_answer: "Nabooru",
      incorrect_answers: ["Saria", "Rauru", "Impa"]
    },
    {
      category: "General Knowledge",
      categoryId: 9,
      difficulty: "easy",
      question: "How many sides does a regular heptagon have?",
      correct_answer: "7",
      incorrect_answers: ["6", "8", "9"]
    },
    {
      category: "General Knowledge",
      categoryId: 9,
      difficulty: "medium",
      question: "Which atmospheric gas constitutes approximately 78% of Earth's atmosphere?",
      correct_answer: "Nitrogen",
      incorrect_answers: ["Oxygen", "Carbon Dioxide", "Argon"]
    },
    {
      category: "General Knowledge",
      categoryId: 9,
      difficulty: "hard",
      question: "What is the name of the psychological bias where incompetent people overestimate their own cognitive ability?",
      correct_answer: "Dunning-Kruger effect",
      incorrect_answers: ["Confirmation bias", "Hawthorne effect", "Baader-Meinhof phenomenon"]
    },
    {
      category: "History",
      categoryId: 23,
      difficulty: "easy",
      question: "In which year did the Apollo 11 mission successfully land the first humans on the Moon?",
      correct_answer: "1969",
      incorrect_answers: ["1965", "1972", "1959"]
    },
    {
      category: "History",
      categoryId: 23,
      difficulty: "medium",
      question: "Which ancient civilization constructed the cliff citadel of Machu Picchu?",
      correct_answer: "Inca Empire",
      incorrect_answers: ["Aztec Empire", "Maya Civilization", "Olmec Civilization"]
    },
    {
      category: "History",
      categoryId: 23,
      difficulty: "hard",
      question: "Who was the Byzantine Emperor responsible for the construction of the Hagia Sophia in Constantinople?",
      correct_answer: "Justinian I",
      incorrect_answers: ["Constantine the Great", "Theodosius II", "Heraclius"]
    },
    {
      category: "Geography",
      categoryId: 22,
      difficulty: "easy",
      question: "Which is the largest ocean by surface area on planet Earth?",
      correct_answer: "Pacific Ocean",
      incorrect_answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]
    },
    {
      category: "Geography",
      categoryId: 22,
      difficulty: "medium",
      question: "What is the capital city of Australia?",
      correct_answer: "Canberra",
      incorrect_answers: ["Sydney", "Melbourne", "Brisbane"]
    },
    {
      category: "Geography",
      categoryId: 22,
      difficulty: "hard",
      question: "Which landlocked country is completely enclosed by South Africa?",
      correct_answer: "Lesotho",
      incorrect_answers: ["Eswatini", "Botswana", "Namibia"]
    },
    {
      category: "Entertainment: Film",
      categoryId: 11,
      difficulty: "easy",
      question: "In 'The Matrix' (1999), which pill color allows Neo to wake up and see the real world?",
      correct_answer: "Red Pill",
      incorrect_answers: ["Blue Pill", "Green Pill", "Yellow Pill"]
    },
    {
      category: "Entertainment: Film",
      categoryId: 11,
      difficulty: "medium",
      question: "Who directed the groundbreaking 1982 cyberpunk sci-fi masterpiece 'Blade Runner'?",
      correct_answer: "Ridley Scott",
      incorrect_answers: ["James Cameron", "Stanley Kubrick", "Steven Spielberg"]
    },
    {
      category: "Science: Mathematics",
      categoryId: 19,
      difficulty: "easy",
      question: "What is the numerical value represented by the Roman numeral 'D'?",
      correct_answer: "500",
      incorrect_answers: ["50", "100", "1000"]
    },
    {
      category: "Science: Mathematics",
      categoryId: 19,
      difficulty: "medium",
      question: "What is the only even prime number in mathematics?",
      correct_answer: "2",
      incorrect_answers: ["0", "4", "6"]
    },
    {
      category: "Entertainment: Music",
      categoryId: 12,
      difficulty: "easy",
      question: "Which legendary British rock band released the 1973 album 'The Dark Side of the Moon'?",
      correct_answer: "Pink Floyd",
      incorrect_answers: ["Led Zeppelin", "The Beatles", "Queen"]
    },
    {
      category: "Entertainment: Music",
      categoryId: 12,
      difficulty: "medium",
      question: "Who was the frontman and lead vocalist for the band Queen?",
      correct_answer: "Freddie Mercury",
      incorrect_answers: ["Brian May", "Roger Taylor", "John Deacon"]
    },
    {
      category: "Mythology",
      categoryId: 20,
      difficulty: "easy",
      question: "In Greek mythology, who was the king of the Olympian gods and wielder of thunderbolts?",
      correct_answer: "Zeus",
      incorrect_answers: ["Poseidon", "Hades", "Ares"]
    },
    {
      category: "Mythology",
      categoryId: 20,
      difficulty: "medium",
      question: "In Norse mythology, what is the name of Thor's enchanted hammer?",
      correct_answer: "Mjölnir",
      incorrect_answers: ["Gungnir", "Gram", "Tyrfing"]
    },
    {
      category: "Sports",
      categoryId: 21,
      difficulty: "easy",
      question: "How many players are on the field for one team in a standard soccer (football) match?",
      correct_answer: "11",
      incorrect_answers: ["9", "10", "12"]
    },
    {
      category: "Science: Gadgets",
      categoryId: 30,
      difficulty: "medium",
      question: "What does 'GPS' stand for in navigation technology?",
      correct_answer: "Global Positioning System",
      incorrect_answers: [
        "Geographic Pointing Satellite",
        "General Propulsion Signal",
        "Global Path Station"
      ]
    },
    {
      category: "Vehicles",
      categoryId: 28,
      difficulty: "easy",
      question: "Which car company produces the iconic 'Mustang' muscle car?",
      correct_answer: "Ford",
      incorrect_answers: ["Chevrolet", "Dodge", "Pontiac"]
    }
  ];

  /* ----------------------------------------------------------------------------
     2. Game State
     ---------------------------------------------------------------------------- */
  const state = {
    categories: [...FALLBACK_CATEGORIES],
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
    try {
      const doc = new DOMParser().parseFromString(htmlString, "text/html");
      return doc.documentElement.textContent || "";
    } catch (e) {
      const txt = document.createElement("textarea");
      txt.innerHTML = htmlString;
      return txt.value;
    }
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
     6. Category Population & Background Fetch
     ---------------------------------------------------------------------------- */

  /**
   * Populates the category dropdown using provided category list.
   */
  function populateCategoryDropdown(categories) {
    categorySelect.innerHTML = '<option value="">Any Category (General Matrix)</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    categorySelect.disabled = false;
    startBtn.disabled = false;
  }

  /**
   * Fetches latest categories from OpenTDB with timeout.
   * If network fails or is blocked, gracefully retains preloaded categories.
   */
  async function fetchCategories() {
    categoryError.classList.add("hidden");
    categoryStatus.textContent = "ONLINE // READY";
    categoryStatus.style.color = "var(--neon-emerald)";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(OPENTDB_CATEGORIES_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.trivia_categories && Array.isArray(data.trivia_categories)) {
          state.categories = data.trivia_categories.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          populateCategoryDropdown(state.categories);
          categoryStatus.textContent = "ONLINE // READY";
          categoryStatus.style.color = "var(--neon-emerald)";
          return;
        }
      }
    } catch (err) {
      // Soft notice, non-blocking fallback
      console.info("Using cached categories matrix:", err.message);
    }

    // Always keep ready state
    categoryStatus.textContent = "ONLINE // CACHED";
    categoryStatus.style.color = "var(--neon-cyan)";
    categorySelect.disabled = false;
    startBtn.disabled = false;
    categoryError.classList.add("hidden");
  }

  /* ----------------------------------------------------------------------------
     7. Question Fetching with Resilient Fallback
     ---------------------------------------------------------------------------- */

  /**
   * Picks 10 questions from the local vault matching category and difficulty if possible,
   * or a randomized high-variety blend across domains.
   */
  function getQuestionsFromLocalVault(categoryId, difficulty) {
    let pool = [...LOCAL_QUESTION_VAULT];

    // Filter by category if specified and questions exist
    if (categoryId) {
      const numId = parseInt(categoryId, 10);
      const filteredByCat = pool.filter((q) => q.categoryId === numId);
      if (filteredByCat.length >= 5) {
        pool = filteredByCat;
      }
    }

    // Filter by difficulty if specified and sufficient
    if (difficulty) {
      const filteredByDiff = pool.filter((q) => q.difficulty === difficulty.toLowerCase());
      if (filteredByDiff.length >= 8) {
        pool = filteredByDiff;
      }
    }

    // Shuffle and pick up to 10
    const shuffled = shuffleArray(pool);
    const selected = shuffled.slice(0, TOTAL_QUESTIONS);

    // If pool had fewer than 10, fill from general pool
    if (selected.length < TOTAL_QUESTIONS) {
      const remaining = shuffleArray(LOCAL_QUESTION_VAULT.filter((q) => !selected.includes(q)));
      while (selected.length < TOTAL_QUESTIONS && remaining.length > 0) {
        selected.push(remaining.pop());
      }
    }

    return processQuestionData(selected);
  }

  /**
   * Fetches questions from OpenTDB with graceful fallback to the local vault.
   * Eliminates all "Error fetching questions" dead ends.
   */
  async function fetchQuestions(categoryId, difficulty) {
    let url = `${OPENTDB_QUESTIONS_URL}?amount=${TOTAL_QUESTIONS}&type=multiple`;

    if (categoryId) {
      url += `&category=${encodeURIComponent(categoryId)}`;
    }
    if (difficulty) {
      url += `&difficulty=${encodeURIComponent(difficulty)}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        if (data.response_code === 0 && data.results && data.results.length >= TOTAL_QUESTIONS) {
          return processQuestionData(data.results.slice(0, TOTAL_QUESTIONS));
        }

        // Response code 1 = not enough questions for specific combo.
        // Try fallback to same category without difficulty constraint
        if (data.response_code === 1 && difficulty) {
          console.info("Relaxing difficulty constraint to fetch available questions...");
          const fallbackUrl = `${OPENTDB_QUESTIONS_URL}?amount=${TOTAL_QUESTIONS}&type=multiple${categoryId ? `&category=${encodeURIComponent(categoryId)}` : ""}`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.response_code === 0 && fallbackData.results && fallbackData.results.length >= TOTAL_QUESTIONS) {
              return processQuestionData(fallbackData.results.slice(0, TOTAL_QUESTIONS));
            }
          }
        }
      }
    } catch (err) {
      console.warn("OpenTDB API network issue, engaging local neural vault:", err.message);
    }

    // Seamless fallback to local question vault:
    console.info("Loading 10 verified questions from local cyber matrix.");
    return getQuestionsFromLocalVault(categoryId, difficulty);
  }

  function processQuestionData(rawList) {
    return rawList.map((item) => {
      const decodedQuestion = decodeHtml(item.question);
      const decodedCorrect = decodeHtml(item.correct_answer);
      const decodedIncorrect = (item.incorrect_answers || []).map((ans) => decodeHtml(ans));

      // Shuffled 4 options
      const allOptions = shuffleArray([decodedCorrect, ...decodedIncorrect]);

      return {
        category: decodeHtml(item.category),
        difficulty: item.difficulty || "medium",
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
    startBtn.querySelector(".btn-glitch-text").textContent = "LAUNCHING MATRIX...";
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
      console.error("Quiz initialization error:", err);
      // Even on catastrophic unexpected failure, guarantee fallback
      state.questions = getQuestionsFromLocalVault(catId, diff);
      state.currentIndex = 0;
      state.score = 0;
      state.userAnswers = [];
      switchScreen(quizScreen);
      renderQuestion();
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

    const stepMs = 50; // Smooth 50ms animation tick
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

    // Keyboard navigation (1-4 number shortcuts for options)
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
    // 1. Immediately populate with standard categories so UI is 100% functional right away
    populateCategoryDropdown(FALLBACK_CATEGORIES);

    // 2. Load lifetime high score
    updateStartScreenHighScoreHUD();

    // 3. Attach listeners
    initEventListeners();

    // 4. Silently query OpenTDB in the background to refresh categories
    fetchCategories();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
