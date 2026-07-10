'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'

const COLORS = ['#2563EB', '#0F6E56', '#BA7517', '#993C1D', '#5F5E5A']

export function StageFunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SourceDonutChart({ data }: { data: { source: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="source" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function WeeklySignupsChart({ data }: { data: { week: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Generic bar chart, reused for the admin stage funnel and the company roles-by-status chart.
export function BarChartGeneric({ data, dataKey = 'count', labelKey = 'stage' }: {
  data: Record<string, string | number>[]
  dataKey?: string
  labelKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey={labelKey} width={110} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#2563EB" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Generic trend line, reused for company avg-days-to-shortlist.
export function TrendLineChart({ data, dataKey = 'value', labelKey = 'label' }: {
  data: Record<string, string | number>[]
  dataKey?: string
  labelKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
