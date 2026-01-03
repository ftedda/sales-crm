import React, { useState } from 'react'
import { PlusCircle, Trash2, Clock, History } from 'lucide-react'
import InvestorTimeline from './InvestorTimeline'

const STAGES = ['Target List', 'Contacted', 'Engaged', 'In Diligence', 'Term Sheet', 'Closing', 'Closed', 'Passed']
const STAGE_COLORS = {
  'Target List': 'bg-gray-100 text-gray-700',
  'Contacted': 'bg-blue-100 text-blue-700',
  'Engaged': 'bg-purple-100 text-purple-700',
  'In Diligence': 'bg-yellow-100 text-yellow-700',
  'Term Sheet': 'bg-orange-100 text-orange-700',
  'Closing': 'bg-green-100 text-green-700',
  'Closed': 'bg-emerald-200 text-emerald-800',
  'Passed': 'bg-red-100 text-red-700'
}
const TIERS = ['1 - Must Have', '2 - Strong Fit', '3 - Opportunistic']

function formatLastTouched(timestamp) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Pipeline({ data, addInvestor, updateInvestor, deleteInvestor, addQuickNote, getInvestorTimeline, getLastTouched }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firm: '', contact: '', email: '', tier: '2 - Strong Fit', stage: 'Target List', nextAction: '', notes: '' })
  const [filter, setFilter] = useState('all')
  const [selectedInvestor, setSelectedInvestor] = useState(null)

  const handleSubmit = async () => {
    if (!form.firm) return
    await addInvestor(form)
    setForm({ firm: '', contact: '', email: '', tier: '2 - Strong Fit', stage: 'Target List', nextAction: '', notes: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this investor?')) {
      await deleteInvestor(id)
    }
  }

  const filtered = filter === 'all' ? data.investors : data.investors.filter(i => i.stage === filter)

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-1">
        <button onClick={() => setFilter('all')} className={`px-2 py-1 rounded text-xs ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
          All ({data.investors.length})
        </button>
        {STAGES.slice(0, 6).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2 py-1 rounded text-xs ${filter === s ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
            {s.split(' ')[0]} ({data.investors.filter(i => i.stage === s).length})
          </button>
        ))}
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Add Investor</span>
      </button>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-sm mb-3">Add New Investor</h3>
          <div className="space-y-2">
            <input placeholder="Firm Name *" value={form.firm} onChange={e => setForm({ ...form, firm: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Contact Name" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className="border rounded px-3 py-2 text-sm">
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="border rounded px-3 py-2 text-sm">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input placeholder="Next Action" value={form.nextAction} onChange={e => setForm({ ...form, nextAction: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Investor list */}
      <div className="space-y-2">
        {filtered.map(inv => {
          const lastTouched = getLastTouched ? getLastTouched(inv.id, inv.firm) : null
          const lastTouchedFormatted = formatLastTouched(lastTouched)

          return (
            <div key={inv.id} className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-slate-800">{inv.firm}</h3>
                    <span className="text-xs text-slate-400">T{inv.tier?.charAt(0)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{inv.contact} {inv.email && `• ${inv.email}`}</p>
                </div>
                <select
                  value={inv.stage}
                  onChange={e => updateInvestor(inv.id, { stage: e.target.value })}
                  className={`${STAGE_COLORS[inv.stage]} px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer`}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Last touched indicator */}
              {lastTouchedFormatted && (
                <div className="flex items-center space-x-1 mt-2 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>Last touched {lastTouchedFormatted}</span>
                </div>
              )}

              {inv.nextAction && (
                <p className="text-sm text-blue-600 mt-2">
                  <span className="font-medium">Next:</span> {inv.nextAction}
                </p>
              )}
              {inv.notes && <p className="text-xs text-slate-500 mt-1">{inv.notes}</p>}

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setSelectedInvestor(inv)}
                  className="flex items-center space-x-1 text-slate-500 text-xs hover:text-slate-700 transition-colors"
                >
                  <History size={14} />
                  <span>View Timeline</span>
                </button>
                <button onClick={() => handleDelete(inv.id)} className="text-red-400 text-xs hover:text-red-600">Delete</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No investors in this view</p>}
      </div>

      {/* Timeline Modal */}
      {selectedInvestor && (
        <InvestorTimeline
          investor={selectedInvestor}
          timeline={getInvestorTimeline ? getInvestorTimeline(selectedInvestor.id, selectedInvestor.firm) : []}
          lastTouched={getLastTouched ? getLastTouched(selectedInvestor.id, selectedInvestor.firm) : null}
          onClose={() => setSelectedInvestor(null)}
          onAddNote={async (note) => {
            if (addQuickNote) {
              await addQuickNote(selectedInvestor.id, selectedInvestor.firm, note)
            }
          }}
        />
      )}
    </div>
  )
}
