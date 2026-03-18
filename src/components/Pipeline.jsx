import React, { useState, useMemo } from 'react'
import { PlusCircle, Trash2, Search, X, ChevronDown, Save, Clock, History, TrendingUp, Flame, Snowflake, Sun, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import InvestorTimeline, { getEngagementLevel, formatRelativeTime } from './InvestorTimeline'

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

const ENGAGEMENT_CONFIG = {
  high: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50', label: 'Hot' },
  medium: { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Active' },
  warm: { icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Warm' },
  cooling: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Cooling' },
  cold: { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Cold' },
  none: { icon: Clock, color: 'text-slate-300', bg: 'bg-slate-50', label: 'None' }
}

export default function Pipeline({ data, addInvestor, updateInvestor, deleteInvestor, addQuickNote, addWeeklyAction, getInvestorTimeline, getLastTouched }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firm: '', contact: '', email: '', tier: '2 - Strong Fit', stage: 'Target List', next_action: '', notes: '' })
  const [stageFilter, setStageFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const ENGAGEMENT_ORDER = ['high', 'medium', 'warm', 'cooling', 'cold', 'none']

  const handleSubmit = async () => {
    if (!form.firm) return
    await addInvestor(form)
    setForm({ firm: '', contact: '', email: '', tier: '2 - Strong Fit', stage: 'Target List', next_action: '', notes: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this investor?')) {
      await deleteInvestor(id)
      setExpandedRow(null)
    }
  }

  const handleExpand = (inv) => {
    if (expandedRow === inv.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(inv.id)
      setEditData({ ...inv })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      await updateInvestor(expandedRow, editData)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const filtered = useMemo(() => {
    let result = data.investors
    if (stageFilter !== 'all') {
      result = result.filter(i => i.stage === stageFilter)
    }
    if (tierFilter !== 'all') {
      result = result.filter(i => i.tier === tierFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.firm?.toLowerCase().includes(q) ||
        i.contact?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }
    if (sortConfig.key) {
      const dir = sortConfig.direction === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        switch (sortConfig.key) {
          case 'firm':
          case 'contact':
            return dir * (a[sortConfig.key] || '').localeCompare(b[sortConfig.key] || '', undefined, { sensitivity: 'base' })
          case 'tier':
            return dir * (a.tier || '').localeCompare(b.tier || '')
          case 'stage':
            return dir * (STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage))
          case 'activity': {
            const timelineA = getInvestorTimeline ? getInvestorTimeline(a.id, a.firm) : []
            const timelineB = getInvestorTimeline ? getInvestorTimeline(b.id, b.firm) : []
            const levelA = ENGAGEMENT_ORDER.indexOf(getEngagementLevel(timelineA).level)
            const levelB = ENGAGEMENT_ORDER.indexOf(getEngagementLevel(timelineB).level)
            if (levelA !== levelB) return dir * (levelA - levelB)
            return dir * (timelineB.length - timelineA.length)
          }
          default:
            return 0
        }
      })
    }
    return result
  }, [data.investors, stageFilter, tierFilter, search, sortConfig, getInvestorTimeline])

  const clearFilters = () => {
    setStageFilter('all')
    setTierFilter('all')
    setSearch('')
  }

  const hasActiveFilters = stageFilter !== 'all' || tierFilter !== 'all' || search.trim()

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search investors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All Tiers</option>
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All Stages ({data.investors.length})</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{s} ({data.investors.filter(i => i.stage === s).length})</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline">
            Clear
          </button>
        )}
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Add Investor</span>
      </button>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-sm mb-3">Add New Investor</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input placeholder="Firm Name *" value={form.firm} onChange={e => setForm({ ...form, firm: e.target.value })} className="border rounded px-3 py-2 text-sm col-span-2 md:col-span-1" />
            <input placeholder="Contact Name" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className="border rounded px-3 py-2 text-sm">
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="border rounded px-3 py-2 text-sm">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Next Action" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm mt-2" rows={2} />
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {data.investors.length} investors
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  { key: 'firm', label: 'Firm', className: '' },
                  { key: 'contact', label: 'Contact', className: 'hidden sm:table-cell' },
                  { key: 'tier', label: 'Tier', className: 'hidden md:table-cell' },
                  { key: 'stage', label: 'Stage', className: '' },
                  { key: 'activity', label: 'Activity', className: 'hidden lg:table-cell' },
                ].map(col => {
                  const SortIcon = sortConfig.key === col.key
                    ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown)
                    : ArrowUpDown
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`text-left px-3 py-2 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-800 ${col.className}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon size={12} className={sortConfig.key === col.key ? 'text-slate-800' : 'text-slate-300'} />
                      </span>
                    </th>
                  )
                })}
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => {
                const lastTouched = getLastTouched ? getLastTouched(inv.id, inv.firm) : null
                const timeline = getInvestorTimeline ? getInvestorTimeline(inv.id, inv.firm) : []
                const engagement = getEngagementLevel(timeline)
                const engagementConfig = ENGAGEMENT_CONFIG[engagement.level]
                const EngagementIcon = engagementConfig.icon

                return (
                  <React.Fragment key={inv.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleExpand(inv)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{inv.firm}</div>
                        <div className="text-xs text-slate-400 sm:hidden">{inv.contact}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 hidden sm:table-cell">
                        <div>{inv.contact}</div>
                        <div className="text-xs text-slate-400">{inv.email}</div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-xs text-slate-500">T{inv.tier?.charAt(0)}</span>
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={inv.stage}
                          onChange={e => updateInvestor(inv.id, { stage: e.target.value })}
                          className={`${STAGE_COLORS[inv.stage]} px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer`}
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {/* Engagement indicator */}
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${engagementConfig.bg}`}
                            title={`${engagementConfig.label}${lastTouched ? ` - Last: ${formatRelativeTime(lastTouched)}` : ''}`}
                          >
                            <EngagementIcon size={12} className={engagementConfig.color} />
                            <span className={`text-xs font-medium ${engagementConfig.color}`}>
                              {engagementConfig.label}
                            </span>
                          </div>
                          {/* Activity count */}
                          {timeline.length > 0 && (
                            <span className="text-xs text-slate-400">
                              {timeline.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {/* Timeline button */}
                          <button
                            onClick={() => setSelectedInvestor(inv)}
                            className="p-1.5 rounded hover:bg-slate-100 transition-colors group"
                            title="View timeline"
                          >
                            <History size={14} className="text-slate-400 group-hover:text-slate-600" />
                          </button>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === inv.id ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    {expandedRow === inv.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-slate-500 block mb-1">Firm</label>
                              <input
                                value={editData.firm || ''}
                                onChange={e => handleEditChange('firm', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Contact</label>
                              <input
                                value={editData.contact || ''}
                                onChange={e => handleEditChange('contact', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Email</label>
                              <input
                                value={editData.email || ''}
                                onChange={e => handleEditChange('email', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Phone</label>
                              <input
                                value={editData.phone || ''}
                                onChange={e => handleEditChange('phone', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Tier</label>
                              <select
                                value={editData.tier || ''}
                                onChange={e => handleEditChange('tier', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Stage</label>
                              <select
                                value={editData.stage || ''}
                                onChange={e => handleEditChange('stage', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Intro Source</label>
                              <input
                                value={editData.intro_source || ''}
                                onChange={e => handleEditChange('intro_source', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Next Action</label>
                              <input
                                value={editData.next_action || ''}
                                onChange={e => handleEditChange('next_action', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Next Action Date</label>
                              <input
                                type="date"
                                value={editData.next_action_date || ''}
                                onChange={e => handleEditChange('next_action_date', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="text-slate-500 block mb-1 text-xs">Notes</label>
                            <textarea
                              value={editData.notes || ''}
                              onChange={e => handleEditChange('notes', e.target.value)}
                              className="w-full border rounded px-2 py-1.5 text-xs"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="flex items-center text-red-500 hover:text-red-700 text-xs"
                              >
                                <Trash2 size={12} className="mr-1" /> Delete
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedInvestor(inv) }}
                                className="flex items-center text-slate-500 hover:text-slate-700 text-xs"
                              >
                                <History size={12} className="mr-1" /> Timeline
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setExpandedRow(null); setEditData({}) }}
                                className="px-3 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSave}
                                className="flex items-center px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700"
                              >
                                <Save size={12} className="mr-1" /> Save
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No investors in this view</p>
        )}
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
          onAddAction={addWeeklyAction ? async (actionText) => {
            const newAction = {
              action: `[${selectedInvestor.firm}] ${actionText}`,
              owner: '',
              due: '',
              status: 'Not Started',
              investor_id: selectedInvestor.id,
              investor_firm: selectedInvestor.firm,
            }
            await addWeeklyAction(newAction)
          } : null}
        />
      )}
    </div>
  )
}
