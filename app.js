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
const generateExamBtn = document.getElementById("generateExamBtn");
const examOutput = document.getElementById("examOutput");
let generatedExamChapter = null;

function getChapter() {
  if (activeChapter === null) return null;
  if (activeChapter === "exam") return generatedExamChapter;
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
  chapterCount.textContent = `${chapters.length + (generatedExamChapter ? 1 : 0)} mục`;
  chapterList.innerHTML = "";

  if (generatedExamChapter) {
    const examBtn = document.createElement("button");
    examBtn.type = "button";
    examBtn.className = "chapter-card exam-card";
    examBtn.dataset.chapterId = generatedExamChapter.id;
    examBtn.classList.toggle("active", activeChapter === "exam");
    examBtn.innerHTML = `
      <span>${generatedExamChapter.title}</span>
      <strong>${generatedExamChapter.name}</strong>
      <small>${generatedExamChapter.questions.length} câu - làm trực tiếp</small>
    `;
    examBtn.addEventListener("click", () => {
      activeChapter = "exam";
      render();
    });
    chapterList.appendChild(examBtn);
  }

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

function shuffleItems(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickQuestions(sourceQuestions, count) {
  return shuffleItems(sourceQuestions).slice(0, count);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeMarkdownCell(value) {
  return String(value).replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function getChapterById(id) {
  return chapters.find(chapter => chapter.id === id);
}

function buildExamSources() {
  const chapter2 = getChapterById("chuong-2");
  const fileFormats = getChapterById("on-dinh-dang-tep");
  return [
    { label: "Bài 1", count: 6, questions: getChapterById("chuong-1")?.questions || [] },
    { label: "Bài 2", count: 7, questions: [...(chapter2?.questions || []), ...(fileFormats?.questions || [])] },
    { label: "Bài 3", count: 7, questions: getChapterById("chuong-3")?.questions || [] },
    { label: "Bài 4", count: 6, questions: getChapterById("chuong-4")?.questions || [] },
    { label: "Bài 5", count: 7, questions: getChapterById("chuong-5")?.questions || [] },
    { label: "Bài 6", count: 7, questions: getChapterById("chuong-6")?.questions || [] }
  ];
}

function makeExamQuestion(question, answerSlot) {
  const correctText = question.options[question.correct];
  const wrongOptions = shuffleItems(question.options.filter((_, index) => index !== question.correct));
  const options = Array(4).fill(null);
  options[answerSlot] = correctText;
  let wrongIndex = 0;

  for (let i = 0; i < options.length; i += 1) {
    if (options[i] === null) {
      options[i] = wrongOptions[wrongIndex];
      wrongIndex += 1;
    }
  }

  return {
    q: question.q,
    options,
    correct: answerSlot,
    explanation: question.explanation
  };
}

function buildExamMarkdown(rows, answerStats, chapterStats) {
  const tableRows = rows.map(row => {
    return `| ${row.tt} | ${row.chapter} | ${escapeMarkdownCell(row.question)} | ${escapeMarkdownCell(row.options[0])} | ${escapeMarkdownCell(row.options[1])} | ${escapeMarkdownCell(row.options[2])} | ${escapeMarkdownCell(row.options[3])} | ${row.answer} |`;
  });

  return [
    "| TT | Bài/Chương | Nội dung câu hỏi | Phương án A | Phương án B | Phương án C | Phương án D | Đáp án |",
    "|---:|---|---|---|---|---|---|:---:|",
    ...tableRows,
    "",
    "## Bảng phân bổ đáp án",
    `A: ${answerStats.A} câu; B: ${answerStats.B} câu; C: ${answerStats.C} câu; D: ${answerStats.D} câu.`,
    "",
    "## Kiểm tra chất lượng đề",
    "1. Tổng số câu: 40.",
    `2. Số câu mỗi chương: ${Object.entries(chapterStats).map(([chapter, total]) => `${chapter}: ${total}`).join("; ")}.`,
    "3. Đề bám theo mẫu: 40 câu, 4 phương án, 1 đáp án đúng, có phân bổ theo 6 bài và ưu tiên câu hiểu/vận dụng/tình huống.",
    "4. Chủ đề bao phủ: thiết bị số, khai thác dữ liệu và định dạng tệp, AI, giao tiếp số, sáng tạo nội dung số, an toàn và liêm chính học thuật."
  ].join("\n");
}

function renderExam(rows, answerStats, chapterStats) {
  const tableRows = rows.map(row => `
    <tr>
      <td>${row.tt}</td>
      <td>${row.chapter}</td>
      <td>${escapeHtml(row.question)}</td>
      <td>${escapeHtml(row.options[0])}</td>
      <td>${escapeHtml(row.options[1])}</td>
      <td>${escapeHtml(row.options[2])}</td>
      <td>${escapeHtml(row.options[3])}</td>
      <td>${row.answer}</td>
    </tr>
  `).join("");

  examOutput.hidden = false;
  examOutput.innerHTML = `
    <div class="exam-meta">Đề được tạo từ ngân hàng câu hỏi hiện có. Bài 2 đã gộp cả Chương 2 và phần Định dạng tệp Chương 2.</div>
    <div class="exam-table-wrap">
      <table class="exam-table">
        <thead>
          <tr>
            <th>TT</th>
            <th>Bài/Chương</th>
            <th>Nội dung câu hỏi</th>
            <th>Phương án A</th>
            <th>Phương án B</th>
            <th>Phương án C</th>
            <th>Phương án D</th>
            <th>Đáp án</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <div class="exam-summary">
      <section class="answer-distribution">
        <strong>Bảng phân bổ đáp án</strong>
        <div>A: ${answerStats.A} câu<br>B: ${answerStats.B} câu<br>C: ${answerStats.C} câu<br>D: ${answerStats.D} câu</div>
      </section>
      <section class="quality-check">
        <strong>Kiểm tra chất lượng đề</strong>
        <div>
          Tổng số câu: 40.<br>
          Số câu mỗi chương: ${Object.entries(chapterStats).map(([chapter, total]) => `${chapter}: ${total}`).join("; ")}.<br>
          Đề bám theo mẫu: 40 câu, 4 phương án, 1 đáp án đúng, phân bổ theo 6 bài.<br>
          Chủ đề chính: thiết bị số, dữ liệu/định dạng tệp, AI, giao tiếp số, sáng tạo nội dung, an toàn và liêm chính học thuật.
        </div>
      </section>
    </div>
  `;
}

function generateExam() {
  const sources = buildExamSources();
  const missingSource = sources.find(source => source.questions.length < source.count);
  if (missingSource) {
    examOutput.hidden = false;
    examOutput.innerHTML = `<div class="empty-state"><strong>Không đủ câu hỏi cho ${missingSource.label}.</strong><span>Cần ${missingSource.count} câu nhưng hiện chỉ có ${missingSource.questions.length} câu.</span></div>`;
    return;
  }

  const answerSlots = shuffleItems([...Array(10).fill(0), ...Array(10).fill(1), ...Array(10).fill(2), ...Array(10).fill(3)]);
  const generatedQuestions = [];
  const answerStats = { A: 0, B: 0, C: 0, D: 0 };
  const chapterStats = {};

  sources.forEach(source => {
    const picked = pickQuestions(source.questions, source.count);
    chapterStats[source.label] = picked.length;
    picked.forEach(question => {
      const answerSlot = answerSlots[generatedQuestions.length];
      const examQuestion = makeExamQuestion(question, answerSlot);
      answerStats[letters[examQuestion.correct]] += 1;
      generatedQuestions.push({
        category: `${source.label} - ${question.category}`,
        q: examQuestion.q,
        options: examQuestion.options,
        correct: examQuestion.correct,
        explanation: `${examQuestion.explanation} Nguồn: ${source.label}.`
      });
    });
  });

  generatedExamChapter = {
    id: "de-thi-40-cau",
    title: "Đề thi",
    name: "Đề 40 câu theo mẫu",
    source: "Tạo từ ngân hàng câu hỏi 6 chương",
    status: "ready",
    questions: generatedQuestions
  };
  state.current[generatedExamChapter.id] = 0;
  state.answers[generatedExamChapter.id] = Array(generatedQuestions.length).fill(null);
  activeChapter = "exam";
  examOutput.hidden = false;
  examOutput.innerHTML = `
    <div class="exam-meta">
      Đã tạo đề 40 câu để làm trực tiếp. Bài 2 đã gộp cả Chương 2 và phần Định dạng tệp Chương 2.
      Phân bổ câu: ${Object.entries(chapterStats).map(([chapter, total]) => `${chapter}: ${total}`).join("; ")}.
      Đáp án đúng được đảo đều: A ${answerStats.A}, B ${answerStats.B}, C ${answerStats.C}, D ${answerStats.D}.
    </div>
  `;
  render();
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

generateExamBtn.addEventListener("click", generateExam);

render();
