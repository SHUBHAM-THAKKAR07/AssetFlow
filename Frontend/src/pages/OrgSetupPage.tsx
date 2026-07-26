import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, FolderTree, UserSquare2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { apiService, toFrontendRole } from '@/lib/apiService'
import type { Department, AssetCategory, User } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Tab = 'departments' | 'categories' | 'employees'

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all"
const inputStyle = { borderColor: '#E7E5EA', color: '#1A1621', background: 'white' }
const labelStyle = { color: '#1A1621' }

const tabStyle = (active: boolean) => active
  ? { background: '#7A3B5E', color: 'white', borderRadius: '10px' }
  : { color: '#6B6470', background: 'transparent' }

export function OrgSetupPage() {
  const [tab, setTab] = useState<Tab>('departments')

  const tabs = [
    { id: 'departments' as Tab, label: 'Departments', icon: FolderTree },
    { id: 'categories' as Tab, label: 'Asset Categories', icon: FolderTree },
    { id: 'employees' as Tab, label: 'Employee Directory', icon: Users },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-[28px] font-bold" style={{ color: '#1A1621' }}>Organization Setup</h1>
        <p className="mt-0.5 text-sm" style={{ color: '#6B6470' }}>Manage departments, asset categories, and employees</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: '#F7F7F9', border: '1px solid #E7E5EA' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={tabStyle(tab === t.id)}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'departments' && <DepartmentsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'employees' && <EmployeesTab />}
    </div>
  )
}

