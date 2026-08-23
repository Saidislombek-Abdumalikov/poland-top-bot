import { ExamSubject } from "../types";

export const examSubjects: ExamSubject[] = [
  {
    id: "pol-lang-b1",
    name: {
      en: "Polish Language — B1 Practice",
      uz: "Polyak tili — B1 Imtihon testi",
    },
    category: "Language",
    level: "B1",
    timeMinutes: 20,
    questions: [
      {
        id: 1,
        q: {
          en: "Wybierz poprawne słowo: 'Codziennie rano _____ kawę i jem śniadanie.'",
          uz: "To'g'ri so'zni tanlang: 'Codziennie rano _____ kawę i jem śniadanie.'",
        },
        options: ["piję", "pijesz", "piją", "pijemy"],
        correct: "piję",
        explanation: {
          en: "The first-person singular form of 'pić' in the present tense is 'piję' (I drink).",
          uz: "'Pić' (ichmoq) fe'lining 1-shaxs birlikdagi hozirgi zamon shakli 'piję' bo'ladi.",
        },
      },
      {
        id: 2,
        q: {
          en: "Która forma jest poprawna? 'Idę do _____ po chleb.'",
          uz: "Qaysi shakl to'g'ri? 'Idę do _____ po chleb.'",
        },
        options: ["sklepu", "sklep", "sklepie", "sklepem"],
        correct: "sklepu",
        explanation: {
          en: "The preposition 'do' requires Genitive case (Dopełniacz): 'do sklepu'.",
          uz: "'Do' predlogidan keyin qaratqich kelishigi (Genitive) ishlatiladi: 'do sklepu'.",
        },
      },
      {
        id: 3,
        q: {
          en: "Jak powiedzieć 'Dziękuję bardzo' po angielsku?",
          uz: "'Dziękuję bardzo' iborasi qanday ma'noni bildiradi?",
        },
        options: ["Thank you very much / Katta rahmat", "Please / Iltimos", "Excuse me / Kechirasiz", "Good morning / Xayrli tong"],
        correct: "Thank you very much / Katta rahmat",
        explanation: {
          en: "'Dziękuję bardzo' means 'Thank you very much'.",
          uz: "'Dziękuję bardzo' — 'Katta rahmat' degan ma'noni beradi.",
        },
      },
      {
        id: 4,
        q: {
          en: "Wybierz liczbę mnogą dla słowa 'student':",
          uz: "'Student' so'zining ko'plik shakli qaysi?",
        },
        options: ["studenci", "studenty", "studenty", "studentowie"],
        correct: "studenci",
        explanation: {
          en: "Masculine personal plural of 'student' is 'studenci'.",
          uz: "'Student' otining erkak jinsi ko'plik shakli 'studenci' bo'ladi.",
        },
      },
      {
        id: 5,
        q: {
          en: "Gdzie znajduje się Wawel?",
          uz: "Vavel qal'asi (Wawel) qaysi shaharda joylashgan?",
        },
        options: ["w Krakowie", "w Warszawie", "we Wrocławiu", "w Gdańsku"],
        correct: "w Krakowie",
        explanation: {
          en: "Wawel Castle is the historic royal castle located in Kraków.",
          uz: "Vavel qal'asi Polshaning qadimiy poytaxti Krakov shahrida joylashgan.",
        },
      },
    ],
  },
  {
    id: "math-entrance",
    name: {
      en: "Mathematics Entrance Exam Prep",
      uz: "Matematika — Kirish imtihoniga tayyorgarlik",
    },
    category: "Entrance",
    level: "University Entrance",
    timeMinutes: 25,
    questions: [
      {
        id: 1,
        q: {
          en: "If f(x) = 2x² - 4x + 5, what is the minimum value of f(x)?",
          uz: "Agar f(x) = 2x² - 4x + 5 bo'lsa, funksiyaning eng kichik qiymati nechaga teng?",
        },
        options: ["3", "5", "1", "-3"],
        correct: "3",
        explanation: {
          en: "Vertex occurs at x = -b/(2a) = 4/(4) = 1. f(1) = 2(1) - 4(1) + 5 = 3.",
          uz: "Parabola uchi x = -b/(2a) = 4/4 = 1 nuqtada. f(1) = 2(1) - 4 + 5 = 3.",
        },
      },
      {
        id: 2,
        q: {
          en: "What is the derivative of f(x) = ln(x² + 1)?",
          uz: "f(x) = ln(x² + 1) funksiyaning hosilasi nima?",
        },
        options: ["2x / (x² + 1)", "1 / (x² + 1)", "2x(x² + 1)", "x / (x² + 1)"],
        correct: "2x / (x² + 1)",
        explanation: {
          en: "By chain rule, d/dx[ln(u)] = u'/u = (2x)/(x² + 1).",
          uz: "Zanjir qoidasiga ko'ra: (ln u)' = u'/u = 2x / (x² + 1).",
        },
      },
      {
        id: 3,
        q: {
          en: "Solve the equation: log₂(x - 3) = 4",
          uz: "Tenglamani yeching: log₂(x - 3) = 4",
        },
        options: ["19", "16", "11", "7"],
        correct: "19",
        explanation: {
          en: "x - 3 = 2⁴ = 16 => x = 19.",
          uz: "x - 3 = 2⁴ = 16 => x = 19.",
        },
      },
      {
        id: 4,
        q: {
          en: "What is the sum of the infinite geometric series: 6 + 3 + 1.5 + 0.75 + ...?",
          uz: "Cheksiz kamayuvchi geometrik progressiya yig'indisini toping: 6 + 3 + 1.5 + 0.75 + ...",
        },
        options: ["12", "18", "9", "15"],
        correct: "12",
        explanation: {
          en: "S = a / (1 - r) = 6 / (1 - 0.5) = 6 / 0.5 = 12.",
          uz: "S = a / (1 - q) = 6 / (1 - 0.5) = 12.",
        },
      },
      {
        id: 5,
        q: {
          en: "If sin(α) = 3/5 and α is in Quadrant I, what is cos(2α)?",
          uz: "Agar sin(α) = 3/5 bo'lsa va α I chorakda bo'lsa, cos(2α) nimaga teng?",
        },
        options: ["7/25", "24/25", "-7/25", "16/25"],
        correct: "7/25",
        explanation: {
          en: "cos(2α) = 1 - 2sin²(α) = 1 - 2(9/25) = 1 - 18/25 = 7/25.",
          uz: "cos(2α) = 1 - 2sin²(α) = 1 - 2*(9/25) = 7/25.",
        },
      },
    ],
  },
  {
    id: "biology-prep",
    name: {
      en: "Biology — Medical Prep Practice",
      uz: "Biologiya — Tibbiyot yo'nalishi testi",
    },
    category: "Science",
    level: "Advanced",
    timeMinutes: 20,
    questions: [
      {
        id: 1,
        q: {
          en: "Which organelle is known as the powerhouse of the cell and produces ATP?",
          uz: "Hujayraning energiya stansiyasi deb ataluvchi va ATF ishlab chiqaruvchi organoid qaysi?",
        },
        options: ["Mitochondria", "Ribosome", "Endoplasmic Reticulum", "Golgi Apparatus"],
        correct: "Mitochondria",
        explanation: {
          en: "Mitochondria perform cellular respiration to produce energy in the form of ATP.",
          uz: "Mitoxondriya hujayraviy nafas olish orqali ATF shaklida energiya ishlab chiqaradi.",
        },
      },
      {
        id: 2,
        q: {
          en: "Which blood type is known as the universal donor for red blood cells?",
          uz: "Qon guruhlaridan qaysi biri eritrotsitlar bo'yicha universal donor hisoblanadi?",
        },
        options: ["O- (O negative)", "AB+ (AB positive)", "A+", "B-"],
        correct: "O- (O negative)",
        explanation: {
          en: "O negative red blood cells lack A, B, and Rh antigens, making them universal for transfusion.",
          uz: "O(I) manfiy qon guruhi A, B va rezus antigenlarga ega emasligi sababli universal donor hisoblanadi.",
        },
      },
      {
        id: 3,
        q: {
          en: "DNA replication is considered:",
          uz: "DNK replikatsiyasi qanday jarayon hisoblanadi?",
        },
        options: ["Semi-conservative", "Conservative", "Dispersive", "Random"],
        correct: "Semi-conservative",
        explanation: {
          en: "DNA replication is semi-conservative: each daughter DNA molecule consists of one original and one new strand.",
          uz: "DNK replikatsiyasi yarim-konservativ usulda kechadi (bitta eski va bitta yangi zanjir).",
        },
      },
    ],
  },
  {
    id: "history-pol",
    name: {
      en: "Poland History, Geography & Culture",
      uz: "Polsha tarixi, geografiyasi va madaniyati",
    },
    category: "Culture",
    level: "General Knowledge",
    timeMinutes: 15,
    questions: [
      {
        id: 1,
        q: {
          en: "What is the capital city and currency of Poland?",
          uz: "Polshaning poytaxti va milliy valyutasi qaysi?",
        },
        options: [
          "Warsaw and Polish Złoty (PLN)",
          "Kraków and Euro (EUR)",
          "Gdańsk and Koruna (CZK)",
          "Wrocław and Forint (HUF)",
        ],
        correct: "Warsaw and Polish Złoty (PLN)",
        explanation: {
          en: "Warsaw (Warszawa) is the capital, and the currency is Polish Złoty (PLN).",
          uz: "Poytaxti — Varshava, milliy valyutasi — Polyak Zlotiyi (PLN).",
        },
      },
      {
        id: 2,
        q: {
          en: "In which year did Poland officially join the European Union (EU)?",
          uz: "Polsha qaysi yilda Yevropa Ittifoqiga (EU) rasman a'zo bo'lgan?",
        },
        options: ["2004", "1999", "2007", "2010"],
        correct: "2004",
        explanation: {
          en: "Poland joined the European Union on May 1, 2004.",
          uz: "Polsha 2004-yil 1-mayda Yevropa Ittifoqiga a'zo bo'ldi.",
        },
      },
      {
        id: 3,
        q: {
          en: "Which famous Polish astronomer formulated the model of the universe that placed the Sun at the center?",
          uz: "Quyoshni koinot markaziga qo'yuvchi geliotsentrik modelni yaratgan mashhur polyak astronomi kim?",
        },
        options: ["Nicolaus Copernicus (Mikołaj Kopernik)", "Marie Curie", "Fryderyk Chopin", "Jan Matejko"],
        correct: "Nicolaus Copernicus (Mikołaj Kopernik)",
        explanation: {
          en: "Nicolaus Copernicus published 'De revolutionibus orbium coelestium' in 1543.",
          uz: "Nikolay Kopernik 1543-yilda koinotning geliotsentrik modelini e'lon qilgan.",
        },
      },
    ],
  },
];
