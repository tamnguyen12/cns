const letters = ["A", "B", "C", "D"];
const chapters = Array.isArray(window.quizChapters) ? window.quizChapters : quizChapters;
let activeChapter = null;

const state = {
  current: {},
  answers: {}
};

chapters.forEach(chapter => {
  state.current[chapter.id] = 0;
  state.answers[chapter.id] = Array(chapter.questions.length).fill(null);
});

const chapterCount = document.getElementById("chapterCount");
const chapterList = document.getElementById("chapterList");
const activeChapterTitle = document.getElementById("activeChapterTitle");
const activeChapterName = document.getElementById("activeChapterName");
const activeQuestionTotal = document.getElementById("activeQuestionTotal");
const questionGrid = document.getElementById("questionGrid");
const categoryLabel = document.getElementById("categoryLabel");
const questionIndex = document.getElementById("questionIndex");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const explanationEl = document.getElementById("explanation");
const answeredCount = document.getElementById("answeredCount");
const scoreCount = document.getElementById("scoreCount");
const progressBar = document.getElementById("progressBar");
const totalCount = document.getElementById("totalCount");
const emptyState = document.getElementById("emptyState");
const quizLayout = document.querySelector(".quiz-layout");
const toolbar = document.querySelector(".toolbar");

function getChapter() {
  if (activeChapter === null) return null;
  return chapters[activeChapter];
}

function getQuestions() {
  return getChapter()?.questions || [];
}

function getCurrentIndex() {
  const chapter = getChapter();
  if (!chapter) return 0;
  return state.current[chapter.id] || 0;
}

function setCurrentIndex(index) {
  const chapter = getChapter();
  if (!chapter) return;
  const questions = getQuestions();
  state.current[chapter.id] = Math.max(0, Math.min(questions.length - 1, index));
}

function getAnswers() {
  const chapter = getChapter();
  return chapter ? state.answers[chapter.id] : [];
}

function renderChapters() {
  chapterCount.textContent = `${chapters.length} chương`;
  chapterList.innerHTML = "";

  chapters.forEach((chapter, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-card";
    btn.dataset.chapterId = chapter.id;
    btn.classList.toggle("active", index === activeChapter);
    btn.classList.toggle("empty", chapter.status !== "ready");
    btn.innerHTML = `
      <span>${chapter.title}</span>
      <strong>${chapter.name}</strong>
      <small>${chapter.questions.length ? `${chapter.questions.length} câu` : "Chưa có dữ liệu"}</small>
    `;
    btn.addEventListener("click", () => {
      activeChapter = index;
      render();
    });
    chapterList.appendChild(btn);
  });
}

function renderGrid() {
  const questions = getQuestions();
  const answers = getAnswers();
  const current = getCurrentIndex();
  questionGrid.innerHTML = "";
  totalCount.textContent = `${questions.length} câu`;

  questions.forEach((question, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = index + 1;
    btn.title = question.category;
    btn.classList.toggle("active", index === current);
    const selected = answers[index];
    if (selected !== null) {
      btn.classList.add(selected === question.correct ? "correct" : "wrong");
    }
    btn.addEventListener("click", () => {
      setCurrentIndex(index);
      render();
    });
    questionGrid.appendChild(btn);
  });
}

function renderQuestion() {
  const questions = getQuestions();
  if (!questions.length) return;

  const current = getCurrentIndex();
  const answers = getAnswers();
  const question = questions[current];
  const selected = answers[current];
  categoryLabel.textContent = question.category;
  questionIndex.textContent = `Câu ${current + 1}/${questions.length}`;
  questionText.textContent = question.q;
  optionsEl.innerHTML = "";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    if (selected !== null && index === question.correct) btn.classList.add("reveal-correct");
    if (selected === index) btn.classList.add("selected", index === question.correct ? "correct" : "wrong");
    btn.innerHTML = `<span class="option-key">${letters[index]}</span><span>${option}</span>`;
    btn.addEventListener("click", () => {
      answers[current] = index;
      render();
    });
    optionsEl.appendChild(btn);
  });

  if (selected === null) {
    explanationEl.hidden = true;
    explanationEl.textContent = "";
  } else {
    const prefix = selected === question.correct ? "Đúng." : `Chưa đúng. Đáp án đúng là ${letters[question.correct]}.`;
    explanationEl.hidden = false;
    explanationEl.textContent = `${prefix} ${question.explanation}`;
  }
}

function renderStats() {
  const questions = getQuestions();
  const answers = getAnswers();
  const answered = answers.filter(answer => answer !== null).length;
  const score = answers.reduce((total, answer, index) => {
    return total + (answer === questions[index].correct ? 1 : 0);
  }, 0);
  answeredCount.textContent = answered;
  scoreCount.textContent = score;
  progressBar.style.width = `${questions.length ? (answered / questions.length) * 100 : 0}%`;
}

function renderChapterHeader() {
  const chapter = getChapter();
  if (!chapter) {
    activeChapterTitle.textContent = "Chọn chương";
    activeChapterName.textContent = "Chọn một chương để bắt đầu làm bài";
    activeQuestionTotal.textContent = "0";
    return;
  }
  activeChapterTitle.textContent = chapter.title;
  activeChapterName.textContent = chapter.name;
  activeQuestionTotal.textContent = chapter.questions.length;
}

function render() {
  const chapter = getChapter();
  const questions = getQuestions();
  renderChapters();
  renderChapterHeader();

  const hasQuestions = Boolean(chapter && questions.length > 0);
  quizLayout.hidden = !hasQuestions;
  toolbar.hidden = !hasQuestions;
  emptyState.hidden = hasQuestions;

  if (!hasQuestions) {
    answeredCount.textContent = "0";
    scoreCount.textContent = "0";
    progressBar.style.width = "0";
    emptyState.querySelector("strong").textContent = chapter ? "Chương này chưa có câu hỏi." : "Hãy chọn một chương.";
    emptyState.querySelector("span").textContent = chapter
      ? "Khi bạn thêm PDF chương mới, dữ liệu câu hỏi có thể được đưa vào quiz-data.js theo cấu trúc sẵn có."
      : "Bấm vào Chương 1 để mở 100 câu trắc nghiệm hiện có.";
    return;
  }

  renderGrid();
  renderQuestion();
  renderStats();
}

document.getElementById("prevBtn").addEventListener("click", () => {
  setCurrentIndex(getCurrentIndex() - 1);
  render();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  setCurrentIndex(getCurrentIndex() + 1);
  render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  const chapter = getChapter();
  if (!chapter) return;
  state.answers[chapter.id] = Array(getQuestions().length).fill(null);
  state.current[chapter.id] = 0;
  render();
});

render();
