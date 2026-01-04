import React, { useMemo, useState } from 'react'
import { ChevronDown, Save, Plus, Trash2, X } from 'lucide-react'

const TIER_COLORS = { '1': 'bg-green-100 text-green-700', '2': 'bg-yellow-100 text-yellow-700', '3': 'bg-red-100 text-red-700' }
const TIER_LABELS = { '1': 'Tier 1', '2': 'Tier 2', '3': 'Tier 3' }
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'In Review', 'Complete']
const STATUS_COLORS = {
  'Not Started': 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'In Review': 'bg-yellow-100 text-yellow-700',
  'Complete': 'bg-green-100 text-green-700'
}

const defaultNewMaterial = {
  name: '',
  tier: '1',
  status: 'Not Started',
  owner: '',
  location: '',
  notes: ''
}

export default function Materials({ data, addMaterial, updateMaterial, deleteMaterial }) {
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState(defaultNewMaterial)

  const stats = useMemo(() => {
    const total = data.materials.length
    const complete = data.materials.filter(m => m.status === 'Complete').length
    const inProgress = data.materials.filter(m => m.status === 'In Progress' || m.status === 'In Review').length
    return { total, complete, inProgress, notStarted: total - complete - inProgress }
  }, [data.materials])

  const filtered = useMemo(() => {
    let result = data.materials
    if (filterTier !== 'all') {
      result = result.filter(m => m.tier === filterTier)
    }
    if (filterStatus !== 'all') {
      result = result.filter(m => m.status === filterStatus)
    }
    return result
  }, [data.materials, filterTier, filterStatus])

  const progressPct = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0

  const handleExpand = (material) => {
    if (expandedRow === material.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(material.id)
      setEditData({ ...material })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      await updateMaterial(expandedRow, editData)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const handleAddMaterial = async () => {
    if (newMaterial.name.trim()) {
      await addMaterial(newMaterial)
      setNewMaterial(defaultNewMaterial)
      setShowAddForm(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this material?')) {
      await deleteMaterial(id)
      if (expandedRow === id) {
        setExpandedRow(null)
        setEditData({})
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold text-slate-800">{stats.complete}/{stats.total} complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="bg-green-500 h-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-slate-500">{stats.notStarted}</div>
          <div className="text-xs text-slate-500">Not Started</div>
        </div>
      </div>

      {/* Filters and Add Button */}
      <div className="flex gap-2">
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white flex-1"
        >
          <option value="all">All Tiers</option>
          <option value="1">Tier 1 - Essential</option>
          <option value="2">Tier 2 - Important</option>
          <option value="3">Tier 3 - Deep Dive</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white flex-1"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
        >
          <Plus size={16} className="mr-1" /> Add
        </button>
      </div>

      {/* Add Material Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-800">Add New Material</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="col-span-2 md:col-span-1">
              <label className="text-slate-500 block mb-1">Material Name *</label>
              <input
                value={newMaterial.name}
                onChange={e => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-2 py-1.5"
                placeholder="e.g., Pitch Deck"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Tier</label>
              <select
                value={newMaterial.tier}
                onChange={e => setNewMaterial(prev => ({ ...prev, tier: e.target.value }))}
                className="w-full border rounded px-2 py-1.5"
              >
                <option value="1">Tier 1 - Essential</option>
                <option value="2">Tier 2 - Important</option>
                <option value="3">Tier 3 - Deep Dive</option>
              </select>
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Status</label>
              <select
                value={newMaterial.status}
                onChange={e => setNewMaterial(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border rounded px-2 py-1.5"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Owner</label>
              <input
                value={newMaterial.owner}
                onChange={e => setNewMaterial(prev => ({ ...prev, owner: e.target.value }))}
                className="w-full border rounded px-2 py-1.5"
                placeholder="Responsible person"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-500 block mb-1">Location / Link</label>
              <input
                value={newMaterial.location}
                onChange={e => setNewMaterial(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border rounded px-2 py-1.5"
                placeholder="Google Drive link, Notion page, etc."
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-slate-500 block mb-1 text-sm">Notes</label>
            <textarea
              value={newMaterial.notes}
              onChange={e => setNewMaterial(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-2 py-1.5 text-sm"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setShowAddForm(false); setNewMaterial(defaultNewMaterial) }}
              className="px-3 py-1.5 text-sm bg-slate-100 rounded hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMaterial}
              disabled={!newMaterial.name.trim()}
              className="flex items-center px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} className="mr-1" /> Add Material
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Material</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-20">Tier</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Status</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden sm:table-cell">Owner</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(m => (
                <React.Fragment key={m.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleExpand(m)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{m.name}</div>
                      {m.location && <div className="text-xs text-slate-400 truncate max-w-48">{m.location}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[m.tier]}`}>
                        {TIER_LABELS[m.tier]}
                      </span>
                    </td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <select
                        value={m.status}
                        onChange={e => updateMaterial(m.id, { status: e.target.value })}
                        className={`${STATUS_COLORS[m.status]} px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer w-full`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="Owner"
                        value={m.owner || ''}
                        onChange={e => updateMaterial(m.id, { owner: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === m.id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expandedRow === m.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-3 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-slate-500 block mb-1">Material Name</label>
                            <input
                              value={editData.name || ''}
                              onChange={e => handleEditChange('name', e.target.value)}
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
                              <option value="1">Tier 1 - Essential</option>
                              <option value="2">Tier 2 - Important</option>
                              <option value="3">Tier 3 - Deep Dive</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Status</label>
                            <select
                              value={editData.status || ''}
                              onChange={e => handleEditChange('status', e.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Owner</label>
                            <input
                              value={editData.owner || ''}
                              onChange={e => handleEditChange('owner', e.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                              placeholder="Responsible person"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-slate-500 block mb-1">Location / Link</label>
                            <input
                              value={editData.location || ''}
                              onChange={e => handleEditChange('location', e.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                              placeholder="Google Drive link, Notion page, etc."
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
                            placeholder="Additional notes about this material..."
                          />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={(e) => handleDelete(m.id, e)}
                            className="flex items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
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
          <p className="text-center py-8 text-slate-400 text-sm">No materials match filters</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded mr-1.5"></span>Tier 1 - Essential (send first)</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded mr-1.5"></span>Tier 2 - Important (after interest)</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-1.5"></span>Tier 3 - Deep Dive (diligence)</span>
      </div>
    </div>
  )
}
