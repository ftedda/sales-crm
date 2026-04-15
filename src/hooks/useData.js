import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Extract #hashtags from action text and merge with existing tags
function extractTags(actionText, existingTags) {
  const found = [...(actionText || '').matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
  const existing = existingTags ? existingTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
  const merged = [...new Set([...existing, ...found])]
  return merged.length ? merged.join(',') : null
}

const defaultData = {
  contacts: [],
  weeklyActions: [],
  contactActivities: []
}

const localStorageKey = 'crm-data'

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
          const [contacts, weeklyActions, contactActivities] = await Promise.all([
            supabase.from('contacts').select('*').eq('org_id', orgId),
            supabase.from('weekly_actions').select('*').eq('org_id', orgId),
            supabase.from('contact_activities').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
          ])

          setData({
            contacts: contacts.data || [],
            weeklyActions: weeklyActions.data || [],
            contactActivities: contactActivities.data || [],
          })
        } catch (e) {
          console.error('Supabase load error:', e)
          setError(e.message)
          setData(loadFromLocalStorage())
        }
      } else {
        setData(loadFromLocalStorage())
      }

      setLoading(false)
    }

    loadData()
  }, [orgId, userId])

  const saveData = useCallback(async (newData) => {
    setData(newData)
    saveToLocalStorage(newData)
  }, [])

  // Internal function to add activity without triggering state update loop
  const addActivityInternal = useCallback(async (activity, currentData) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('contact_activities')
        .insert({ ...newActivity, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      if (inserted) newActivity.id = inserted.id
    }

    return {
      newActivity,
      contactActivities: [newActivity, ...currentData.contactActivities]
    }
  }, [userId, orgId])

  // Contacts CRUD
  const addContact = useCallback(async (contact) => {
    const newContact = { ...contact, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('contacts')
        .insert({ ...newContact, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      newContact.id = inserted.id
    }

    const activityResult = await addActivityInternal({
      contact_id: newContact.id,
      contact_name: newContact.name,
      activity_type: 'created',
      description: `Added ${newContact.name}${newContact.company ? ` (${newContact.company})` : ''} to CRM`
    }, data)

    const newData = {
      ...data,
      contacts: [...data.contacts, newContact],
      contactActivities: activityResult.contactActivities
    }
    saveData(newData)
    return newContact
  }, [data, saveData, userId, orgId, addActivityInternal])

  const updateContact = useCallback(async (id, updates) => {
    const existingContact = data.contacts.find(c => c.id === id)

    if (supabase && orgId) {
      const { error } = await supabase.from('contacts').update(updates).eq('id', id)
      if (error) throw error
    }

    let contactActivities = data.contactActivities

    // Log stage change as an activity
    if (updates.stage && existingContact && updates.stage !== existingContact.stage) {
      const activityResult = await addActivityInternal({
        contact_id: id,
        contact_name: existingContact.name,
        activity_type: 'stage_change',
        description: `Stage changed from ${existingContact.stage} to ${updates.stage}`,
        old_value: existingContact.stage,
        new_value: updates.stage
      }, { contactActivities })
      contactActivities = activityResult.contactActivities
    }

    const newData = {
      ...data,
      contacts: data.contacts.map(c => c.id === id ? { ...c, ...updates } : c),
      contactActivities
    }
    saveData(newData)
  }, [data, saveData, orgId, addActivityInternal])

  const deleteContact = useCallback(async (id) => {
    if (supabase && orgId) {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    }

    const newData = { ...data, contacts: data.contacts.filter(c => c.id !== id) }
    saveData(newData)
  }, [data, saveData, orgId])

  // Weekly Actions CRUD
  const addWeeklyAction = useCallback(async (action) => {
    const newAction = { ...action, id: Date.now(), created_at: new Date().toISOString() }
    if (!newAction.due) newAction.due = null
    newAction.tags = extractTags(newAction.action, newAction.tags)

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
    const sanitized = { ...updates }
    if ('due' in sanitized && !sanitized.due) sanitized.due = null
    if ('action' in sanitized) {
      const existing = data.weeklyActions.find(a => a.id === id)
      sanitized.tags = extractTags(sanitized.action, sanitized.tags ?? existing?.tags)
    }

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

  // Contact Activities
  const addActivity = useCallback(async (activity) => {
    const newActivity = { ...activity, id: Date.now(), created_at: new Date().toISOString() }

    if (supabase && orgId) {
      const { data: inserted, error } = await supabase
        .from('contact_activities')
        .insert({ ...newActivity, user_id: userId, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      if (inserted) newActivity.id = inserted.id
    }

    const newData = {
      ...data,
      contactActivities: [newActivity, ...data.contactActivities]
    }
    saveData(newData)
    return newActivity
  }, [data, saveData, userId, orgId])

  const addQuickNote = useCallback(async (contactId, contactName, note) => {
    return addActivity({
      contact_id: contactId,
      contact_name: contactName,
      activity_type: 'note',
      description: note
    })
  }, [addActivity])

  // Get unified timeline for a contact (activities + linked actions)
  const getContactTimeline = useCallback((contactId, contactName) => {
    const activities = data.contactActivities
      .filter(a => a.contact_id === contactId)
      .map(a => ({
        id: `activity-${a.id}`,
        type: a.activity_type,
        description: a.description,
        oldValue: a.old_value,
        newValue: a.new_value,
        timestamp: a.created_at,
        source: 'activity'
      }))

    const namePrefix = `[${contactName}] `
    const actions = (data.weeklyActions || [])
      .filter(a => a.contact_id === contactId || a.action?.startsWith(namePrefix))
      .map(a => ({
        id: `action-${a.id}`,
        type: 'action',
        description: a.action?.startsWith(namePrefix) ? a.action.replace(namePrefix, '') : a.action,
        timestamp: a.created_at,
        actionStatus: a.status,
        source: 'action'
      }))

    return [...activities, ...actions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [data])

  // Get last touched date for a contact
  const getLastTouched = useCallback((contactId, contactName) => {
    const timeline = getContactTimeline(contactId, contactName)
    if (timeline.length === 0) return null
    return timeline[0].timestamp
  }, [getContactTimeline])

  // Export to CSV
  const exportToCSV = useCallback((tableName) => {
    const tableData = data[tableName]
    if (!tableData?.length) return

    const safeCSVField = (val) => {
      const s = String(val ?? '').replace(/"/g, '""')
      if (/^[=+@\-]/.test(s)) return `"'${s}"`
      return `"${s}"`
    }

    const headers = Object.keys(tableData[0])
    const csv = [
      headers.join(','),
      ...tableData.map(row => headers.map(h => safeCSVField(row[h])).join(','))
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
    // Contacts
    addContact,
    updateContact,
    deleteContact,
    // Weekly Actions
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    // Contact Activities & Timeline
    addActivity,
    addQuickNote,
    getContactTimeline,
    getLastTouched,
    // Export
    exportToCSV
  }
}
