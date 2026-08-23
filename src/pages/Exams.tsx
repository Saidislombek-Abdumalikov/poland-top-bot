import { useState } from "react";

const exams = [
  { id: "pol-lang-b1", name: "Polish Language — B1", subject: "Polish Language", level: "B1", questions: 60, time: 90, year: 2024, category: "Language" },
  { id: "pol-lang-b2", name: "Polish Language — B2", subject: "Polish Language", level: "B2", questions: 70, time: 110, year: 2024, category: "Language" },
  { id: "math-entrance", name: "Mathematics Entrance Exam", subject: "Mathematics", level: "University Entrance", questions: 40, time: 120, year: 2024, category: "Entrance" },
  { id: "biology-prep", name: "Biology — Medical Prep", subject: "Biology", level: "Advanced", questions: 50, time: 90, year: 2024, category: "Science" },
  { id: "chem-prep", name: "Chemistry — Medical Prep", subject: "Chemistry", level: "Advanced", questions: 45, time: 90, year: 2024, category: "Science" },
  { id: "eng-cert", name: "English Proficiency Practice", subject: "English", level: "B2–C1", questions: 55, time: 80, year: 2024, category: "Language" },
  { id: "history-pol", name: "Polish History & Culture", subject: "History", level: "Intermediate", questions: 35, time: 60, year: 2023, category: "Culture" },
  { id: "phys-entrance", name: "Physics Entrance Exam", subject: "Physics", level: "University Entrance", questions: 40, time: 100, year: 2024, category: "Entrance" },
];

const categories = ["All", "Language", "Entrance", "Science", "Culture"];

export default function Exams() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeExam, setActiveExam] = useState<typeof exams[0] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const filtered = exams.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "All" && e.category !== category) return false;
    return true;
  });

  const mockQuestions = [
    { q: "Which of the following is the capital of Poland?", options: ["Kraków", "Warsaw", "Gdańsk", "Poznań"], correct: "Warsaw" },
    { q: "Poland joined the European Union in:", options: ["2002", "2004", "2006", "2008"], correct: "2004" },
    { q: "What is the Polish currency?", options: ["Euro", "Koruna", "Złoty", "Forint"], correct: "Złoty" },
    { q: "The Jagiellonian University was founded in:", options: ["1264", "1364", "1464", "1564"], correct: "1364" },
    { q: "Poland's largest city by population is:", options: ["Kraków", "Gdańsk", "Warsaw", "Wrocław"], correct: "Warsaw" },
  ];

  if (activeExam) {
    const question = mockQuestions[currentQ];
    const score = Object.keys(answers).filter((k) => answers[Number(k)] === mockQuestions[Number(k)]?.correct).length;

    return (
      <div className="max-w-[760px] mx-auto px-6 py-10">
        {/* Exam header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-label text-[#9E9E98] mb-1">{activeExam.subject}</p>
            <h1 className="text-h3 text-[#141413]">{activeExam.name}</h1>
          </div>
          <button onClick={() => { setActiveExam(null); setAnswers({}); setCurrentQ(0); setSubmitted(false); }} className="text-[13px] text-[#5C5C57] hover:text-[#141413]">
            ← Back to exams
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 bg-[#E3E3DE] rounded-full overflow-hidden">
            <div className="h-full bg-[#1C4587] rounded-full transition-all" style={{ width: `${((currentQ + 1) / mockQuestions.length) * 100}%` }} />
          </div>
          <span className="text-[12px] text-[#9E9E98] shrink-0">Question {currentQ + 1} of {mockQuestions.length}</span>
        </div>

        {submitted ? (
          <div className="text-center py-12 bg-white border border-[#E3E3DE] rounded-[12px]">
            <div className="text-[48px] font-bold text-[#141413] mb-2">{score}/{mockQuestions.length}</div>
            <p className="text-[15px] text-[#5C5C57] mb-6">{score >= 4 ? "Excellent result!" : score >= 3 ? "Good effort!" : "Keep practicing!"}</p>
            <div className="space-y-2 text-left max-w-[400px] mx-auto mb-8">
              {mockQuestions.map((mq, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-[6px] ${answers[i] === mq.correct ? "bg-[#EDFAF3]" : "bg-[#FEF2F2]"}`}>
                  <span className="text-[12px] font-medium mt-0.5">{answers[i] === mq.correct ? "✓" : "✗"}</span>
                  <div>
                    <p className="text-[12px] font-medium text-[#141413]">{mq.q}</p>
                    <p className="text-[11px] text-[#5C5C57]">Correct: {mq.correct}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setAnswers({}); setCurrentQ(0); setSubmitted(false); }} className="px-5 py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571]">
              Try again
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-7">
            <p className="text-[17px] font-medium text-[#141413] mb-6">{question.q}</p>
            <div className="space-y-2 mb-8">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                  className={`w-full text-left px-4 py-3 rounded-[7px] border text-[14px] transition-colors ${
                    answers[currentQ] === opt ? "border-[#1C4587] bg-[#EEF2FB] text-[#1C4587] font-medium" : "border-[#E3E3DE] text-[#141413] hover:border-[#1C4587]/30 hover:bg-[#F8F8F7]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 border border-[#E3E3DE] rounded-[6px] text-[13px] font-medium text-[#5C5C57] hover:bg-[#F8F8F7] disabled:opacity-40"
              >
                Previous
              </button>
              {currentQ < mockQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  disabled={!answers[currentQ]}
                  className="px-4 py-2 bg-[#1C4587] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#163571] disabled:opacity-40"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={!answers[currentQ]}
                  className="px-4 py-2 bg-[#2E7D52] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#236040] disabled:opacity-40"
                >
                  Submit exam
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Practice</p>
        <h1 className="text-h1 text-[#141413] mb-2">Exams & Practice Tests</h1>
        <p className="text-body text-[#5C5C57]">Prepare for university entrance exams and language requirements.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input type="text" placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-10 px-3.5 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587]" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 h-10 rounded-[5px] text-[13px] font-medium border transition-colors ${category === cat ? "bg-[#1C4587] text-white border-[#1C4587]" : "bg-white border-[#E3E3DE] text-[#5C5C57] hover:bg-[#F8F8F7]"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((exam) => (
          <div key={exam.id} className="bg-white border border-[#E3E3DE] rounded-[10px] p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-[14px] font-semibold text-[#141413]">{exam.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#F0F0EE] text-[#5C5C57] rounded-[3px]">{exam.category}</span>
              </div>
              <p className="text-[12px] text-[#9E9E98] mb-3">{exam.subject} · Level: {exam.level} · {exam.year}</p>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#5C5C57]">{exam.questions} questions</span>
                <span className="text-[12px] text-[#5C5C57]">{exam.time} min</span>
              </div>
            </div>
            <button
              onClick={() => { setActiveExam(exam); setAnswers({}); setCurrentQ(0); setSubmitted(false); }}
              className="shrink-0 px-3.5 py-1.5 bg-[#1C4587] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#163571]"
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
