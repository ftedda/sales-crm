import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const defaultData = {
  investors: [],
  emails: [],
  meetings: [],
  materials: [
    { id: 1, name: 'Executive Summary (2 pages)', tier: '1', status: 'Not Started', owner: '' },
    { id: 2, name: 'High-Level Metrics Snapshot', tier: '1', status: 'Not Started', owner: '' },
    { id: 3, name: 'Team Overview', tier: '1', status: 'Not Started', owner: '' },
    { id: 4, name: 'Full Pitch Deck', tier: '2', status: 'Not Started', owner: '' },
    { id: 5, name: 'Detailed Financial Model', tier: '2', status: 'Not Started', owner: '' },
    { id: 6, name: 'Customer Case Studies', tier: '2', status: 'Not Started', owner: '' },
    { id: 7, name: 'Product Roadmap', tier: '2', status: 'Not Started', owner: '' },
    { id: 8, name: 'Cap Table & Ownership', tier: '3', status: 'Not Started', owner: '' },
    { id: 9, name: 'Cohort Analysis & Unit Economics', tier: '3', status: 'Not Started', owner: '' },
    { id: 10, name: 'Sample Customer Contracts', tier: '3', status: 'Not Started', owner: '' },
    { id: 11, name: 'Reference Customer List', tier: '3', status: 'Not Started', owner: '' },
    { id: 12, name: 'Legal Structure & Agreements', tier: '3', status: 'Not Started', owner: '' },
  ],
  termSheets: [],
  weeklyActions: []
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
          const [investors, emails, meetings, materials, termSheets, weeklyActions] = await Promise.all([
            supabase.from('investors').select('*').eq('user_id', userId),
            supabase.from('emails').select('*').eq('user_id', userId),
            supabase.from('meetings').select('*').eq('user_id', userId),
            supabase.from('materials').select('*').eq('user_id', userId),
            supabase.from('term_sheets').select('*').eq('user_id', userId),
            supabase.from('weekly_actions').select('*').eq('user_id', userId),
          ])

          setData({
            investors: investors.data || [],
            emails: emails.data || [],
            meetings: meetings.data || [],
            materials: materials.data?.length ? materials.data : defaultData.materials,
            termSheets: termSheets.data || [],
            weeklyActions: weeklyActions.data || []
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

    const newData = { ...data, investors: [...data.investors, newInvestor] }
    saveData(newData)
    return newInvestor
  }, [data, saveData, userId])

  const updateInvestor = useCallback(async (id, updates) => {
    if (supabase && userId) {
      await supabase.from('investors').update(updates).eq('id', id)
    }

    const newData = {
      ...data,
      investors: data.investors.map(i => i.id === id ? { ...i, ...updates } : i)
    }
    saveData(newData)
  }, [data, saveData, userId])

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
    // Meetings
    addMeeting,
    deleteMeeting,
    // Materials
    updateMaterial,
    // Term Sheets
    addTermSheet,
    deleteTermSheet,
    // Weekly Actions
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    // Export
    exportToCSV
  }
}
