import React, { useState, useMemo } from 'react'
import { PlusCircle, FolderLock, Pencil, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react'

const NDA_OPTIONS = ['Yes', 'No', 'Pending']
const NDA_COLORS = {
  'Yes': 'bg-green-100 text-green-800',
  'No': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  '': 'bg-slate-100 text-slate-500'
}

const ACCESS_LEVELS = ['None', 'Stage 1', 'Stage 2', 'Stage 3', 'Full']
const ACCESS_COLORS = {
  'None': 'bg-slate-100 text-slate-600',
  'Stage 1': 'bg-blue-100 text-blue-700',
  'Stage 2': 'bg-purple-100 text-purple-700',
  'Stage 3': 'bg-orange-100 text-orange-700',
  'Full': 'bg-green-100 text-green-700',
  '': 'bg-slate-100 text-slate-500'
}

const ACCESS_RANK = { '': 0, 'None': 0, 'Stage 1': 1, 'Stage 2': 2, 'Stage 3': 3, 'Full': 4 }

const emptyForm = {
  fund: '',
  main_contact: '',
  other_contacts: '',
  nda_status: '',
  target_access: '',
  current_access: '',
  email_addresses: '',
  notes: ''
}

export default function DataRoomAccess({ data, addDataRoomEntry, updateDataRoomEntry, deleteDataRoomEntry }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [ndaFilter, setNdaFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState('all')
  const [sortField, setSortField] = useState('fund')
  const [sortDirection, setSortDirection] = useState('asc')

  const entries = data.dataRoomEntries || []

  const handleFundChange = (firmName) => {
    const investor = data.investors.find(i => i.firm === firmName)
    setForm(prev => ({
      ...prev,
      fund: firmName,
      main_contact: investor?.contact || prev.main_contact,
      email_addresses: investor?.email || prev.email_addresses
    }))
  }

  const handleSubmit = async () => {
    if (!form.fund) return
    if (editingId) {
      await updateDataRoomEntry(editingId, form)
    } else {
      await addDataRoomEntry(form)
    }
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (entry) => {
    setForm({
      fund: entry.fund || '',
      main_contact: entry.main_contact || '',
      other_contacts: entry.other_contacts || '',
      nda_status: entry.nda_status || '',
      target_access: entry.target_access || '',
      current_access: entry.current_access || '',
      email_addresses: entry.email_addresses || '',
      notes: entry.notes || ''
    })
    setEditingId(entry.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this data room entry?')) {
      await deleteDataRoomEntry(id)
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filtered = useMemo(() => {
    let result = entries

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        (e.fund || '').toLowerCase().includes(q) ||
        (e.main_contact || '').toLowerCase().includes(q) ||
        (e.other_contacts || '').toLowerCase().includes(q) ||
        (e.email_addresses || '').toLowerCase().includes(q)
      )
    }

    if (ndaFilter !== 'all') {
      result = result.filter(e => e.nda_status === ndaFilter)
    }

    if (accessFilter !== 'all') {
      result = result.filter(e => e.current_access === accessFilter)
    }

    result = [...result].sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (sortField === 'target_access' || sortField === 'current_access') {
        aVal = ACCESS_RANK[aVal] || 0
        bVal = ACCESS_RANK[bVal] || 0
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return result
  }, [entries, search, ndaFilter, accessFilter, sortField, sortDirection])

  // Stats
  const totalEntries = entries.length
  const ndasSigned = entries.filter(e => e.nda_status === 'Yes').length
  const activeAccess = entries.filter(e => e.current_access && e.current_access !== 'None').length
  const pendingUpgrades = entries.filter(e =>
    e.target_access && e.target_access !== 'None' &&
    (ACCESS_RANK[e.target_access] || 0) > (ACCESS_RANK[e.current_access] || 0)
  ).length

  const SortHeader = ({ field, label }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ArrowUpDown size={10} className="text-slate-300" />
        )}
      </span>
    </th>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <h2 className="font-semibold text-indigo-800 flex items-center gap-2">
          <FolderLock size={18} />
          Data Room Access
        </h2>
        <p className="text-sm text-indigo-700 mt-1">
          Track investor data room access levels and NDA status. Stages map to material tiers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-2xl font-bold text-slate-800">{totalEntries}</div>
          <div className="text-xs text-slate-500">Total Entries</div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-2xl font-bold text-green-700">{ndasSigned}</div>
          <div className="text-xs text-slate-500">NDAs Signed</div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-2xl font-bold text-purple-700">{activeAccess}</div>
          <div className="text-xs text-slate-500">Active Access</div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-2xl font-bold text-orange-700">{pendingUpgrades}</div>
          <div className="text-xs text-slate-500">Pending Upgrades</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search funds, contacts, emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <select
          value={ndaFilter}
          onChange={e => setNdaFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All NDA</option>
          {NDA_OPTIONS.map(s => <option key={s} value={s}>NDA: {s}</option>)}
          <option value="">NDA: Not set</option>
        </select>
        <select
          value={accessFilter}
          onChange={e => setAccessFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Access</option>
          {ACCESS_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="">Not set</option>
        </select>
      </div>

      {/* Add Button */}
      <button
        onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
        className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
      >
        <PlusCircle size={16} /><span>Add Data Room Entry</span>
      </button>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-medium text-slate-800 mb-3">
              {editingId ? 'Edit Data Room Entry' : 'New Data Room Entry'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Fund / Firm *</label>
                <select
                  value={form.fund}
                  onChange={e => handleFundChange(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select investor...</option>
                  {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Main Contact</label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={form.main_contact}
                    onChange={e => setForm({ ...form, main_contact: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Other Contacts</label>
                  <input
                    type="text"
                    placeholder="Additional contacts"
                    value={form.other_contacts}
                    onChange={e => setForm({ ...form, other_contacts: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">NDA Status</label>
                  <select
                    value={form.nda_status}
                    onChange={e => setForm({ ...form, nda_status: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {NDA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Target Access</label>
                  <select
                    value={form.target_access}
                    onChange={e => setForm({ ...form, target_access: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {ACCESS_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Current Access</label>
                  <select
                    value={form.current_access}
                    onChange={e => setForm({ ...form, current_access: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {ACCESS_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Email Addresses</label>
                <input
                  type="text"
                  placeholder="email1@fund.com; email2@fund.com"
                  value={form.email_addresses}
                  onChange={e => setForm({ ...form, email_addresses: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">
                {editingId ? 'Update' : 'Save'}
              </button>
              <button onClick={handleCancel} className="bg-slate-100 px-4 py-2 rounded text-sm hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <SortHeader field="fund" label="Fund" />
              <SortHeader field="main_contact" label="Main Contact" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 hidden sm:table-cell">Other Contacts</th>
              <SortHeader field="nda_status" label="NDA" />
              <SortHeader field="target_access" label="Target" />
              <SortHeader field="current_access" label="Current" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 hidden md:table-cell">Emails</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-3 py-8 text-center text-slate-400 text-sm">
                  {entries.length === 0 ? 'No data room entries yet. Add your first entry above.' : 'No entries match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map(entry => {
                const hasGap = entry.target_access && entry.target_access !== 'None' &&
                  (ACCESS_RANK[entry.target_access] || 0) > (ACCESS_RANK[entry.current_access] || 0)
                return (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{entry.fund}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.main_contact}</td>
                    <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{entry.other_contacts}</td>
                    <td className="px-3 py-2">
                      <select
                        value={entry.nda_status || ''}
                        onChange={e => updateDataRoomEntry(entry.id, { nda_status: e.target.value })}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer font-medium ${NDA_COLORS[entry.nda_status || '']}`}
                      >
                        <option value="">-</option>
                        {NDA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={entry.target_access || ''}
                        onChange={e => updateDataRoomEntry(entry.id, { target_access: e.target.value })}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer font-medium ${ACCESS_COLORS[entry.target_access || '']}`}
                      >
                        <option value="">-</option>
                        {ACCESS_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={entry.current_access || ''}
                          onChange={e => updateDataRoomEntry(entry.id, { current_access: e.target.value })}
                          className={`text-xs px-2 py-1 rounded border-0 cursor-pointer font-medium ${ACCESS_COLORS[entry.current_access || '']}`}
                        >
                          <option value="">-</option>
                          {ACCESS_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {hasGap && (
                          <span className="text-orange-500" title="Access upgrade needed">
                            <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 hidden md:table-cell max-w-[200px] truncate" title={entry.email_addresses}>
                      {entry.email_addresses}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Entry count */}
      {entries.length > 0 && (
        <div className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {entries.length} entries
        </div>
      )}
    </div>
  )
}
