import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Activity,
  CalendarClock,
  Check,
  ClipboardList,
  Download,
  KeyRound,
  LockKeyhole,
  Printer,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useParams } from 'react-router-dom'
import { db } from '../../db/db.js'
import { useAuth } from '../../hooks/useAuth.js'

const SECTIONS = {
  jadwal: { title: 'Jadwal ujian', description: 'Buat jadwal dan tetapkan peserta ujian.', adminOnly: false },
  token: { title: 'Token / kode ujian', description: 'Lihat dan segarkan kode masuk ujian.', adminOnly: false },
  keamanan: { title: 'Pengaturan keamanan', description: 'Atur batas waktu minimum dan pengamanan sesi ujian.', adminOnly: true },
  'daftar-ujian': { title: 'Daftar ujian', description: 'Lihat status dan detail seluruh ujian lokal.', adminOnly: false },
  dasbor: { title: 'Dasbor pengerjaan', description: 'Ringkasan peserta yang belum mulai, sedang mengerjakan, atau selesai.', adminOnly: false },
  monitoring: { title: 'Monitoring pengawas', description: 'Pantau progres peserta dan catatan pelanggaran ujian.', adminOnly: false },
  'rekap-nilai': { title: 'Rekap nilai', description: 'Lihat nilai dan unduh rekap ujian ke Excel.', adminOnly: false },
  'analisis-butir': { title: 'Analisis butir soal', description: 'Tinjau tingkat kesukaran dan sebaran jawaban peserta.', adminOnly: false },
  'cetak-dokumen': { title: 'Cetak dokumen', description: 'Cetak daftar hadir dan daftar peserta sebagai PDF melalui dialog cetak browser.', adminOnly: false },
  'manajemen-peran': { title: 'Manajemen peran', description: 'Atur peran dan status akun pengguna lokal.', adminOnly: true },
  'kunci-aktivitas': { title: 'Kunci aktivitas', description: 'Tutup sementara akses peserta ke sesi ujian pada perangkat ini.', adminOnly: true },
}

const panelClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100'

function createToken() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const values = new Uint8Array(6)
  globalThis.crypto.getRandomValues(values)
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

function formatDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}

function normalizeAnswer(value) {
  return String(value ?? '').trim().toLocaleLowerCase('id')
}

