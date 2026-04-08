import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import RegionsList from './components/RegionsList'
import RegionDetail from './components/RegionDetail'
import SuburbsList from './components/SuburbsList'
import BlackoutDates from './components/BlackoutDates'

export default function App() {
  const [page, setPage] = useState('regions') // 'regions', 'detail', 'suburbs', or 'blackout'
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [regions, setRegions] = useState([])

  // Load regions for dropdowns
  useEffect(() => {
    fetchRegions()
  }, [])

  async function fetchRegions() {
    try {
      const response = await axios.get('/api/regions')
      setRegions(response.data.data || [])
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const handleViewRegion = (regionId) => {
    setSelectedRegionId(regionId)
    setPage('detail')
  }

  const handleBack = () => {
    setPage('regions')
    setSelectedRegionId(null)
  }

  const handleGoToSuburbs = () => {
    setPage('suburbs')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🚚 HDS Delivery Admin</h1>
          <p>Manage delivery regions and schedules</p>
        </div>

        {/* Navigation Tabs */}
        {page !== 'detail' && (
          <nav className="app-nav">
            <button
              className={`nav-tab ${page === 'regions' ? 'active' : ''}`}
              onClick={() => setPage('regions')}
            >
              Screen 1: Regions
            </button>
            <button
              className={`nav-tab ${page === 'suburbs' ? 'active' : ''}`}
              onClick={() => setPage('suburbs')}
            >
              Screen 3: Suburbs
            </button>
            <button
              className={`nav-tab ${page === 'blackout' ? 'active' : ''}`}
              onClick={() => setPage('blackout')}
            >
              Screen 4: Blackout Dates
            </button>
          </nav>
        )}
      </header>

      <main className="app-main">
        {page === 'regions' && (
          <RegionsList onSelectRegion={handleViewRegion} />
        )}

        {page === 'detail' && selectedRegionId && (
          <RegionDetail regionId={selectedRegionId} onBack={handleBack} />
        )}

        {page === 'suburbs' && (
          <SuburbsList regions={regions} />
        )}

        {page === 'blackout' && (
          <BlackoutDates />
        )}
      </main>

      <footer className="app-footer">
        <p>HDS Delivery Admin • Workout Meals</p>
      </footer>
    </div>
  )
}
