import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, CreditCard, Calendar as CalendarIcon, Video, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const upcomingVisits = [
  { id: 1, doctor: 'Dr. Ahmed Ali', rep: 'Sarah Johnson', date: '2026-03-20 10:00 AM', type: 'In Person', status: 'Confirmed' },
  { id: 2, doctor: 'Dr. Fatima Hassan', rep: 'Mohammed Khalid', date: '2026-03-21 02:30 PM', type: 'Video', status: 'Pending' },
  { id: 3, doctor: 'Dr. Youssef Omar', rep: 'Sarah Johnson', date: '2026-03-22 11:15 AM', type: 'Call', status: 'Confirmed' },
];

const analyticsData = [
  { name: 'Jan', visits: 40 },
  { name: 'Feb', visits: 30 },
  { name: 'Mar', visits: 20 },
  { name: 'Apr', visits: 27 },
  { name: 'May', visits: 18 },
  { name: 'Jun', visits: 23 },
];

export function PharmaDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Reps</CardTitle>
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Visits (Month)</CardTitle>
            <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Available Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850</div>
            <Button variant="outline" size="sm" className="mt-2 w-full text-xs">Buy Bundle</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Visits</CardTitle>
            <CardDescription>Manage and track your representatives' visits.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                        {visit.type === 'In Person' ? <MapPin className="h-5 w-5" /> : 
                         visit.type === 'Video' ? <Video className="h-5 w-5" /> : 
                         <Phone className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">{visit.doctor}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Rep: {visit.rep}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                          <CalendarIcon className="h-3 w-3" />
                          {visit.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={visit.status === 'Confirmed' ? 'default' : 'secondary'}>
                        {visit.status}
                      </Badge>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{visit.type}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Visits</CardTitle>
            <CardDescription>Visit performance over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="visits" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
