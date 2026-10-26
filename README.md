# Qriosity — Dynamic Trivia Quiz Website

A dynamic, responsive, client-side trivia quiz web application that fetches multiple-choice questions from the Open Trivia Database (OpenTDB) API based on customizable user preferences.

---

## 1. Project Overview

**Qriosity** offers a fast-paced trivia challenge featuring 10 questions per round across diverse categories and difficulties. Players race against a 15-second countdown timer for each question, receive immediate visual feedback, review any missed questions at the end, and track their all-time top 5 high scores stored securely in the browser.

---

## 2. Features

- **Dynamic Category Fetching**: Categories are loaded in real time on startup directly from the Open Trivia DB API, populating an alphabetical dropdown with an "Any Category" default option.
- **Difficulty Selection**: Select from *Any Difficulty*, *Easy*, *Medium*, or *Hard*.
- **Configurable Quiz Sessions**: Requests exactly 10 questions tailored to the player's chosen category and difficulty.
- **15-Second Question Timer**:
  - Visible numeric countdown alongside a smoothly shrinking progress indicator bar.
  - Automatically turns to a warning alert state when 5 seconds or fewer remain.
  - Automatically times out unanswered questions, reveals the correct answer, and locks options.
- **Randomized Answer Options**: Shuffles the single correct answer and three incorrect answers using the Fisher-Yates algorithm so the order is unpredictable and stable per question.
- **Immediate Answer Feedback**:
  - Correct selection turns **GREEN** with a `✓` indicator.
  - Incorrect selection turns **RED** with a `✗` indicator and simultaneously reveals the correct answer in **GREEN** with `✓`.
  - All option buttons are locked immediately after selection to prevent duplicate answers.
  - Clear **Next** button (labeled **Finish** on question 10) appears after an answer or timeout.
- **Quiz Progress Indicator**: Real-time counter (`Question X of 10`) and animated progress bar.
- **Result Summary**:
  - Displays final score as `X / 10`, percentage score, and a motivational message based on performance.
- **Missed Questions Review**:
  - Lists *only* questions that were answered incorrectly or timed out.
  - Displays the question text, the user's answer (or "No answer: time ran out"), and the correct answer.
  - Shows "Perfect score, nothing to review!" when achieving 10 / 10.
- **Top 5 High Scores Persistence**:
  - Saved to `localStorage` under the key `triviaQuizHighScores`.
  - Stores `{ score, total, category, difficulty, date }`.
  - Sorted by score descending, with ties broken by the most recent attempt.
  - Displayed on both the Start screen and Result screen.
  - Guarded by robust `try/catch` and schema validation to prevent corrupted storage crashes.
- **Play Again**: Restarts the quiz back on the Start screen while retaining already-fetched categories without making redundant network calls.
- **Error & Rate Limit Handling**:
  - Graceful notifications for connection failures, insufficient question pools (`response_code: 1`), and API rate limits (`response_code: 5` / HTTP 429) with a 5-second cooldown safety lock.
- **Accessibility & Security**:
  - Semantic HTML5 elements (`<main>`, `<section>`, `<header>`, `<button>`, `<label>`).
  - Screen reader announcements via `aria-live="polite"`.
  - Full keyboard navigation and visible focus rings.
  - HTML entity decoding via `DOMParser` with strict `textContent` DOM rendering to prevent XSS.

---

## 3. Tech Stack

- **HTML5**: Semantic document structure, accessible ARIA attributes, clean forms.
- **CSS3**: Modern Vanilla CSS, CSS Custom Properties (variables), Flexbox, CSS Grid, glassmorphism, responsive breakpoints (mobile-first from 320px up).
- **JavaScript (ES6+)**: Vanilla JavaScript, asynchronous `fetch` with `async/await`, Fisher-Yates shuffle, DOM manipulation, `localStorage` persistence.
- **Open Trivia Database API**: External REST API source for categories and trivia questions.
- **Zero Dependencies**: No libraries, no frameworks (React, jQuery, Bootstrap, Tailwind, etc.), no build tools, no npm packages.

---

## 4. How It Works

The quiz lifecycle follows a linear, single-screen state machine:

