import React, { useState } from 'react'
import { PlusCircle, DollarSign } from 'lucide-react'

export default function TermSheets({ data, addTermSheet, deleteTermSheet }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', dateReceived: '', leadAmount: '', totalRound: '', preMoney: '', boardSeats: '', terms: '', expiration: '' })

  const handleSubmit = async () => {
    if (!form.investor) return
    await addTermSheet(form)
    setForm({ investor: '', dateReceived: '', leadAmount: '', totalRound: '', preMoney: '', boardSeats: '', terms: '', expiration: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    await deleteTermSheet(id)
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Add Term Sheet</span>
      </button>

      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="space-y-2">
            <select value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select Investor</option>
              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" placeholder="Date Received" value={form.dateReceived} onChange={e => setForm({ ...form, dateReceived: e.target.value })} className="border rounded px-3 py-2 text-sm" />
              <input type="date" placeholder="Expiration" value={form.expiration} onChange={e => setForm({ ...form, expiration: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Lead ($M)" value={form.leadAmount} onChange={e => setForm({ ...form, leadAmount: e.target.value })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Round ($M)" value={form.totalRound} onChange={e => setForm({ ...form, totalRound: e.target.value })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Pre-$ ($M)" value={form.preMoney} onChange={e => setForm({ ...form, preMoney: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            </div>
            <input placeholder="Board Seats" value={form.boardSeats} onChange={e => setForm({ ...form, boardSeats: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Key Terms & Notes" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {data.termSheets.length > 0 ? (
        <div className="space-y-3">
          {data.termSheets.map(ts => (
            <div key={ts.id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-green-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{ts.investor}</h3>
                  <p className="text-xs text-slate-500">Received: {ts.dateReceived}</p>
                </div>
                {ts.expiration && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Exp: {ts.expiration}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Lead Amount</p>
                  <p className="font-semibold">${ts.leadAmount}M</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Total Round</p>
                  <p className="font-semibold">${ts.totalRound}M</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Pre-Money</p>
                  <p className="font-semibold">${ts.preMoney}M</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Board Seats</p>
                  <p className="font-semibold">{ts.boardSeats}</p>
                </div>
              </div>
              {ts.terms && <p className="mt-3 text-sm text-slate-600"><strong>Terms:</strong> {ts.terms}</p>}
              <button onClick={() => handleDelete(ts.id)} className="text-red-400 text-xs mt-3 hover:text-red-600">Delete</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center border">
          <DollarSign size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="font-medium text-slate-600">No Term Sheets Yet</h3>
          <p className="text-slate-400 text-sm">They'll appear here when received</p>
        </div>
      )}

      <div className="bg-slate-100 rounded-lg p-3">
        <h3 className="font-medium text-slate-700 text-sm mb-2">Comparison Checklist</h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
          <span>• Valuation</span>
          <span>• Dilution %</span>
          <span>• Board composition</span>
          <span>• Protective provisions</span>
          <span>• Anti-dilution</span>
          <span>• Participation rights</span>
          <span>• Founder vesting</span>
          <span>• Option pool</span>
          <span>• Partner value-add</span>
          <span>• Speed to close</span>
        </div>
      </div>
    </div>
  )
}
