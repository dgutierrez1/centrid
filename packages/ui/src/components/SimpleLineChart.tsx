import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@centrid/ui/components';
import { TrendingUp } from 'lucide-react';

export function SimpleLineChart() {
  const data = [
    { month: "Jan", documents: 186 },
    { month: "Feb", documents: 305 },
    { month: "Mar", documents: 237 },
    { month: "Apr", documents: 273 },
    { month: "May", documents: 309 },
    { month: "Jun", documents: 414 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Document Growth</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="documents"
                stroke="#ff4d4d"
                strokeWidth={2}
                dot={{ fill: '#ff4d4d', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 35% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total documents uploaded for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
