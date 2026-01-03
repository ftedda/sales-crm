import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Clock, Mail, Users, Target, ArrowRight, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const STAGES = ['Target List', 'Contacted', 'Engaged', 'In Diligence', 'Term Sheet', 'Closing', 'Closed']
const STAGE_COLORS = {
  'Target List': 'bg-gray-200',
  'Contacted': 'bg-blue-200',
  'Engaged': 'bg-purple-200',
  'In Diligence': 'bg-yellow-200',
  'Term Sheet': 'bg-orange-200',
  'Closing': 'bg-green-200',
  'Closed': 'bg-emerald-300'
}

const TIERS = ['1 - Must Have', '2 - Strong Fit', '3 - Opportunistic']

// Helper to get week boundaries
const getWeekBoundaries = (weeksAgo = 0) => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMonday - (weeksAgo * 7))
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return { weekStart, weekEnd }
}

export default function FunnelAnalytics({ data }) {
  // Calculate week-over-week metrics on the fly
  const weekOverWeek = useMemo(() => {
    const investors = data.investors || []
    const emails = data.emails || []
    const meetings = data.meetings || []

    const thisWeek = getWeekBoundaries(0)
    const lastWeek = getWeekBoundaries(1)

    const getWeekMetrics = (start, end) => {
      // New investors added this week (using first_contact_date or created_at)
      const newInvestors = investors.filter(i => {
        const date = new Date(i.first_contact_date || i.created_at)
        return date >= start && date <= end
      }).length

      // Emails sent this week
      const weekEmails = emails.filter(e => {
        if (!e.sent_date) return false
        const date = new Date(e.sent_date)
        return date >= start && date <= end
      })
      const emailsSent = weekEmails.length
      const emailsReplied = weekEmails.filter(e => e.replied).length

      // Meetings this week
      const meetingsHeld = meetings.filter(m => {
        if (!m.date) return false
        const date = new Date(m.date)
        return date >= start && date <= end
      }).length

      // Response rate for this week's emails
      const responseRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0

      return { newInvestors, emailsSent, emailsReplied, meetingsHeld, responseRate }
    }

    const current = getWeekMetrics(thisWeek.weekStart, thisWeek.weekEnd)
    const previous = getWeekMetrics(lastWeek.weekStart, lastWeek.weekEnd)

    return {
      current,
      previous,
      weekLabel: thisWeek.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lastWeekLabel: lastWeek.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      deltas: {
        newInvestors: current.newInvestors - previous.newInvestors,
        emailsSent: current.emailsSent - previous.emailsSent,
        meetingsHeld: current.meetingsHeld - previous.meetingsHeld,
        responseRate: current.responseRate - previous.responseRate
      }
    }
  }, [data.investors, data.emails, data.meetings])

  // Calculate funnel metrics
  const funnelMetrics = useMemo(() => {
    const investors = data.investors || []
    const stageOrder = STAGES.reduce((acc, stage, idx) => ({ ...acc, [stage]: idx }), {})

    // Count investors at each stage or beyond (for conversion calculation)
    const stageCounts = STAGES.map(stage => ({
      stage,
      count: investors.filter(i => i.stage === stage || stageOrder[i.stage] > stageOrder[stage]).length,
      currentCount: investors.filter(i => i.stage === stage).length
    }))

    // Calculate conversion rates between stages
    const conversions = []
    for (let i = 0; i < STAGES.length - 1; i++) {
      const fromStage = STAGES[i]
      const toStage = STAGES[i + 1]
      const fromCount = stageCounts[i].count
      const toCount = stageCounts[i + 1].count
      const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0
      conversions.push({ from: fromStage, to: toStage, rate, fromCount, toCount })
    }

    return { stageCounts, conversions }
  }, [data.investors])

  // Calculate average time in each stage using investor_activities
  const stageTimeMetrics = useMemo(() => {
    const investors = data.investors || []
    const activities = data.investorActivities || []
    const now = new Date()

    return STAGES.map(stage => {
      const stageInvestors = investors.filter(i => i.stage === stage)
      if (stageInvestors.length === 0) return { stage, avgDays: null, count: 0 }

      let totalDays = 0
      let investorsWithData = 0

      stageInvestors.forEach(inv => {
        // Find when this investor entered their current stage
        const stageChangeActivity = activities.find(
          a => a.investor_id === inv.id &&
               a.activity_type === 'stage_change' &&
               a.new_value === inv.stage
        )

        let enteredStageDate
        if (stageChangeActivity) {
          enteredStageDate = new Date(stageChangeActivity.created_at)
        } else if (inv.stage === 'Target List' || inv.stage === 'Contacted') {
          // For initial stages, use first_contact_date or created_at
          enteredStageDate = new Date(inv.first_contact_date || inv.created_at)
        } else {
          // No activity record found, skip this investor
          return
        }

        if (enteredStageDate) {
          const days = Math.floor((now - enteredStageDate) / (1000 * 60 * 60 * 24))
          totalDays += days
          investorsWithData++
        }
      })

      return {
        stage,
        avgDays: investorsWithData > 0 ? Math.round(totalDays / investorsWithData) : null,
        count: stageInvestors.length
      }
    })
  }, [data.investors, data.investorActivities])

  // Calculate response rate by email type
  const emailMetrics = useMemo(() => {
    const emails = data.emails || []
    const emailsByType = {}

    emails.forEach(email => {
      if (!email.type) return
      if (!emailsByType[email.type]) {
        emailsByType[email.type] = { sent: 0, replied: 0 }
      }
      emailsByType[email.type].sent++
      if (email.replied) emailsByType[email.type].replied++
    })

    return Object.entries(emailsByType)
      .map(([type, stats]) => ({
        type,
        sent: stats.sent,
        replied: stats.replied,
        rate: stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [data.emails])

  // Calculate win/loss by investor tier
  const tierMetrics = useMemo(() => {
    const investors = data.investors || []

    return TIERS.map(tier => {
      const tierInvestors = investors.filter(i => i.tier === tier)
      const won = tierInvestors.filter(i => i.stage === 'Closed').length
      const lost = tierInvestors.filter(i => i.stage === 'Passed').length
      const active = tierInvestors.filter(i => !['Closed', 'Passed'].includes(i.stage)).length
      const total = tierInvestors.length

      return {
        tier,
        total,
        won,
        lost,
        active,
        winRate: total > 0 ? Math.round((won / total) * 100) : 0,
        lossRate: total > 0 ? Math.round((lost / total) * 100) : 0
      }
    })
  }, [data.investors])

  // Calculate pipeline velocity trends (last 8 weeks)
  const velocityMetrics = useMemo(() => {
    const investors = data.investors || []
    const emails = data.emails || []
    const meetings = data.meetings || []

    const weeks = []

    for (let i = 7; i >= 0; i--) {
      const { weekStart, weekEnd } = getWeekBoundaries(i)
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Count emails sent in this week
      const emailCount = emails.filter(e => {
        if (!e.sent_date) return false
        const date = new Date(e.sent_date)
        return date >= weekStart && date <= weekEnd
      }).length

      // Count meetings in this week
      const meetingCount = meetings.filter(m => {
        if (!m.date) return false
        const date = new Date(m.date)
        return date >= weekStart && date <= weekEnd
      }).length

      // Count new investors added this week
      const newInvestors = investors.filter(inv => {
        const date = new Date(inv.first_contact_date || inv.created_at)
        return date >= weekStart && date <= weekEnd
      }).length

      weeks.push({
        label: weekLabel,
        emails: emailCount,
        meetings: meetingCount,
        newInvestors
      })
    }

    return weeks
  }, [data.investors, data.emails, data.meetings])

  // Overall stats
  const overallStats = useMemo(() => {
    const investors = data.investors || []
    const emails = data.emails || []

    const totalInvestors = investors.length
    const activeInvestors = investors.filter(i => !['Passed', 'Target List', 'Closed'].includes(i.stage)).length
    const closedDeals = investors.filter(i => i.stage === 'Closed').length
    const passed = investors.filter(i => i.stage === 'Passed').length
    const overallWinRate = (closedDeals + passed) > 0
      ? Math.round((closedDeals / (closedDeals + passed)) * 100)
      : 0
    const totalEmails = emails.length
    const repliedEmails = emails.filter(e => e.replied).length
    const overallResponseRate = totalEmails > 0 ? Math.round((repliedEmails / totalEmails) * 100) : 0

    return { totalInvestors, activeInvestors, closedDeals, passed, overallWinRate, overallResponseRate }
  }, [data.investors, data.emails])

  // Delta indicator component
  const DeltaIndicator = ({ value, suffix = '', inverse = false }) => {
    if (value === null || value === undefined) return null
    const isPositive = inverse ? value < 0 : value > 0

    if (value === 0) {
      return (
        <span className="text-xs text-slate-400 flex items-center">
          <Minus size={12} className="mr-0.5" />
          0{suffix}
        </span>
      )
    }

    return (
      <span className={`text-xs flex items-center ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
        {value > 0 ? '+' : ''}{value}{suffix}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-slate-700">Funnel Analytics</h2>

      {/* Week-over-Week Comparison */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <TrendingUp size={16} className="mr-2" />
          This Week vs Last Week
          <span className="ml-2 text-xs font-normal text-slate-500">
            ({weekOverWeek.lastWeekLabel} → {weekOverWeek.weekLabel})
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">New Investors</span>
              <DeltaIndicator value={weekOverWeek.deltas.newInvestors} />
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1">{weekOverWeek.current.newInvestors}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Emails Sent</span>
              <DeltaIndicator value={weekOverWeek.deltas.emailsSent} />
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1">{weekOverWeek.current.emailsSent}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Meetings Held</span>
              <DeltaIndicator value={weekOverWeek.deltas.meetingsHeld} />
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1">{weekOverWeek.current.meetingsHeld}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Response Rate</span>
              <DeltaIndicator value={weekOverWeek.deltas.responseRate} suffix="%" />
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1">{weekOverWeek.current.responseRate}%</p>
          </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center justify-between">
            <Users size={16} className="text-slate-500" />
            <span className="text-2xl font-bold text-slate-800">{overallStats.activeInvestors}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Active Pipeline</p>
        </div>
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center justify-between">
            <Target size={16} className="text-green-500" />
            <span className="text-2xl font-bold text-green-600">{overallStats.overallWinRate}%</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Win Rate</p>
        </div>
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center justify-between">
            <Mail size={16} className="text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{overallStats.overallResponseRate}%</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Email Response Rate</p>
        </div>
        <div className="bg-white rounded-lg p-3 border shadow-sm">
          <div className="flex items-center justify-between">
            <BarChart3 size={16} className="text-purple-500" />
            <span className="text-2xl font-bold text-slate-800">{overallStats.closedDeals}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Closed Deals</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
          <TrendingUp size={16} className="mr-2" />
          Conversion Funnel
        </h2>
        <div className="space-y-3">
          {funnelMetrics.conversions.map((conv, idx) => (
            <div key={conv.from} className="flex items-center">
              <div className={`w-28 text-xs font-medium text-slate-700 ${STAGE_COLORS[conv.from]} px-2 py-1 rounded`}>
                {conv.from}
              </div>
              <div className="flex-1 mx-3 relative">
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${conv.rate >= 50 ? 'bg-green-400' : conv.rate >= 25 ? 'bg-yellow-400' : 'bg-red-400'} transition-all`}
                    style={{ width: `${conv.rate}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold ${conv.rate >= 40 ? 'text-white' : 'text-slate-700'}`}>
                    {conv.rate}%
                  </span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 mx-1" />
              <div className={`w-28 text-xs font-medium text-slate-700 ${STAGE_COLORS[conv.to]} px-2 py-1 rounded`}>
                {conv.to}
              </div>
              <span className="ml-2 text-xs text-slate-500">
                ({conv.fromCount} → {conv.toCount})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Average Time in Stage */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Clock size={16} className="mr-2" />
          Average Time in Each Stage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stageTimeMetrics.filter(s => s.count > 0).map(metric => (
            <div key={metric.stage} className={`${STAGE_COLORS[metric.stage]} rounded-lg p-3`}>
              <p className="text-xs font-medium text-slate-700">{metric.stage}</p>
              <p className="text-lg font-bold text-slate-800">
                {metric.avgDays !== null ? `${metric.avgDays}d` : '—'}
              </p>
              <p className="text-xs text-slate-500">{metric.count} investor{metric.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
        {stageTimeMetrics.every(s => s.count === 0) && (
          <p className="text-sm text-slate-400 text-center py-4">No stage data available yet</p>
        )}
      </div>

      {/* Response Rate by Email Type */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Mail size={16} className="mr-2" />
          Response Rate by Email Type
        </h2>
        {emailMetrics.length > 0 ? (
          <div className="space-y-2">
            {emailMetrics.map(metric => (
              <div key={metric.type} className="flex items-center text-xs">
                <span className="w-36 text-slate-600 truncate" title={metric.type}>{metric.type}</span>
                <div className="flex-1 mx-2 bg-slate-100 rounded-full h-5 overflow-hidden relative">
                  <div
                    className={`h-full ${metric.rate >= 50 ? 'bg-green-400' : metric.rate >= 25 ? 'bg-blue-400' : 'bg-slate-300'}`}
                    style={{ width: `${Math.max(metric.rate, 5)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {metric.rate}%
                  </span>
                </div>
                <span className="w-16 text-right text-slate-500">
                  {metric.replied}/{metric.sent} replied
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No email data available yet</p>
        )}
      </div>

      {/* Win/Loss by Investor Tier */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Target size={16} className="mr-2" />
          Win/Loss by Investor Tier
        </h2>
        <div className="space-y-3">
          {tierMetrics.map(metric => (
            <div key={metric.tier} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{metric.tier}</span>
                <span className="text-xs text-slate-500">{metric.total} total</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden flex">
                  {metric.total > 0 && (
                    <>
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(metric.won / metric.total) * 100}%` }}
                        title={`Won: ${metric.won}`}
                      />
                      <div
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${(metric.active / metric.total) * 100}%` }}
                        title={`Active: ${metric.active}`}
                      />
                      <div
                        className="h-full bg-red-400 transition-all"
                        style={{ width: `${(metric.lost / metric.total) * 100}%` }}
                        title={`Lost: ${metric.lost}`}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-green-600 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {metric.won} won ({metric.winRate}%)
                </span>
                <span className="text-blue-500">{metric.active} active</span>
                <span className="text-red-500 flex items-center">
                  <TrendingDown size={12} className="mr-1" />
                  {metric.lost} lost ({metric.lossRate}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Velocity Trends */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <TrendingUp size={16} className="mr-2" />
          Pipeline Velocity (Last 8 Weeks)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-slate-500 font-medium">Week</th>
                <th className="text-center py-2 text-slate-500 font-medium">New Investors</th>
                <th className="text-center py-2 text-slate-500 font-medium">Emails Sent</th>
                <th className="text-center py-2 text-slate-500 font-medium">Meetings</th>
              </tr>
            </thead>
            <tbody>
              {velocityMetrics.map((week, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 text-slate-600">{week.label}</td>
                  <td className="py-2 text-center">
                    <span className={`inline-block min-w-[24px] px-2 py-0.5 rounded ${week.newInvestors > 0 ? 'bg-purple-100 text-purple-700' : 'text-slate-400'}`}>
                      {week.newInvestors}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`inline-block min-w-[24px] px-2 py-0.5 rounded ${week.emails > 0 ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                      {week.emails}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`inline-block min-w-[24px] px-2 py-0.5 rounded ${week.meetings > 0 ? 'bg-green-100 text-green-700' : 'text-slate-400'}`}>
                      {week.meetings}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {velocityMetrics.every(w => w.emails === 0 && w.meetings === 0 && w.newInvestors === 0) && (
          <p className="text-sm text-slate-400 text-center py-2 mt-2">
            Add dates to your investors, emails, and meetings to see velocity trends
          </p>
        )}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-medium text-indigo-900 text-sm mb-2">Key Insights</h3>
        <div className="text-xs text-indigo-700 space-y-1">
          {funnelMetrics.conversions.length > 0 && (
            <>
              {funnelMetrics.conversions.filter(c => c.rate < 30).length > 0 && (
                <p>• <strong>Bottleneck Alert:</strong> {funnelMetrics.conversions.filter(c => c.rate < 30).map(c => `${c.from} → ${c.to}`).join(', ')} have low conversion rates</p>
              )}
              {funnelMetrics.conversions.filter(c => c.rate >= 60).length > 0 && (
                <p>• <strong>Strong Stages:</strong> {funnelMetrics.conversions.filter(c => c.rate >= 60).map(c => `${c.from} → ${c.to}`).join(', ')} are converting well</p>
              )}
            </>
          )}
          {emailMetrics.length > 0 && emailMetrics[0].rate >= 40 && (
            <p>• <strong>Best Performing Email:</strong> "{emailMetrics[0].type}" has {emailMetrics[0].rate}% response rate</p>
          )}
          {tierMetrics.filter(t => t.total > 0).length > 0 && (
            <p>• <strong>Tier Focus:</strong> {tierMetrics.filter(t => t.winRate > 0).length > 0
              ? `${tierMetrics.filter(t => t.winRate > 0).sort((a, b) => b.winRate - a.winRate)[0]?.tier} has the best win rate`
              : 'Keep building your pipeline to see tier performance'
            }</p>
          )}
          {overallStats.activeInvestors === 0 && overallStats.totalInvestors === 0 && (
            <p>• <strong>Get Started:</strong> Add investors to your pipeline to see funnel analytics</p>
          )}
        </div>
      </div>
    </div>
  )
}
