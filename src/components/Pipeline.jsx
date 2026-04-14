import React, { useState, useMemo } from 'react'
import { PlusCircle, Trash2, Search, X, ChevronDown, Save, Clock, History, TrendingUp, Flame, Snowflake, Sun, ArrowUpDown, ArrowUp, ArrowDown, CalendarClock, AlertTriangle } from 'lucide-react'
import ContactTimeline, { getEngagementLevel, formatRelativeTime } from './ContactTimeline'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
const STAGE_COLORS = {
  'Lead': 'bg-gray-100 text-gray-700',
  'Qualified': 'bg-blue-100 text-blue-700',
  'Proposal': 'bg-purple-100 text-purple-700',
  'Negotiation': 'bg-yellow-100 text-yellow-700',
  'Closed Won': 'bg-emerald-200 text-emerald-800',
  'Closed Lost': 'bg-red-100 text-red-700'
}
const PRIORITIES = ['High', 'Medium', 'Low']

const ENGAGEMENT_CONFIG = {
  high: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50', label: 'Hot' },
  medium: { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Active' },
  warm: { icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Warm' },
  cooling: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Cooling' },
  cold: { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Cold' },
  none: { icon: Clock, color: 'text-slate-300', bg: 'bg-slate-50', label: 'None' }
}

function formatCurrency(value) {
  if (!value) return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
  return `$${num.toLocaleString()}`
}

function getFollowUpStatus(date) {
  if (!date) return { label: 'Not set', color: 'text-slate-400', bg: 'bg-slate-50' }
  const today = new Date().toISOString().split('T')[0]
  if (date < today) return { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' }
  if (date === today) return { label: 'Today', color: 'text-orange-600', bg: 'bg-orange-50' }
  return { label: date, color: 'text-green-600', bg: 'bg-green-50' }
}

export default function Pipeline({ data, addContact, updateContact, deleteContact, addQuickNote, addWeeklyAction, updateWeeklyAction, getContactTimeline, getLastTouched }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', title: '', deal_value: '', stage: 'Lead', source: '', priority: 'Medium', next_follow_up: '', next_follow_up_note: '', notes: '' })
  const [stageFilter, setStageFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState(null) // 'needs_followup'
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})
  const [selectedContact, setSelectedContact] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const ENGAGEMENT_ORDER = ['high', 'medium', 'warm', 'cooling', 'cold', 'none']

  const handleSubmit = async () => {
    if (!form.name) return
    const submitData = { ...form }
    if (submitData.deal_value) submitData.deal_value = Number(submitData.deal_value)
    if (!submitData.next_follow_up) submitData.next_follow_up = null
    await addContact(submitData)
    setForm({ name: '', company: '', email: '', phone: '', title: '', deal_value: '', stage: 'Lead', source: '', priority: 'Medium', next_follow_up: '', next_follow_up_note: '', notes: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this contact?')) {
      await deleteContact(id)
      setExpandedRow(null)
    }
  }

  const handleExpand = (contact) => {
    if (expandedRow === contact.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(contact.id)
      setEditData({ ...contact })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      const updates = { ...editData }
      if (updates.deal_value) updates.deal_value = Number(updates.deal_value)
      if (!updates.next_follow_up) updates.next_follow_up = null
      await updateContact(expandedRow, updates)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    let result = data.contacts || []
    if (stageFilter !== 'all') {
      result = result.filter(c => c.stage === stageFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter(c => c.priority === priorityFilter)
    }
    if (quickFilter === 'needs_followup') {
      result = result.filter(c => {
        const overdue = c.next_follow_up && c.next_follow_up < today
        const noFollowUp = !c.next_follow_up && c.stage !== 'Closed Won' && c.stage !== 'Closed Lost'
        return overdue || noFollowUp
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      )
    }
    if (sortConfig.key) {
      const dir = sortConfig.direction === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        switch (sortConfig.key) {
          case 'name':
          case 'company':
            return dir * (a[sortConfig.key] || '').localeCompare(b[sortConfig.key] || '', undefined, { sensitivity: 'base' })
          case 'deal_value':
            return dir * ((Number(a.deal_value) || 0) - (Number(b.deal_value) || 0))
          case 'stage':
            return dir * (STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage))
          case 'activity': {
            const timelineA = getContactTimeline ? getContactTimeline(a.id, a.name) : []
            const timelineB = getContactTimeline ? getContactTimeline(b.id, b.name) : []
            const levelA = ENGAGEMENT_ORDER.indexOf(getEngagementLevel(timelineA).level)
            const levelB = ENGAGEMENT_ORDER.indexOf(getEngagementLevel(timelineB).level)
            if (levelA !== levelB) return dir * (levelA - levelB)
            return dir * (timelineB.length - timelineA.length)
          }
          case 'follow_up': {
            const aDate = a.next_follow_up || '9999-99-99'
            const bDate = b.next_follow_up || '9999-99-99'
            return dir * aDate.localeCompare(bDate)
          }
          default:
            return 0
        }
      })
    }
    return result
  }, [data.contacts, stageFilter, priorityFilter, quickFilter, search, sortConfig, getContactTimeline, today])

  const clearFilters = () => {
    setStageFilter('all')
    setPriorityFilter('all')
    setSearch('')
    setQuickFilter(null)
  }

  const hasActiveFilters = stageFilter !== 'all' || priorityFilter !== 'all' || search.trim() || quickFilter

  const needsFollowUpCount = useMemo(() => {
    return (data.contacts || []).filter(c => {
      const overdue = c.next_follow_up && c.next_follow_up < today
      const noFollowUp = !c.next_follow_up && c.stage !== 'Closed Won' && c.stage !== 'Closed Lost'
      return overdue || noFollowUp
    }).length
  }, [data.contacts, today])

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
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
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All Stages ({(data.contacts || []).length})</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{s} ({(data.contacts || []).filter(c => c.stage === s).length})</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline">
            Clear
          </button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
          <PlusCircle size={16} /><span>Add Contact</span>
        </button>
        {needsFollowUpCount > 0 && (
          <button
            onClick={() => setQuickFilter(quickFilter === 'needs_followup' ? null : 'needs_followup')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
              quickFilter === 'needs_followup'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Needs Follow-up ({needsFollowUpCount})</span>
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-sm mb-3">Add New Contact</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm col-span-2 md:col-span-1" />
            <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Deal Value" type="number" value={form.deal_value} onChange={e => setForm({ ...form, deal_value: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="border rounded px-3 py-2 text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="border rounded px-3 py-2 text-sm">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="text-xs text-slate-500">Follow-up Date</label>
              <input type="date" value={form.next_follow_up} onChange={e => setForm({ ...form, next_follow_up: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Follow-up Note</label>
              <input placeholder="What to follow up on" value={form.next_follow_up_note} onChange={e => setForm({ ...form, next_follow_up_note: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
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
          Showing {filtered.length} of {(data.contacts || []).length} contacts
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  { key: 'name', label: 'Name', className: '' },
                  { key: 'company', label: 'Company', className: 'hidden sm:table-cell' },
                  { key: 'deal_value', label: 'Deal Value', className: 'hidden md:table-cell' },
                  { key: 'stage', label: 'Stage', className: '' },
                  { key: 'activity', label: 'Activity', className: 'hidden lg:table-cell' },
                  { key: 'follow_up', label: 'Follow-up', className: 'hidden lg:table-cell' },
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
              {filtered.map(contact => {
                const lastTouched = getLastTouched ? getLastTouched(contact.id, contact.name) : null
                const timeline = getContactTimeline ? getContactTimeline(contact.id, contact.name) : []
                const engagement = getEngagementLevel(timeline)
                const engagementConfig = ENGAGEMENT_CONFIG[engagement.level]
                const EngagementIcon = engagementConfig.icon
                const followUp = getFollowUpStatus(contact.next_follow_up)

                return (
                  <React.Fragment key={contact.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleExpand(contact)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{contact.name}</div>
                        {contact.title && <div className="text-xs text-slate-400">{contact.title}</div>}
                        <div className="text-xs text-slate-400 sm:hidden">{contact.company}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 hidden sm:table-cell">
                        <div>{contact.company}</div>
                        <div className="text-xs text-slate-400">{contact.email}</div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-sm font-medium text-slate-700">{formatCurrency(contact.deal_value)}</span>
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={contact.stage}
                          onChange={e => updateContact(contact.id, { stage: e.target.value })}
                          className={`${STAGE_COLORS[contact.stage]} px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer`}
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${engagementConfig.bg}`}
                            title={`${engagementConfig.label}${lastTouched ? ` - Last: ${formatRelativeTime(lastTouched)}` : ''}`}
                          >
                            <EngagementIcon size={12} className={engagementConfig.color} />
                            <span className={`text-xs font-medium ${engagementConfig.color}`}>
                              {engagementConfig.label}
                            </span>
                          </div>
                          {timeline.length > 0 && (
                            <span className="text-xs text-slate-400">
                              {timeline.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <div className={`flex items-center gap-1 text-xs font-medium ${followUp.color}`}>
                          <CalendarClock size={12} />
                          <span>{followUp.label}</span>
                        </div>
                        {contact.next_follow_up_note && (
                          <div className="text-xs text-slate-400 truncate max-w-[120px]" title={contact.next_follow_up_note}>
                            {contact.next_follow_up_note}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="p-1.5 rounded hover:bg-slate-100 transition-colors group"
                            title="View timeline"
                          >
                            <History size={14} className="text-slate-400 group-hover:text-slate-600" />
                          </button>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === contact.id ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    {expandedRow === contact.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-3 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-slate-500 block mb-1">Name</label>
                              <input
                                value={editData.name || ''}
                                onChange={e => handleEditChange('name', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Company</label>
                              <input
                                value={editData.company || ''}
                                onChange={e => handleEditChange('company', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Title</label>
                              <input
                                value={editData.title || ''}
                                onChange={e => handleEditChange('title', e.target.value)}
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
                              <label className="text-slate-500 block mb-1">Deal Value</label>
                              <input
                                type="number"
                                value={editData.deal_value || ''}
                                onChange={e => handleEditChange('deal_value', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Priority</label>
                              <select
                                value={editData.priority || 'Medium'}
                                onChange={e => handleEditChange('priority', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
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
                              <label className="text-slate-500 block mb-1">Source</label>
                              <input
                                value={editData.source || ''}
                                onChange={e => handleEditChange('source', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Follow-up Date</label>
                              <input
                                type="date"
                                value={editData.next_follow_up || ''}
                                onChange={e => handleEditChange('next_follow_up', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-slate-500 block mb-1">Follow-up Note</label>
                              <input
                                value={editData.next_follow_up_note || ''}
                                onChange={e => handleEditChange('next_follow_up_note', e.target.value)}
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
                                onClick={() => handleDelete(contact.id)}
                                className="flex items-center text-red-500 hover:text-red-700 text-xs"
                              >
                                <Trash2 size={12} className="mr-1" /> Delete
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedContact(contact) }}
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
          <p className="text-center py-8 text-slate-400 text-sm">No contacts in this view</p>
        )}
      </div>

      {/* Timeline Modal */}
      {selectedContact && (
        <ContactTimeline
          contact={selectedContact}
          timeline={getContactTimeline ? getContactTimeline(selectedContact.id, selectedContact.name) : []}
          lastTouched={getLastTouched ? getLastTouched(selectedContact.id, selectedContact.name) : null}
          onClose={() => setSelectedContact(null)}
          onAddNote={async (note) => {
            if (addQuickNote) {
              await addQuickNote(selectedContact.id, selectedContact.name, note)
            }
          }}
          onToggleAction={updateWeeklyAction}
          onAddAction={addWeeklyAction ? async (actionText) => {
            const newAction = {
              action: `[${selectedContact.name}] ${actionText}`,
              owner: '',
              due: '',
              status: 'Not Started',
              contact_id: selectedContact.id,
              contact_name: selectedContact.name,
            }
            await addWeeklyAction(newAction)
          } : null}
        />
      )}
    </div>
  )
}
