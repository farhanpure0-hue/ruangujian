import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpenCheck, Check, ChevronDown, CircleHelp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { db } from '../../db/db.js'
import { useAuth } from '../../hooks/useAuth.js'

const QUESTION_TYPES = [
  { value: 'pilihan_ganda', label: 'Pilihan ganda' },
  { value: 'pilihan_ganda_kompleks', label: 'Pilihan ganda kompleks' },
  { value: 'benar_salah', label: 'Benar / Salah' },
  { value: 'menjodohkan', label: 'Menjodohkan' },
  { value: 'isian_singkat', label: 'Isian singkat' },
  { value: 'uraian', label: 'Uraian / Esai' },
]
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']
const TYPE_LABELS = Object.fromEntries(QUESTION_TYPES.map(({ value, label }) => [value, label]))

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100'
const labelClass = 'block text-sm font-medium text-slate-700'

function blankQuestion(mapelId, kelasId) {
  return {
    mapelId: mapelId ?? '',
    kelasId: kelasId ?? '',
    tipe: 'pilihan_ganda',
    tingkatKesulitan: 'sedang',
    bobot: 1,
    pertanyaan: '',
    pembahasan: '',
    aktif: true,
    jumlahOpsi: 4,
    opsi: OPTION_LABELS.slice(0, 4).map((label) => ({ label, teks: '', gambar: null })),
    jawabanBenar: [],
    aturanSkor: 'proporsional',
    pernyataan: [{ teks: '', benar: true }],
    pasangan: [{ kiri: '', kanan: '' }],
    jawabanDiterima: [],
    rubrik: '',
  }
}

function questionToForm(question) {
  const form = {
    ...blankQuestion(question.mapelId, question.kelasId),
    ...question,
    jumlahOpsi: Math.max(4, question.opsi?.length ?? 4),
  }
  if (question.tipe === 'benar_salah' && !question.pernyataan?.length) {
    form.pernyataan = [{ teks: '', benar: true }]
  }
  if (question.tipe === 'menjodohkan' && !question.pasangan?.length) {
    form.pasangan = [{ kiri: '', kanan: '' }]
  }
  return form
}

function answerSummary(question) {
  if (question.tipe === 'pilihan_ganda' || question.tipe === 'pilihan_ganda_kompleks') {
    return question.jawabanBenar?.join(', ') || 'Belum diatur'
  }
  if (question.tipe === 'benar_salah') {
    return (question.pernyataan ?? []).map((item) => item.benar ? 'Benar' : 'Salah').join(', ')
  }
  if (question.tipe === 'menjodohkan') {
    return `${question.pasangan?.length ?? 0} pasangan kunci`
  }
  if (question.tipe === 'isian_singkat') {
    return question.jawabanDiterima?.join(' / ') || 'Belum diatur'
  }
  return question.rubrik ? 'Dinilai manual · rubrik tersedia' : 'Dinilai manual'
}

