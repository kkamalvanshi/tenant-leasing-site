'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Users, Building, ChevronDown, ChevronUp, Search, Filter, X, SlidersHorizontal } from 'lucide-react'

// Dual Range Slider Component
interface DualRangeSliderProps {
  min: number
  max: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  prefix?: string
  suffix?: string
  step?: number
}

function DualRangeSlider({ min, max, value, onChange, prefix = '', suffix = '', step = 1 }: DualRangeSliderProps) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)
  
  const getPercent = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100
  }, [min, max])
  
  const minPercent = getPercent(value.min)
  const maxPercent = getPercent(value.max)
  
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), value.max - step)
    onChange({ ...value, min: newMin })
  }
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), value.min + step)
    onChange({ ...value, max: newMax })
  }
  
  const formatValue = (val: number) => {
    if (prefix === '$') {
      return `${prefix}${val.toLocaleString()}${suffix}`
    }
    return `${prefix}${val}${suffix}`
  }
  
  return (
    <div className="pt-2 pb-4">
      {/* Value labels */}
      <div className="flex justify-between mb-3">
        <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
          {formatValue(value.min)}
        </span>
        <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
          {formatValue(value.max)}
        </span>
      </div>
      
      {/* Slider track */}
      <div className="relative h-2">
        {/* Background track */}
        <div className="absolute inset-0 bg-chat-input rounded-full" />
        
        {/* Active range track */}
        <div 
          className="absolute h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
          style={{ 
            left: `${minPercent}%`, 
            width: `${maxPercent - minPercent}%` 
          }}
        />
        
        {/* Min thumb input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={handleMinChange}
          onMouseDown={() => setDragging('min')}
          onMouseUp={() => setDragging(null)}
          onTouchStart={() => setDragging('min')}
          onTouchEnd={() => setDragging(null)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500 [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: dragging === 'min' ? 5 : 3 }}
        />
        
        {/* Max thumb input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={handleMaxChange}
          onMouseDown={() => setDragging('max')}
          onMouseUp={() => setDragging(null)}
          onTouchStart={() => setDragging('max')}
          onTouchEnd={() => setDragging(null)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500 [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: dragging === 'max' ? 5 : 4 }}
        />
      </div>
      
      {/* Min/Max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">{formatValue(min)}</span>
        <span className="text-[10px] text-gray-600">{formatValue(max)}</span>
      </div>
    </div>
  )
}

interface DataSet {
  headers: string[]
  rows: string[][]
}

interface DataTablesProps {
  onClose?: () => void
}

interface FilterState {
  [column: string]: string[]
}

interface RangeFilterState {
  [column: string]: { min: number | null; max: number | null }
}

export default function DataTables({ onClose }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<'guests' | 'units'>('guests')
  const [guestCards, setGuestCards] = useState<DataSet | null>(null)
  const [nearbyUnits, setNearbyUnits] = useState<DataSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<FilterState>({})
  const [rangeFilters, setRangeFilters] = useState<RangeFilterState>({})
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null)
  const [activeRangeDropdown, setActiveRangeDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setGuestCards(data.guestCards)
        setNearbyUnits(data.nearbyUnits)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-filter-dropdown]')) {
        setActiveFilterDropdown(null)
        setActiveRangeDropdown(null)
      }
    }
    
    if (activeFilterDropdown || activeRangeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeFilterDropdown, activeRangeDropdown])

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnIndex)
      setSortDirection('asc')
    }
  }

  const currentData = activeTab === 'guests' ? guestCards : nearbyUnits

  // Define which columns are filterable for each tab
  const filterableColumns = useMemo(() => {
    if (activeTab === 'guests') {
      return ['Lead Source', 'Status', 'Pet Preference', 'Last Activity Type', 'Beds']
    } else {
      return ['Beds', 'Baths', 'Location']
    }
  }, [activeTab])

  // Define which columns have range filters
  const rangeFilterableColumns = useMemo(() => {
    if (activeTab === 'guests') {
      return ['Max Rent', 'Monthly Income', 'Credit Score']
    } else {
      return ['Advertised Rent', 'Sqft', 'Similarity']
    }
  }, [activeTab])

  // Get min/max values for range columns
  const columnRanges = useMemo(() => {
    if (!currentData) return {}
    const ranges: { [key: string]: { min: number; max: number; values: number[] } } = {}
    
    rangeFilterableColumns.forEach(colName => {
      const colIndex = currentData.headers.indexOf(colName)
      if (colIndex !== -1) {
        const numericValues: number[] = []
        currentData.rows.forEach(row => {
          const val = parseNumericValue(row[colIndex])
          if (val !== null) numericValues.push(val)
        })
        if (numericValues.length > 0) {
          ranges[colName] = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            values: numericValues.sort((a, b) => a - b)
          }
        }
      }
    })
    return ranges
  }, [currentData, rangeFilterableColumns])

  // Parse numeric value from string (handles $, %, commas)
  function parseNumericValue(str: string): number | null {
    if (!str) return null
    // Handle credit score ranges like "720 to 799"
    if (str.includes(' to ')) {
      const parts = str.split(' to ')
      const avg = (parseInt(parts[0]) + parseInt(parts[1])) / 2
      return isNaN(avg) ? null : avg
    }
    // Handle percentage like "96%"
    if (str.includes('%')) {
      const num = parseFloat(str.replace('%', ''))
      return isNaN(num) ? null : num
    }
    // Remove $, commas, and other non-numeric chars
    const cleaned = str.replace(/[^0-9.-]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  // Update range filter
  const updateRangeFilter = (column: string, type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setRangeFilters(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [type]: numValue
      }
    }))
  }

  // Clear range filter
  const clearRangeFilter = (column: string) => {
    setRangeFilters(prev => {
      const { [column]: _, ...rest } = prev
      return rest
    })
  }

  // Get unique values for each filterable column
  const columnUniqueValues = useMemo(() => {
    if (!currentData) return {}
    const uniqueValues: { [key: string]: string[] } = {}
    
    filterableColumns.forEach(colName => {
      const colIndex = currentData.headers.indexOf(colName)
      if (colIndex !== -1) {
        const values = new Set<string>()
        currentData.rows.forEach(row => {
          if (row[colIndex]) values.add(row[colIndex])
        })
        uniqueValues[colName] = Array.from(values).sort()
      }
    })
    return uniqueValues
  }, [currentData, filterableColumns])

  // Toggle filter value
  const toggleFilter = (column: string, value: string) => {
    setFilters(prev => {
      const current = prev[column] || []
      if (current.includes(value)) {
        const newValues = current.filter(v => v !== value)
        if (newValues.length === 0) {
          const { [column]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [column]: newValues }
      } else {
        return { ...prev, [column]: [...current, value] }
      }
    })
  }

  // Clear all filters for a column
  const clearColumnFilter = (column: string) => {
    setFilters(prev => {
      const { [column]: _, ...rest } = prev
      return rest
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({})
    setRangeFilters({})
  }

  // Count active filters
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)
  const activeRangeFilterCount = Object.values(rangeFilters).filter(r => r.min !== null || r.max !== null).length
  const totalActiveFilters = activeFilterCount + activeRangeFilterCount
  
  // Apply search and filters
  const filteredRows = useMemo(() => {
    if (!currentData) return []
    
    return currentData.rows.filter(row => {
      // Apply search
      if (searchTerm && !row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false
      }
      
      // Apply column filters
      for (const [column, selectedValues] of Object.entries(filters)) {
        if (selectedValues.length === 0) continue
        const colIndex = currentData.headers.indexOf(column)
        if (colIndex !== -1 && !selectedValues.includes(row[colIndex])) {
          return false
        }
      }
      
      // Apply range filters
      for (const [column, range] of Object.entries(rangeFilters)) {
        if (range.min === null && range.max === null) continue
        const colIndex = currentData.headers.indexOf(column)
        if (colIndex === -1) continue
        
        const cellValue = parseNumericValue(row[colIndex])
        if (cellValue === null) return false
        
        if (range.min !== null && cellValue < range.min) return false
        if (range.max !== null && cellValue > range.max) return false
      }
      
      return true
    })
  }, [currentData, searchTerm, filters, rangeFilters])

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortColumn === null) return 0
    const aVal = a[sortColumn] || ''
    const bVal = b[sortColumn] || ''
    
    // Try numeric sort
    const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''))
    const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''))
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
    }
    
    // Fall back to string sort
    return sortDirection === 'asc' 
      ? aVal.localeCompare(bVal) 
      : bVal.localeCompare(aVal)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Tabs */}
      <div className="flex border-b border-chat-border/30">
        <button
          onClick={() => { setActiveTab('guests'); setSearchTerm(''); setSortColumn(null); setFilters({}); setRangeFilters({}); setActiveFilterDropdown(null); setActiveRangeDropdown(null); }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'guests'
              ? 'text-accent-teal border-b-2 border-accent-teal bg-chat-hover/50'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users size={16} />
          Guest Cards
          <span className="ml-1 px-2 py-0.5 text-xs bg-chat-input rounded-full">
            {guestCards?.rows.length || 0}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('units'); setSearchTerm(''); setSortColumn(null); setFilters({}); setRangeFilters({}); setActiveFilterDropdown(null); setActiveRangeDropdown(null); }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'units'
              ? 'text-accent-teal border-b-2 border-accent-teal bg-chat-hover/50'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Building size={16} />
          Nearby Units
          <span className="ml-1 px-2 py-0.5 text-xs bg-chat-input rounded-full">
            {nearbyUnits?.rows.length || 0}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-chat-border/30 space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-chat-input text-gray-200 placeholder-gray-500 pl-10 pr-4 py-2 rounded-lg border border-chat-border/50 focus:outline-none focus:border-accent-teal/50"
            />
          </div>
          {totalActiveFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X size={14} />
              Clear All ({totalActiveFilters})
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          {filterableColumns.map(column => {
            const values = columnUniqueValues[column] || []
            const selectedCount = (filters[column] || []).length
            const isOpen = activeFilterDropdown === column
            
            return (
              <div key={column} className="relative" data-filter-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown(isOpen ? null : column); setActiveRangeDropdown(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedCount > 0
                      ? 'bg-accent-teal/20 border-accent-teal/50 text-accent-teal'
                      : 'bg-chat-input border-chat-border/50 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  {column}
                  {selectedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-accent-teal text-chat-bg rounded-full text-[10px] font-medium">
                      {selectedCount}
                    </span>
                  )}
                  <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-[250px] overflow-y-auto bg-chat-sidebar border border-chat-border/50 rounded-lg shadow-xl">
                    <div className="sticky top-0 bg-chat-sidebar border-b border-chat-border/30 p-2">
                      <button
                        onClick={() => clearColumnFilter(column)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="p-1">
                      {values.map(value => {
                        const isSelected = (filters[column] || []).includes(value)
                        return (
                          <label
                            key={value}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-chat-hover/50 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFilter(column, value)}
                              className="w-3.5 h-3.5 rounded border-gray-600 bg-chat-input text-accent-teal focus:ring-accent-teal/50"
                            />
                            <span className={isSelected ? 'text-gray-200' : 'text-gray-400'}>
                              {value || '(empty)'}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Range Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          {rangeFilterableColumns.map(column => {
            const range = columnRanges[column]
            if (!range) return null
            
            const currentFilter = rangeFilters[column] || { min: null, max: null }
            const hasFilter = currentFilter.min !== null || currentFilter.max !== null
            const isOpen = activeRangeDropdown === column
            
            return (
              <div key={column} className="relative" data-filter-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveRangeDropdown(isOpen ? null : column); setActiveFilterDropdown(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    hasFilter
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                      : 'bg-chat-input border-chat-border/50 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  <SlidersHorizontal size={12} />
                  {column}
                  {hasFilter && (
                    <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-medium">
                      ✓
                    </span>
                  )}
                  <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-[280px] bg-chat-sidebar border border-chat-border/50 rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-300">{column}</span>
                      <button
                        onClick={() => clearRangeFilter(column)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Reset
                      </button>
                    </div>
                    
                    <DualRangeSlider
                      min={range.min}
                      max={range.max}
                      value={{
                        min: currentFilter.min ?? range.min,
                        max: currentFilter.max ?? range.max
                      }}
                      onChange={(newValue) => {
                        setRangeFilters(prev => ({
                          ...prev,
                          [column]: {
                            min: newValue.min === range.min ? null : newValue.min,
                            max: newValue.max === range.max ? null : newValue.max
                          }
                        }))
                      }}
                      prefix={column.includes('Rent') || column.includes('Income') ? '$' : ''}
                      suffix={column === 'Similarity' ? '%' : ''}
                      step={column.includes('Rent') || column.includes('Income') ? 50 : column === 'Similarity' ? 1 : 10}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Active Filters Pills */}
        {totalActiveFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* Category filters */}
            {Object.entries(filters).map(([column, values]) =>
              values.map(value => (
                <span
                  key={`${column}-${value}`}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-accent-teal/20 text-accent-teal rounded-full"
                >
                  <span className="text-gray-400">{column}:</span> {value}
                  <button
                    onClick={() => toggleFilter(column, value)}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
            {/* Range filters */}
            {Object.entries(rangeFilters).map(([column, range]) => {
              if (range.min === null && range.max === null) return null
              const prefix = column.includes('Rent') || column.includes('Income') ? '$' : ''
              const suffix = column === 'Similarity' ? '%' : ''
              let label = ''
              if (range.min !== null && range.max !== null) {
                label = `${prefix}${range.min.toLocaleString()}${suffix} - ${prefix}${range.max.toLocaleString()}${suffix}`
              } else if (range.min !== null) {
                label = `≥ ${prefix}${range.min.toLocaleString()}${suffix}`
              } else if (range.max !== null) {
                label = `≤ ${prefix}${range.max.toLocaleString()}${suffix}`
              }
              return (
                <span
                  key={`range-${column}`}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full"
                >
                  <span className="text-gray-400">{column}:</span> {label}
                  <button
                    onClick={() => clearRangeFilter(column)}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Showing {sortedRows.length} of {currentData?.rows.length || 0} records
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-chat-border/50">
                {currentData?.headers.map((header, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      {sortColumn === idx && (
                        sortDirection === 'asc' 
                          ? <ChevronUp size={14} className="text-accent-teal" />
                          : <ChevronDown size={14} className="text-accent-teal" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-chat-border/30">
              {sortedRows.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-chat-hover/50 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="px-4 py-3 text-gray-300 whitespace-nowrap"
                    >
                      {formatCell(cell, currentData?.headers[cellIdx] || '', activeTab)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatCell(value: string, header: string, tab: 'guests' | 'units'): React.ReactNode {
  if (!value) return <span className="text-gray-600">—</span>
  
  // Format credit score with color
  if (header === 'Credit Score') {
    const score = parseInt(value)
    let color = 'text-gray-300'
    if (value.includes('800') || score >= 800) color = 'text-green-400'
    else if (value.includes('720') || value.includes('740') || (score >= 720 && score < 800)) color = 'text-teal-400'
    else if (value.includes('660') || (score >= 660 && score < 720)) color = 'text-yellow-400'
    else if (value.includes('620') || (score >= 620 && score < 660)) color = 'text-orange-400'
    else if (value.includes('580') || score < 620) color = 'text-red-400'
    return <span className={color}>{value}</span>
  }
  
  // Format status
  if (header === 'Status') {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
        {value}
      </span>
    )
  }
  
  // Format similarity percentage
  if (header === 'Similarity') {
    const pct = parseInt(value)
    let color = 'text-gray-300'
    if (pct >= 90) color = 'text-green-400'
    else if (pct >= 80) color = 'text-teal-400'
    else if (pct >= 70) color = 'text-yellow-400'
    return <span className={`font-medium ${color}`}>{value}</span>
  }
  
  // Format rent values
  if (header.includes('Rent') || header === 'Max Rent') {
    if (value.includes('▲')) {
      return <span className="text-green-400">{value}</span>
    } else if (value.includes('▼')) {
      return <span className="text-red-400">{value}</span>
    }
    return <span className="text-teal-400">{value}</span>
  }
  
  // Format income
  if (header === 'Monthly Income') {
    const income = parseFloat(value)
    return <span className="text-gray-300">${income.toLocaleString()}</span>
  }
  
  // Format square feet
  if (header === 'Square Feet') {
    if (value.includes('▲')) {
      return <span className="text-green-400">{value}</span>
    } else if (value.includes('▼')) {
      return <span className="text-red-400">{value}</span>
    }
  }
  
  // Format pet preference
  if (header === 'Pet Preference') {
    if (value === 'Dogs') return <span>🐕 {value}</span>
    if (value === 'Cats') return <span>🐱 {value}</span>
    if (value === 'Other') return <span>🐾 {value}</span>
  }
  
  return value
}


