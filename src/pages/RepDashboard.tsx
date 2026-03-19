import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Video, Phone, MapPin, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JitsiMeeting } from '@/components/JitsiMeeting';

const myVisits = [
  { id: 1, doctor: 'Dr. Ahmed Ali', hospital: 'King Faisal Specialist Hospital', date: '2026-03-20 10:00 AM', type: 'In Person', status: 'Confirmed' },
  { id: 2, doctor: 'Dr. Fatima Hassan', hospital: 'National Guard Hospital', date: '2026-03-21 02:30 PM', type: 'Video', status: 'Pending' },
];

export function RepDashboard() {
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {meetingRoom && (
        <JitsiMeeting 
          roomName={meetingRoom} 
          displayName="Sales Rep" 
          onClose={() => setMeetingRoom(null)} 
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">My Visits (Month)</CardTitle>
            <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Target: 25</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Company Credits</CardTitle>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Available for booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Approvals</CardTitle>
            <CalendarIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Waiting for doctor response</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Visits</CardTitle>
            <CardDescription>Your scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                      {visit.type === 'In Person' ? <MapPin className="h-5 w-5" /> : 
                       visit.type === 'Video' ? <Video className="h-5 w-5" /> : 
                       <Phone className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-slate-100">{visit.doctor}</h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{visit.hospital}</p>
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
                    {visit.type === 'Video' && visit.status === 'Confirmed' && (
                      <Button size="sm" onClick={() => setMeetingRoom(`visit_${visit.id}`)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                        Join Call
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Book</CardTitle>
            <CardDescription>Find a doctor to visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-slate-400" />
              <Input placeholder="Search doctor name..." className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full justify-start text-xs">
                <Filter className="mr-2 h-3 w-3" /> Specialty
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs">
                <MapPin className="mr-2 h-3 w-3" /> Location
              </Button>
            </div>
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
              Find Doctors
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
