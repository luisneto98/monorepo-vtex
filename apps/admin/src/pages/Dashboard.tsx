import { useEffect, useState } from 'react';
import { Users, Calendar, Building2, HelpCircle, RefreshCw } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { apiService } from '@/services/api.service';
import { cn } from '@/lib/utils';

interface DashboardStats {
  speakers: number;
  sessions: number;
  sponsors: number;
  faqs: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    speakers: 0,
    sessions: 0,
    sponsors: 0,
    faqs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [speakersRes, sessionsRes, sponsorsRes, faqsRes] = await Promise.all([
        apiService.get('/speakers'),
        apiService.get('/sessions'),
        apiService.get('/sponsors'),
        apiService.get('/faq'),
      ]);

      setStats({
        speakers: speakersRes.metadata?.total || (Array.isArray(speakersRes.data) ? speakersRes.data.length : 0),
        sessions: sessionsRes.metadata?.total || (Array.isArray(sessionsRes.data) ? sessionsRes.data.length : 0),
        sponsors: sponsorsRes.metadata?.total || (Array.isArray(sponsorsRes.data) ? sponsorsRes.data.length : 0),
        faqs: faqsRes.metadata?.total || (Array.isArray(faqsRes.data) ? faqsRes.data.length : 0),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Visão geral do evento VTEX DAY 2026
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard
          title="Total de Palestrantes"
          value={stats.speakers}
          icon={Users}
          color="blue"
          loading={loading}
          description="Palestrantes cadastrados"
        />

        <StatsCard
          title="Total de Palestras"
          value={stats.sessions}
          icon={Calendar}
          color="green"
          loading={loading}
          description="Sessões programadas"
        />

        <StatsCard
          title="Total de Patrocinadores"
          value={stats.sponsors}
          icon={Building2}
          color="purple"
          loading={loading}
          description="Empresas parceiras"
        />

        <StatsCard
          title="Perguntas Frequentes"
          value={stats.faqs}
          icon={HelpCircle}
          color="orange"
          loading={loading}
          description="FAQs disponíveis"
        />
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/speakers"
            className="flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Gerenciar Palestrantes</span>
          </a>
          <a
            href="/sessions"
            className="flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Gerenciar Palestras</span>
          </a>
          <a
            href="/sponsors"
            className="flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Gerenciar Patrocinadores</span>
          </a>
        </div>
      </div>
    </div>
  );
}