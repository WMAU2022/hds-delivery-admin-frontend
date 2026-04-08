import React, { useState, useEffect } from 'react'
import axios from 'axios'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function RegionDetail({ regionId, onBack }) {
  const [region, setRegion] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCutoffEdit, setShowCutoffEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cutoffEdit, setCutoffEdit] = useState({})

  const [newSchedule, setNewSchedule] = useState({
    cutoff_day: 'Monday',
    pack_day: 'Tuesday',
    delivery_day: 'Friday',
    has_am: true,
    has_business_hours: false,
    am_time_start: '12:00 AM',
    am_time_end: '7:00 AM',
    business_hours_start: '8:00 AM',
    business_hours_end: '6:00 PM',
  })

  useEffect(() => {
    fetchRegionDetail()
  }, [regionId])

  async function fetchRegionDetail() {
    setLoading(true)
    setError(null)

    try {
      const regionRes = await axios.get(`/api/regions/${regionId}`)
      setRegion(regionRes.data.data)
      setSchedules(regionRes.data.data.schedules || [])
    } catch (err) {
      setError(`Failed to load region: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSchedule() {
    if (!newSchedule.cutoff_day || !newSchedule.pack_day || !newSchedule.delivery_day) {
      setError('Please fill all fields')
      return
    }

    if (!newSchedule.has_am && !newSchedule.has_business_hours) {
      setError('Select at least one delivery option')
      return
    }

    setIsSaving(true)

    try {
      const response = await axios.post('/api/schedules', {
        region_id: regionId,
        ...newSchedule,
      })

      setSchedules([...schedules, response.data.data])
      setNewSchedule({
        cutoff_day: 'Monday',
        pack_day: 'Tuesday',
        delivery_day: 'Friday',
        has_am: true,
        has_business_hours: false,
        am_time_start: '12:00 AM',
        am_time_end: '7:00 AM',
        business_hours_start: '8:00 AM',
        business_hours_end: '6:00 PM',
      })
      setShowAddForm(false)
      setSuccess('Schedule added')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to add schedule: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleSchedule(scheduleId) {
    try {
      const response = await axios.put(`/api/schedules/${scheduleId}/toggle`)
      setSchedules(schedules.map(s => (s.id === scheduleId ? response.data.data : s)))
      setSuccess('Schedule toggled')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to toggle schedule: ${err.message}`)
    }
  }

  async function handleSetDefault(scheduleId) {
    setIsSaving(true)

    try {
      await axios.put(`/api/schedules/${regionId}/set-default/${scheduleId}`)
      setSchedules(
        schedules.map(s => ({
          ...s,
          is_default: s.id === scheduleId,
        }))
      )
      setSuccess('Default schedule updated')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to set default: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSchedule(scheduleId) {
    if (!confirm('Delete this schedule?')) return

    try {
      await axios.delete(`/api/schedules/${scheduleId}`)
      setSchedules(schedules.filter(s => s.id !== scheduleId))
      setSuccess('Schedule deleted')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to delete schedule: ${err.message}`)
    }
  }

  async function handleSaveCutoff() {
    setIsSaving(true)

    try {
      await axios.put(`/api/regions/${regionId}`, cutoffEdit)
      setRegion({ ...region, ...cutoffEdit })
      setShowCutoffEdit(false)
      setSuccess('Cutoff settings saved')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to save cutoff: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading region details...</p>
        </div>
      </div>
    )
  }

  if (!region) {
    return (
      <div className="screen">
        <div className="screen-body">
          <div className="error-message">Region not found</div>
          <button className="back-button" onClick={onBack}>
            ← Back to Regions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Screen 2: Region Configuration Detail</h2>
        <p>{region.name} • Edit delivery schedules</p>
      </div>

      <div className="screen-body">
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <button className="back-button" onClick={onBack}>
          ← Back to Regions
        </button>

        <div style={{ marginBottom: '20px' }}>
          <strong>Region:</strong> {region.name}
        </div>

        {/* Cutoff Settings - At Top, Applies to All Schedules */}
        {!showCutoffEdit ? (
          <div style={{ background: '#e3f2fd', border: '2px solid #667eea', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#667eea', fontSize: '14px' }}>🔔 Order Cutoff Time</strong>
                <p style={{ margin: '6px 0 0 0', color: '#333', fontSize: '13px' }}>
                  <strong>{region.cutoff_time}</strong> applies to all delivery days below (cutoff day is per-schedule)
                </p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  setCutoffEdit({
                    cutoff_time: region.cutoff_time,
                  })
                  setShowCutoffEdit(true)
                }}
                style={{ height: 'fit-content' }}
              >
                Edit Time
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffacd', border: '2px solid #ffd700', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <strong style={{ color: '#b8860b', fontSize: '14px' }}>🔔 Edit Order Cutoff Time</strong>
            <div style={{ display: 'flex', gap: '15px', marginTop: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>Cutoff Time (applies to all delivery days)</label>
                <input
                  type="time"
                  value={cutoffEdit.cutoff_time}
                  onChange={(e) => setCutoffEdit({ ...cutoffEdit, cutoff_time: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-small" onClick={handleSaveCutoff} disabled={isSaving}>✓ Save</button>
              <button className="btn btn-secondary btn-small" onClick={() => setShowCutoffEdit(false)}>✕ Cancel</button>
            </div>
          </div>
        )}

        <div className="info-box">
          <strong>📌 Delivery Schedules:</strong> Configure cutoff/pack/delivery days and select delivery windows.
        </div>

        {schedules && schedules.length > 0 ? (
          <div>
            {schedules.map(schedule => (
              <div key={schedule.id} className={`schedule-card ${schedule.is_default ? 'active' : ''}`}>
                <div className="schedule-flow">
                  <div className="flow-item">
                    <label>Cutoff Day</label>
                    <select value={schedule.cutoff_day} onChange={(e) => {
                      const updated = schedules.map(s => s.id === schedule.id ? { ...s, cutoff_day: e.target.value } : s)
                      setSchedules(updated)
                      handleScheduleUpdate(schedule.id, { cutoff_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-item">
                    <label>Pack Day</label>
                    <select value={schedule.pack_day} onChange={(e) => {
                      const updated = schedules.map(s => s.id === schedule.id ? { ...s, pack_day: e.target.value } : s)
                      setSchedules(updated)
                      handleScheduleUpdate(schedule.id, { pack_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-item">
                    <label>Delivery Day</label>
                    <select value={schedule.delivery_day} onChange={(e) => {
                      const updated = schedules.map(s => s.id === schedule.id ? { ...s, delivery_day: e.target.value } : s)
                      setSchedules(updated)
                      handleScheduleUpdate(schedule.id, { delivery_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                </div>
                <div className="schedule-footer">
                  <div className="schedule-hours" style={{ flex: 1 }}>
                    <label>Delivery Windows</label>
                    <div style={{ display: 'flex', gap: '25px', marginTop: '8px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                        <input type="checkbox" checked={schedule.has_am || false} onChange={(e) => handleScheduleUpdate(schedule.id, { has_am: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        AM <span style={{ color: '#999', fontSize: '12px' }}>(12:00 AM - 7:00 AM)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                        <input type="checkbox" checked={schedule.has_business_hours || false} onChange={(e) => handleScheduleUpdate(schedule.id, { has_business_hours: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        Business Hours <span style={{ color: '#999', fontSize: '12px' }}>(8:00 AM - 6:00 PM)</span>
                      </label>
                    </div>
                  </div>
                  <div className="schedule-actions">
                    <button className={`toggle-switch ${schedule.enabled ? 'active' : ''}`} onClick={() => handleToggleSchedule(schedule.id)} title={schedule.enabled ? 'Disable' : 'Enable'} />
                    <button className="btn-icon" onClick={() => handleSetDefault(schedule.id)} style={{ color: schedule.is_default ? '#667eea' : '#ccc' }}>★</button>
                    <button className="btn-icon" onClick={() => handleDeleteSchedule(schedule.id)} style={{ color: '#c33' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999' }}>No schedules configured</p>
        )}

        {!showAddForm ? (
          <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add Schedule</button>
        ) : (
          <div className="schedule-card" style={{ backgroundColor: '#fffacd', borderColor: '#ffd700' }}>
            <div className="schedule-flow">
              <div className="flow-item"><label>Cutoff Day</label><select value={newSchedule.cutoff_day} onChange={(e) => setNewSchedule({ ...newSchedule, cutoff_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
              <div className="flow-arrow">→</div>
              <div className="flow-item"><label>Pack Day</label><select value={newSchedule.pack_day} onChange={(e) => setNewSchedule({ ...newSchedule, pack_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
              <div className="flow-arrow">→</div>
              <div className="flow-item"><label>Delivery Day</label><select value={newSchedule.delivery_day} onChange={(e) => setNewSchedule({ ...newSchedule, delivery_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
            </div>
            <div className="schedule-footer">
              <div className="schedule-hours" style={{ flex: 1 }}>
                <label>Delivery Windows</label>
                <div style={{ display: 'flex', gap: '25px', marginTop: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                    <input type="checkbox" checked={newSchedule.has_am} onChange={(e) => setNewSchedule({ ...newSchedule, has_am: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    AM <span style={{ color: '#999', fontSize: '12px' }}>(12:00 AM - 7:00 AM)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                    <input type="checkbox" checked={newSchedule.has_business_hours} onChange={(e) => setNewSchedule({ ...newSchedule, has_business_hours: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    Business Hours <span style={{ color: '#999', fontSize: '12px' }}>(8:00 AM - 6:00 PM)</span>
                  </label>
                </div>
              </div>
              <div className="schedule-actions"><button className="btn btn-primary btn-small" onClick={handleAddSchedule} disabled={isSaving}>✓ Add</button><button className="btn btn-secondary btn-small" onClick={() => setShowAddForm(false)}>✕ Cancel</button></div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button className="btn btn-secondary" onClick={onBack}>Done Editing</button>
        </div>
      </div>
    </div>
  )

  async function handleScheduleUpdate(scheduleId, updates) {
    try {
      await axios.put(`/api/schedules/${scheduleId}`, updates)
      setSchedules(schedules.map(s => s.id === scheduleId ? { ...s, ...updates } : s))
      setSuccess('Updated')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(`Update failed: ${err.message}`)
    }
  }
}