```
[Start Screen]
     │
     ├── 1. Fetches categories from API on page load
     ├── 2. Reads & displays top 5 high scores from localStorage
     ├── 3. User chooses Category & Difficulty
     └── 4. User clicks "Start Quiz"
             │
             ▼
[Quiz Screen (Questions 1 to 10)]
     │
     ├── 1. Decodes HTML entities & shuffles 4 choices
     ├── 2. 15-second countdown timer starts
     ├── 3. User clicks an option OR timer expires:
     │      - Timer stops
     │      - Options lock
     │      - Immediate Green / Red color & icon feedback
     │      - Next button appears (labeled "Finish" on question 10)
     └── 4. User clicks "Next" / "Finish" -> Repeat for 10 questions
             │
             ▼
[Result & Review Screen]
     │
     ├── 1. Computes final score, percentage, & feedback message
     ├── 2. Saves score to localStorage (keeping sorted top 5)
     ├── 3. Renders Review section for incorrect / timed-out questions
     ├── 4. Displays updated Top 5 High Scores
     └── 5. User clicks "Play Again"
             │
             ▼
[Return to Start Screen (Reusing loaded categories)]
```

---

## 5. Project Structure

```
Qriosity/
├── index.html        # Semantic HTML5 markup and screen definitions
├── style.css         # Modern styling, theme variables, and animations
├── script.js         # Modular ES6+ quiz engine, state, API, & storage
├── README.md         # Full project documentation and user guide
└── .gitignore        # Ignores OS, editor, and build artifacts
```

---

## 6. How to Run Locally

Because Qriosity uses pure HTML, CSS, and vanilla JavaScript without any build steps or npm installations, you can run it immediately on any computer:

### Option A: Open Directly in a Browser
Simply double-click `index.html` or drag and drop it into any modern web browser (Chrome, Firefox, Safari, Edge).

### Option B: Using Python's Built-in HTTP Server
If you prefer running through a local web server:
```bash
# Navigate to the project root directory
cd Qriosity

# Run local HTTP server (Python 3)
python -m http.server 8000
```
Then open your browser and navigate to:
```
http://localhost:8000
```

### Option C: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and select **"Open with Live Server"**.

*No dependencies, installations, or compilers required!*

---

## 7. How to Deploy for Free with GitHub Pages

You can host this project online for free in under a minute using GitHub Pages:

1. Push your repository to GitHub (e.g. `https://github.com/luckycode1206/trivia-quiz-app`).
2. Go to your repository on GitHub and click on the **Settings** tab.
3. In the left sidebar, navigate to **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and leave the folder set to `/ (root)`.
5. Click **Save**.
6. Wait 1–2 minutes for GitHub Actions to deploy the site. Your live URL will be:
   ```
   https://luckycode1206.github.io/trivia-quiz-app/
   ```

---

## 8. API Reference

This project integrates with the public, free **Open Trivia Database**:

1. **Categories Endpoint**:
   - `GET https://opentdb.com/api_category.php`
   - Returns a list of all official trivia categories with their unique integer IDs.
2. **Questions Endpoint**:
   - `GET https://opentdb.com/api.php?amount=10&type=multiple[&category=ID][&difficulty=easy|medium|hard]`
   - `amount`: Always set to `10`.
   - `type`: Set to `multiple` (four-choice questions).
   - `category`: Omitted when the user selects "Any Category".
   - `difficulty`: Omitted when the user selects "Any Difficulty".

*Special thanks and attribution to [Open Trivia DB (opentdb.com)](https://opentdb.com) for providing the free trivia questions and category data.*

---

## 9. Known Limitations

- **API Rate Limiting**: The public Open Trivia DB API restricts requests to approximately 1 request per 5 seconds per IP. If you make multiple rapid requests, the API returns HTTP 429 (`response_code: 5`). The app catches this and locks the Start button for 5 seconds with a cooldown countdown.
- **Specific Category Question Pools**: Certain niche categories have fewer than 10 questions for a given difficulty (e.g. "Entertainment: Japanese Anime & Manga" on "Hard"). When this happens, the API returns `response_code: 1`. The app displays a friendly error requesting the user to select another difficulty or category.
- **Internet Connection Required**: Because questions and categories are fetched dynamically from Open Trivia DB on demand, an active internet connection is required to start a quiz.
- **Storage Scope**: High scores are stored in browser `localStorage` and are scoped to the individual browser and device.

---

## 10. Author & License

- **Author**: [luckycode1206](https://github.com/luckycode1206)
- **License**: Released under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this project.
