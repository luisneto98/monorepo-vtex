import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import NotificationComposer from '@/components/notifications/NotificationComposer';
import NotificationHistory from '@/components/notifications/NotificationHistory';
import NotificationScheduled from '@/components/notifications/NotificationScheduled';
import NotificationStats from '@/components/notifications/NotificationStats';
import {  Bell, Clock, History, BarChart } from 'lucide-react';

export default function PushNotifications() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Push Notifications</h1>
        <p className="text-gray-600 mt-2">
          Manage and send push notifications to mobile app users
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Notification</CardTitle>
              <CardDescription>
                Compose a new push notification to send to your app users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationComposer
                onSuccess={() => {
                  toast({
                    title: 'Success',
                    description: 'Notification sent successfully',
                  });
                  setActiveTab('history');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <NotificationScheduled />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <NotificationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}