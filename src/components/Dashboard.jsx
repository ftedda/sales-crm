import React, { useState } from 'react'
import { PlusCircle, Trash2, Check, Edit3, ArrowRight, AlertCircle, Building2, Users, Target, DollarSign, Download } from 'lucide-react'

const STAGES = ['Target List', 'Contacted', 'Engaged', 'In Diligence', 'Term Sheet', 'Closing', 'Closed', 'Passed']
const STAGE_COLORS = {
  'Target List': 'bg-gray-100',
  'Contacted': 'bg-blue-100',
  'Engaged': 'bg-purple-100',
  'In Diligence': 'bg-yellow-100',
  'Term Sheet': 'bg-orange-100',
  'Closing': 'bg-green-100',
  'Closed': 'bg-emerald-200',
  'Passed': 'bg-red-100'
}

export default function Dashboard({ data, addWeeklyAction, updateWeeklyAction, deleteWeeklyAction, exportToCSV }) {
  const [editingAction, setEditingAction] = useState(null)

  const getStageCount = (stage) => data.investors.filter(i => i.stage === stage).length
  const getActiveCount = () => data.investors.filter(i => !['Passed', 'Target List', 'Closed'].includes(i.stage)).length

  const metrics = [
    { label: 'Total Investors', value: data.investors.length, icon: Building2, color: 'bg-slate-100 border-slate-200' },
    { label: 'Active', value: getActiveCount(), icon: Users, color: 'bg-blue-50 border-blue-200' },
    { label: 'In Diligence', value: getStageCount('In Diligence'), icon: Target, color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Term Sheets', value: getStageCount('Term Sheet') + data.termSheets.length, icon: DollarSign, color: 'bg-green-50 border-green-200' },
  ]

  const timeline = [
    { phase: 'Prep', period: 'Jan-Feb', status: 'current' },
    { phase: 'Roadshow', period: 'Mar-Apr', status: 'upcoming' },
    { phase: 'Term Sheets', period: 'May', status: 'upcoming' },
    { phase: 'Close', period: 'Jun-Jul', status: 'upcoming' },
  ]

  const handleAddAction = () => {
    const newAction = { action: 'New action', owner: '', due: '', status: 'Not Started' }
    addWeeklyAction(newAction).then(action => {
      setEditingAction(action.id)
    })
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => exportToCSV('investors')}
          className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <Download size={16} />
          <span>Export Pipeline</span>
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

      {/* Timeline */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Timeline</h2>
        <div className="flex items-center justify-between">
          {timeline.map((t, i) => (
            <React.Fragment key={t.phase}>
              <div className={`flex-1 text-center p-2 rounded ${t.status === 'current' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
                <p className="font-medium text-sm">{t.phase}</p>
                <p className={`text-xs ${t.status === 'current' ? 'text-slate-300' : 'text-slate-500'}`}>{t.period}</p>
              </div>
              {i < timeline.length - 1 && <ArrowRight size={16} className="text-slate-300 mx-1 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Pipeline by Stage</h2>
        <div className="space-y-2">
          {STAGES.filter(s => s !== 'Passed').map(stage => {
            const count = getStageCount(stage)
            const total = data.investors.length || 1
            const pct = (count / total) * 100
            return (
              <div key={stage} className="flex items-center text-xs">
                <span className="w-20 text-slate-600 truncate">{stage}</span>
                <div className="flex-1 mx-2 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${STAGE_COLORS[stage]}`} 
                    style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} 
                  />
                </div>
                <span className="w-6 text-right font-medium text-slate-700">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">This Week's Actions</h2>
          <button onClick={handleAddAction} className="text-slate-500 hover:text-slate-700">
            <PlusCircle size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {(data.weeklyActions || []).map(action => (
            <div key={action.id} className="flex items-center space-x-2 p-2 bg-slate-50 rounded text-sm">
              <button 
                onClick={() => updateWeeklyAction(action.id, { status: action.status === 'Complete' ? 'Not Started' : 'Complete' })}
                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${action.status === 'Complete' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}
              >
                {action.status === 'Complete' && <Check size={12} />}
              </button>
              {editingAction === action.id ? (
                <>
                  <input 
                    value={action.action} 
                    onChange={e => updateWeeklyAction(action.id, { action: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    autoFocus
                  />
                  <input 
                    value={action.owner || ''} 
                    onChange={e => updateWeeklyAction(action.id, { owner: e.target.value })}
                    placeholder="Owner"
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <input 
                    type="date"
                    value={action.due || ''} 
                    onChange={e => updateWeeklyAction(action.id, { due: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <button onClick={() => setEditingAction(null)} className="text-green-600">
                    <Check size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className={`flex-1 ${action.status === 'Complete' ? 'line-through text-slate-400' : ''}`}>{action.action}</span>
                  <span className="text-slate-500 text-xs">{action.owner}</span>
                  <span className="text-slate-400 text-xs">{action.due}</span>
                  <button onClick={() => setEditingAction(action.id)} className="text-slate-400 hover:text-slate-600">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteWeeklyAction(action.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
          {(!data.weeklyActions || data.weeklyActions.length === 0) && (
            <p className="text-slate-400 text-sm text-center py-2">No actions yet. Click + to add.</p>
          )}
        </div>
      </div>

      {/* Stage Gate Reminders */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 text-sm mb-2">Stage Gate Reminders</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
          <div className="flex items-start space-x-1">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span><strong>G1:</strong> 5 days to respond</span>
          </div>
          <div className="flex items-start space-x-1">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span><strong>G2:</strong> 7 days to schedule</span>
          </div>
          <div className="flex items-start space-x-1">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span><strong>G3:</strong> 10 days for deep dive</span>
          </div>
          <div className="flex items-start space-x-1">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span><strong>G4:</strong> 3 weeks diligence</span>
          </div>
        </div>
      </div>
    </div>
  )
}