function QuestionEditor({ question, subjects, classes, onCancel, onSave }) {
  const [form, setForm] = useState(() => question ? questionToForm(question) : blankQuestion(subjects[0]?.id, classes[0]?.id))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const type = form.tipe

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setOptionCount(count) {
    setForm((current) => ({
      ...current,
      jumlahOpsi: count,
      opsi: OPTION_LABELS.slice(0, count).map((label, index) => ({
        label,
        teks: current.opsi?.[index]?.teks ?? '',
        gambar: current.opsi?.[index]?.gambar ?? null,
      })),
      jawabanBenar: current.jawabanBenar.filter((label) => OPTION_LABELS.slice(0, count).includes(label)),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.pertanyaan.trim()) return setError('Teks soal wajib diisi.')
    if (!form.mapelId || !form.kelasId) return setError('Pilih mata pelajaran dan kelas.')
    if (!Number.isFinite(Number(form.bobot)) || Number(form.bobot) <= 0) return setError('Bobot harus lebih besar dari 0.')

    if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
      if (form.opsi.some((option) => !option.teks.trim())) return setError('Isi teks untuk semua opsi jawaban.')
      if (!form.jawabanBenar.length) return setError('Pilih minimal satu kunci jawaban.')
      if (type === 'pilihan_ganda' && form.jawabanBenar.length !== 1) return setError('Pilihan ganda harus memiliki tepat satu kunci.')
    }
    if (type === 'benar_salah' && form.pernyataan.some((item) => !item.teks.trim())) {
      return setError('Isi semua pernyataan benar/salah.')
    }
    if (type === 'menjodohkan' && form.pasangan.some((pair) => !pair.kiri.trim() || !pair.kanan.trim())) {
      return setError('Isi kedua bagian untuk setiap pasangan.')
    }
    if (type === 'isian_singkat' && !form.jawabanDiterima.some((answer) => answer.trim())) {
      return setError('Masukkan minimal satu kunci jawaban isian.')
    }

    const now = new Date()
    const payload = {
      mapelId: Number(form.mapelId),
      kelasId: Number(form.kelasId),
      tipe: type,
      tingkatKesulitan: form.tingkatKesulitan,
      bobot: Number(form.bobot),
      pertanyaan: form.pertanyaan.trim(),
      pembahasan: form.pembahasan.trim(),
      aktif: form.aktif,
      updatedAt: now,
      ...(question ? {} : { createdAt: now }),
    }

    if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
      Object.assign(payload, {
        opsi: form.opsi.map((option, index) => ({ label: OPTION_LABELS[index], teks: option.teks.trim(), gambar: option.gambar ?? null })),
        jawabanBenar: [...form.jawabanBenar],
        aturanSkor: type === 'pilihan_ganda_kompleks' ? form.aturanSkor : 'tepat',
      })
    } else if (type === 'benar_salah') {
      payload.pernyataan = form.pernyataan.map((item) => ({ teks: item.teks.trim(), benar: item.benar }))
    } else if (type === 'menjodohkan') {
      payload.pasangan = form.pasangan.map((pair) => ({ kiri: pair.kiri.trim(), kanan: pair.kanan.trim() }))
    } else if (type === 'isian_singkat') {
      payload.jawabanDiterima = form.jawabanDiterima.map((answer) => answer.trim()).filter(Boolean)
    } else if (type === 'uraian') {
      payload.rubrik = form.rubrik.trim()
    }

    setSaving(true)
    try {
      await onSave(payload)
    } catch (saveError) {
      console.error('Gagal menyimpan soal:', saveError)
      setError(`Soal tidak dapat disimpan: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-editor-title"
        className="mx-auto my-4 max-w-4xl rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Bank Soal</p>
            <h2 id="question-editor-title" className="mt-1 text-xl font-bold text-navy-950">
              {question ? 'Ubah soal' : 'Tambah soal'}
            </h2>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <label className={labelClass}>
              Mata pelajaran
              <select className={inputClass} value={form.mapelId} onChange={(event) => update('mapelId', event.target.value)} required>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.nama}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Kelas
              <select className={inputClass} value={form.kelasId} onChange={(event) => update('kelasId', event.target.value)} required>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.nama}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Jenis soal
              <select className={inputClass} value={type} onChange={(event) => update('tipe', event.target.value)}>
                {QUESTION_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Kesulitan
                <select className={inputClass} value={form.tingkatKesulitan} onChange={(event) => update('tingkatKesulitan', event.target.value)}>
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </label>
              <label className={labelClass}>
                Bobot nilai
                <input className={inputClass} type="number" min="0.1" step="0.1" value={form.bobot} onChange={(event) => update('bobot', event.target.value)} required />
              </label>
            </div>

            <label className={`${labelClass} sm:col-span-2`}>
              Teks soal
              <textarea className={inputClass} rows={3} value={form.pertanyaan} onChange={(event) => update('pertanyaan', event.target.value)} placeholder="Tuliskan pertanyaan..." required />
            </label>

            {(type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') && (
              <div className="space-y-4 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">Opsi dan kunci jawaban</h3>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Jumlah opsi
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1.5"
                      value={form.jumlahOpsi}
                      onChange={(event) => setOptionCount(Number(event.target.value))}
                    >
                      <option value={4}>4 opsi</option>
                      <option value={5}>5 opsi</option>
                    </select>
                  </label>
                </div>
                {form.opsi.map((option, index) => (
                  <div key={option.label} className="grid items-center gap-2 sm:grid-cols-[auto_2.5rem_1fr]">
                    <input
                      type={type === 'pilihan_ganda' ? 'radio' : 'checkbox'}
                      name="answer-key"
                      aria-label={`Jadikan opsi ${option.label} sebagai kunci`}
                      checked={form.jawabanBenar.includes(option.label)}
                      onChange={(event) => {
                        const next = type === 'pilihan_ganda'
                          ? [option.label]
                          : event.target.checked
                            ? [...form.jawabanBenar, option.label]
                            : form.jawabanBenar.filter((answer) => answer !== option.label)
                        update('jawabanBenar', next)
                      }}
                      className="h-4 w-4 accent-blue-700"
                    />
                    <span className="text-sm font-semibold text-slate-700">{option.label}</span>
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      value={option.teks}
                      onChange={(event) => update('opsi', form.opsi.map((item, itemIndex) => itemIndex === index ? { ...item, teks: event.target.value } : item))}
                      placeholder={`Teks opsi ${option.label}`}
                    />
                  </div>
                ))}
                {type === 'pilihan_ganda_kompleks' && (
                  <label className="block max-w-sm text-sm font-medium text-slate-700">
                    Aturan skor
                    <select className={inputClass} value={form.aturanSkor} onChange={(event) => update('aturanSkor', event.target.value)}>
                      <option value="proporsional">Proporsional untuk setiap pilihan benar</option>
                      <option value="semua_benar">Skor hanya jika semua kunci tepat</option>
                    </select>
                  </label>
                )}
                <p className="text-xs text-slate-500">Pilih lingkaran untuk kunci tunggal atau kotak centang untuk lebih dari satu kunci.</p>
              </div>
            )}

            {type === 'benar_salah' && (
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Pernyataan dan kunci</h3>
                  <button type="button" onClick={() => update('pernyataan', [...form.pernyataan, { teks: '', benar: true }])} className="text-sm font-semibold text-blue-800 hover:text-blue-950">
                    + Tambah pernyataan
                  </button>
                </div>
                {form.pernyataan.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                    <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={item.teks} onChange={(event) => update('pernyataan', form.pernyataan.map((row, rowIndex) => rowIndex === index ? { ...row, teks: event.target.value } : row))} placeholder={`Pernyataan ${index + 1}`} />
                    <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={String(item.benar)} onChange={(event) => update('pernyataan', form.pernyataan.map((row, rowIndex) => rowIndex === index ? { ...row, benar: event.target.value === 'true' } : row))}>
                      <option value="true">Benar</option>
                      <option value="false">Salah</option>
                    </select>
                    <button type="button" disabled={form.pernyataan.length === 1} onClick={() => update('pernyataan', form.pernyataan.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40" aria-label={`Hapus pernyataan ${index + 1}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {type === 'menjodohkan' && (
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Pasangan kunci jawaban</h3>
                  <button type="button" onClick={() => update('pasangan', [...form.pasangan, { kiri: '', kanan: '' }])} className="text-sm font-semibold text-blue-800 hover:text-blue-950">
                    + Tambah pasangan
                  </button>
                </div>
                {form.pasangan.map((pair, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={pair.kiri} onChange={(event) => update('pasangan', form.pasangan.map((row, rowIndex) => rowIndex === index ? { ...row, kiri: event.target.value } : row))} placeholder={`Bagian kiri ${index + 1}`} />
                    <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={pair.kanan} onChange={(event) => update('pasangan', form.pasangan.map((row, rowIndex) => rowIndex === index ? { ...row, kanan: event.target.value } : row))} placeholder={`Pasangan benar ${index + 1}`} />
                    <button type="button" disabled={form.pasangan.length === 1} onClick={() => update('pasangan', form.pasangan.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40" aria-label={`Hapus pasangan ${index + 1}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {type === 'isian_singkat' && (
              <label className={`${labelClass} sm:col-span-2`}>
                Kunci jawaban (satu jawaban per baris)
                <textarea className={inputClass} rows={3} value={form.jawabanDiterima.join('\n')} onChange={(event) => update('jawabanDiterima', event.target.value.split('\n'))} placeholder={'Contoh:\nJakarta\nDKI Jakarta'} />
                <span className="mt-1 block text-xs font-normal text-slate-500">Pencocokan otomatis sebaiknya mengabaikan perbedaan kapitalisasi.</span>
              </label>
            )}

            {type === 'uraian' && (
              <label className={`${labelClass} sm:col-span-2`}>
                Kunci penilaian / rubrik (opsional)
                <textarea className={inputClass} rows={3} value={form.rubrik} onChange={(event) => update('rubrik', event.target.value)} placeholder="Kriteria atau poin penting jawaban yang diharapkan..." />
                <span className="mt-1 block text-xs font-normal text-slate-500">Jawaban uraian dinilai manual oleh guru.</span>
              </label>
            )}

            <label className={`${labelClass} sm:col-span-2`}>
              Pembahasan (opsional)
              <textarea className={inputClass} rows={2} value={form.pembahasan ?? ''} onChange={(event) => update('pembahasan', event.target.value)} placeholder="Pembahasan untuk soal..." />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.aktif} onChange={(event) => update('aktif', event.target.checked)} className="h-4 w-4 accent-blue-700" />
              Soal aktif dan dapat digunakan
            </label>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2" role="alert">{error}</p>}
          </div>
          <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-7">
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan soal'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default function QuestionBankPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const data = useLiveQuery(async () => {
    const [allSubjects, classes, questions, teacher] = await Promise.all([
      db.mapel.toArray(),
      db.kelas.toArray(),
      db.soal.orderBy('updatedAt').reverse().toArray(),
      user.role === 'guru' && user.guruId ? db.guru.get(user.guruId) : Promise.resolve(null),
    ])
    const subjects = user.role === 'guru'
      ? allSubjects.filter((subject) => subject.id === teacher?.mapelId)
      : allSubjects
    const subjectIds = new Set(subjects.map((subject) => subject.id))
    return {
      subjects,
      classes,
      questions: questions.filter((question) => subjectIds.has(question.mapelId)),
    }
  }, [user.id, user.role, user.guruId])

  const subjects = data?.subjects ?? []
  const classes = data?.classes ?? []
  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id')
    return (data?.questions ?? []).filter((question) => {
      const matchesSearch = !query || question.pertanyaan?.toLocaleLowerCase('id').includes(query)
      const matchesSubject = !subjectFilter || question.mapelId === Number(subjectFilter)
      const matchesClass = !classFilter || question.kelasId === Number(classFilter)
      const matchesType = !typeFilter || question.tipe === typeFilter
      return matchesSearch && matchesSubject && matchesClass && matchesType
    })
  }, [data?.questions, search, subjectFilter, classFilter, typeFilter])
  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.nama]))
  const classNames = new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass.nama]))

  async function saveQuestion(payload) {
    if (editor?.id) {
      await db.soal.put({
        ...payload,
        id: editor.id,
        createdAt: editor.createdAt ?? new Date(),
      })
      setNotice('Soal berhasil diperbarui.')
    } else {
      await db.soal.add(payload)
      setPage(1)
      setNotice('Soal berhasil ditambahkan.')
    }
    setEditor(null)
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function deleteQuestion(question) {
    if (!window.confirm('Hapus soal ini dari bank soal? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await db.transaction('rw', [db.soal, db.ujianSoal], async () => {
        const linkedExamCount = await db.ujianSoal.where('soalId').equals(question.id).count()
        if (linkedExamCount > 0) {
          throw new Error('Soal sudah digunakan pada ujian. Lepaskan soal dari ujian terlebih dahulu.')
        }
        await db.soal.delete(question.id)
      })
      setNotice('Soal berhasil dihapus.')
      window.setTimeout(() => setNotice(''), 3500)
    } catch (error) {
      console.error('Gagal menghapus soal:', error)
      setNotice(error.message || 'Soal gagal dihapus.')
      window.setTimeout(() => setNotice(''), 5000)
    }
  }

  if (!data) {
    return <p className="py-10 text-center text-sm text-slate-500" role="status">Memuat bank soal...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-800">Kelola materi ujian</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-950">Bank Soal</h1>
          <p className="mt-2 text-sm text-slate-600">Simpan dan atur soal beserta kunci jawaban per mata pelajaran.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create' })}
          disabled={!subjects.length || !classes.length}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} aria-hidden="true" />
          Tambah soal
        </button>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status">
          <Check size={17} aria-hidden="true" />{notice}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">Cari teks soal</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
            <input className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari teks soal..." />
          </label>
          <label>
            <span className="sr-only">Filter mata pelajaran</span>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setPage(1) }}>
              <option value="">Semua mata pelajaran</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.nama}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter kelas</span>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setPage(1) }}>
              <option value="">Semua kelas</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.nama}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter jenis soal</span>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1) }}>
              <option value="">Semua jenis soal</option>
              {QUESTION_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Soal</th>
                <th className="px-4 py-3 font-semibold">Mapel / Kelas</th>
                <th className="px-4 py-3 font-semibold">Jenis / Bobot</th>
                <th className="px-4 py-3 font-semibold">Kunci jawaban</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleQuestions.map((question) => (
                <tr key={question.id} className="align-top hover:bg-slate-50/70">
                  <td className="max-w-sm px-4 py-4">
                    <p className="line-clamp-2 font-medium leading-5 text-slate-900">{question.pertanyaan}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">Kesulitan {question.tingkatKesulitan}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{subjectNames.get(question.mapelId) ?? 'Mapel tidak ditemukan'}</p>
                    <p className="mt-1 text-xs text-slate-500">{classNames.get(question.kelasId) ?? 'Kelas tidak ditemukan'}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{TYPE_LABELS[question.tipe] ?? question.tipe}</p>
                    <p className="mt-1 text-xs text-slate-500">Bobot {question.bobot}</p>
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-600">
                    <span className="inline-flex items-start gap-1.5">
                      <BookOpenCheck className="mt-0.5 shrink-0 text-emerald-700" size={15} aria-hidden="true" />
                      <span className="line-clamp-2">{answerSummary(question)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${question.aktif ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {question.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditor(question)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-800" aria-label="Ubah soal">
                        <Pencil size={17} />
                      </button>
                      <button type="button" onClick={() => deleteQuestion(question)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label="Hapus soal">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleQuestions.length && (
                <tr>
                  <td colSpan="6" className="px-5 py-14 text-center">
                    <CircleHelp className="mx-auto text-slate-300" size={30} aria-hidden="true" />
                    <p className="mt-3 font-medium text-slate-700">Soal tidak ditemukan</p>
                    <p className="mt-1 text-sm text-slate-500">Coba ubah pencarian atau tambahkan soal baru.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
          <span>Menampilkan {filteredQuestions.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredQuestions.length)} dari {filteredQuestions.length} soal</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Halaman sebelumnya">
              <ChevronDown className="rotate-90" size={17} />
            </button>
            <span className="min-w-20 text-center">Halaman {currentPage} / {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Halaman berikutnya">
              <ChevronDown className="-rotate-90" size={17} />
            </button>
          </div>
        </footer>
      </section>

      {editor && (
        <QuestionEditor
          question={editor.id ? editor : null}
          subjects={subjects}
          classes={classes}
          onCancel={() => setEditor(null)}
          onSave={saveQuestion}
        />
      )}
    </div>
  )
}
