import React from 'react'
import { Users, DollarSign, Download, ChevronRight, TrendingUp, AlertTriangle, CalendarClock, Trophy } from 'lucide-react'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
const STAGE_COLORS = {
  'Lead': 'bg-gray-200',
  'Qualified': 'bg-blue-200',
  'Proposal': 'bg-purple-200',
  'Negotiation': 'bg-yellow-200',
  'Closed Won': 'bg-emerald-300',
  'Closed Lost': 'bg-red-200'
}

function formatCurrency(value) {
  if (!value) return '$0'
  const num = Number(value)
  if (isNaN(num)) return '$0'
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
  return `$${num.toLocaleString()}`
}

export default function Dashboard({ data, exportToCSV, onNavigateToActions, onNavigateToPipeline }) {
  const contacts = data.contacts || []
  const actions = data.weeklyActions || []
  const today = new Date().toISOString().split('T')[0]

  const activeStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation']
  const activeDeals = contacts.filter(c => activeStages.includes(c.stage))
  const totalPipelineValue = activeDeals.reduce((sum, c) => sum + (Number(c.deal_value) || 0), 0)
  const closedWonValue = contacts.filter(c => c.stage === 'Closed Won').reduce((sum, c) => sum + (Number(c.deal_value) || 0), 0)

  const metrics = [
    { label: 'Total Contacts', value: contacts.length, icon: Users, color: 'bg-slate-100 border-slate-200' },
    { label: 'Active Deals', value: activeDeals.length, icon: TrendingUp, color: 'bg-blue-50 border-blue-200' },
    { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue), icon: DollarSign, color: 'bg-purple-50 border-purple-200' },
    { label: 'Closed Won', value: formatCurrency(closedWonValue), icon: Trophy, color: 'bg-green-50 border-green-200' },
  ]

  // Pipeline value by stage
  const pipelineByStage = STAGES.filter(s => s !== 'Closed Lost').map(stage => {
    const stageContacts = contacts.filter(c => c.stage === stage)
    const stageValue = stageContacts.reduce((sum, c) => sum + (Number(c.deal_value) || 0), 0)
    return { stage, count: stageContacts.length, value: stageValue }
  })
  const maxStageValue = Math.max(...pipelineByStage.map(s => s.value), 1)

  // Needs attention: overdue follow-ups or no activity in 14+ days
  const needsAttention = contacts.filter(c => {
    if (c.stage === 'Closed Won' || c.stage === 'Closed Lost') return false
    const overdue = c.next_follow_up && c.next_follow_up < today
    const noFollowUp = !c.next_follow_up
    return overdue || noFollowUp
  }).slice(0, 5)

  // Upcoming follow-ups (next 7 days)
  const sevenDaysOut = new Date()
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)
  const sevenDaysOutStr = sevenDaysOut.toISOString().split('T')[0]

  const upcomingFollowUps = contacts
    .filter(c => c.next_follow_up && c.next_follow_up >= today && c.next_follow_up <= sevenDaysOutStr)
    .sort((a, b) => a.next_follow_up.localeCompare(b.next_follow_up))
    .slice(0, 5)

  // Recent incomplete actions
  const recentActions = actions
    .filter(a => a.status !== 'Complete')
    .sort((a, b) => {
      if (a.due && b.due) return a.due.localeCompare(b.due)
      if (a.due) return -1
      if (b.due) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end">
        <button
          onClick={() => exportToCSV('contacts')}
          className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <Download size={16} />
          <span>Export Contacts</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className={`${m.color} rounded-lg p-3 border`}>
            <div className="flex items-center justify-between">
              <m.icon size={16} className="text-slate-500" />
              <span className="text-2xl font-bold text-slate-800">{m.value}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Value by Stage */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Value by Stage</h2>
        <div className="space-y-2">
          {pipelineByStage.map(({ stage, count, value }) => {
            const pct = maxStageValue > 0 ? (value / maxStageValue) * 100 : 0
            return (
              <div key={stage} className="flex items-center text-xs">
                <span className="w-24 text-slate-600 truncate">{stage}</span>
                <div className="flex-1 mx-2 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full transition-all flex items-center px-2 ${STAGE_COLORS[stage]}`}
                    style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                  >
                    {value > 0 && <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{formatCurrency(value)}</span>}
                  </div>
                </div>
                <span className="w-6 text-right font-medium text-slate-700">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two-column: Needs Attention + Upcoming Follow-ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Needs Attention */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-700">Needs Attention</h2>
            </div>
            {onNavigateToPipeline && (
              <button
                onClick={onNavigateToPipeline}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                View All
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {needsAttention.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-2">All contacts are on track!</p>
            ) : (
              needsAttention.map(c => (
                <div key={c.id} className="flex items-center space-x-2 p-2 bg-amber-50 rounded text-sm">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400" />
                  <span className="flex-1 truncate text-slate-700">
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </span>
                  <span className="text-xs text-amber-600 flex-shrink-0">
                    {c.next_follow_up && c.next_follow_up < today ? `Overdue: ${c.next_follow_up}` : 'No follow-up set'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock size={14} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Upcoming Follow-ups</h2>
            </div>
          </div>
          <div className="space-y-2">
            {upcomingFollowUps.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-2">No follow-ups this week</p>
            ) : (
              upcomingFollowUps.map(c => (
                <div key={c.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded text-sm">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${c.next_follow_up === today ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <span className="flex-1 truncate text-slate-700">
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </span>
                  <span className={`text-xs flex-shrink-0 ${c.next_follow_up === today ? 'text-orange-600 font-medium' : 'text-blue-600'}`}>
                    {c.next_follow_up === today ? 'Today' : c.next_follow_up}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Recent Actions</h2>
          {onNavigateToActions && (
            <button
              onClick={onNavigateToActions}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              View All ({actions.length})
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        <div className="space-y-2">
          {recentActions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-2">
              {actions.length > 0 ? 'All actions completed!' : 'No actions yet.'}
            </p>
          ) : (
            recentActions.map(action => (
              <div key={action.id} className="flex items-center space-x-2 p-2 bg-slate-50 rounded text-sm">
                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${action.due && action.due < today ? 'bg-red-500' : 'bg-slate-300'}`} />
                <span className="flex-1 truncate text-slate-700">{action.action}</span>
                {action.due && (
                  <span className={`text-xs flex-shrink-0 ${action.due < today ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                    {action.due}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
