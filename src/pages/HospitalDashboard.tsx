import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Calendar as CalendarIcon, Video, Phone, MapPin, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

const doctors = [
  { id: 1, name: 'Dr. Ahmed Ali', specialty: 'Cardiology', experience: '15 years', status: 'Active' },
  { id: 2, name: 'Dr. Fatima Hassan', specialty: 'Neurology', experience: '8 years', status: 'Active' },
  { id: 3, name: 'Dr. Youssef Omar', specialty: 'Pediatrics', experience: '12 years', status: 'Inactive' },
];

const bookings = [
  { id: 1, doctor: 'Dr. Ahmed Ali', company: 'Pfizer', rep: 'Sarah Johnson', date: '2026-03-20 10:00 AM', type: 'In Person', status: 'Confirmed' },
  { id: 2, doctor: 'Dr. Fatima Hassan', company: 'Novartis', rep: 'Mohammed Khalid', date: '2026-03-21 02:30 PM', type: 'Video', status: 'Pending' },
];

export function HospitalDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+3 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Visits This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">12 Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Pharma Engagement</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">15 active companies</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Doctors</CardTitle>
              <CardDescription>Overview of registered doctors</CardDescription>
            </div>
            <Button size="sm">Add Doctor</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                      {doc.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-slate-100">{doc.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{doc.specialty} • {doc.experience}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'Active' ? 'default' : 'secondary'}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest visit requests from pharma companies</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {bookings.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                        {visit.type === 'In Person' ? <MapPin className="h-5 w-5" /> : 
                         visit.type === 'Video' ? <Video className="h-5 w-5" /> : 
                         <Phone className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">{visit.doctor}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{visit.company} ({visit.rep})</p>
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
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
