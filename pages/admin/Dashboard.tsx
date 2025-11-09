
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Clock, MessageCircle } from 'lucide-react';

const sessionData = [
  { name: 'Mon', sessions: 25 },
  { name: 'Tue', sessions: 32 },
  { name: 'Wed', sessions: 28 },
  { name: 'Thu', sessions: 45 },
  { name: 'Fri', sessions: 51 },
  { name: 'Sat', sessions: 60 },
  { name: 'Sun', sessions: 55 },
];

const durationData = [
    { name: 'Mon', duration: 120 },
    { name: 'Tue', duration: 150 },
    { name: 'Wed', duration: 135 },
    { name: 'Thu', duration: 180 },
    { name: 'Fri', duration: 210 },
    { name: 'Sat', duration: 240 },
    { name: 'Sun', duration: 220 },
];


const StatCard = ({ title, value, icon: Icon, change }: { title: string; value: string; icon: React.ElementType; change: string }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <Icon className="w-6 h-6 text-gray-500" />
        </div>
        <div className="mt-2">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-green-400 mt-1">{change}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Sessions" value="3,450" icon={Users} change="+12% from last week" />
        <StatCard title="Avg. Session Duration" value="3m 15s" icon={Clock} change="+5% from last week" />
        <StatCard title="Total Interactions" value="12,890" icon={MessageCircle} change="+8% from last week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Sessions This Week</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
              <XAxis dataKey="name" stroke="#8E8E8E" />
              <YAxis stroke="#8E8E8E" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #3A3A3A' }} />
              <Legend />
              <Bar dataKey="sessions" fill="#4285F4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Average Duration (seconds)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={durationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A"/>
                <XAxis dataKey="name" stroke="#8E8E8E" />
                <YAxis stroke="#8E8E8E" />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #3A3A3A' }}/>
                <Legend />
                <Line type="monotone" dataKey="duration" stroke="#34A853" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
