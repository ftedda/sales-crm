import React, { useState, useMemo } from 'react'
import { PlusCircle, DollarSign, Pencil, Trash2, X, ChevronUp, ChevronDown, Search, Filter, Loader2, Check, AlertCircle } from 'lucide-react'

const emptyForm = { investor: '', dateReceived: '', leadAmount: '', totalRound: '', preMoney: '', boardSeats: '', terms: '', expiration: '' }

export default function TermSheets({ data, addTermSheet, updateTermSheet, deleteTermSheet }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [sortField, setSortField] = useState('dateReceived')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterExpiring, setFilterExpiring] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null, 'saving', 'saved', 'error'

  const handleSubmit = async () => {
    if (!form.investor) return
    setSaveStatus('saving')
    try {
      if (editingId) {
        await updateTermSheet(editingId, form)
        setEditingId(null)
      } else {
        await addTermSheet(form)
      }
      setSaveStatus('saved')
      setForm(emptyForm)
      setShowForm(false)
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (e) {
      console.error('Error saving term sheet:', e)
      setSaveStatus('error')
    }
  }

  const handleEdit = (ts) => {
    setForm({
      investor: ts.investor || '',
      dateReceived: ts.dateReceived || '',
      leadAmount: ts.leadAmount || '',
      totalRound: ts.totalRound || '',
      preMoney: ts.preMoney || '',
      boardSeats: ts.boardSeats || '',
      terms: ts.terms || '',
      expiration: ts.expiration || ''
    })
    setEditingId(ts.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this term sheet?')) {
      await deleteTermSheet(id)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const isExpiringSoon = (expiration) => {
    if (!expiration) return false
    const expDate = new Date(expiration)
    const today = new Date()
    const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  }

  const isExpired = (expiration) => {
    if (!expiration) return false
    return new Date(expiration) < new Date()
  }

  const sortedAndFilteredTermSheets = useMemo(() => {
    let filtered = [...data.termSheets]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ts =>
        ts.investor?.toLowerCase().includes(query) ||
        ts.terms?.toLowerCase().includes(query)
      )
    }

    // Apply expiring filter
    if (filterExpiring) {
      filtered = filtered.filter(ts => isExpiringSoon(ts.expiration) || isExpired(ts.expiration))
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle numeric fields
      if (['leadAmount', 'totalRound', 'preMoney'].includes(sortField)) {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }

      // Handle date fields
      if (['dateReceived', 'expiration'].includes(sortField)) {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [data.termSheets, searchQuery, filterExpiring, sortField, sortDirection])

  const SortHeader = ({ field, label }) => (
    <th
      className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </div>
    </th>
  )

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {saveStatus === 'saved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2 text-green-700">
          <Check size={16} />
          <span className="text-sm">Term sheet saved successfully to cloud</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">Error saving term sheet. Check console for details.</span>
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}
          className="flex items-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          <PlusCircle size={16} /><span>Add Term Sheet</span>
        </button>
      </div>

      {/* Search and Filters */}
      {data.termSheets.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by investor or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <button
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
              filterExpiring
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            <span>Expiring Soon</span>
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? 'Edit Term Sheet' : 'Add Term Sheet'}
              </h3>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <select
                value={form.investor}
                onChange={e => setForm({ ...form, investor: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Select Investor</option>
                {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date Received</label>
                  <input
                    type="date"
                    value={form.dateReceived}
                    onChange={e => setForm({ ...form, dateReceived: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Expiration</label>
                  <input
                    type="date"
                    value={form.expiration}
                    onChange={e => setForm({ ...form, expiration: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Lead ($M)</label>
                  <input
                    type="text"
                    placeholder="e.g., 15"
                    value={form.leadAmount}
                    onChange={e => setForm({ ...form, leadAmount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Round ($M)</label>
                  <input
                    type="text"
                    placeholder="e.g., 25"
                    value={form.totalRound}
                    onChange={e => setForm({ ...form, totalRound: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pre-$ ($M)</label>
                  <input
                    type="text"
                    placeholder="e.g., 100"
                    value={form.preMoney}
                    onChange={e => setForm({ ...form, preMoney: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Board Seats</label>
                <input
                  type="text"
                  placeholder="e.g., 1 investor seat"
                  value={form.boardSeats}
                  onChange={e => setForm({ ...form, boardSeats: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Key Terms & Notes</label>
                <textarea
                  placeholder="Important terms, conditions, notes..."
                  value={form.terms}
                  onChange={e => setForm({ ...form, terms: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleCancel}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveStatus === 'saving'}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Save Changes' : 'Add Term Sheet'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Sheets Table */}
      {data.termSheets.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <SortHeader field="investor" label="Investor" />
                  <SortHeader field="dateReceived" label="Received" />
                  <SortHeader field="leadAmount" label="Lead ($M)" />
                  <SortHeader field="totalRound" label="Round ($M)" />
                  <SortHeader field="preMoney" label="Pre-$ ($M)" />
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Board
                  </th>
                  <SortHeader field="expiration" label="Expires" />
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sortedAndFilteredTermSheets.map(ts => (
                  <tr key={ts.id} className="hover:bg-slate-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{ts.investor}</div>
                      {ts.terms && (
                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={ts.terms}>
                          {ts.terms}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                      {ts.dateReceived || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                      {ts.leadAmount ? `$${ts.leadAmount}M` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                      {ts.totalRound ? `$${ts.totalRound}M` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                      {ts.preMoney ? `$${ts.preMoney}M` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                      {ts.boardSeats || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {ts.expiration ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          isExpired(ts.expiration)
                            ? 'bg-slate-100 text-slate-500'
                            : isExpiringSoon(ts.expiration)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {ts.expiration}
                          {isExpired(ts.expiration) && ' (Expired)'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(ts)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ts.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedAndFilteredTermSheets.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No term sheets match your search criteria
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center border">
          <DollarSign size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="font-medium text-slate-600">No Term Sheets Yet</h3>
          <p className="text-slate-400 text-sm">They'll appear here when received</p>
        </div>
      )}

      {/* Comparison Checklist */}
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