function Table({ headers, children, empty = 'Belum ada data.' }) {
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children || <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function downloadWorkbook(filename, sheetName, rows) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export default function OperationsPage() {
  const { section } = useParams()
  const { user } = useAuth()
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    nama: '',
    jenis: 'Ujian Sekolah',
    mapelId: '',
    kelasId: '',
    tanggal: new Date().toISOString().slice(0, 10),
    waktuMulai: '08:00',
    durasiMenit: 90,
    jumlahSoal: 20,
  })
  const [securityForm, setSecurityForm] = useState(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const data = useLiveQuery(async () => {
    const [exams, subjects, classes, participants, answers, results, violations, users, students, settings, questions, examQuestions] = await Promise.all([
      db.ujian.toArray(),
      db.mapel.toArray(),
      db.kelas.toArray(),
      db.pesertaUjian.toArray(),
      db.jawaban.toArray(),
      db.hasil.toArray(),
      db.pelanggaran.toArray(),
      db.users.toArray(),
      db.siswa.toArray(),
      db.pengaturan.toArray(),
      db.soal.toArray(),
      db.ujianSoal.toArray(),
    ])
    return { exams, subjects, classes, participants, answers, results, violations, users, students, settings, questions, examQuestions }
  }, [])

  const subjectNames = useMemo(() => new Map((data?.subjects ?? []).map((item) => [item.id, item.nama])), [data?.subjects])
  const classNames = useMemo(() => new Map((data?.classes ?? []).map((item) => [item.id, item.nama])), [data?.classes])
  const studentNames = useMemo(() => new Map((data?.students ?? []).map((item) => [item.id, item.nama])), [data?.students])
  const settingMap = useMemo(() => new Map((data?.settings ?? []).map((item) => [item.kunci, item.nilai])), [data?.settings])
  const examById = useMemo(() => new Map((data?.exams ?? []).map((exam) => [exam.id, exam])), [data?.exams])
  const examRows = useMemo(() => (data?.exams ?? []).map((exam) => ({
    ...exam,
    participants: (data?.participants ?? []).filter((participant) => participant.ujianId === exam.id),
  })), [data?.exams, data?.participants])
  const sectionInfo = SECTIONS[section]

  if (!sectionInfo) return <p className="rounded-xl bg-white p-6 text-slate-700">Menu tidak ditemukan.</p>
  if (sectionInfo.adminOnly && user.role !== 'admin') {
    return <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900" role="alert">Menu ini hanya dapat digunakan administrator.</p>
  }
  if (!data) return <p className="py-10 text-center text-sm text-slate-500" role="status">Memuat data operasional...</p>

  const alert = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4000)
  }

  async function saveExam(event) {
    event.preventDefault()
    const subjectId = Number(scheduleForm.mapelId)
    const classId = Number(scheduleForm.kelasId)
    const questionCount = Math.max(0, Number(scheduleForm.jumlahSoal))
    const questions = await db.soal
      .where('mapelId')
      .equals(subjectId)
      .filter((question) => question.kelasId === classId && question.aktif)
      .limit(questionCount)
      .toArray()

    if (!scheduleForm.nama.trim() || !subjectId || !classId) {
      alert('Lengkapi nama ujian, mata pelajaran, dan kelas.')
      return
    }
    if (!questions.length) {
      alert('Belum ada soal aktif untuk mata pelajaran dan kelas tersebut.')
      return
    }

    setBusy(true)
    try {
      const token = createToken()
      await db.transaction('rw', [db.ujian, db.ujianSoal], async () => {
        const examId = await db.ujian.add({
          nama: scheduleForm.nama.trim(),
          jenis: scheduleForm.jenis,
          mapelId: subjectId,
          kelasId: classId,
          tanggal: new Date(`${scheduleForm.tanggal}T00:00:00`),
          waktuMulai: scheduleForm.waktuMulai,
          durasiMenit: Number(scheduleForm.durasiMenit),
          jumlahSoal: questions.length,
          acakSoal: true,
          acakOpsi: true,
          tampilkanNilai: false,
          minimalWaktuMenit: Number(settingMap.get('keamananUjian')?.minimalWaktuMenit ?? 10),
          token,
          status: 'terjadwal',
          createdAt: new Date(),
        })
        await db.ujianSoal.bulkAdd(questions.map((question, index) => ({
          ujianId: examId,
          soalId: question.id,
          urutan: index + 1,
        })))
      })
      setScheduleOpen(false)
      setScheduleForm((current) => ({ ...current, nama: '' }))
      alert(`Jadwal berhasil dibuat. Token ujian: ${token}`)
    } catch (error) {
      console.error('Gagal membuat jadwal ujian:', error)
      alert(`Jadwal tidak dapat dibuat: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function refreshExamToken(exam) {
    const token = createToken()
    await db.ujian.update(exam.id, { token })
    alert(`Token ujian ${exam.nama} diperbarui menjadi ${token}.`)
  }

  async function saveSecuritySettings(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const value = {
        minimalWaktuMenit: Math.max(0, Number(securityForm?.minimalWaktuMenit ?? 10)),
        wajibFullscreen: Boolean(securityForm?.wajibFullscreen),
        catatPelanggaran: Boolean(securityForm?.catatPelanggaran),
        tampilkanNilai: Boolean(securityForm?.tampilkanNilai),
      }
      await db.pengaturan.put({ kunci: 'keamananUjian', nilai: value })
      setSecurityForm(value)
      alert('Pengaturan keamanan tersimpan di perangkat ini.')
    } catch (error) {
      console.error('Gagal menyimpan pengaturan keamanan:', error)
      alert(`Pengaturan gagal disimpan: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function changeUser(userId, changes) {
    try {
      await db.users.update(userId, changes)
      alert('Pengaturan akun berhasil diperbarui.')
    } catch (error) {
      console.error('Gagal memperbarui akun:', error)
      alert(`Akun gagal diperbarui: ${error.message}`)
    }
  }

  async function toggleActivityLock(locked) {
    try {
      await db.pengaturan.put({
        kunci: 'kunciAktivitas',
        nilai: { terkunci: locked, diubahPada: new Date().toISOString(), diubahOleh: user.username },
      })
      alert(locked ? 'Akses login siswa dikunci pada perangkat ini.' : 'Kunci aktivitas siswa dibuka.')
    } catch (error) {
      console.error('Gagal mengubah kunci aktivitas:', error)
      alert(`Kunci aktivitas tidak dapat diubah: ${error.message}`)
    }
  }

  const exportResults = async () => {
    const rows = data.results.map((result) => ({
      Ujian: examById.get(result.ujianId)?.nama ?? `Ujian ${result.ujianId}`,
      Peserta: studentNames.get(result.siswaId) ?? `Siswa ${result.siswaId}`,
      Nilai: result.nilai ?? '',
      Status: result.statusPenilaian ?? '',
    }))
    try {
      await downloadWorkbook('rekap-nilai-ruangujian.xlsx', 'Rekap Nilai', rows)
    } catch (error) {
      console.error('Gagal mengekspor rekap nilai:', error)
      alert(`Rekap nilai gagal diekspor: ${error.message}`)
    }
  }

  function printReport(title, rows) {
    const printableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])}</td>`).join('')}</tr>`).join('')
    const headers = rows.length ? rows[0].map((cell) => `<th>${String(cell)}</th>`).join('') : ''
    const content = `
      <!doctype html><html lang="id"><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#172033}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#eff6ff}@media print{button{display:none}}</style>
      </head><body><h1>${title}</h1><p>${new Date().toLocaleString('id-ID')}</p><table><thead><tr>${headers}</tr></thead><tbody>${printableRows}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Jendela cetak diblokir browser. Izinkan pop-up untuk mencetak dokumen.')
      return
    }
    printWindow.document.write(content)
    printWindow.document.close()
  }

  const examOptions = data.exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.nama}</option>)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-800">Administrasi ujian</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-950">{sectionInfo.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{sectionInfo.description}</p>
      </header>
      {notice && <p className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status"><Check size={17} />{notice}</p>}

      {(section === 'jadwal' || section === 'daftar-ujian') && (
        <>
          <div className="flex justify-end">
            {section === 'jadwal' && <button type="button" onClick={() => setScheduleOpen(!scheduleOpen)} className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><CalendarClock size={17} />{scheduleOpen ? 'Tutup form' : 'Buat jadwal'}</button>}
          </div>
          {scheduleOpen && (
            <form onSubmit={saveExam} className={`${panelClass} grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3`}>
              <label className="text-sm font-medium">Nama ujian<input className={`${inputClass} mt-1.5`} required value={scheduleForm.nama} onChange={(event) => setScheduleForm({ ...scheduleForm, nama: event.target.value })} placeholder="Contoh: PTS Semester Ganjil" /></label>
              <label className="text-sm font-medium">Jenis ujian<select className={`${inputClass} mt-1.5`} value={scheduleForm.jenis} onChange={(event) => setScheduleForm({ ...scheduleForm, jenis: event.target.value })}>{['PTS', 'PAS', 'PAT', 'Ujian Sekolah', 'Try Out'].map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="text-sm font-medium">Mata pelajaran<select className={`${inputClass} mt-1.5`} required value={scheduleForm.mapelId} onChange={(event) => setScheduleForm({ ...scheduleForm, mapelId: event.target.value })}><option value="">Pilih mapel</option>{data.subjects.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></label>
              <label className="text-sm font-medium">Kelas<select className={`${inputClass} mt-1.5`} required value={scheduleForm.kelasId} onChange={(event) => setScheduleForm({ ...scheduleForm, kelasId: event.target.value })}><option value="">Pilih kelas</option>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></label>
              <label className="text-sm font-medium">Tanggal<input className={`${inputClass} mt-1.5`} type="date" required value={scheduleForm.tanggal} onChange={(event) => setScheduleForm({ ...scheduleForm, tanggal: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">Jam mulai<input className={`${inputClass} mt-1.5`} type="time" required value={scheduleForm.waktuMulai} onChange={(event) => setScheduleForm({ ...scheduleForm, waktuMulai: event.target.value })} /></label>
                <label className="text-sm font-medium">Durasi (menit)<input className={`${inputClass} mt-1.5`} type="number" min="1" required value={scheduleForm.durasiMenit} onChange={(event) => setScheduleForm({ ...scheduleForm, durasiMenit: event.target.value })} /></label>
              </div>
              <label className="text-sm font-medium">Jumlah soal<input className={`${inputClass} mt-1.5`} type="number" min="1" required value={scheduleForm.jumlahSoal} onChange={(event) => setScheduleForm({ ...scheduleForm, jumlahSoal: event.target.value })} /></label>
              <div className="flex items-end"><button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? 'Menyimpan jadwal...' : 'Simpan jadwal'}</button></div>
            </form>
          )}
          <Table headers={['Nama ujian', 'Mapel / kelas', 'Tanggal', 'Jam / durasi', 'Token', 'Status']}>
            {examRows.map((exam) => (
              <tr key={exam.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{exam.nama}<p className="text-xs text-slate-500">{exam.jenis}</p></td>
                <td className="px-4 py-3 text-slate-600">{subjectNames.get(exam.mapelId) ?? '—'}<p className="text-xs text-slate-500">{classNames.get(exam.kelasId) ?? '—'}</p></td>
                <td className="px-4 py-3">{formatDate(exam.tanggal)}</td>
                <td className="px-4 py-3">{exam.waktuMulai ?? '—'} / {exam.durasiMenit ?? '—'} menit</td>
                <td className="px-4 py-3 font-mono font-bold tracking-widest">{exam.token ?? '—'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{exam.status ?? 'draft'}</span></td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {section === 'token' && (
        <Table headers={['Ujian', 'Tanggal', 'Kelas', 'Token saat ini', 'Aksi']}>
          {data.exams.map((exam) => (
            <tr key={exam.id}>
              <td className="px-4 py-3 font-medium">{exam.nama}</td><td className="px-4 py-3">{formatDate(exam.tanggal)}</td><td className="px-4 py-3">{classNames.get(exam.kelasId) ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-lg font-bold tracking-[0.2em]">{exam.token ?? '—'}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => refreshExamToken(exam)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><RefreshCw size={14} />Segarkan token</button></td>
            </tr>
          ))}
        </Table>
      )}

      {section === 'keamanan' && (() => {
        const current = securityForm ?? settingMap.get('keamananUjian') ?? { minimalWaktuMenit: 10, wajibFullscreen: true, catatPelanggaran: true, tampilkanNilai: false }
        const setField = (field, value) => setSecurityForm({ ...current, [field]: value })
        return (
          <form onSubmit={saveSecuritySettings} className={`${panelClass} max-w-3xl space-y-5 p-6`}>
            <label className="block max-w-xs text-sm font-medium">Waktu minimum sebelum peserta boleh mengakhiri (menit)<input className={`${inputClass} mt-1.5`} type="number" min="0" value={current.minimalWaktuMenit} onChange={(event) => setField('minimalWaktuMenit', event.target.value)} /></label>
            {[
              ['wajibFullscreen', 'Wajibkan mode layar penuh'],
              ['catatPelanggaran', 'Catat perpindahan tab dan pelanggaran'],
              ['tampilkanNilai', 'Tampilkan nilai setelah ujian selesai'],
            ].map(([key, label]) => <label key={key} className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={Boolean(current[key])} onChange={(event) => setField(key, event.target.checked)} className="h-4 w-4 accent-blue-700" />{label}</label>)}
            <button disabled={busy} className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : 'Simpan pengaturan'}</button>
          </form>
        )
      })()}

      {(section === 'dasbor' || section === 'monitoring') && (() => {
        const counts = {
          total: data.participants.length,
          belum: data.participants.filter((item) => item.status === 'belum' || item.status === 'belum_login').length,
          berlangsung: data.participants.filter((item) => item.status === 'mengerjakan' || item.status === 'sedang_mengerjakan').length,
          selesai: data.participants.filter((item) => item.status === 'selesai').length,
        }
        const rows = data.participants.filter((item) => !classFilter || String(examById.get(item.ujianId)?.kelasId) === classFilter)
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries({ 'Total peserta': counts.total, 'Belum login': counts.belum, 'Sedang mengerjakan': counts.berlangsung, Selesai: counts.selesai }).map(([label, count]) => <article key={label} className={`${panelClass} p-5`}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-navy-950">{count}</p></article>)}
            </div>
            <div className="flex max-w-sm items-center gap-2"><label className="sr-only" htmlFor="monitor-class">Filter kelas</label><select id="monitor-class" className={inputClass} value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="">Semua kelas</option>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
            <Table headers={['Peserta', 'Ujian', 'Status', 'Waktu mulai', 'Pelanggaran']}>
              {rows.map((participant) => {
                const exam = examById.get(participant.ujianId)
                const count = data.violations.filter((item) => item.pesertaUjianId === participant.id).length
                return <tr key={participant.id}><td className="px-4 py-3 font-medium">{studentNames.get(participant.siswaId) ?? `Siswa ${participant.siswaId}`}</td><td className="px-4 py-3">{exam?.nama ?? 'Ujian'}</td><td className="px-4 py-3 capitalize">{participant.status ?? 'belum login'}</td><td className="px-4 py-3">{participant.waktuMulai ? formatDate(participant.waktuMulai) : '—'}</td><td className="px-4 py-3">{count}</td></tr>
              })}
            </Table>
          </>
        )
      })()}

      {section === 'rekap-nilai' && (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={exportResults} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Download size={16} />Unduh Excel</button>
            <button type="button" onClick={() => printReport('Rekap Nilai Ujian', [['Ujian', 'Peserta', 'Nilai', 'Status'], ...data.results.map((result) => [examById.get(result.ujianId)?.nama ?? `Ujian ${result.ujianId}`, studentNames.get(result.siswaId) ?? `Siswa ${result.siswaId}`, result.nilai ?? '', result.statusPenilaian ?? ''])])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><Printer size={16} />Cetak / Simpan PDF</button>
          </div>
          <Table headers={['Ujian', 'Peserta', 'Nilai', 'Status penilaian']}>
            {data.results.map((result) => <tr key={result.id}><td className="px-4 py-3">{examById.get(result.ujianId)?.nama ?? `Ujian ${result.ujianId}`}</td><td className="px-4 py-3">{studentNames.get(result.siswaId) ?? `Siswa ${result.siswaId}`}</td><td className="px-4 py-3 font-semibold">{result.nilai ?? '—'}</td><td className="px-4 py-3">{result.statusPenilaian ?? 'Sementara'}</td></tr>)}
          </Table>
        </>
      )}

      {section === 'analisis-butir' && (
        <>
          <div className="flex max-w-sm items-center gap-2"><label className="sr-only" htmlFor="analysis-exam">Pilih ujian</label><select id="analysis-exam" className={inputClass} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">Pilih ujian</option>{examOptions}</select></div>
          <AnalysisTable data={data} selectedExamId={Number(roleFilter)} subjectNames={subjectNames} />
        </>
      )}

      {section === 'cetak-dokumen' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => printReport('Daftar Hadir Ujian', [['No.', 'Nomor Peserta', 'Nama', 'Kelas', 'Tanda Tangan'], ...data.students.map((student, index) => [index + 1, data.users.find((account) => account.siswaId === student.id)?.username ?? student.nisn, student.nama, student.rombel ?? classNames.get(student.kelasId) ?? '', ''])])} className={`${panelClass} flex items-center gap-4 p-5 text-left hover:border-blue-300`}><ClipboardList className="text-blue-800" size={25} /><span><strong className="block">Daftar hadir</strong><span className="mt-1 block text-sm text-slate-500">Cetak atau simpan sebagai PDF</span></span></button>
            <button type="button" onClick={() => printReport('Daftar Peserta Ujian', [['No.', 'Nomor Peserta', 'Nama', 'Kelas'], ...data.students.map((student, index) => [index + 1, student.nisn, student.nama, student.rombel ?? classNames.get(student.kelasId) ?? ''])])} className={`${panelClass} flex items-center gap-4 p-5 text-left hover:border-blue-300`}><Printer className="text-blue-800" size={25} /><span><strong className="block">Daftar peserta</strong><span className="mt-1 block text-sm text-slate-500">Cetak atau simpan sebagai PDF</span></span></button>
          </div>
          <p className="text-sm text-slate-500">Pada dialog cetak browser, pilih “Save as PDF” untuk mengunduh PDF.</p>
        </>
      )}

      {section === 'manajemen-peran' && (
        <Table headers={['Pengguna', 'Nama', 'Peran', 'Status']}>
          {data.users.map((account) => <tr key={account.id}><td className="px-4 py-3 font-mono">{account.username}</td><td className="px-4 py-3">{account.nama}</td><td className="px-4 py-3"><select aria-label={`Peran ${account.username}`} disabled={account.id === user.id} className="rounded-lg border border-slate-300 px-2 py-1.5" value={account.role} onChange={(event) => changeUser(account.id, { role: event.target.value })}><option value="admin">Admin</option><option value="guru">Guru</option><option value="siswa">Siswa</option></select></td><td className="px-4 py-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(account.aktif)} disabled={account.id === user.id} onChange={(event) => changeUser(account.id, { aktif: event.target.checked })} className="h-4 w-4 accent-blue-700" />{account.aktif ? 'Aktif' : 'Nonaktif'}</label></td></tr>)}
        </Table>
      )}

      {section === 'kunci-aktivitas' && (() => {
        const locked = Boolean(settingMap.get('kunciAktivitas')?.terkunci)
        return <section className={`${panelClass} max-w-3xl p-6`}><div className="flex items-start gap-4"><div className={`rounded-xl p-3 ${locked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><LockKeyhole size={24} /></div><div className="flex-1"><h2 className="text-lg font-bold text-slate-900">{locked ? 'Aktivitas siswa terkunci' : 'Aktivitas siswa terbuka'}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Penguncian mencegah login baru dan akses ruang siswa pada browser/perangkat ini. Pengaturan tidak berlaku ke browser peserta lain sampai data disinkronkan dengan file paket.</p><button type="button" onClick={() => toggleActivityLock(!locked)} className={`mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${locked ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'}`}>{locked ? 'Buka aktivitas siswa' : 'Kunci aktivitas siswa'}</button></div></div></section>
      })()}
    </div>
  )
}

