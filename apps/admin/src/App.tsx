import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Speakers } from '@/pages/Speakers';
import Sessions from '@/pages/Sessions';
import { SponsorTiers } from '@/pages/SponsorTiers';
import { Sponsors } from '@/pages/Sponsors';
import { FaqCategories } from '@/pages/FaqCategories';
import { Faqs } from '@/pages/Faqs';
import VisibilityControl from '@/pages/VisibilityControl';
import EventSettings from '@/pages/EventSettings';
import { PressMaterials } from '@/pages/PressMaterials';
import NewsReleases from '@/pages/NewsReleases';
import LegalPages from '@/pages/LegalPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    document.title = 'VTEX DAY 26 Admin';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="/visibility" element={<VisibilityControl />} />
            <Route path="/event-settings" element={<EventSettings />} />
            <Route path="/press-materials" element={<PressMaterials />} />
            <Route path="/news-releases" element={<NewsReleases />} />
            <Route path="/legal-pages" element={<LegalPages />} />
            <Route path="/notifications" element={<div className="p-6">Notificações (Em breve)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;