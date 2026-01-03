import React, { useState, useMemo } from 'react'
import { PlusCircle, CheckCircle, Clock, Search, X, ChevronDown, Trash2, Save } from 'lucide-react'

const EMAIL_TYPES = [
  { name: 'Catching Up', phase: 'Pre-Launch' },
  { name: 'Quick Question', phase: 'Pre-Launch' },
  { name: 'The Heads Up', phase: 'Pre-Launch' },
  { name: 'Official Outreach', phase: 'Launch' },
  { name: 'Traction Update', phase: 'Launch' },
  { name: 'Scheduling Push', phase: 'Launch' },
  { name: 'Post-Meeting Follow-Up', phase: 'Roadshow' },
  { name: 'Process Update', phase: 'Roadshow' },
  { name: 'Customer Win', phase: 'Roadshow' },
  { name: 'Partner Meeting Request', phase: 'Roadshow' },
  { name: 'Timeline Clarity', phase: 'Close' },
  { name: 'Term Sheet Received', phase: 'Close' },
  { name: 'Final Call', phase: 'Close' },
  { name: 'Graceful Close', phase: 'Close' }
]

export default function Emails({ data, addEmail, updateEmail, deleteEmail }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', type: '', subject: '', sent_date: '', replied: false })
  const [search, setSearch] = useState('')
  const [filterReplied, setFilterReplied] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})

  const handleSubmit = async () => {
    if (!form.investor || !form.type) return
    await addEmail(form)
    setForm({ investor: '', type: '', subject: '', sent_date: '', replied: false })
    setShowForm(false)
  }

  const handleExpand = (email) => {
    if (expandedRow === email.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(email.id)
      setEditData({ ...email })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      await updateEmail(expandedRow, editData)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this email?')) {
      await deleteEmail(id)
      setExpandedRow(null)
    }
  }

  const toggleReplied = async (e, id, currentValue) => {
    e.stopPropagation()
    await updateEmail(id, { replied: !currentValue })
  }

  const filtered = useMemo(() => {
    let result = [...data.emails].reverse()
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.investor?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q) ||
        e.subject?.toLowerCase().includes(q)
      )
    }
    if (filterReplied === 'replied') {
      result = result.filter(e => e.replied)
    } else if (filterReplied === 'waiting') {
      result = result.filter(e => !e.replied)
    }
    return result
  }, [data.emails, search, filterReplied])

  const stats = useMemo(() => {
    const total = data.emails.length
    const replied = data.emails.filter(e => e.replied).length
    return { total, replied, waiting: total - replied }
  }, [data.emails])

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-500">Total Sent</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          <div className="text-xs text-slate-500">Replied</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.waiting}</div>
          <div className="text-xs text-slate-500">Waiting</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails..."
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
          value={filterReplied}
          onChange={e => setFilterReplied(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All ({stats.total})</option>
          <option value="replied">Replied ({stats.replied})</option>
          <option value="waiting">Waiting ({stats.waiting})</option>
        </select>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Log Email</span>
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
              <option value="">Email Type</option>
              {EMAIL_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <input placeholder="Subject Line" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input type="date" value={form.sent_date} onChange={e => setForm({ ...form, sent_date: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center space-x-2 mt-2">
            <input type="checkbox" checked={form.replied} onChange={e => setForm({ ...form, replied: e.target.checked })} />
            <span className="text-sm">Reply Received</span>
          </label>
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
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden sm:table-cell">Subject</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden md:table-cell">Date</th>
                <th className="text-center px-3 py-2 font-medium text-slate-600">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <React.Fragment key={e.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleExpand(e)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{e.investor}</div>
                      <div className="text-xs text-slate-400 sm:hidden">{e.sent_date}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <div>{e.type}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-500 hidden sm:table-cell max-w-48 truncate">
                      {e.subject || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell">
                      {e.sent_date}
                    </td>
                    <td className="px-3 py-2 text-center" onClick={ev => ev.stopPropagation()}>
                      <button
                        onClick={(ev) => toggleReplied(ev, e.id, e.replied)}
                        className="inline-flex items-center"
                      >
                        {e.replied ? (
                          <span className="inline-flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                            <CheckCircle size={12} className="mr-1" />Replied
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">
                            <Clock size={12} className="mr-1" />Waiting
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === e.id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expandedRow === e.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-slate-500 block mb-1">Investor</label>
                            <select
                              value={editData.investor || ''}
                              onChange={ev => handleEditChange('investor', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            >
                              <option value="">Select Investor</option>
                              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Email Type</label>
                            <select
                              value={editData.type || ''}
                              onChange={ev => handleEditChange('type', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            >
                              <option value="">Select Type</option>
                              {EMAIL_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Subject</label>
                            <input
                              value={editData.subject || ''}
                              onChange={ev => handleEditChange('subject', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Date Sent</label>
                            <input
                              type="date"
                              value={editData.sent_date || ''}
                              onChange={ev => handleEditChange('sent_date', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Reply Date</label>
                            <input
                              type="date"
                              value={editData.reply_date || ''}
                              onChange={ev => handleEditChange('reply_date', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editData.replied || false}
                                onChange={ev => handleEditChange('replied', ev.target.checked)}
                              />
                              <span className="text-slate-600">Reply Received</span>
                            </label>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="text-slate-500 block mb-1 text-xs">Notes</label>
                          <textarea
                            value={editData.notes || ''}
                            onChange={ev => handleEditChange('notes', ev.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-xs"
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => handleDelete(e.id)}
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
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No emails logged yet</p>
        )}
      </div>

      {/* Email Sequence Reference */}
      <details className="bg-blue-50 rounded-lg border border-blue-200">
        <summary className="px-3 py-2 cursor-pointer font-medium text-blue-900 text-sm">Email Sequence Reference</summary>
        <div className="px-3 pb-3 text-xs text-blue-700 space-y-1">
          <p><strong>Pre-Launch:</strong> Catching Up → Quick Question → The Heads Up</p>
          <p><strong>Launch:</strong> Official Outreach → Traction Update → Scheduling Push</p>
          <p><strong>Roadshow:</strong> Post-Meeting → Process Update → Customer Win → Partner Meeting</p>
          <p><strong>Close:</strong> Timeline Clarity → Term Sheet Received → Final Call → Graceful Close</p>
        </div>
      </details>
    </div>
  )
}
