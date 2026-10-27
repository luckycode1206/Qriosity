# Qriocity — Cyber-Arcade Neon Trivia Matrix

A complete, production-ready, dynamic trivia quiz web application named **Qriocity** built strictly with vanilla **HTML5**, **CSS3**, and **JavaScript (ES6+)**. Powered by the free Open Trivia Database (OpenTDB) API with zero external frameworks, backends, or paid services.

---

## 🎨 Visual & Theme Design ("Cyber-Arcade Neon")

- **Background**: Deep midnight black / dark charcoal (`#0f1016`) with an animated glowing cyber grid and ambient radial neon orbs (`#00f5ff` cyan & `#a855f7` purple).
- **Containers/Cards**: Translucent dark gray cards (`rgba(18, 22, 34, 0.78)`) featuring a frosted glass effect (`backdrop-filter: blur(14px)`), subtle glowing borders, and neon gradient top dividers.
- **Accents**: Electric neon purple (`#a855f7`) and electric cyan (`#00f5ff`) highlights for headers, badges, timers, and buttons.
- **Interactive UI**:
  - Smooth transitions and screen fade-ins (`#start-screen`, `#quiz-screen`, `#result-screen`).
  - Option buttons lift up on hover (`transform: translateY(-3px) scale(1.01)`) with a glowing neon border (`box-shadow: 0 0 18px rgba(0, 245, 255, 0.42)`).
  - Fully responsive layout optimized for mobile, tablet, and desktop viewports.

---

## 🕹️ Functional Features

### 1. Start Screen
- **App Branding**: "Qriocity" title with glowing cyberpunk gradient and futuristic subtitle.
- **Lifetime High Score HUD**: Retrieves and displays the player's lifetime best score from browser `localStorage`.
- **Dynamic Category Fetching**: Queries `https://opentdb.com/api_category.php` on startup, populates sorted categories, and provides an inline retry trigger on network errors.
- **Difficulty Selection**: Dropdown options for **Easy**, **Medium**, and **Hard** (along with an "Any Difficulty" option).
- **Glowing Start Button**: Neon cyan-to-purple gradient with hover glow and loading feedback.

### 2. Quiz Screen (Gameplay)
- **10 Questions**: Queries `https://opentdb.com/api.php?amount=10&category=[CAT_ID]&difficulty=[DIFFICULTY]&type=multiple`.
- **HUD Progress & Status**: Real-time progress tracker ("Question 3 of 10"), category pill, difficulty badge, and live score counter.
- **15-Second Glowing Countdown Timer**:
  - Smooth visual timer bar that shrinks from 100% to 0%.
  - Animated digital seconds counter.
  - Automatically transitions to a pulsing warning state at $\le 4$ seconds.
  - On timeout: Locks all options, marks question as incorrect, turns the correct option Neon Emerald Green, and reveals the "Next" button.
- **4 Shuffled Options**:
  - Correct answer and three incorrect answers shuffled randomly via the Fisher-Yates algorithm.
  - Robust HTML entity decoding (e.g. `&quot;`, `&#039;`, `&amp;`) using native `DOMParser`.
- **Immediate Visual Feedback**:
  - Options are immediately disabled on click to prevent double submissions.
  - Correct answer highlights in **Neon Emerald Green** (`#00ff9d`) with a `✓` checkmark.
  - If incorrect, the chosen option highlights in **Laser Crimson Red** (`#ff0055`) with a `✗` cross and subtle haptic shake.
  - Informative toast feedback banner and glowing "Next Question" / "View Final Results" button.

### 3. Final Score & Review Screen
- **Score Pod**: Displays final score out of 10 (e.g., `8 / 10`) and assigns a dynamic cyber rank (e.g., *Synapse Overlord*, *Cyber Master*, *Neural Operative*).
- **Lifetime High Score Celebration**:
  - Saves best score to `localStorage` under `qriocity_lifetime_high_score`.
  - When the lifetime high score is beaten, an animated **"★ NEW HIGH SCORE ACHIEVED! ★"** banner flashes alongside high-octane celebratory canvas confetti particles.
- **Missed Questions Review**:
  - Lists every question answered incorrectly or timed out.
  - Displays the full question text, user's wrong answer (Laser Crimson Red badge) or timeout status, and the correct answer (Neon Emerald Green badge).
  - Displays a special "Flawless Cyber Victory!" card if 10/10 is achieved.
- **Play Again Button**:
  - Resets state cleanly and returns to the Start Screen without refetching categories redundantly.

---

## 🚀 Running Locally

Serve via any static HTTP server or open directly in the browser:

```bash
# Using Python built-in server:
python -m http.server 3000

# Open in browser:
http://localhost:3000
```
