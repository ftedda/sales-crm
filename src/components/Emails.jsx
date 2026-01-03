import React, { useState } from 'react'
import { PlusCircle, CheckCircle, Clock } from 'lucide-react'

const EMAIL_TYPES = ['Catching Up', 'Quick Question', 'The Heads Up', 'Official Outreach', 'Traction Update', 'Scheduling Push', 'Post-Meeting Follow-Up', 'Process Update', 'Customer Win', 'Partner Meeting Request', 'Timeline Clarity', 'Term Sheet Received', 'Final Call', 'Graceful Close']

export default function Emails({ data, addEmail, updateEmail }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', type: '', subject: '', sentDate: '', replied: false })

  const handleSubmit = async () => {
    if (!form.investor || !form.type) return
    await addEmail(form)
    setForm({ investor: '', type: '', subject: '', sentDate: '', replied: false })
    setShowForm(false)
  }

  const toggleReplied = async (id, currentValue) => {
    await updateEmail(id, { replied: !currentValue })
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Log Email</span>
      </button>

      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="space-y-2">
            <select value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select Investor</option>
              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Email Type</option>
              {EMAIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Subject Line" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            <input type="date" value={form.sentDate} onChange={e => setForm({ ...form, sentDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.replied} onChange={e => setForm({ ...form, replied: e.target.checked })} />
              <span className="text-sm">Reply Received</span>
            </label>
          </div>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.emails.slice().reverse().map(e => (
          <div key={e.id} className="bg-white rounded-lg p-3 shadow-sm border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-800">{e.investor}</h3>
                <p className="text-xs text-slate-500">{e.type}</p>
                {e.subject && <p className="text-sm text-slate-600 mt-1">{e.subject}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{e.sentDate}</p>
                <button onClick={() => toggleReplied(e.id, e.replied)} className="mt-1">
                  {e.replied ? (
                    <span className="inline-flex items-center text-green-600 text-xs"><CheckCircle size={12} className="mr-1" />Replied</span>
                  ) : (
                    <span className="inline-flex items-center text-slate-400 text-xs"><Clock size={12} className="mr-1" />Waiting</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        {data.emails.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No emails logged yet</p>}
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <h3 className="font-medium text-blue-900 text-sm mb-2">Email Sequence</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Pre-Launch:</strong> Catching Up → Quick Question → The Heads Up</p>
          <p><strong>Launch:</strong> Official Outreach → Traction Update → Scheduling Push</p>
          <p><strong>Roadshow:</strong> Post-Meeting → Process Update → Customer Win → Partner Meeting</p>
          <p><strong>Close:</strong> Timeline Clarity → Term Sheet Received → Final Call → Graceful Close</p>
        </div>
      </div>
    </div>
  )
}
