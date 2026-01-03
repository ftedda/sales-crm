import React, { useState, useMemo } from 'react'
import { PlusCircle, Trash2, Search, X, ChevronDown, Save } from 'lucide-react'

const MEETING_TYPES = ['Intro Call (30 min)', 'Deep Dive (60 min)', 'Partner Meeting', 'Customer Reference', 'Diligence Call', 'Term Sheet Discussion']

export default function Meetings({ data, addMeeting, updateMeeting, deleteMeeting }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', date: '', time: '', type: '', notes: '', follow_up: '' })
  const [search, setSearch] = useState('')
  const [filterTime, setFilterTime] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})

  const handleSubmit = async () => {
    if (!form.investor || !form.date) return
    await addMeeting(form)
    setForm({ investor: '', date: '', time: '', type: '', notes: '', follow_up: '' })
    setShowForm(false)
  }

  const handleExpand = (meeting) => {
    if (expandedRow === meeting.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(meeting.id)
      setEditData({ ...meeting })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      await updateMeeting(expandedRow, editData)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this meeting?')) {
      await deleteMeeting(id)
      setExpandedRow(null)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    let result = [...data.meetings].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.investor?.toLowerCase().includes(q) ||
        m.type?.toLowerCase().includes(q) ||
        m.notes?.toLowerCase().includes(q)
      )
    }
    if (filterTime === 'upcoming') {
      result = result.filter(m => m.date >= today)
    } else if (filterTime === 'past') {
      result = result.filter(m => m.date < today)
    }
    return result
  }, [data.meetings, search, filterTime, today])

  const stats = useMemo(() => {
    const total = data.meetings.length
    const upcoming = data.meetings.filter(m => m.date >= today).length
    return { total, upcoming, past: total - upcoming }
  }, [data.meetings, today])

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-xs text-slate-500">Upcoming</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-slate-500">{stats.past}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search meetings..."
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
          value={filterTime}
          onChange={e => setFilterTime(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All ({stats.total})</option>
          <option value="upcoming">Upcoming ({stats.upcoming})</option>
          <option value="past">Past ({stats.past})</option>
        </select>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Add Meeting</span>
      </button>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="">Select Investor</option>
              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="">Meeting Type</option>
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <textarea placeholder="Meeting Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm mt-2" rows={2} />
          <input placeholder="Follow-up Action" value={form.follow_up} onChange={e => setForm({ ...form, follow_up: e.target.value })} className="w-full border rounded px-3 py-2 text-sm mt-2" />
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Investor</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Date</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden sm:table-cell">Time</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden md:table-cell">Follow-up</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(m => {
                const isPast = m.date < today
                return (
                  <React.Fragment key={m.id}>
                    <tr
                      className={`hover:bg-slate-50 cursor-pointer ${isPast ? 'opacity-60' : ''}`}
                      onClick={() => handleExpand(m)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{m.investor}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {m.type || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`${!isPast ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                          {m.date}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">
                        {m.time || '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-500 hidden md:table-cell max-w-32 truncate">
                        {m.follow_up || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === m.id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>
                    {expandedRow === m.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-slate-500 block mb-1">Investor</label>
                              <select
                                value={editData.investor || ''}
                                onChange={e => handleEditChange('investor', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                <option value="">Select Investor</option>
                                {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Meeting Type</label>
                              <select
                                value={editData.type || ''}
                                onChange={e => handleEditChange('type', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                <option value="">Select Type</option>
                                {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Date</label>
                              <input
                                type="date"
                                value={editData.date || ''}
                                onChange={e => handleEditChange('date', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Time</label>
                              <input
                                type="time"
                                value={editData.time || ''}
                                onChange={e => handleEditChange('time', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Location</label>
                              <input
                                value={editData.location || ''}
                                onChange={e => handleEditChange('location', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                                placeholder="Zoom / Office / etc"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Prep Status</label>
                              <select
                                value={editData.prep_status || ''}
                                onChange={e => handleEditChange('prep_status', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                              >
                                <option value="">Select Status</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Ready">Ready</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Attendees (Us)</label>
                              <input
                                value={editData.attendees_us || ''}
                                onChange={e => handleEditChange('attendees_us', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                                placeholder="Team members"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Attendees (Them)</label>
                              <input
                                value={editData.attendees_them || ''}
                                onChange={e => handleEditChange('attendees_them', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                                placeholder="Investor contacts"
                              />
                            </div>
                            <div>
                              <label className="text-slate-500 block mb-1">Follow-up</label>
                              <input
                                value={editData.follow_up || ''}
                                onChange={e => handleEditChange('follow_up', e.target.value)}
                                className="w-full border rounded px-2 py-1.5"
                                placeholder="Next action"
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
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="flex items-center text-red-500 hover:text-red-700 text-xs"
                            >
                              <Trash2 size={12} className="mr-1" /> Delete
                            </button>
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
          <p className="text-center py-8 text-slate-400 text-sm">No meetings yet</p>
        )}
      </div>
    </div>
  )
}
