import { useEffect, useState } from 'react';
import { Building, Users, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// import { SponsorsService } from '@/services/sponsors.service';

interface SponsorStatsData {
  totalSponsors: number;
  activeSponsors: number;
  totalPosts: number;
  maxPosts: number;
  tierDistribution: {
    tier: string;
    count: number;
    percentage: number;
  }[];
  visibilityStats: {
    visible: number;
    hidden: number;
  };
}

export function SponsorStats() {
  const [stats, setStats] = useState<SponsorStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // TODO: Implement statistics endpoint in backend
      // const data = await SponsorsService.getStatistics();

      // For now, use mock data
      const mockData: SponsorStatsData = {
        totalSponsors: 0,
        activeSponsors: 0,
        totalPosts: 0,
        maxPosts: 0,
        tierDistribution: [],
        visibilityStats: {
          visible: 0,
          hidden: 0
        }
      };

      setStats(mockData);
    } catch (error) {
      console.error('Failed to fetch sponsor statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const postUsagePercentage = stats.maxPosts > 0
    ? Math.round((stats.totalPosts / stats.maxPosts) * 100)
    : 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSponsors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSponsors} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visibility</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibilityStats.visible}</div>
            <p className="text-xs text-muted-foreground">
              {stats.visibilityStats.hidden} hidden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Usage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPosts} / {stats.maxPosts}
            </div>
            <Progress value={postUsagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSponsors > 0
                ? Math.round((stats.activeSponsors / stats.totalSponsors) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sponsors with content
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.tierDistribution.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.tierDistribution.map((tier) => (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tier.tier}</span>
                    <span className="text-sm text-muted-foreground">
                      {tier.count} ({tier.percentage}%)
                    </span>
                  </div>
                  <Progress value={tier.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}