function AnalysisTable({ data, selectedExamId, subjectNames }) {
  const analysis = useMemo(() => {
    if (!selectedExamId) return []
    const examQuestionIds = data.examQuestions
      .filter((link) => link.ujianId === selectedExamId)
      .map((link) => link.soalId)
    const ids = [...new Set(examQuestionIds)]
    return ids.map((questionId) => {
      const question = data.questions.find((item) => item.id === questionId)
      const examParticipantIds = new Set(data.participants
        .filter((participant) => participant.ujianId === selectedExamId)
        .map((participant) => participant.id))
      const responses = data.answers.filter((answer) =>
        answer.soalId === questionId && examParticipantIds.has(answer.pesertaUjianId))
      const choices = new Map()
      let correct = 0
      for (const response of responses) {
        const value = response.isi ?? response.jawaban ?? response.nilaiJawaban ?? response.pilihan
        const answerKey = question?.jawabanDiterima ?? question?.jawabanBenar
        const normalized = normalizeAnswer(Array.isArray(value) ? value.slice().sort().join(',') : value)
        if (Array.isArray(answerKey) && answerKey.some((item) => normalizeAnswer(item) === normalized)) correct += 1
        else if (typeof answerKey === 'string' && normalizeAnswer(answerKey) === normalized) correct += 1
        const choice = Array.isArray(value) ? value.join(', ') : String(value ?? 'Kosong')
        choices.set(choice, (choices.get(choice) ?? 0) + 1)
      }
      const weight = question?.bobot ?? 0
      return {
        id: questionId,
        prompt: question?.pertanyaan ?? `Soal ${questionId}`,
        subject: subjectNames.get(question?.mapelId) ?? '—',
        p: responses.length ? correct / responses.length : null,
        responseCount: responses.length,
        weight,
        choices: [...choices.entries()].map(([choice, count]) => `${choice} (${Math.round((count / responses.length) * 100)}%)`).join(', '),
      }
    })
  }, [data, selectedExamId, subjectNames])

  if (!selectedExamId) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Pilih ujian untuk melihat analisis butir.</p>

  return (
    <Table headers={['Butir soal', 'Mapel', 'Indeks kesukaran (p)', 'Respons', 'Sebaran pilihan']}>
      {analysis.map((item) => <tr key={item.id}><td className="max-w-sm px-4 py-3"><span className="line-clamp-2">{item.prompt}</span></td><td className="px-4 py-3">{item.subject}</td><td className="px-4 py-3">{item.p === null ? 'Belum ada respons' : `${item.p.toFixed(2)} (${item.p < 0.3 ? 'sulit' : item.p > 0.7 ? 'mudah' : 'sedang'})`}</td><td className="px-4 py-3">{item.responseCount}</td><td className="max-w-sm px-4 py-3 text-xs">{item.choices || '—'}</td></tr>)}
    </Table>
  )
}
