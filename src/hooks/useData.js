import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const defaultMaterials = [
  { name: 'Executive Summary (2 pages)', tier: '1', status: 'Not Started', owner: '' },
  { name: 'High-Level Metrics Snapshot', tier: '1', status: 'Not Started', owner: '' },
  { name: 'Team Overview', tier: '1', status: 'Not Started', owner: '' },
  { name: 'Full Pitch Deck', tier: '2', status: 'Not Started', owner: '' },
  { name: 'Detailed Financial Model', tier: '2', status: 'Not Started', owner: '' },
  { name: 'Customer Case Studies', tier: '2', status: 'Not Started', owner: '' },
  { name: 'Product Roadmap', tier: '2', status: 'Not Started', owner: '' },
  { name: 'Cap Table & Ownership', tier: '3', status: 'Not Started', owner: '' },
  { name: 'Cohort Analysis & Unit Economics', tier: '3', status: 'Not Started', owner: '' },
  { name: 'Sample Customer Contracts', tier: '3', status: 'Not Started', owner: '' },
  { name: 'Reference Customer List', tier: '3', status: 'Not Started', owner: '' },
  { name: 'Legal Structure & Agreements', tier: '3', status: 'Not Started', owner: '' },
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

export function useData(userId) {
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      if (supabase && userId) {
        try {
          // Load from Supabase
          const [
            investors, emails, meetings, materials, termSheets, weeklyActions,
            references, investorActivities, capTableShareholders, capTableOptions
          ] = await Promise.all([
            supabase.from('investors').select('*').eq('user_id', userId),
            supabase.from('emails').select('*').eq('user_id', userId),
            supabase.from('meetings').select('*').eq('user_id', userId),
            supabase.from('materials').select('*').eq('user_id', userId),
            supabase.from('term_sheets').select('*').eq('user_id', userId),
            supabase.from('weekly_actions').select('*').eq('user_id', userId),
            supabase.from('references').select('*').eq('user_id', userId),
            supabase.from('investor_activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('cap_table_shareholders').select('*').eq('user_id', userId),
            supabase.from('cap_table_options').select('*').eq('user_id', userId).single(),
          ])

          // Seed materials if empty (new user)
          let materialsData = materials.data || []
          if (materialsData.length === 0) {
            const materialsToSeed = defaultMaterials.map(m => ({ ...m, user_id: userId }))
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
            termSheets: termSheets.data || [],
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
  }, [userId])

  // Save data function
  const saveData = useCallback(async (newData) => {
    setData(newData)

    if (supabase && userId) {
      // Save to Supabase (upsert each table)
      try {
        // Note: In production, you'd want more granular updates
        // This is simplified for the scaffold
        console.log('Saving to Supabase...')
      } catch (e) {
        console.error('Supabase save error:', e)
      }
    }

    // Always save to localStorage as backup
    saveToLocalStorage(newData)
  }, [userId])

  // Internal function to add activity without triggering state update loop
  const addActivityInternal = useCallback(async (activity, currentData) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('investor_activities')
        .insert({ ...newActivity, user_id: userId })
        .select()
        .single()

      if (!error && inserted) newActivity.id = inserted.id
    }

    return {
      newActivity,
      investorActivities: [newActivity, ...currentData.investorActivities]
    }
  }, [userId])

  // CRUD operations for each entity
  const addInvestor = useCallback(async (investor) => {
    const newInvestor = { ...investor, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('investors')
        .insert({ ...newInvestor, user_id: userId })
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
  }, [data, saveData, userId, addActivityInternal])

  const updateInvestor = useCallback(async (id, updates) => {
    const existingInvestor = data.investors.find(i => i.id === id)

    if (supabase && userId) {
      await supabase.from('investors').update(updates).eq('id', id)
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
  }, [data, saveData, userId, addActivityInternal])

  const deleteInvestor = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('investors').delete().eq('id', id)
    }

    const newData = { ...data, investors: data.investors.filter(i => i.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  const addEmail = useCallback(async (email) => {
    const newEmail = { ...email, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('emails')
        .insert({ ...newEmail, user_id: userId })
        .select()
        .single()

      if (!error) newEmail.id = inserted.id
    }

    const newData = { ...data, emails: [...data.emails, newEmail] }
    saveData(newData)
    return newEmail
  }, [data, saveData, userId])

  const updateEmail = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('emails').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      emails: data.emails.map(e => e.id === id ? { ...e, ...updates } : e)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteEmail = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('emails').delete().eq('id', id)
    }

    const newData = { ...data, emails: data.emails.filter(e => e.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  const addMeeting = useCallback(async (meeting) => {
    const newMeeting = { ...meeting, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('meetings')
        .insert({ ...newMeeting, user_id: userId })
        .select()
        .single()

      if (!error) newMeeting.id = inserted.id
    }

    const newData = { ...data, meetings: [...data.meetings, newMeeting] }
    saveData(newData)
    return newMeeting
  }, [data, saveData, userId])

  const updateMeeting = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('meetings').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      meetings: data.meetings.map(m => m.id === id ? { ...m, ...updates } : m)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteMeeting = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('meetings').delete().eq('id', id)
    }

    const newData = { ...data, meetings: data.meetings.filter(m => m.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  const updateMaterial = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('materials').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      materials: data.materials.map(m => m.id === id ? { ...m, ...updates } : m)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const addTermSheet = useCallback(async (termSheet) => {
    const newTermSheet = { ...termSheet, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('term_sheets')
        .insert({ ...newTermSheet, user_id: userId })
        .select()
        .single()

      if (!error) newTermSheet.id = inserted.id
    }

    const newData = { ...data, termSheets: [...data.termSheets, newTermSheet] }
    saveData(newData)
    return newTermSheet
  }, [data, saveData, userId])

  const updateTermSheet = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('term_sheets').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      termSheets: data.termSheets.map(t => t.id === id ? { ...t, ...updates } : t)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteTermSheet = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('term_sheets').delete().eq('id', id)
    }

    const newData = { ...data, termSheets: data.termSheets.filter(t => t.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  const addWeeklyAction = useCallback(async (action) => {
    const newAction = { ...action, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('weekly_actions')
        .insert({ ...newAction, user_id: userId })
        .select()
        .single()

      if (!error) newAction.id = inserted.id
    }

    const newData = { ...data, weeklyActions: [...data.weeklyActions, newAction] }
    saveData(newData)
    return newAction
  }, [data, saveData, userId])

  const updateWeeklyAction = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('weekly_actions').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      weeklyActions: data.weeklyActions.map(a => a.id === id ? { ...a, ...updates } : a)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteWeeklyAction = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('weekly_actions').delete().eq('id', id)
    }

    const newData = { ...data, weeklyActions: data.weeklyActions.filter(a => a.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  // References CRUD
  const addReference = useCallback(async (reference) => {
    const newReference = { ...reference, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('references')
        .insert({ ...newReference, user_id: userId })
        .select()
        .single()

      if (!error) newReference.id = inserted.id
    }

    const newData = { ...data, references: [...data.references, newReference] }
    saveData(newData)
    return newReference
  }, [data, saveData, userId])

  const updateReference = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('references').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      references: data.references.map(r => r.id === id ? { ...r, ...updates } : r)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteReference = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('references').delete().eq('id', id)
    }

    const newData = { ...data, references: data.references.filter(r => r.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  // Cap Table Shareholders CRUD
  const addShareholder = useCallback(async (shareholder) => {
    const newShareholder = { ...shareholder, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('cap_table_shareholders')
        .insert({ ...newShareholder, user_id: userId })
        .select()
        .single()

      if (!error) newShareholder.id = inserted.id
    }

    const newData = { ...data, capTableShareholders: [...data.capTableShareholders, newShareholder] }
    saveData(newData)
    return newShareholder
  }, [data, saveData, userId])

  const updateShareholder = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('cap_table_shareholders').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      capTableShareholders: data.capTableShareholders.map(s => s.id === id ? { ...s, ...updates } : s)
    }
    saveData(newData)
  }, [data, saveData, userId])

  const deleteShareholder = useCallback(async (id) => {
    if (supabase && userId) {
      await supabase.from('cap_table_shareholders').delete().eq('id', id)
    }

    const newData = { ...data, capTableShareholders: data.capTableShareholders.filter(s => s.id !== id) }
    saveData(newData)
  }, [data, saveData, userId])

  // Cap Table Option Pool
  const updateOptionPool = useCallback(async (options) => {
    if (supabase && userId) {
      // Upsert the option pool (one row per user)
      await supabase
        .from('cap_table_options')
        .upsert({ ...options, user_id: userId }, { onConflict: 'user_id' })
    }

    const newData = { ...data, capTableOptions: options }
    saveData(newData)
  }, [data, saveData, userId])

  // Investor Activities
  const addActivity = useCallback(async (activity) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && userId) {
      const { data: inserted, error } = await supabase
        .from('investor_activities')
        .insert({ ...newActivity, user_id: userId })
        .select()
        .single()

      if (!error && inserted) newActivity.id = inserted.id
    }

    const newData = {
      ...data,
      investorActivities: [newActivity, ...data.investorActivities]
    }
    saveData(newData)
    return newActivity
  }, [data, saveData, userId])

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
    updateMaterial,
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
    // Investor Activities & Timeline
    addActivity,
    addQuickNote,
    getInvestorTimeline,
    getLastTouched,
    // Export
    exportToCSV
  }
}
