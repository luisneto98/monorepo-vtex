import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, XCircle, Clock, Smartphone, TrendingUp } from 'lucide-react';
import notificationsService, { type NotificationStats as Stats } from '@/services/notifications.service';

export default function NotificationStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await notificationsService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Failed to load statistics
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Sent',
      value: stats.totalSent.toLocaleString(),
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Failed',
      value: stats.totalFailed.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Scheduled',
      value: stats.totalScheduled.toLocaleString(),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Registered Devices',
      value: stats.totalDevices.toLocaleString(),
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Delivery Rate',
      value: `${stats.deliveryRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delivery Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-semibold">{stats.deliveryRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stats.deliveryRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Successfully Delivered</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalSent.toLocaleString()}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Failed Deliveries</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.totalFailed.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}