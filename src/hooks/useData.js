import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Term Sheets field mapping (component uses camelCase, Supabase uses snake_case)
const termSheetFieldsToSnake = {
  dateReceived: 'date_received',
  leadAmount: 'lead_amount',
  totalRound: 'total_round',
  preMoney: 'pre_money',
  boardSeats: 'board_seats',
  proRata: 'pro_rata'
}

const termSheetFieldsToCamel = {
  date_received: 'dateReceived',
  lead_amount: 'leadAmount',
  total_round: 'totalRound',
  pre_money: 'preMoney',
  board_seats: 'boardSeats',
  pro_rata: 'proRata'
}

// Convert term sheet object from camelCase to snake_case for Supabase
const termSheetToDB = (obj) => {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = termSheetFieldsToSnake[key] || key
    result[newKey] = value
  }
  return result
}

// Convert term sheet object from snake_case to camelCase for UI
const termSheetFromDB = (obj) => {
  if (!obj) return obj
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = termSheetFieldsToCamel[key] || key
    result[newKey] = value
  }
  return result
}

const defaultMaterials = [
  { name: 'Executive Summary (2 pages)', tier: '1', status: 'Not Started', owner: '', sort_order: 1 },
  { name: 'High-Level Metrics Snapshot', tier: '1', status: 'Not Started', owner: '', sort_order: 2 },
  { name: 'Team Overview', tier: '1', status: 'Not Started', owner: '', sort_order: 3 },
  { name: 'Full Pitch Deck', tier: '2', status: 'Not Started', owner: '', sort_order: 4 },
  { name: 'Detailed Financial Model', tier: '2', status: 'Not Started', owner: '', sort_order: 5 },
  { name: 'Customer Case Studies', tier: '2', status: 'Not Started', owner: '', sort_order: 6 },
  { name: 'Product Roadmap', tier: '2', status: 'Not Started', owner: '', sort_order: 7 },
  { name: 'Cap Table & Ownership', tier: '3', status: 'Not Started', owner: '', sort_order: 8 },
  { name: 'Cohort Analysis & Unit Economics', tier: '3', status: 'Not Started', owner: '', sort_order: 9 },
  { name: 'Sample Customer Contracts', tier: '3', status: 'Not Started', owner: '', sort_order: 10 },
  { name: 'Reference Customer List', tier: '3', status: 'Not Started', owner: '', sort_order: 11 },
  { name: 'Legal Structure & Agreements', tier: '3', status: 'Not Started', owner: '', sort_order: 12 },
]

const defaultData = {
  investors: [],
  emails: [],
  meetings: [],
  materials: [],
  termSheets: [],
  weeklyActions: [],
  references: [],
  investorActivities: [],
  capTableShareholders: [],
  capTableOptions: { allocated: 0, unallocated: 0 }
}

// Local storage fallback
const localStorageKey = 'series-b-data'

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(localStorageKey)
    return stored ? JSON.parse(stored) : defaultData
  } catch {
    return defaultData
  }
}

