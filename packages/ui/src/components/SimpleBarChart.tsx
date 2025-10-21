import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@centrid/ui/components';
import { TrendingUp } from 'lucide-react';

export function SimpleBarChart() {
  const data = [
    { month: "Jan", create: 186, edit: 80, research: 120 },
    { month: "Feb", create: 305, edit: 200, research: 150 },
    { month: "Mar", create: 237, edit: 120, research: 180 },
    { month: "Apr", create: 73, edit: 190, research: 90 },
    { month: "May", create: 209, edit: 130, research: 160 },
    { month: "Jun", create: 214, edit: 140, research: 170 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Agent Usage</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="create" fill="#ff4d4d" />
              <Bar dataKey="edit" fill="#ff9999" />
              <Bar dataKey="research" fill="#ffb3b3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 12.5% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing agent usage for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