function SectionCard({ title, count, action, children }: { title: string; count: number; action: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E7E5EA' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E7E5EA' }}>
        <h3 className="font-semibold text-sm" style={{ color: '#1A1621' }}>{title} <span style={{ color: '#9C97A3' }}>({count})</span></h3>
        <button onClick={action} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl transition-all hover:brightness-90" style={{ background: '#7A3B5E' }}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function DepartmentsTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [headEmployeeId, setHeadEmployeeId] = useState('')
  const [parentDepartmentId, setParentDepartmentId] = useState('')

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: apiService.getDepartments,
  })

  const { data: rawEmployees = [] } = useQuery({
    queryKey: ['raw-employees'],
    queryFn: apiService.getEmployees,
  })

  const createMutation = useMutation({
    mutationFn: apiService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department created successfully!')
      setShowCreate(false)
      setName('')
      setHeadEmployeeId('')
      setParentDepartmentId('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create department')
    }
  })

  const columns: Column<Department>[] = [
    { key: 'name', header: 'Department', sortable: true, render: r => <span className="font-semibold" style={{ color: '#1A1621' }}>{r.name}</span> },
    { key: 'head', header: 'Head', sortable: true, render: r => r.head ?? '—' },
    { key: 'parent', header: 'Parent', render: r => r.parent ?? <span style={{ color: '#9C97A3' }}>Root</span> },
    { key: 'employeeCount', header: 'Employees', sortable: true, render: r => <span className="font-mono font-semibold" style={{ color: '#1A1621' }}>{r.employeeCount}</span> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: () => (
      <div className="flex gap-1">
        <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-not-allowed" style={{ color: '#9C97A3' }}><Pencil className="w-3.5 h-3.5" /></button>
        <button className="p-1.5 hover:bg-red-50 rounded-lg cursor-not-allowed" style={{ color: '#9C97A3' }}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ]

  const handleCreate = () => {
    if (!name) return toast.error('Department Name is required')
    createMutation.mutate({
      name,
      headEmployeeId: headEmployeeId || undefined,
      parentDepartmentId: parentDepartmentId || undefined,
    })
  }

  return (
    <>
      <SectionCard title="Departments" count={departments.length} action={() => setShowCreate(true)}>
        <DataTable columns={columns} data={departments} />
      </SectionCard>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Department"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50" style={{ borderColor: '#E7E5EA', color: '#6B6470' }}>Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:brightness-90" style={{ background: '#7A3B5E' }}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Department Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Engineering"
              onFocus={e => e.target.style.borderColor = '#7A3B5E'} onBlur={e => e.target.style.borderColor = '#E7E5EA'} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Department Head</label>
            <select value={headEmployeeId} onChange={e => setHeadEmployeeId(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '10px 14px' }}>
              <option value="">Select head employee (Optional)</option>
              {rawEmployees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Parent Department</label>
            <select value={parentDepartmentId} onChange={e => setParentDepartmentId(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '10px 14px' }}>
              <option value="">None (Root)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
}

function CategoriesTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: apiService.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: apiService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Asset category created successfully!')
      setShowCreate(false)
      setName('')
      setCode('')
      setDescription('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category')
    }
  })

  const handleCreate = () => {
    if (!name) return toast.error('Category Name is required')
    if (code.trim().length < 2) return toast.error('Code must be at least 2 characters')
    createMutation.mutate({ name, code: code.toUpperCase(), description })
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E7E5EA' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E7E5EA' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#1A1621' }}>Asset Categories <span style={{ color: '#9C97A3' }}>({categories.length})</span></h3>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl hover:brightness-90" style={{ background: '#7A3B5E' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat: AssetCategory) => (
            <div key={cat.id} className="rounded-2xl p-4 transition-all hover:shadow-sm cursor-pointer group" style={{ border: '1px solid #E7E5EA' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1A1621' }}>{cat.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9C97A3' }}>{cat.description || 'No description'}</p>
                </div>
                <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 cursor-not-allowed" style={{ color: '#9C97A3' }}><Pencil className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[20px] font-bold tabular-nums" style={{ color: '#7A3B5E' }}>{cat.assetCount.toLocaleString()}</span>
                <span className="text-xs" style={{ color: '#9C97A3' }}>total assets</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Asset Category"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50" style={{ borderColor: '#E7E5EA', color: '#6B6470' }}>Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:brightness-90" style={{ background: '#7A3B5E' }}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Category Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Laptops" onFocus={e => e.target.style.borderColor = '#7A3B5E'} onBlur={e => e.target.style.borderColor = '#E7E5EA'} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Category Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={inputCls} style={inputStyle} placeholder="e.g. LAP" maxLength={20} />
            <p className="text-xs mt-1" style={{ color: '#9C97A3' }}>A short unique code, at least 2 letters (e.g. LAP for Laptops)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} style={inputStyle} rows={3} placeholder="Provide category details…" />
          </div>
          <div className="pt-2" style={{ borderTop: '1px solid #E7E5EA' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#1A1621' }}>Category Schema Custom Fields</p>
            <p className="text-xs" style={{ color: '#9C97A3' }}>Custom schema fields can be created dynamically via direct dynamic uploads.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}

function EmployeesTab() {
  const queryClient = useQueryClient()
  const [showPromote, setShowPromote] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [targetRole, setTargetRole] = useState('asset_manager')

  const { data: rawEmployees = [] } = useQuery({
    queryKey: ['raw-employees'],
    queryFn: apiService.getEmployees,
  })

  // Map backend employees representation to type User
  const employeesList: User[] = rawEmployees.map((e: any) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`.trim() || e.email,
    email: e.email,
    role: toFrontendRole(e.roles?.[0] || 'employee'),
    department: e.department?.name,
  }))

  const promoteMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) => apiService.promoteUser(userId, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-employees'] })
      toast.success('Employee role promoted successfully!')
      setShowPromote(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to promote employee role')
    }
  })

  const columns: Column<User>[] = [
    { key: 'name', header: 'Employee', sortable: true, render: r => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7A3B5E, #3D1F35)' }}>{r.name.charAt(0)}</div>
        <div><p className="text-sm font-semibold" style={{ color: '#1A1621' }}>{r.name}</p><p className="text-xs" style={{ color: '#9C97A3' }}>{r.email}</p></div>
      </div>
    )},
    { key: 'department', header: 'Department', sortable: true, render: r => r.department ?? <span style={{ color: '#9C97A3' }}>—</span> },
    { key: 'role', header: 'Role', render: r => <StatusBadge status={r.role} /> },
    { key: 'actions', header: '', render: r => (
      <button onClick={() => { setSelected(r); setTargetRole('asset_manager'); setShowPromote(true) }} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all hover:brightness-95 cursor-pointer" style={{ background: '#F0E8ED', color: '#7A3B5E', border: 'none' }}>
        <UserSquare2 className="w-3.5 h-3.5" /> Promote
      </button>
    )},
  ]

  const handlePromote = () => {
    if (!selected) return
    promoteMutation.mutate({
      userId: selected.id,
      roleName: targetRole,
    })
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E7E5EA' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E7E5EA' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#1A1621' }}>Employee Directory <span style={{ color: '#9C97A3' }}>({employeesList.length})</span></h3>
        </div>
        <div className="p-5"><DataTable columns={columns} data={employeesList} /></div>
      </div>
      <Modal open={showPromote} onClose={() => setShowPromote(false)} title="Promote Employee"
        footer={
          <>
            <button onClick={() => setShowPromote(false)} className="px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50" style={{ borderColor: '#E7E5EA', color: '#6B6470' }}>Cancel</button>
            <button onClick={handlePromote} className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:brightness-90" style={{ background: '#7A3B5E' }}>
              {promoteMutation.isPending ? 'Confirming…' : 'Confirm Promotion →'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: '#F7F7F9', border: '1px solid #E7E5EA' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #7A3B5E, #3D1F35)' }}>{selected.name.charAt(0)}</div>
              <div><p className="font-semibold text-sm" style={{ color: '#1A1621' }}>{selected.name}</p><p className="text-xs" style={{ color: '#9C97A3' }}>{selected.email}</p></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Promote to</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '10px 14px' }}>
                <option value="asset_manager">Asset Manager</option>
                <option value="department_head">Department Head</option>
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
                <option value="technician">Technician</option>
              </select>
            </div>
            <div className="p-3 rounded-xl" style={{ background: '#FEF3E2', border: '1px solid #FCD9A0' }}>
              <p className="text-xs font-medium" style={{ color: '#D97706' }}>⚠️ Changing a user's role updates their access permissions immediately.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
export default OrgSetupPage;
