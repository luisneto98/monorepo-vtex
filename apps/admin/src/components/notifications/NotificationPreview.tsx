import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone } from 'lucide-react';

interface NotificationPreviewProps {
  title: string;
  message: string;
}

export default function NotificationPreview({ title, message }: NotificationPreviewProps) {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={platform} onValueChange={(v) => setPlatform(v as 'ios' | 'android')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ios">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>

          <TabsContent value="ios" className="mt-4">
            <div className="relative mx-auto w-full max-w-sm">
              {/* iPhone Frame */}
              <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-gray-900 rounded-b-3xl z-10"></div>

                {/* Screen */}
                <div className="relative bg-white rounded-[2.5rem] overflow-hidden h-[600px]">
                  {/* Status Bar */}
                  <div className="bg-gray-100 h-12 flex items-center justify-between px-6 text-xs">
                    <span className="font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-3 bg-gray-400 rounded-sm"></div>
                      <div className="w-4 h-3 bg-gray-400 rounded-sm"></div>
                      <div className="w-4 h-3 bg-gray-400 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Notification */}
                  <div className="p-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">VD</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-500">VTEX Day</span>
                            <span className="text-xs text-gray-400">now</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                            {title || 'Notification Title'}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {message || 'Your notification message will appear here'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="android" className="mt-4">
            <div className="relative mx-auto w-full max-w-sm">
              {/* Android Frame */}
              <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="relative bg-white rounded-[2rem] overflow-hidden h-[600px]">
                  {/* Status Bar */}
                  <div className="bg-gray-900 h-8 flex items-center justify-between px-4 text-xs text-white">
                    <span className="font-medium">9:41</span>
                    <div className="flex gap-1 items-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Notification */}
                  <div className="p-3">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">VD</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">VTEX Day</span>
                            <span className="text-xs text-gray-500">• now</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {title || 'Notification Title'}
                          </h4>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {message || 'Your notification message will appear here'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-gray-500 text-center">
          This is a preview of how your notification will appear on devices
        </div>
      </CardContent>
    </Card>
  );
}