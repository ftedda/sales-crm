import React, { useState, useMemo, useEffect } from 'react'
import { PlusCircle, Trash2, PieChart, TrendingUp, Users, Calculator, ChevronDown, ChevronUp, Save, Check, AlertCircle } from 'lucide-react'

const EXIT_SCENARIOS = [
  { label: '$50M', value: 50 },
  { label: '$100M', value: 100 },
  { label: '$250M', value: 250 },
  { label: '$500M', value: 500 },
  { label: '$1B', value: 1000 },
]

export default function CapTable({
  data,
  addShareholder,
  updateShareholder,
  deleteShareholder,
  updateOptionPool,
  saveOptionPool
}) {
  const [showFounderForm, setShowFounderForm] = useState(false)
  const [showInvestorForm, setShowInvestorForm] = useState(false)
  const [founderForm, setFounderForm] = useState({ name: '', shares: '' })
  const [investorForm, setInvestorForm] = useState({ name: '', shares: '', round: '' })
  const [expandedScenario, setExpandedScenario] = useState(null)
  const [selectedTermSheets, setSelectedTermSheets] = useState([])

  // Local state for option pool with dirty tracking
  const [localOptionPool, setLocalOptionPool] = useState({ allocated: 0, unallocated: 0 })
  const [optionPoolDirty, setOptionPoolDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null, 'saving', 'saved', 'error'

  // Sync local option pool with data when data changes
  useEffect(() => {
    const pool = data.capTableOptions || { allocated: 0, unallocated: 0 }
    setLocalOptionPool({
      allocated: pool.allocated || 0,
      unallocated: pool.unallocated || 0
    })
    setOptionPoolDirty(false)
  }, [data.capTableOptions])

  // Derive founders and investors from capTableShareholders
  const founders = useMemo(() => {
    return (data.capTableShareholders || []).filter(s => s.category === 'founder')
  }, [data.capTableShareholders])

  const investors = useMemo(() => {
    return (data.capTableShareholders || []).filter(s => s.category === 'investor')
  }, [data.capTableShareholders])

  // Use local option pool for display
  const optionPool = localOptionPool

  // Calculate totals
  const calculations = useMemo(() => {
    const founderShares = founders.reduce((sum, f) => sum + Number(f.shares), 0)
    const investorShares = investors.reduce((sum, i) => sum + Number(i.shares), 0)
    const optionPoolTotal = Number(optionPool.allocated || 0) + Number(optionPool.unallocated || 0)
    const totalShares = founderShares + investorShares + optionPoolTotal

    return {
      founderShares,
      investorShares,
      optionPoolTotal,
      totalShares,
      founderOwnership: totalShares > 0 ? (founderShares / totalShares * 100).toFixed(2) : 0,
      investorOwnership: totalShares > 0 ? (investorShares / totalShares * 100).toFixed(2) : 0,
      optionPoolPct: totalShares > 0 ? (optionPoolTotal / totalShares * 100).toFixed(2) : 0,
    }
  }, [founders, investors, optionPool])

  // Calculate impact of each term sheet
  const termSheetScenarios = useMemo(() => {
    return (data.termSheets || []).map(ts => {
      const preMoney = Number(ts.preMoney || ts.pre_money) * 1000000
      const roundSize = Number(ts.totalRound || ts.total_round) * 1000000
      const postMoney = preMoney + roundSize

      // Calculate new shares issued
      const currentPricePerShare = calculations.totalShares > 0 ? preMoney / calculations.totalShares : 1
      const newSharesIssued = currentPricePerShare > 0 ? roundSize / currentPricePerShare : 0

      // Option pool shuffle (assume 10% post-money if not specified)
      const targetOptionPool = 0.10
      const postMoneyShares = calculations.totalShares + newSharesIssued
      const requiredOptionPool = postMoneyShares * targetOptionPool
      const additionalOptionsNeeded = Math.max(0, requiredOptionPool - calculations.optionPoolTotal)

      // Final shares after round
      const finalTotalShares = postMoneyShares + additionalOptionsNeeded

      // Ownership percentages post-round
      const founderOwnershipPost = finalTotalShares > 0 ? (calculations.founderShares / finalTotalShares * 100).toFixed(2) : 0
      const existingInvestorOwnershipPost = finalTotalShares > 0 ? (calculations.investorShares / finalTotalShares * 100).toFixed(2) : 0
      const newInvestorOwnership = finalTotalShares > 0 ? (newSharesIssued / finalTotalShares * 100).toFixed(2) : 0
      const optionPoolPost = finalTotalShares > 0 ? ((calculations.optionPoolTotal + additionalOptionsNeeded) / finalTotalShares * 100).toFixed(2) : 0

      // Dilution calculation
      const founderDilution = (calculations.founderOwnership - founderOwnershipPost).toFixed(2)

      return {
        ...ts,
        preMoney: ts.preMoney || ts.pre_money,
        postMoney: postMoney / 1000000,
        newSharesIssued,
        founderOwnershipPost,
        existingInvestorOwnershipPost,
        newInvestorOwnership,
        optionPoolPost,
        founderDilution,
        additionalOptionsNeeded,
        finalTotalShares,
      }
    })
  }, [data.termSheets, calculations])

  // Calculate exit scenarios for selected term sheets
  const exitAnalysis = useMemo(() => {
    if (selectedTermSheets.length === 0) return []

    return EXIT_SCENARIOS.map(exit => {
      const exitValue = exit.value * 1000000

      const scenarios = selectedTermSheets.map(tsId => {
        const scenario = termSheetScenarios.find(s => s.id === tsId)
        if (!scenario) return null

        const founderValue = (exitValue * scenario.founderOwnershipPost / 100) / 1000000
        const existingInvestorValue = (exitValue * scenario.existingInvestorOwnershipPost / 100) / 1000000
        const newInvestorValue = (exitValue * scenario.newInvestorOwnership / 100) / 1000000

        return {
          investor: scenario.investor,
          founderValue,
          existingInvestorValue,
          newInvestorValue,
          founderOwnership: scenario.founderOwnershipPost,
        }
      }).filter(Boolean)

      return { ...exit, scenarios }
    })
  }, [selectedTermSheets, termSheetScenarios])

  // Add founder
  const handleAddFounder = async () => {
    if (!founderForm.name || !founderForm.shares) return
    await addShareholder({
      name: founderForm.name,
      shares: Number(founderForm.shares),
      type: 'Common',
      category: 'founder'
    })
    setFounderForm({ name: '', shares: '' })
    setShowFounderForm(false)
  }

  // Add existing investor
  const handleAddInvestor = async () => {
    if (!investorForm.name || !investorForm.shares) return
    await addShareholder({
      name: investorForm.name,
      shares: Number(investorForm.shares),
      type: 'Preferred',
      category: 'investor',
      round: investorForm.round || 'Prior Round'
    })
    setInvestorForm({ name: '', shares: '', round: '' })
    setShowInvestorForm(false)
  }

  // Update option pool locally (mark dirty)
  const handleUpdateOptionPool = (field, value) => {
    const newPool = {
      ...localOptionPool,
      [field]: Number(value) || 0
    }
    setLocalOptionPool(newPool)
    setOptionPoolDirty(true)
    setSaveStatus(null)
    // Also update parent state for calculations
    updateOptionPool(newPool)
  }

  // Save option pool to Supabase
  const handleSaveOptionPool = async () => {
    setSaveStatus('saving')
    const result = await saveOptionPool(localOptionPool)
    if (result.success) {
      setSaveStatus('saved')
      setOptionPoolDirty(false)
      // Clear saved status after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000)
    } else {
      setSaveStatus('error')
    }
  }

  // Toggle term sheet selection for comparison
  const toggleTermSheetSelection = (id) => {
    setSelectedTermSheets(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // Simple bar visualization
  const OwnershipBar = ({ label, percentage, color, amount }) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{percentage}%{amount ? ` ($${amount.toFixed(1)}M)` : ''}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-1">
          <PieChart size={20} />
          <h2 className="font-bold text-lg">Cap Table Scenario Modeling</h2>
        </div>
        <p className="text-purple-100 text-sm">Compare term sheets on dilution, not just valuation</p>
      </div>

      {/* Current Cap Table Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
            <Users size={16} />
            <span>Current Cap Table</span>
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{calculations.founderOwnership}%</p>
              <p className="text-xs text-blue-600">Founders</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{calculations.investorOwnership}%</p>
              <p className="text-xs text-purple-600">Investors</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{calculations.optionPoolPct}%</p>
              <p className="text-xs text-amber-600">Option Pool</p>
            </div>
          </div>

          {/* Founders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-slate-700">Founders</h4>
              <button
                onClick={() => setShowFounderForm(true)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <PlusCircle size={12} /><span>Add</span>
              </button>
            </div>

            {showFounderForm && (
              <div className="bg-slate-50 rounded p-3 mb-2 space-y-2">
                <input
                  placeholder="Name"
                  value={founderForm.name}
                  onChange={e => setFounderForm({ ...founderForm, name: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
                <input
                  placeholder="Shares"
                  type="number"
                  value={founderForm.shares}
                  onChange={e => setFounderForm({ ...founderForm, shares: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
                <div className="flex space-x-2">
                  <button onClick={handleAddFounder} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">Add</button>
                  <button onClick={() => setShowFounderForm(false)} className="bg-slate-200 px-3 py-1 rounded text-xs">Cancel</button>
                </div>
              </div>
            )}

            {founders.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No founders added yet</p>
            ) : (
              <div className="space-y-1">
                {founders.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({f.type})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">{Number(f.shares).toLocaleString()} shares</span>
                      <span className="text-xs text-slate-500">
                        ({calculations.totalShares > 0 ? (f.shares / calculations.totalShares * 100).toFixed(1) : 0}%)
                      </span>
                      <button onClick={() => deleteShareholder(f.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing Investors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-slate-700">Existing Investors</h4>
              <button
                onClick={() => setShowInvestorForm(true)}
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center space-x-1"
              >
                <PlusCircle size={12} /><span>Add</span>
              </button>
            </div>

            {showInvestorForm && (
              <div className="bg-slate-50 rounded p-3 mb-2 space-y-2">
                <input
                  placeholder="Investor Name"
                  value={investorForm.name}
                  onChange={e => setInvestorForm({ ...investorForm, name: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Shares"
                    type="number"
                    value={investorForm.shares}
                    onChange={e => setInvestorForm({ ...investorForm, shares: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    placeholder="Round (e.g., Seed)"
                    value={investorForm.round}
                    onChange={e => setInvestorForm({ ...investorForm, round: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleAddInvestor} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">Add</button>
                  <button onClick={() => setShowInvestorForm(false)} className="bg-slate-200 px-3 py-1 rounded text-xs">Cancel</button>
                </div>
              </div>
            )}

            {investors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No investors added yet</p>
            ) : (
              <div className="space-y-1">
                {investors.map(i => (
                  <div key={i.id} className="flex items-center justify-between bg-purple-50 rounded px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{i.name}</span>
                      <span className="text-xs text-purple-500 ml-2">({i.round})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">{Number(i.shares).toLocaleString()} shares</span>
                      <span className="text-xs text-slate-500">
                        ({calculations.totalShares > 0 ? (i.shares / calculations.totalShares * 100).toFixed(1) : 0}%)
                      </span>
                      <button onClick={() => deleteShareholder(i.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Option Pool */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-slate-700">Option Pool (ESOP)</h4>
              <button
                onClick={handleSaveOptionPool}
                disabled={!optionPoolDirty || saveStatus === 'saving'}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  saveStatus === 'saved'
                    ? 'bg-green-100 text-green-700'
                    : saveStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : optionPoolDirty
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check size={12} />
                    <span>Saved</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle size={12} />
                    <span>Error</span>
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    <span>{optionPoolDirty ? 'Save Changes' : 'Saved'}</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded p-3">
                <label className="text-xs text-amber-700 block mb-1">Allocated</label>
                <input
                  type="number"
                  value={optionPool.allocated || 0}
                  onChange={e => handleUpdateOptionPool('allocated', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="bg-amber-50 rounded p-3">
                <label className="text-xs text-amber-700 block mb-1">Unallocated</label>
                <input
                  type="number"
                  value={optionPool.unallocated || 0}
                  onChange={e => handleUpdateOptionPool('unallocated', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">Total Shares Outstanding</p>
            <p className="text-xl font-bold text-slate-800">{calculations.totalShares.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Term Sheet Impact Modeling */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
            <Calculator size={16} />
            <span>Term Sheet Dilution Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Select term sheets to compare at different exit valuations</p>
        </div>

        <div className="p-4">
          {termSheetScenarios.length > 0 ? (
            <div className="space-y-3">
              {termSheetScenarios.map(scenario => (
                <div
                  key={scenario.id}
                  className={`rounded-lg border-2 transition-all ${
                    selectedTermSheets.includes(scenario.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleTermSheetSelection(scenario.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTermSheets.includes(scenario.id)}
                          onChange={() => toggleTermSheetSelection(scenario.id)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <div>
                          <h4 className="font-semibold text-slate-800">{scenario.investor}</h4>
                          <p className="text-xs text-slate-500">
                            ${scenario.preMoney}M pre → ${scenario.postMoney.toFixed(1)}M post
                          </p>
                        </div>
                      </div>
                      <button onClick={(e) => {
                        e.stopPropagation()
                        setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)
                      }}>
                        {expandedScenario === scenario.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white rounded p-2">
                        <p className="text-lg font-bold text-blue-600">{scenario.founderOwnershipPost}%</p>
                        <p className="text-xs text-slate-500">Founders</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-lg font-bold text-red-500">-{scenario.founderDilution}%</p>
                        <p className="text-xs text-slate-500">Dilution</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-lg font-bold text-green-600">{scenario.newInvestorOwnership}%</p>
                        <p className="text-xs text-slate-500">New Investor</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-lg font-bold text-amber-600">{scenario.optionPoolPost}%</p>
                        <p className="text-xs text-slate-500">Options</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedScenario === scenario.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <OwnershipBar
                          label="Founders (Post-Round)"
                          percentage={scenario.founderOwnershipPost}
                          color="bg-blue-500"
                        />
                        <OwnershipBar
                          label="Existing Investors"
                          percentage={scenario.existingInvestorOwnershipPost}
                          color="bg-purple-500"
                        />
                        <OwnershipBar
                          label={`New Investor (${scenario.investor})`}
                          percentage={scenario.newInvestorOwnership}
                          color="bg-green-500"
                        />
                        <OwnershipBar
                          label="Option Pool"
                          percentage={scenario.optionPoolPost}
                          color="bg-amber-500"
                        />

                        <div className="bg-slate-100 rounded p-3 text-xs text-slate-600">
                          <p><strong>New shares issued:</strong> {Math.round(scenario.newSharesIssued).toLocaleString()}</p>
                          {scenario.additionalOptionsNeeded > 0 && (
                            <p className="text-amber-700">
                              <strong>Option pool expansion:</strong> +{Math.round(scenario.additionalOptionsNeeded).toLocaleString()} shares (pre-money)
                            </p>
                          )}
                          <p><strong>Total shares post-round:</strong> {Math.round(scenario.finalTotalShares).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calculator size={40} className="mx-auto text-slate-200 mb-3" />
              <h3 className="font-medium text-slate-600">No Term Sheets to Analyze</h3>
              <p className="text-slate-400 text-sm">Add term sheets in the Term Sheets tab to model their impact</p>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison at Exit */}
      {selectedTermSheets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
              <TrendingUp size={16} />
              <span>Founder Value at Exit</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Compare how much founders receive at different exit valuations
            </p>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-slate-600 font-medium">Exit Value</th>
                  {selectedTermSheets.map(tsId => {
                    const ts = termSheetScenarios.find(s => s.id === tsId)
                    return (
                      <th key={tsId} className="text-center py-2 px-2 text-slate-600 font-medium">
                        {ts?.investor}
                        <span className="block text-xs font-normal text-slate-400">
                          ${ts?.preMoney}M pre
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {exitAnalysis.map((exit, idx) => (
                  <tr key={exit.label} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="py-3 px-2 font-medium text-slate-800">{exit.label}</td>
                    {exit.scenarios.map((scenario, i) => (
                      <td key={i} className="py-3 px-2 text-center">
                        <div className="font-bold text-green-600">${scenario.founderValue.toFixed(1)}M</div>
                        <div className="text-xs text-slate-500">{scenario.founderOwnership}% ownership</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual Comparison */}
          <div className="p-4 border-t bg-slate-50">
            <h4 className="font-medium text-sm text-slate-700 mb-3">Visual Comparison: $100M Exit</h4>
            <div className="space-y-2">
              {exitAnalysis.find(e => e.value === 100)?.scenarios.map((scenario, idx) => {
                const maxValue = Math.max(
                  ...exitAnalysis.find(e => e.value === 100)?.scenarios.map(s => s.founderValue) || [1]
                )
                const barWidth = (scenario.founderValue / maxValue) * 100
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500']

                return (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-24 text-sm text-slate-600 truncate">{scenario.investor}</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} flex items-center justify-end pr-2 text-white text-xs font-medium`}
                        style={{ width: `${barWidth}%` }}
                      >
                        ${scenario.founderValue.toFixed(1)}M
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Educational Info */}
      <div className="bg-slate-100 rounded-lg p-4">
        <h3 className="font-medium text-slate-700 text-sm mb-2">Understanding Dilution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="bg-white rounded p-3">
            <strong className="text-slate-800">Option Pool Shuffle</strong>
            <p className="mt-1">Investors often require expanding the option pool pre-money, which dilutes founders more than the headline dilution suggests.</p>
          </div>
          <div className="bg-white rounded p-3">
            <strong className="text-slate-800">Pre vs Post Money</strong>
            <p className="mt-1">A $20M on $80M pre is the same ownership as $20M on $100M post (20%), but feels different when negotiating.</p>
          </div>
          <div className="bg-white rounded p-3">
            <strong className="text-slate-800">Focus on Exit Value</strong>
            <p className="mt-1">A lower valuation with better terms might yield more founder value at exit than a higher valuation with aggressive terms.</p>
          </div>
          <div className="bg-white rounded p-3">
            <strong className="text-slate-800">Stacking Rounds</strong>
            <p className="mt-1">Each round compounds dilution. Model your ownership through Series C/D to see the long-term impact of today's terms.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
