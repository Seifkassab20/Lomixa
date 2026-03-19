import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Video, Phone, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from '@/components/CalendarView';

const todayVisits = [
  { id: 1, company: 'Pfizer', rep: 'Sarah Johnson', time: '10:00 AM', type: 'In Person', status: 'Confirmed' },
  { id: 2, company: 'Novartis', rep: 'Mohammed Khalid', time: '02:30 PM', type: 'Video', status: 'Pending' },
];

const calendarEvents = [
  { title: 'Pfizer (Sarah)', start: new Date(new Date().setHours(10, 0, 0, 0)), end: new Date(new Date().setHours(10, 30, 0, 0)), backgroundColor: '#059669' },
  { title: 'Novartis (Mohammed)', start: new Date(new Date().setHours(14, 30, 0, 0)), end: new Date(new Date().setHours(15, 0, 0, 0)), backgroundColor: '#f59e0b' },
];

export function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Visits Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">2 remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Requires your action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Visits (Month)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Earnings (SAR)</CardTitle>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">﷼</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,500</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Schedule Overview</CardTitle>
            <CardDescription>Your upcoming visits and availability</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarView events={calendarEvents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayVisits.map((visit) => (
              <div key={visit.id} className="flex flex-col p-4 border dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100">{visit.company}</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Rep: {visit.rep}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      {visit.time}
                    </div>
                  </div>
                  <Badge variant={visit.status === 'Confirmed' ? 'default' : 'secondary'}>
                    {visit.status}
                  </Badge>
                </div>
                {visit.status === 'Pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t dark:border-slate-800 mt-4">
              <Button className="w-full justify-start" variant="outline">
                <Video className="mr-2 h-4 w-4" /> Start Video Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
