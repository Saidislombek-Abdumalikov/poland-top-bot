import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Universities from "./pages/Universities";
import UniversityDetail from "./pages/UniversityDetail";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Premium from "./pages/Premium";
import Reviews from "./pages/Reviews";
import AITools from "./pages/AITools";
import Exams from "./pages/Exams";
import NAWA from "./pages/NAWA";
import Documents from "./pages/Documents";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SavedPrograms from "./pages/SavedPrograms";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ lang, onLangChange }: { lang: string; onLangChange: (l: string) => void }) {
  const { pathname } = useLocation();
  const isAuth = pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F7]">
      {!isAuth && <Header lang={lang} onLangChange={onLangChange} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/universities/:id" element={<UniversityDetail />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/tools" element={<AITools />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/nawa" element={<NAWA />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/saved" element={<SavedPrograms />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!isAuth && <Footer />}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout lang={lang} onLangChange={setLang} />
    </BrowserRouter>
  );
}
