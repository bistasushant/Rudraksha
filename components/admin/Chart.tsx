import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis } from "recharts"

const Chart = () => {
  const revenueData = [
    { name: "Jan", value: 2400 },
    { name: "Feb", value: 1398 },
    { name: "Mar", value: 9800 },
    { name: "Apr", value: 3908 },
    { name: "May", value: 4800 },
    { name: "Jun", value: 3800 },
    { name: "Jul", value: 4300 },
  ]

  const ordersData = [
    { name: "Jan", value: 340 },
    { name: "Feb", value: 289 },
    { name: "Mar", value: 503 },
    { name: "Apr", value: 389 },
    { name: "May", value: 402 },
    { name: "Jun", value: 429 },
    { name: "Jul", value: 463 },
  ]

  return (
    <div className="grid gap-6 p-4 md:p-6 lg:p-8 md:grid-cols-2">
      <Card className="bg-white/5 border-white/10 shadow-lg h-[400px] md:h-[600px]">
        <CardHeader>
          <CardTitle className="text-white/70 text-2xl font-bold">
            Revenue Overview
          </CardTitle>
          <CardDescription className="text-white/70 text-md">
            Monthly revenue for the current year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[300px] w-full">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="text-white/70"
            >
              <BarChart
                data={revenueData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Bar
                  dataKey="value"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  className="fill-purple-500 opacity-80 hover:opacity-100 hover:fill-purple-400 transition-all"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-slate-900 border border-white/10 text-white"
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return `$${value.toLocaleString()}`;
                        }
                        return value;
                      }}
                    />
                  }
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 shadow-lg h-[400px] md:h-[600px]">
        <CardHeader>
          <CardTitle className="text-white/70 text-2xl font-bold">
            Orders Trend
          </CardTitle>
          <CardDescription className="text-white/70 text-md">
            Monthly orders for the current year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[300px] w-full">
            <ChartContainer
              config={{
                orders: {
                  label: "Orders",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="text-white/70"
            >
              <RechartsLineChart
                data={ordersData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#a855f7" }}
                  activeDot={{ r: 6, fill: "#a855f7" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-slate-900 border border-white/10 text-white"
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return value.toLocaleString();
                        }
                        return value;
                      }}
                    />
                  }
                />
              </RechartsLineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Chart;
