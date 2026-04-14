import React, { useState, useMemo } from 'react'
import { PlusCircle, Trash2, Check, Edit3, Search, X } from 'lucide-react'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-yellow-100 text-yellow-700',
  'bg-indigo-100 text-indigo-700',
]

function getTagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export default function Actions({ data, addWeeklyAction, updateWeeklyAction, deleteWeeklyAction }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [tagFilter, setTagFilter] = useState('all')
  const [contactFilter, setContactFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [editingAction, setEditingAction] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ action: '', owner: '', due: '', contact_id: '', tags: '' })

  const allTags = useMemo(() => {
    const tags = new Set()
    ;(data.weeklyActions || []).forEach(a => {
      if (a.tags) a.tags.split(',').forEach(t => { if (t.trim()) tags.add(t.trim()) })
    })
    return [...tags].sort()
  }, [data.weeklyActions])

  const contactMap = useMemo(() => {
    const map = new Map()
    ;(data.contacts || []).forEach(c => map.set(c.id, c))
    return map
  }, [data.contacts])

  const nameToContact = useMemo(() => {
    const map = new Map()
    ;(data.contacts || []).forEach(c => { if (c.name) map.set(c.name, c) })
    return map
  }, [data.contacts])

  // Resolve contact info: use FK if set, otherwise parse [Name] prefix
  const getActionContact = (action) => {
    if (action.contact_id) return contactMap.get(action.contact_id) || null
    if (action.contact_name) return nameToContact.get(action.contact_name) || null
    // Legacy: try investor_id / investor_firm for migrated data
    if (action.investor_id) return contactMap.get(action.investor_id) || null
    const match = action.action?.match(/^\[([^\]]+)\]\s/)
    if (match) return nameToContact.get(match[1]) || null
    return null
  }

  const getActionDisplayText = (action) => {
    return action.action?.replace(/^\[[^\]]+\]\s*/, '') || action.action
  }

  const uniqueNames = useMemo(() => {
    const names = new Set()
    ;(data.contacts || []).forEach(c => { if (c.name) names.add(c.name) })
    return [...names].sort()
  }, [data.contacts])

  const filteredActions = useMemo(() => {
    let result = data.weeklyActions || []

    if (statusFilter === 'active') {
      result = result.filter(a => a.status !== 'Complete')
    } else if (statusFilter === 'completed') {
      result = result.filter(a => a.status === 'Complete')
    }

    if (tagFilter !== 'all') {
      result = result.filter(a => a.tags && a.tags.split(',').map(t => t.trim()).includes(tagFilter))
    }

    if (contactFilter !== 'all') {
      result = result.filter(a => {
        const c = getActionContact(a)
        return c && c.name === contactFilter
      })
    }

    if (stageFilter !== 'all') {
      result = result.filter(a => {
        const c = getActionContact(a)
        return c && c.stage === stageFilter
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.action?.toLowerCase().includes(q) ||
        a.owner?.toLowerCase().includes(q) ||
        a.contact_name?.toLowerCase().includes(q) ||
        a.investor_firm?.toLowerCase().includes(q) ||
        a.tags?.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      const aComplete = a.status === 'Complete' ? 1 : 0
      const bComplete = b.status === 'Complete' ? 1 : 0
      if (aComplete !== bComplete) return aComplete - bComplete
      if (a.due && b.due) return a.due.localeCompare(b.due)
      if (a.due) return -1
      if (b.due) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [data.weeklyActions, statusFilter, tagFilter, contactFilter, stageFilter, search, contactMap])

  const activeFilterCount = [
    tagFilter !== 'all',
    contactFilter !== 'all',
    stageFilter !== 'all',
    search.trim(),
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setTagFilter('all')
    setContactFilter('all')
    setStageFilter('all')
  }

  const handleAddAction = async () => {
    if (!form.action.trim()) return
    const contact = form.contact_id ? contactMap.get(Number(form.contact_id)) : null
    const newAction = {
      action: form.action,
      owner: form.owner,
      due: form.due,
      status: 'Not Started',
      contact_id: contact ? contact.id : null,
      contact_name: contact ? contact.name : null,
      tags: form.tags || null,
    }
    await addWeeklyAction(newAction)
    setForm({ action: '', owner: '', due: '', contact_id: '', tags: '' })
    setShowForm(false)
  }

  const isOverdue = (action) => {
    if (!action.due || action.status === 'Complete') return false
    return action.due < new Date().toISOString().split('T')[0]
  }

  const totalActions = (data.weeklyActions || []).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Actions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          <PlusCircle size={16} />
          <span>Add</span>
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-sm mb-3">New Action</h3>
          <div className="space-y-2">
            <input
              placeholder="What needs to happen? Use #tags..."
              value={form.action}
              onChange={e => setForm({ ...form, action: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              autoFocus
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select
                value={form.contact_id}
                onChange={e => setForm({ ...form, contact_id: e.target.value })}
                className="border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">No contact</option>
                {(data.contacts || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
              <input
                placeholder="Owner"
                value={form.owner}
                onChange={e => setForm({ ...form, owner: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={form.due}
                onChange={e => setForm({ ...form, due: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                placeholder="Tags (comma-separated)"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleAddAction} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-lg p-3 shadow-sm border space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions..."
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
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border bg-white"
          >
            <option value="all">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
          <select
            value={contactFilter}
            onChange={e => setContactFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border bg-white"
          >
            <option value="all">All Contacts</option>
            {uniqueNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border bg-white"
          >
            <option value="all">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Status pills + filter info */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {['active', 'completed', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing {filteredActions.length} of {totalActions}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-slate-500 hover:text-slate-700 underline">
                Clear filters ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action List */}
      <div className="space-y-2">
        {filteredActions.map(action => {
          const actionTags = action.tags ? action.tags.split(',').map(t => t.trim()).filter(Boolean) : []
          const resolvedContact = getActionContact(action)
          const displayText = getActionDisplayText(action)
          const overdue = isOverdue(action)

          return (
            <div key={action.id} className="bg-white rounded-lg shadow-sm border p-3">
              <div className="flex items-start space-x-2">
                {/* Checkbox */}
                <button
                  onClick={() => updateWeeklyAction(action.id, { status: action.status === 'Complete' ? 'Not Started' : 'Complete' })}
                  className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                    action.status === 'Complete' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {action.status === 'Complete' && <Check size={12} />}
                </button>

                {/* Content */}
                {editingAction === action.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      value={action.action}
                      onChange={e => updateWeeklyAction(action.id, { action: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <select
                        value={action.contact_id || resolvedContact?.id || ''}
                        onChange={e => {
                          const c = e.target.value ? contactMap.get(Number(e.target.value)) : null
                          updateWeeklyAction(action.id, {
                            contact_id: c ? c.id : null,
                            contact_name: c ? c.name : null,
                          })
                        }}
                        className="border rounded px-2 py-1 text-sm bg-white"
                      >
                        <option value="">No contact</option>
                        {(data.contacts || []).map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                        ))}
                      </select>
                      <input
                        value={action.owner || ''}
                        onChange={e => updateWeeklyAction(action.id, { owner: e.target.value })}
                        placeholder="Owner"
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="date"
                        value={action.due || ''}
                        onChange={e => updateWeeklyAction(action.id, { due: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <input
                        value={action.tags || ''}
                        onChange={e => updateWeeklyAction(action.id, { tags: e.target.value })}
                        placeholder="Tags"
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <button onClick={() => setEditingAction(null)} className="text-green-600 text-sm flex items-center gap-1">
                      <Check size={14} /> Done
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm ${action.status === 'Complete' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {displayText}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setEditingAction(action.id)} className="text-slate-400 hover:text-slate-600 p-1">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => deleteWeeklyAction(action.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Meta row: tags, contact, owner, due */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {resolvedContact && (
                        <button
                          onClick={() => setContactFilter(resolvedContact.name)}
                          className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          {resolvedContact.name}
                        </button>
                      )}
                      {actionTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag)}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTagColor(tag)} hover:opacity-80`}
                        >
                          #{tag}
                        </button>
                      ))}
                      {action.owner && (
                        <span className="text-xs text-slate-500">@{action.owner}</span>
                      )}
                      {action.due && (
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                          {overdue ? 'Overdue: ' : ''}{action.due}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {filteredActions.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            {totalActions === 0 ? 'No actions yet. Click + Add to create one.' : 'No actions match your filters.'}
          </div>
        )}
      </div>
    </div>
  )
}
