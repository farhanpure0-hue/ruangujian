import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Building2, Check, ImagePlus, Pencil, Plus, Save, Search, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react'
import { db } from '../../db/db.js'
import { hashPassword } from '../../utils/hash.js'

const tabs = [
  { id: 'school', label: 'Profil sekolah', icon: Building2 },
  { id: 'staff', label: 'Guru & operator', icon: ShieldCheck },
  { id: 'students', label: 'Murid / peserta', icon: UsersRound },
]

const fieldClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100'
const panelClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm'

async function readImage(file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('Pilih berkas gambar.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran logo maksimal 2 MB.')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Logo gagal dibaca.'))
    reader.readAsDataURL(file)
  })
}

function MasterTable({ headers, children, empty, colSpan }) {
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children || <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffEditor({ initial, subjects, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    nama: initial?.nama ?? '',
    username: initial?.account?.username ?? '',
    nip: initial?.nip ?? '',
    jabatan: initial?.jabatan ?? '',
    mapelId: initial?.mapelId ?? '',
    role: initial?.account?.role ?? 'guru',
    aktif: initial?.account?.aktif ?? true,
    password: '',
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.nama.trim() || !form.username.trim() || (!initial?.account && !form.password)) {
      setError('Nama, nama pengguna, dan kata sandi untuk akun baru wajib diisi.')
      return
    }
    if (!['guru', 'pengawas'].includes(form.role)) {
      setError('Pilih peran Guru atau Pengawas.')
      return
    }

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (saveError) {
      console.error('Gagal menyimpan data guru/operator:', saveError)
      setError(saveError.message || 'Data guru/operator gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="staff-title" className="mx-auto my-4 max-w-2xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Data master</p><h2 id="staff-title" className="mt-1 text-xl font-bold text-navy-950">{initial ? 'Ubah guru/operator' : 'Tambah guru/operator'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm font-medium">Nama lengkap<input className={fieldClass} required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} /></label>
          <label className="text-sm font-medium">Jabatan<input className={fieldClass} value={form.jabatan} onChange={(event) => setForm({ ...form, jabatan: event.target.value })} placeholder="Contoh: Guru Matematika / Operator" /></label>
          <label className="text-sm font-medium">Nama pengguna<input className={fieldClass} required autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label className="text-sm font-medium">NIP / ID pegawai<input className={fieldClass} value={form.nip} onChange={(event) => setForm({ ...form, nip: event.target.value })} /></label>
          <label className="text-sm font-medium">Hak akses<select className={fieldClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="guru">Guru — bank soal dan laporan</option><option value="pengawas">Pengawas — hanya dasbor dan monitoring</option></select></label>
          <label className="text-sm font-medium">Mata pelajaran (opsional)<select className={fieldClass} value={form.mapelId} onChange={(event) => setForm({ ...form, mapelId: event.target.value })}><option value="">Tidak ditetapkan</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.nama}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">{initial?.account ? 'Kata sandi baru (kosongkan jika tidak diubah)' : 'Kata sandi awal'}<input className={fieldClass} type="password" autoComplete="new-password" required={!initial?.account} minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.aktif} onChange={(event) => setForm({ ...form, aktif: event.target.checked })} className="h-4 w-4 accent-blue-700" />Akun aktif</label>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Batal</button>
            <button disabled={saving} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan data'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function StudentEditor({ initial, classes, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    nama: initial?.nama ?? '',
    nisn: initial?.nisn ?? '',
    nomorPeserta: initial?.nomorPeserta ?? '',
    kelasId: initial?.kelasId ?? classes[0]?.id ?? '',
    rombel: initial?.rombel ?? '',
    aktif: initial?.aktif ?? true,
    password: '',
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.nama.trim() || !form.nisn.trim() || !form.nomorPeserta.trim() || !form.kelasId) {
      setError('Nama, NISN, nomor peserta, dan kelas wajib diisi.')
      return
    }
    if (!initial && !form.password) {
      setError('Kata sandi awal wajib diisi.')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (saveError) {
      console.error('Gagal menyimpan data peserta:', saveError)
      setError(saveError.message || 'Data peserta gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="student-title" className="mx-auto my-4 max-w-2xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Data master</p><h2 id="student-title" className="mt-1 text-xl font-bold text-navy-950">{initial ? 'Ubah data peserta' : 'Tambah peserta'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Nama lengkap<input className={fieldClass} required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} /></label>
          <label className="text-sm font-medium">NISN<input className={fieldClass} required value={form.nisn} onChange={(event) => setForm({ ...form, nisn: event.target.value })} /></label>
          <label className="text-sm font-medium">Nomor peserta<input className={fieldClass} required value={form.nomorPeserta} onChange={(event) => setForm({ ...form, nomorPeserta: event.target.value })} /></label>
          <label className="text-sm font-medium">Kelas<select className={fieldClass} required value={form.kelasId} onChange={(event) => setForm({ ...form, kelasId: event.target.value, rombel: classes.find((item) => item.id === Number(event.target.value))?.nama ?? '' })}><option value="">Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></label>
          <label className="text-sm font-medium">Rombel<input className={fieldClass} value={form.rombel} onChange={(event) => setForm({ ...form, rombel: event.target.value })} placeholder="Contoh: XI IPA 1" /></label>
          <label className="text-sm font-medium sm:col-span-2">{initial?.account ? 'Kata sandi baru (opsional)' : 'Kata sandi awal'}<input className={fieldClass} type="password" autoComplete="new-password" required={!initial?.account} minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.aktif} onChange={(event) => setForm({ ...form, aktif: event.target.checked })} className="h-4 w-4 accent-blue-700" />Peserta aktif</label>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Batal</button>
            <button disabled={saving} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan data'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('school')
  const [staffEditor, setStaffEditor] = useState(null)
  const [studentEditor, setStudentEditor] = useState(null)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const data = useLiveQuery(async () => {
    const [settings, staff, users, students, classes, subjects] = await Promise.all([
      db.pengaturan.get('identitasSekolah'),
      db.guru.toArray(),
      db.users.toArray(),
      db.siswa.toArray(),
      db.kelas.toArray(),
      db.mapel.toArray(),
    ])
    const accountsByGuruId = new Map(users.filter((item) => item.guruId).map((item) => [item.guruId, item]))
    const accountsByStudentId = new Map(users.filter((item) => item.siswaId).map((item) => [item.siswaId, item]))
    return {
      profile: settings?.nilai ?? { nama: '', alamat: '', kepalaSekolah: '', logo: null, npsn: '' },
      staff: staff.map((item) => ({ ...item, account: accountsByGuruId.get(item.id) })),
      students: students.map((item) => ({ ...item, account: accountsByStudentId.get(item.id) })),
      classes,
      subjects,
    }
  }, [])
  const classNames = useMemo(() => new Map((data?.classes ?? []).map((item) => [item.id, item.nama])), [data?.classes])

  if (!data) return <p className="py-10 text-center text-sm text-slate-500" role="status">Memuat data master...</p>

  function showNotice(message, isError = false) {
    setNotice(isError ? '' : message)
    setError(isError ? message : '')
    window.setTimeout(() => {
      setNotice('')
      setError('')
    }, 4500)
  }

  async function saveProfile(profile) {
    setSavingProfile(true)
    setError('')
    try {
      await db.pengaturan.put({ kunci: 'identitasSekolah', nilai: profile })
      showNotice('Profil sekolah berhasil disimpan.')
    } catch (saveError) {
      console.error('Gagal menyimpan profil sekolah:', saveError)
      showNotice(`Profil sekolah gagal disimpan: ${saveError.message}`, true)
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveStaff(form) {
    const username = form.username.trim()
    const nip = form.nip.trim()
    const duplicateAccount = await db.users.where('username').equals(username).first()
    if (duplicateAccount && duplicateAccount.id !== staffEditor?.account?.id) {
      throw new Error('Nama pengguna sudah dipakai akun lain.')
    }
    if (nip) {
      const duplicateStaff = await db.guru.where('nip').equals(nip).first()
      if (duplicateStaff && duplicateStaff.id !== staffEditor?.id) {
        throw new Error('NIP/ID pegawai sudah terdaftar.')
      }
    }
    if (username === 'admin') {
      throw new Error('Nama pengguna admin tidak dapat digunakan untuk akun staf.')
    }

    const passwordHash = form.password ? await hashPassword(form.password) : undefined
    await db.transaction('rw', [db.guru, db.users], async () => {
      const staffData = {
        nip: nip || null,
        nama: form.nama.trim(),
        jabatan: form.jabatan.trim(),
        mapelId: form.mapelId ? Number(form.mapelId) : null,
        aktif: form.aktif,
      }
      let guruId = staffEditor?.id
      if (guruId) await db.guru.update(guruId, staffData)
      else guruId = await db.guru.add(staffData)

      const accountData = {
        username,
        nama: form.nama.trim(),
        role: form.role,
        guruId,
        aktif: form.aktif,
        jabatan: form.jabatan.trim(),
        ...(passwordHash ? { passwordHash } : {}),
      }
      if (staffEditor?.account) await db.users.update(staffEditor.account.id, accountData)
      else {
        if (!passwordHash) throw new Error('Kata sandi awal wajib diisi.')
        await db.users.add(accountData)
      }
    })
    showNotice('Data guru/operator dan akun berhasil disimpan.')
  }

  async function deactivateStaff(staff) {
    if (!window.confirm(`Nonaktifkan akun ${staff.nama}? Riwayat akun tetap disimpan.`)) return
    try {
      await db.transaction('rw', [db.guru, db.users], async () => {
        await db.guru.update(staff.id, { aktif: false })
        if (staff.account) await db.users.update(staff.account.id, { aktif: false })
      })
      showNotice('Akun guru/operator dinonaktifkan.')
    } catch (actionError) {
      console.error('Gagal menonaktifkan akun staf:', actionError)
      showNotice(`Akun gagal dinonaktifkan: ${actionError.message}`, true)
    }
  }

  async function saveStudent(form) {
    const nisn = form.nisn.trim()
    const nomorPeserta = form.nomorPeserta.trim()
    const existingNisn = await db.siswa.where('nisn').equals(nisn).first()
    const existingNumber = await db.siswa.where('nomorPeserta').equals(nomorPeserta).first()
    if (existingNisn && existingNisn.id !== studentEditor?.id) throw new Error('NISN sudah terdaftar.')
    if (existingNumber && existingNumber.id !== studentEditor?.id) throw new Error('Nomor peserta sudah terdaftar.')
    const studentAccount = studentEditor?.account
      ?? (studentEditor?.id ? await db.users.where('siswaId').equals(studentEditor.id).first() : null)
    const usernameAccount = await db.users.where('username').equals(nisn).first()
    if (usernameAccount && usernameAccount.id !== studentAccount?.id) {
      throw new Error('NISN ini sudah digunakan sebagai nama pengguna akun lain.')
    }

    const passwordHash = form.password ? await hashPassword(form.password) : undefined
    await db.transaction('rw', [db.siswa, db.users], async () => {
      const studentData = {
        nama: form.nama.trim(),
        nisn,
        nomorPeserta,
        kelasId: Number(form.kelasId),
        rombel: form.rombel.trim() || classNames.get(Number(form.kelasId)) || '',
        aktif: form.aktif,
      }
      let studentId = studentEditor?.id
      if (studentId) await db.siswa.update(studentId, studentData)
      else studentId = await db.siswa.add(studentData)

      const account = studentAccount ?? await db.users.where('siswaId').equals(studentId).first()
      const accountData = {
        username: nisn,
        nama: form.nama.trim(),
        role: 'siswa',
        siswaId: studentId,
        aktif: form.aktif,
        ...(passwordHash ? { passwordHash } : {}),
      }
      if (account) await db.users.update(account.id, accountData)
      else {
        if (!passwordHash) throw new Error('Kata sandi awal wajib diisi.')
        await db.users.add(accountData)
      }
    })
    showNotice('Data peserta dan akun login berhasil disimpan.')
  }

  async function deactivateStudent(student) {
    if (!window.confirm(`Nonaktifkan peserta ${student.nama}? Data dan riwayat ujian akan tetap disimpan.`)) return
    try {
      await db.transaction('rw', [db.siswa, db.users], async () => {
        await db.siswa.update(student.id, { aktif: false })
        if (student.account) await db.users.update(student.account.id, { aktif: false })
      })
      showNotice('Peserta dinonaktifkan tanpa menghapus riwayat ujian.')
    } catch (actionError) {
      console.error('Gagal menonaktifkan peserta:', actionError)
      showNotice(`Peserta gagal dinonaktifkan: ${actionError.message}`, true)
    }
  }

  const staffRows = data.staff.filter((staff) => {
    const query = search.trim().toLocaleLowerCase('id')
    return !query || [staff.nama, staff.nip, staff.jabatan, staff.account?.username].some((value) => value?.toLocaleLowerCase('id').includes(query))
  })
  const studentRows = data.students.filter((student) => {
    const query = search.trim().toLocaleLowerCase('id')
    return !query || [student.nama, student.nisn, student.nomorPeserta, student.rombel].some((value) => value?.toLocaleLowerCase('id').includes(query))
  })
  const selectedTab = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-800">Administrasi sebelum ujian</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-950">Data Master</h1>
        <p className="mt-2 text-sm text-slate-600">Kelola identitas sekolah, akun tenaga pendidik/operator, dan data murid atau peserta ujian.</p>
      </header>

      {notice && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Check size={17} />{notice}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-200/70 p-1.5" role="tablist" aria-label="Bagian data master">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => { setActiveTab(id); setSearch('') }} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === id ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Icon size={17} aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'school' && <SchoolProfile profile={data.profile} onSave={saveProfile} saving={savingProfile} />}

      {activeTab === 'staff' && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">Akun Guru dapat mengelola bank soal. Akun Pengawas hanya dapat membuka dasbor dan monitoring.</p>
            <button type="button" onClick={() => setStaffEditor({})} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Plus size={17} />Tambah guru/operator</button>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Cari nama, akun, jabatan, atau NIP..." />
          <MasterTable headers={['Nama / jabatan', 'Akun', 'NIP / mapel', 'Hak akses', 'Status', 'Aksi']} colSpan={6} empty="Belum ada data guru/operator.">
            {staffRows.map((staff) => (
              <tr key={staff.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{staff.nama}<p className="text-xs font-normal text-slate-500">{staff.jabatan || 'Jabatan belum diatur'}</p></td>
                <td className="px-4 py-3 font-mono text-slate-600">{staff.account?.username ?? 'Akun belum dibuat'}</td>
                <td className="px-4 py-3 text-slate-600">{staff.nip || '—'}<p className="text-xs text-slate-500">{data.subjects.find((subject) => subject.id === staff.mapelId)?.nama ?? '—'}</p></td>
                <td className="px-4 py-3">{staff.account?.role === 'pengawas' ? 'Pengawas' : 'Guru'}</td>
                <td className="px-4 py-3"><Status active={staff.aktif && staff.account?.aktif} /></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button type="button" onClick={() => setStaffEditor(staff)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-800" aria-label={`Ubah ${staff.nama}`}><Pencil size={16} /></button><button type="button" onClick={() => deactivateStaff(staff)} disabled={!staff.aktif} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40" aria-label={`Nonaktifkan ${staff.nama}`}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </MasterTable>
        </section>
      )}

      {activeTab === 'students' && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">Data ini digunakan untuk daftar peserta dan login menggunakan NISN atau nomor peserta.</p>
            <button type="button" onClick={() => setStudentEditor({})} disabled={!data.classes.length} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"><Plus size={17} />Tambah peserta</button>
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Cari nama, NISN, nomor peserta, atau rombel..." />
          <MasterTable headers={['Nama peserta', 'NISN', 'Nomor peserta', 'Kelas / rombel', 'Status', 'Aksi']} colSpan={6} empty="Belum ada data murid atau peserta.">
            {studentRows.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{student.nama}</td><td className="px-4 py-3 font-mono text-slate-600">{student.nisn}</td><td className="px-4 py-3 font-mono text-slate-600">{student.nomorPeserta}</td><td className="px-4 py-3">{classNames.get(student.kelasId) ?? '—'}<p className="text-xs text-slate-500">{student.rombel ?? '—'}</p></td><td className="px-4 py-3"><Status active={student.aktif && student.account?.aktif} /></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button type="button" onClick={() => setStudentEditor(student)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-800" aria-label={`Ubah ${student.nama}`}><Pencil size={16} /></button><button type="button" onClick={() => deactivateStudent(student)} disabled={!student.aktif} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40" aria-label={`Nonaktifkan ${student.nama}`}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </MasterTable>
        </section>
      )}

      {selectedTab && activeTab !== 'school' && activeTab !== 'staff' && activeTab !== 'students' && <p>{selectedTab.label}</p>}
      {staffEditor && <StaffEditor initial={staffEditor.id ? staffEditor : null} subjects={data.subjects} onClose={() => setStaffEditor(null)} onSave={saveStaff} />}
      {studentEditor && <StudentEditor initial={studentEditor.id ? studentEditor : null} classes={data.classes} onClose={() => setStudentEditor(null)} onSave={saveStudent} />}
    </div>
  )
}

function SchoolProfile({ profile, onSave, saving }) {
  const [form, setForm] = useState(profile)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await onSave(form)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function handleLogo(event) {
    try {
      const logo = await readImage(event.target.files?.[0])
      if (logo) setForm((current) => ({ ...current, logo }))
    } catch (logoError) {
      setError(logoError.message)
    }
    event.target.value = ''
  }

  return (
    <form onSubmit={submit} className={`${panelClass} max-w-4xl p-5 sm:p-7`}>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-800"><Building2 size={22} /></div>
        <div><h2 className="font-bold text-slate-900">Identitas institusi</h2><p className="text-sm text-slate-500">Informasi ini disimpan lokal dan dapat digunakan pada dokumen ujian.</p></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Nama sekolah / institusi<input className={fieldClass} required value={form.nama ?? ''} onChange={(event) => setForm({ ...form, nama: event.target.value })} placeholder="Nama resmi sekolah" /></label>
        <label className="text-sm font-medium">NPSN / kode institusi<input className={fieldClass} value={form.npsn ?? ''} onChange={(event) => setForm({ ...form, npsn: event.target.value })} /></label>
        <label className="text-sm font-medium">Kepala sekolah<input className={fieldClass} value={form.kepalaSekolah ?? ''} onChange={(event) => setForm({ ...form, kepalaSekolah: event.target.value })} /></label>
        <label className="text-sm font-medium sm:col-span-2">Alamat<textarea className={fieldClass} rows={3} value={form.alamat ?? ''} onChange={(event) => setForm({ ...form, alamat: event.target.value })} /></label>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="school-logo">Logo sekolah</label>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {form.logo ? <img src={form.logo} alt="Pratinjau logo sekolah" className="h-20 w-20 rounded-xl border border-slate-200 object-contain p-2" /> : <div className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400"><Building2 size={27} /></div>}
            <div><label htmlFor="school-logo" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus size={16} />Pilih logo</label><input id="school-logo" className="sr-only" type="file" accept="image/*" onChange={handleLogo} /><p className="mt-1 text-xs text-slate-500">PNG, JPG, atau SVG · maksimal 2 MB</p>{form.logo && <button type="button" onClick={() => setForm({ ...form, logo: null })} className="mt-1 text-xs font-semibold text-red-700">Hapus logo</button>}</div>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="flex justify-end border-t border-slate-100 pt-4 sm:col-span-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{saving ? 'Menyimpan...' : 'Simpan profil sekolah'}</button></div>
      </div>
    </form>
  )
}

function SearchBox({ value, onChange, placeholder }) {
  return <label className="relative block max-w-lg"><span className="sr-only">Cari data</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className={`${fieldClass} mt-0 pl-9`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function Status({ active }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{active ? 'Aktif' : 'Nonaktif'}</span>
}
