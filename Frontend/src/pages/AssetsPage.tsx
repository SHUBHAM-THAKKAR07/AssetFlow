import { useState } from 'react'
import { Search, Plus, Filter, X, Package, MapPin, User, History, Wrench, Upload } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SlideOverPanel } from '@/components/shared/SlideOverPanel'
import { Modal } from '@/components/shared/Modal'
import { apiService } from '@/lib/apiService'
import type { Asset } from '@/types'
import { formatDate } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

const STATUSES = ['Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed']

export function AssetsPage() {
  const { user } = useAuth()
  const isEmployee = user?.role === 'Employee'
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'allocation' | 'maintenance'>('info')

  // Form states for registration
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [purchaseValue, setPurchaseValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [warrantyExpiry, setWarrantyExpiry] = useState('')

  // Queries using TanStack Query
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiService.getAssets(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: apiService.getCategories,
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: apiService.getLocations,
  })

  const createMutation = useMutation({
    mutationFn: apiService.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      toast.success('Asset registered successfully!')
      setShowRegister(false)
      // reset
      setName('')
      setCategoryId('')
      setLocationId('')
      setPurchaseValue('')
      setPurchaseDate('')
      setWarrantyExpiry('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register asset')
    }
  })

  const filtered = assets.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !search || a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || (a.assignedTo ?? '').toLowerCase().includes(q)
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(a.status)
    const matchCategory = !categoryFilter || a.categoryId === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  const toggleStatus = (s: string) => setStatusFilter(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s])

  const handleRegister = () => {
    if (!name) return toast.error('Asset Name is required')
    if (!categoryId) return toast.error('Asset Category is required')
    createMutation.mutate({
      name,
      categoryId,
      locationId: locationId || undefined,
      purchaseValue: purchaseValue ? Number(purchaseValue) : undefined,
      purchaseDate: purchaseDate || undefined,
      warrantyExpiry: warrantyExpiry || undefined,
    })
  }

  const columns: Column<Asset>[] = [
    { key: 'tag', header: 'Asset Tag', sortable: true, render: r => <span className="font-mono text-xs font-semibold px-2 py-1 rounded" style={{ background: '#F0E8ED', color: '#7A3B5E' }}>{r.tag}</span> },
    { key: 'name', header: 'Asset Name', sortable: true, render: r => <span className="font-semibold" style={{ color: '#1A1621' }}>{r.name}</span> },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'condition', header: 'Condition', render: r => <StatusBadge status={r.condition} /> },
    { key: 'location', header: 'Location', render: r => <span className="flex items-center gap-1" style={{ color: '#6B6470' }}><MapPin className="w-3.5 h-3.5" style={{ color: '#9C97A3' }} />{r.location}</span> },
    { key: 'assignedTo', header: 'Assigned To', render: r => r.assignedTo ? <span className="flex items-center gap-1" style={{ color: '#6B6470' }}><User className="w-3.5 h-3.5" style={{ color: '#9C97A3' }} />{r.assignedTo}</span> : <span style={{ color: '#9C97A3' }}>—</span> },
  ]

  return (
    <>
      <div className="space-y-5 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: '#1A1621' }}>Asset Registry</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B6470' }}>{filtered.length} assets found</p>
          </div>
          {!isEmployee && (
            <button onClick={() => setShowRegister(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-all hover:brightness-90 cursor-pointer" style={{ background: '#7A3B5E' }}>
              <Plus className="w-4 h-4" /> Register Asset
            </button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #E7E5EA' }}>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9C97A3' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, tag, assignee…" className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#E7E5EA', color: '#1A1621' }}
                onFocus={e => e.target.style.borderColor = '#7A3B5E'} onBlur={e => e.target.style.borderColor = '#E7E5EA'} />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: '#E7E5EA', color: '#6B6470' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#9C97A3' }}><Filter className="w-3.5 h-3.5" /> Status:</span>
            {STATUSES.map(s => (
              <button key={s} onClick={() => toggleStatus(s)} className="px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer"
                style={statusFilter.includes(s) ? { background: '#7A3B5E', color: 'white', borderColor: '#7A3B5E' } : { background: 'white', color: '#6B6470', borderColor: '#E7E5EA' }}>
                {s}
              </button>
            ))}
            {(statusFilter.length > 0 || categoryFilter) && (
              <button onClick={() => { setStatusFilter([]); setCategoryFilter('') }} className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#C0392B' }}>
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E7E5EA' }}>
          <DataTable columns={columns} data={filtered} onRowClick={setSelectedAsset}
            emptyState={<div className="flex flex-col items-center gap-3 py-12"><Package className="w-10 h-10" style={{ color: '#E7E5EA' }} /><p style={{ color: '#9C97A3' }}>No assets match your filters</p></div>}
          />
        </div>
      </div>

      {/* Detail Panel */}
      <SlideOverPanel open={!!selectedAsset} onClose={() => setSelectedAsset(null)} title={selectedAsset?.name ?? ''} subtitle={selectedAsset?.tag} width="xl">
        {selectedAsset && (
          <div className="p-6 space-y-5">
            <div className="w-full h-36 rounded-2xl flex items-center justify-center" style={{ background: '#F7F7F9', border: '1px solid #E7E5EA' }}>
              <Package className="w-12 h-12" style={{ color: '#E7E5EA' }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selectedAsset.status} />
              <StatusBadge status={selectedAsset.condition} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F7F7F9', border: '1px solid #E7E5EA' }}>
              {(['info', 'allocation', 'maintenance'] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer"
                  style={detailTab === t ? { background: 'white', color: '#1A1621', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#9C97A3' }}>
                  {t === 'allocation' ? 'Alloc. History' : t === 'maintenance' ? 'Maint. History' : 'Info'}
                </button>
              ))}
            </div>

            {detailTab === 'info' && (
              <div className="space-y-0">
                {[
                  ['Asset Tag', <span key="tag" className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#F0E8ED', color: '#7A3B5E' }}>{selectedAsset.tag}</span>],
                  ['Category', selectedAsset.category], ['Location', selectedAsset.location],
                  ['Department', selectedAsset.department ?? '—'], ['Assigned To', selectedAsset.assignedTo ?? '—'],
                  ['Purchase Date', selectedAsset.purchaseDate ? formatDate(selectedAsset.purchaseDate) : '—'],
                  ['Purchase Value', selectedAsset.purchaseValue ? `₹${selectedAsset.purchaseValue.toLocaleString('en-IN')}` : '—'],
                  ['Warranty Expiry', selectedAsset.warrantyExpiry ? formatDate(selectedAsset.warrantyExpiry) : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #F7F7F9' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9C97A3', letterSpacing: '0.06em' }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: '#1A1621' }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {detailTab === 'allocation' && <div className="py-12 text-center text-sm" style={{ color: '#9C97A3' }}><History className="w-8 h-8 mx-auto mb-2" style={{ color: '#E7E5EA' }} />No allocation history</div>}
            {detailTab === 'maintenance' && <div className="py-12 text-center text-sm" style={{ color: '#9C97A3' }}><Wrench className="w-8 h-8 mx-auto mb-2" style={{ color: '#E7E5EA' }} />No maintenance history</div>}
          </div>
        )}
      </SlideOverPanel>

      {/* Register Modal */}
      <Modal open={showRegister} onClose={() => setShowRegister(false)} title="Register New Asset" size="xl"
        footer={
          <>
            <button onClick={() => setShowRegister(false)} className="px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50 cursor-pointer" style={{ borderColor: '#E7E5EA', color: '#6B6470' }}>Cancel</button>
            <button onClick={handleRegister} className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:brightness-90 cursor-pointer" style={{ background: '#7A3B5E' }}>
              {createMutation.isPending ? 'Registering…' : 'Register Asset →'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Asset Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E7E5EA' }} placeholder='e.g. MacBook Pro 14"'
                onFocus={e => e.target.style.borderColor = '#7A3B5E'} onBlur={e => e.target.style.borderColor = '#E7E5EA'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: '#E7E5EA', color: '#1A1621' }}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Location</label>
              <select value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: '#E7E5EA', color: '#1A1621' }}>
                <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.building} {loc.floor ? `Floor ${loc.floor}` : ''} {loc.room ? `Room ${loc.room}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Purchase Value (₹)</label>
              <input type="number" value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E7E5EA' }}
                onFocus={e => e.target.style.borderColor = '#7A3B5E'} onBlur={e => e.target.style.borderColor = '#E7E5EA'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: '#E7E5EA' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Warranty Expiry</label>
              <input type="date" value={warrantyExpiry} onChange={e => setWarrantyExpiry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: '#E7E5EA' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1621' }}>Auto-generated Tag</label>
            <div className="px-3.5 py-2.5 rounded-xl font-mono text-sm font-semibold" style={{ background: '#F0E8ED', border: '1px solid #D8B8CA', color: '#7A3B5E' }}>
              AF-{String(assets.length + 1).padStart(4, '0')}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
export default AssetsPage;
