'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CommissionChartsProps {
  chartData: any[]
  pieData: any[]
  brokerageData: any[]
  colors: any
  isDark: boolean
  card: any
  text: any
}

export function CommissionCharts({ chartData, pieData, brokerageData, colors, isDark, card, text }: CommissionChartsProps) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Monthly Income Trend */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
              Monthly Income Trend
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                <YAxis tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: colors.text.primary }}
                  formatter={(value: any) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="gci" stroke="#f59e0b" strokeWidth={3} name="Gross Commission" dot={{ fill: '#f59e0b', r: 4 }} />
                <Line type="monotone" dataKey="nci" stroke="#10b981" strokeWidth={3} name="Net Commission" dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions by Month */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
              Transactions by Month
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                <YAxis tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: colors.text.primary }}
                />
                <Legend />
                <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Type Distribution */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
              Client Type Distribution
            </h3>
          </div>
          <div style={{ padding: '24px', paddingTop: '40px', paddingBottom: '40px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => {
                    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: colors.text.primary }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.text.primary
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income by Brokerage */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
              Income by Brokerage
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            {brokerageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brokerageData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 14, fill: colors.text.secondary }} 
                    stroke={colors.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: colors.text.secondary }} 
                    stroke={colors.text.secondary}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: colors.text.primary }}
                    formatter={(value: any) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', color: colors.text.primary }} />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    name="Net Commission Income" 
                    radius={[8, 8, 0, 0]}
                    label={{ position: 'top', fill: colors.text.primary, fontSize: 12, formatter: (value: any) => `$${(value / 1000).toFixed(1)}k` }}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...text.secondary }}>
                <p style={{ fontSize: '14px', margin: '0' }}>No brokerage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