const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function useData(userId, orgId) {
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      if (supabase && orgId) {
        try {
          // Load from Supabase by org
          const [
            investors, emails, meetings, materials, termSheets, weeklyActions,
            references, investorActivities, capTableShareholders, capTableOptions
          ] = await Promise.all([
            supabase.from('investors').select('*').eq('org_id', orgId),
            supabase.from('emails').select('*').eq('org_id', orgId),
            supabase.from('meetings').select('*').eq('org_id', orgId),
            supabase.from('materials').select('*').eq('org_id', orgId).order('sort_order', { ascending: true }),
            supabase.from('term_sheets').select('*').eq('org_id', orgId),
            supabase.from('weekly_actions').select('*').eq('org_id', orgId),
            supabase.from('references').select('*').eq('org_id', orgId),
            supabase.from('investor_activities').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
            supabase.from('cap_table_shareholders').select('*').eq('org_id', orgId),
            supabase.from('cap_table_options').select('*').eq('org_id', orgId).single(),
          ])

          // Seed materials if empty (new org)
          let materialsData = materials.data || []
          if (materialsData.length === 0) {
            const materialsToSeed = defaultMaterials.map(m => ({ ...m, user_id: userId, org_id: orgId }))
            const { data: seeded } = await supabase
              .from('materials')
              .insert(materialsToSeed)
              .select()
            materialsData = seeded || []
          }

          setData({
            investors: investors.data || [],
            emails: emails.data || [],
            meetings: meetings.data || [],
            materials: materialsData,
            termSheets: (termSheets.data || []).map(termSheetFromDB),
            weeklyActions: weeklyActions.data || [],
            references: references.data || [],
            investorActivities: investorActivities.data || [],
            capTableShareholders: capTableShareholders.data || [],
            capTableOptions: capTableOptions.data || { allocated: 0, unallocated: 0 }
          })
        } catch (e) {
          console.error('Supabase load error:', e)
          setError(e.message)
          setData(loadFromLocalStorage())
        }
      } else {
        // Fallback to localStorage
        setData(loadFromLocalStorage())
      }

      setLoading(false)
    }

    loadData()
  }, [orgId, userId])

  // Save data function
  const saveData = useCallback(async (newData) => {
    setData(newData)
    // Always save to localStorage as backup
    saveToLocalStorage(newData)
  }, [])

  // Internal function to add activity without triggering state update loop
  const addActivityInternal = useCallback(async (activity, currentData) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('investor_activities')
        .insert({ ...newActivity, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      if (inserted) newActivity.id = inserted.id
    }

    return {
      newActivity,
      investorActivities: [newActivity, ...currentData.investorActivities]
    }
  }, [userId, orgId])

  // CRUD operations for each entity
  const addInvestor = useCallback(async (investor) => {
    const newInvestor = { ...investor, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('investors')
        .insert({ ...newInvestor, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newInvestor.id = inserted.id
    }

    // Log the created activity
    const activityResult = await addActivityInternal({
      investor_id: newInvestor.id,
      investor_firm: newInvestor.firm,
      activity_type: 'created',
      description: `Added ${newInvestor.firm} to pipeline`
    }, data)

    const newData = {
      ...data,
      investors: [...data.investors, newInvestor],
      investorActivities: activityResult.investorActivities
    }
    saveData(newData)
    return newInvestor
  }, [data, saveData, userId, orgId, addActivityInternal])

  const updateInvestor = useCallback(async (id, updates) => {
    const existingInvestor = data.investors.find(i => i.id === id)

    if (supabase && orgId) {
      const { error } = await supabase.from('investors').update(updates).eq('id', id)
      if (error) throw error
    }

    let investorActivities = data.investorActivities

    // Log stage change as an activity
    if (updates.stage && existingInvestor && updates.stage !== existingInvestor.stage) {
      const activityResult = await addActivityInternal({
        investor_id: id,
        investor_firm: existingInvestor.firm,
        activity_type: 'stage_change',
        description: `Stage changed from ${existingInvestor.stage} to ${updates.stage}`,
        old_value: existingInvestor.stage,
        new_value: updates.stage
      }, { investorActivities })
      investorActivities = activityResult.investorActivities
    }

    const newData = {
      ...data,
      investors: data.investors.map(i => i.id === id ? { ...i, ...updates } : i),
      investorActivities
    }
    saveData(newData)
  }, [data, saveData, orgId, addActivityInternal])

  const deleteInvestor = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('investors').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, investors: data.investors.filter(i => i.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  const addEmail = useCallback(async (email) => {
    const newEmail = { ...email, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('emails')
        .insert({ ...newEmail, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newEmail.id = inserted.id
    }

    const newData = { ...data, emails: [...data.emails, newEmail] }
    saveData(newData)
    return newEmail
  }, [data, saveData, userId, orgId])

  const updateEmail = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('emails').update(updates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      emails: data.emails.map(e => e.id === id ? { ...e, ...updates } : e)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteEmail = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('emails').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, emails: data.emails.filter(e => e.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  const addMeeting = useCallback(async (meeting) => {
    const newMeeting = { ...meeting, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('meetings')
        .insert({ ...newMeeting, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newMeeting.id = inserted.id
    }

    const newData = { ...data, meetings: [...data.meetings, newMeeting] }
    saveData(newData)
    return newMeeting
  }, [data, saveData, userId, orgId])

  const updateMeeting = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('meetings').update(updates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      meetings: data.meetings.map(m => m.id === id ? { ...m, ...updates } : m)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteMeeting = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('meetings').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, meetings: data.meetings.filter(m => m.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  const addMaterial = useCallback(async (material) => {
    const maxOrder = data.materials.reduce((max, m) => Math.max(max, m.sort_order || 0), 0)
    const newMaterial = { ...material, id: Date.now(), created_at: new Date().toISOString(), sort_order: maxOrder + 1 }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('materials')
        .insert({ ...newMaterial, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newMaterial.id = inserted.id
    }

    const newData = { ...data, materials: [...data.materials, newMaterial] }
    saveData(newData)
    return newMaterial
  }, [data, saveData, userId, orgId])

  const updateMaterial = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('materials').update(updates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      materials: data.materials.map(m => m.id === id ? { ...m, ...updates } : m)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteMaterial = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, materials: data.materials.filter(m => m.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  const reorderMaterials = useCallback(async (reorderedMaterials) => {
    // Assign sequential sort_order values
    const updated = reorderedMaterials.map((m, i) => ({ ...m, sort_order: i + 1 }))

    // Optimistic local update
    const newData = { ...data, materials: updated }
    saveData(newData)

    // Persist changed rows to Supabase
    if (supabase && orgId) {
      const updates = updated
        .filter((m, i) => {
          const original = data.materials.find(om => om.id === m.id)
          return !original || original.sort_order !== i + 1
        })
        .map(m => supabase.from('materials').update({ sort_order: m.sort_order }).eq('id', m.id))

      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed) console.error('Failed to persist reorder:', failed.error)
    }
  }, [data, saveData, orgId])

  const addTermSheet = useCallback(async (termSheet) => {
    const newTermSheet = { ...termSheet, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      // Convert camelCase to snake_case for Supabase
      const dbTermSheet = termSheetToDB({ ...newTermSheet, user_id: userId, org_id: orgId })

      const { data: inserted, error } = await supabase
        .from('term_sheets')
        .insert(dbTermSheet)
        .select()
        .single()

      if (error) throw error
      if (inserted) newTermSheet.id = inserted.id
    }

    const newData = { ...data, termSheets: [...data.termSheets, newTermSheet] }
    saveData(newData)
    return newTermSheet
  }, [data, saveData, userId, orgId])

  const updateTermSheet = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const dbUpdates = termSheetToDB(updates)
      const { error } = await supabase.from('term_sheets').update(dbUpdates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      termSheets: data.termSheets.map(t => t.id === id ? { ...t, ...updates } : t)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteTermSheet = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('term_sheets').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, termSheets: data.termSheets.filter(t => t.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  const addWeeklyAction = useCallback(async (action) => {
    const newAction = { ...action, id: Date.now(), created_at: new Date().toISOString() }
    // Convert empty due string to null (PostgreSQL date column rejects '')
    if (!newAction.due) newAction.due = null

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('weekly_actions')
        .insert({ ...newAction, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newAction.id = inserted.id
    }

    const newData = { ...data, weeklyActions: [...data.weeklyActions, newAction] }
    saveData(newData)
    return newAction
  }, [data, saveData, userId, orgId])

  const updateWeeklyAction = useCallback(async (id, updates) => {
    // Convert empty due string to null for PostgreSQL date column
    const sanitized = { ...updates }
    if ('due' in sanitized && !sanitized.due) sanitized.due = null

    if (supabase && orgId) {
      const { error } = await supabase.from('weekly_actions').update(sanitized).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      weeklyActions: data.weeklyActions.map(a => a.id === id ? { ...a, ...sanitized } : a)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteWeeklyAction = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('weekly_actions').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, weeklyActions: data.weeklyActions.filter(a => a.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  // References CRUD
  const addReference = useCallback(async (reference) => {
    const newReference = { ...reference, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('references')
        .insert({ ...newReference, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newReference.id = inserted.id
    }

    const newData = { ...data, references: [...data.references, newReference] }
    saveData(newData)
    return newReference
  }, [data, saveData, userId, orgId])

  const updateReference = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('references').update(updates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      references: data.references.map(r => r.id === id ? { ...r, ...updates } : r)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteReference = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('references').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, references: data.references.filter(r => r.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  // Cap Table Shareholders CRUD
  const addShareholder = useCallback(async (shareholder) => {
    const newShareholder = { ...shareholder, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('cap_table_shareholders')
        .insert({ ...newShareholder, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      if (inserted) newShareholder.id = inserted.id
    }

    const newData = { ...data, capTableShareholders: [...data.capTableShareholders, newShareholder] }
    saveData(newData)
    return newShareholder
  }, [data, saveData, userId, orgId])

  const updateShareholder = useCallback(async (id, updates) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('cap_table_shareholders').update(updates).eq('id', id)
      if (error) throw error
    }

    const newData = {
      ...data,
      capTableShareholders: data.capTableShareholders.map(s => s.id === id ? { ...s, ...updates } : s)
    }
    saveData(newData)
  }, [data, saveData, orgId])

  const deleteShareholder = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('cap_table_shareholders').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, capTableShareholders: data.capTableShareholders.filter(s => s.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  // Cap Table Option Pool - update local state only (call saveOptionPool to persist)
  const updateOptionPoolLocal = useCallback((options) => {
    const newData = { ...data, capTableOptions: options }
    saveData(newData)
  }, [data, saveData])

  // Cap Table Option Pool - save to Supabase
  const saveOptionPool = useCallback(async (options) => {
    if (supabase && orgId) {
      const { error } = await supabase
        .from('cap_table_options')
        .upsert({
          allocated: Number(options.allocated) || 0,
          unallocated: Number(options.unallocated) || 0,
          user_id: userId,
          org_id: orgId
        }, { onConflict: 'org_id' })

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    }
    return { success: true } // No Supabase, local-only mode
  }, [userId, orgId])

  // Legacy function for backward compatibility
  const updateOptionPool = useCallback(async (options) => {
    updateOptionPoolLocal(options)
    return saveOptionPool(options)
  }, [updateOptionPoolLocal, saveOptionPool])

  // Investor Activities
  const addActivity = useCallback(async (activity) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('investor_activities')
        .insert({ ...newActivity, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      if (inserted) newActivity.id = inserted.id
    }

    const newData = {
      ...data,
      investorActivities: [newActivity, ...data.investorActivities]
    }
    saveData(newData)
    return newActivity
  }, [data, saveData, userId, orgId])

  const addQuickNote = useCallback(async (investorId, investorFirm, note) => {
    return addActivity({
      investor_id: investorId,
      investor_firm: investorFirm,
      activity_type: 'note',
      description: note
    })
  }, [addActivity])

  // Get unified timeline for an investor (activities + emails + meetings + references)
  const getInvestorTimeline = useCallback((investorId, investorFirm) => {
    const activities = data.investorActivities
      .filter(a => a.investor_id === investorId)
      .map(a => ({
        id: `activity-${a.id}`,
        type: a.activity_type,
        description: a.description,
        oldValue: a.old_value,
        newValue: a.new_value,
        timestamp: a.created_at,
        source: 'activity'
      }))

    const emails = data.emails
      .filter(e => e.investor === investorFirm)
      .map(e => ({
        id: `email-${e.id}`,
        type: 'email',
        description: `${e.type}: ${e.subject || 'No subject'}`,
        timestamp: e.sent_date ? new Date(e.sent_date).toISOString() : e.created_at,
        replied: e.replied,
        opened: e.opened,
        clicked: e.clicked,
        source: 'email'
      }))

    const meetings = data.meetings
      .filter(m => m.investor === investorFirm)
      .map(m => ({
        id: `meeting-${m.id}`,
        type: 'meeting',
        meetingType: m.type,
        description: `${m.type || 'Meeting'}${m.notes ? ': ' + m.notes.substring(0, 100) : ''}`,
        timestamp: m.date ? new Date(m.date).toISOString() : m.created_at,
        followUp: m.follow_up,
        attendees: [m.attendees_us, m.attendees_them].filter(Boolean).join(' / '),
        source: 'meeting'
      }))

    const references = (data.references || [])
      .filter(r => r.requestedBy === investorFirm)
      .map(r => ({
        id: `reference-${r.id}`,
        type: 'reference',
        description: `Reference call with ${r.customerName || r.customer_name || 'customer'}${r.contact_name ? ` (${r.contact_name})` : ''}`,
        timestamp: r.scheduled_date ? new Date(r.scheduled_date).toISOString() : r.created_at,
        status: r.status,
        source: 'reference'
      }))

    return [...activities, ...emails, ...meetings, ...references]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [data])

  // Get last touched date for an investor
  const getLastTouched = useCallback((investorId, investorFirm) => {
    const timeline = getInvestorTimeline(investorId, investorFirm)
    if (timeline.length === 0) return null
    return timeline[0].timestamp
  }, [getInvestorTimeline])

  // Export to CSV
  const exportToCSV = useCallback((tableName) => {
    const tableData = data[tableName]
    if (!tableData?.length) return

    const headers = Object.keys(tableData[0])
    const csv = [
      headers.join(','),
      ...tableData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  return {
    data,
    loading,
    error,
    saveData,
    // Investors
    addInvestor,
    updateInvestor,
    deleteInvestor,
    // Emails
    addEmail,
    updateEmail,
    deleteEmail,
    // Meetings
    addMeeting,
    updateMeeting,
    deleteMeeting,
    // Materials
    addMaterial,
    updateMaterial,
    deleteMaterial,
    reorderMaterials,
    // Term Sheets
    addTermSheet,
    updateTermSheet,
    deleteTermSheet,
    // Weekly Actions
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    // References
    addReference,
    updateReference,
    deleteReference,
    // Cap Table
    addShareholder,
    updateShareholder,
    deleteShareholder,
    updateOptionPool,
    saveOptionPool,
    // Investor Activities & Timeline
    addActivity,
    addQuickNote,
    getInvestorTimeline,
    getLastTouched,
    // Export
    exportToCSV
  }
}
