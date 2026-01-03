import React from 'react'

const tierColors = { '1': 'border-l-green-500', '2': 'border-l-yellow-500', '3': 'border-l-red-500' }
const statusOptions = ['Not Started', 'In Progress', 'In Review', 'Complete']
const statusColors = { 'Not Started': 'bg-slate-100', 'In Progress': 'bg-blue-100', 'In Review': 'bg-yellow-100', 'Complete': 'bg-green-100' }

export default function Materials({ data, updateMaterial }) {
  const completedCount = data.materials.filter(m => m.status === 'Complete').length

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progress</span>
          <span className="text-sm font-bold text-slate-800">{completedCount}/{data.materials.length}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="bg-green-500 h-full transition-all" style={{ width: `${(completedCount / data.materials.length) * 100}%` }} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex space-x-3 text-xs">
        <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded mr-1"></span>Tier 1</span>
        <span className="flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded mr-1"></span>Tier 2</span>
        <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded mr-1"></span>Tier 3</span>
      </div>

      {/* Materials list */}
      <div className="space-y-2">
        {data.materials.map(m => (
          <div key={m.id} className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${tierColors[m.tier]}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                <h3 className="font-medium text-slate-800 text-sm">{m.name}</h3>
              </div>
              <select 
                value={m.status} 
                onChange={e => updateMaterial(m.id, { status: e.target.value })} 
                className={`${statusColors[m.status]} px-2 py-1 rounded text-xs font-medium border-0`}
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input 
              placeholder="Owner" 
              value={m.owner || ''} 
              onChange={e => updateMaterial(m.id, { owner: e.target.value })} 
              className="mt-2 border rounded px-2 py-1 text-xs w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
