import React, { useState } from 'react'
import { PlusCircle } from 'lucide-react'

const MEETING_TYPES = ['Intro Call (30 min)', 'Deep Dive (60 min)', 'Partner Meeting', 'Customer Reference', 'Diligence Call', 'Term Sheet Discussion']

export default function Meetings({ data, addMeeting, deleteMeeting }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', date: '', time: '', type: '', notes: '', followUp: '' })

  const handleSubmit = async () => {
    if (!form.investor || !form.date) return
    await addMeeting(form)
    setForm({ investor: '', date: '', time: '', type: '', notes: '', followUp: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    await deleteMeeting(id)
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Add Meeting</span>
      </button>

      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="space-y-2">
            <select value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select Investor</option>
              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="border rounded px-3 py-2 text-sm" />
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            </div>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Meeting Type</option>
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea placeholder="Meeting Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
            <input placeholder="Follow-up Action" value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.meetings.slice().reverse().map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 shadow-sm border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{m.investor}</h3>
                <p className="text-xs text-slate-500">{m.type}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{m.date}</p>
                <p className="text-xs text-slate-400">{m.time}</p>
              </div>
            </div>
            {m.notes && <p className="text-sm text-slate-600 mt-2">{m.notes}</p>}
            {m.followUp && <p className="text-sm text-blue-600 mt-1"><strong>Follow-up:</strong> {m.followUp}</p>}
            <button onClick={() => handleDelete(m.id)} className="text-red-400 text-xs mt-2 hover:text-red-600">Delete</button>
          </div>
        ))}
        {data.meetings.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No meetings yet</p>}
      </div>
    </div>
  )
}
