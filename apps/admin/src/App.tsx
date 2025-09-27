import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Speakers } from '@/pages/Speakers';
import Sessions from '@/pages/Sessions';
import { SponsorTiers } from '@/pages/SponsorTiers';
import { Sponsors } from '@/pages/Sponsors';
import { FaqCategories } from '@/pages/FaqCategories';
import { Faqs } from '@/pages/Faqs';

function App() {
  useEffect(() => {
    document.title = 'VTEX DAY 26 Admin';
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sponsor-tiers" element={<SponsorTiers />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/faq-categories" element={<FaqCategories />} />
          <Route path="/faq" element={<Faqs />} />
          <Route path="/visibility" element={<div className="p-6">Visibilidade (Em breve)</div>} />
          <Route path="/notifications" element={<div className="p-6">Notificações (Em breve)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;