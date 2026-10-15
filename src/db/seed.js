import { db } from './db.js'
import { hashPassword } from '../utils/hash.js'

const questionTypes = ['pilihan_ganda', 'pilihan_ganda_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'uraian']
const optionLabels = ['A', 'B', 'C', 'D']
const difficultyLevels = ['mudah', 'sedang', 'sulit']
const DEFAULT_SUBJECTS = [
  { kode: 'MAT', nama: 'Matematika', deskripsi: 'Matematika wajib' },
  { kode: 'BIN', nama: 'Bahasa Indonesia', deskripsi: 'Bahasa Indonesia' },
  { kode: 'SBY', nama: 'Seni Budaya' },
  { kode: 'PKN', nama: 'Pendidikan Pancasila dan Kewarganegaraan (PKn)' },
  { kode: 'PJOK', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
  { kode: 'PAI', nama: 'Pendidikan Agama Islam' },
  { kode: 'PAK', nama: 'Pendidikan Agama Kristen' },
  { kode: 'PRA', nama: 'Prakarya' },
  { kode: 'BIO', nama: 'Biologi' },
  { kode: 'GEO', nama: 'Geografi' },
  { kode: 'SOS', nama: 'Sosiologi' },
  { kode: 'BINTL', nama: 'Bahasa Indonesia Tingkat Lanjut' },
  { kode: 'SEJIND', nama: 'Sejarah Indonesia' },
  { kode: 'SEJTL', nama: 'Sejarah Tingkat Lanjut' },
  { kode: 'SEJPM', nama: 'Sejarah Peminatan' },
  { kode: 'BIG', nama: 'Bahasa Inggris' },
  { kode: 'BIGTL', nama: 'Bahasa Inggris Tingkat Lanjut' },
  { kode: 'MATTL', nama: 'Matematika Tingkat Lanjut' },
]

function createQuestion(index, mapelId, kelasId, mapelName) {
  const type = questionTypes[(index - 1) % questionTypes.length]
  const base = {
    mapelId,
    kelasId,
    tipe: type,
    tingkatKesulitan: difficultyLevels[(index - 1) % difficultyLevels.length],
    bobot: type === 'uraian' ? 5 : 2,
    pertanyaan: `Contoh soal ${index}: pilih jawaban yang paling tepat untuk materi ${mapelName} nomor ${index}.`,
    pembahasan: `Pembahasan contoh untuk soal nomor ${index}.`,
    gambar: null,
    aktif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
    return {
      ...base,
      opsi: optionLabels.map((label, optionIndex) => ({
        label,
        teks: `Pilihan ${label} untuk soal ${index}`,
        gambar: null,
      })),
      jawabanBenar: type === 'pilihan_ganda' ? ['A'] : ['A', 'C'],
      aturanSkor: 'proporsional',
    }
  }

  if (type === 'benar_salah') {
    return {
      ...base,
      pernyataan: [
        { teks: `Pernyataan pertama soal ${index}`, benar: true },
        { teks: `Pernyataan kedua soal ${index}`, benar: false },
      ],
    }
  }

  if (type === 'menjodohkan') {
    return {
      ...base,
      pasangan: [
        { kiri: `Konsep ${index}-A`, kanan: `Pasangan ${index}-A` },
        { kiri: `Konsep ${index}-B`, kanan: `Pasangan ${index}-B` },
      ],
    }
  }

  if (type === 'isian_singkat') {
    return { ...base, jawabanDiterima: [`jawaban ${index}`, `hasil ${index}`] }
  }

  return { ...base, rubrik: 'Nilai berdasarkan ketepatan dan kelengkapan jawaban.' }
}

async function ensureDefaultSubjects() {
  await db.transaction('rw', db.mapel, async () => {
    const existingSubjects = await db.mapel
      .where('kode')
      .anyOf(DEFAULT_SUBJECTS.map(({ kode }) => kode))
      .toArray()
    const existingCodes = new Set(existingSubjects.map(({ kode }) => kode))
    const missingSubjects = DEFAULT_SUBJECTS.filter(({ kode }) => !existingCodes.has(kode))
    if (missingSubjects.length) {
      await db.mapel.bulkAdd(missingSubjects)
    }
  })
}

export async function seedDatabase() {
  await ensureDefaultSubjects()

  const [adminHash, guruHash, siswaHash] = await Promise.all([
    hashPassword('admin123'),
    hashPassword('guru123'),
    hashPassword('siswa123'),
  ])
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const examStart = new Date(today)
  examStart.setHours(Math.max(0, now.getHours() - 1), 0, 0, 0)
  const examEnd = new Date(today)
  examEnd.setHours(23, 59, 59, 999)

  const seeded = await db.transaction(
    'rw',
    [db.users, db.siswa, db.guru, db.kelas, db.mapel, db.tahunAjaran, db.soal, db.ujian, db.ujianSoal, db.pengaturan],
    async () => {
      if (await db.users.where('username').equals('admin').count()) {
        return false
      }

      const tahunAjaranId = await db.tahunAjaran.add({
        nama: `${now.getFullYear()}/${now.getFullYear() + 1}`,
        semester: 'Ganjil',
        aktif: true,
      })
      const kelasIds = await db.kelas.bulkAdd([
        { tingkat: 'X', nama: 'X IPA 1', tahunAjaranId },
        { tingkat: 'XI', nama: 'XI IPA 1', tahunAjaranId },
        { tingkat: 'XII', nama: 'XII IPA 1', tahunAjaranId },
      ], { allKeys: true })
      const [matematika, bahasaIndonesia] = await Promise.all([
        db.mapel.where('kode').equals('MAT').first(),
        db.mapel.where('kode').equals('BIN').first(),
      ])
      const mapelIds = [matematika.id, bahasaIndonesia.id]
      const guruIds = await db.guru.bulkAdd([
        { nip: '198501012010011001', nama: 'Dewi Lestari, S.Pd.', mapelId: mapelIds[0], aktif: true },
        { nip: '198703152012021002', nama: 'Budi Santoso, S.Pd.', mapelId: mapelIds[1], aktif: true },
      ], { allKeys: true })

      const siswaData = Array.from({ length: 20 }, (_, index) => {
        const number = index + 1
        return {
          nisn: `009876${String(number).padStart(4, '0')}`,
          nomorPeserta: `CBT-2026-${String(number).padStart(3, '0')}`,
          nama: `Siswa Contoh ${String(number).padStart(2, '0')}`,
          kelasId: kelasIds[index % kelasIds.length],
          rombel: ['X IPA 1', 'XI IPA 1', 'XII IPA 1'][index % 3],
          aktif: true,
          passwordHash: siswaHash,
        }
      })
      const siswaIds = await db.siswa.bulkAdd(siswaData, { allKeys: true })

      await db.users.bulkAdd([
        { username: 'admin', passwordHash: adminHash, nama: 'Administrator', role: 'admin', aktif: true },
        ...guruIds.map((guruId, index) => ({
          username: `guru${index + 1}`,
          passwordHash: guruHash,
          nama: index === 0 ? 'Dewi Lestari, S.Pd.' : 'Budi Santoso, S.Pd.',
          role: 'guru',
          guruId,
          aktif: true,
        })),
        ...siswaData.map((siswa, index) => ({
          username: siswa.nisn,
          passwordHash: siswa.passwordHash,
          nama: siswa.nama,
          role: 'siswa',
          siswaId: siswaIds[index],
          aktif: true,
        })),
      ])

      await db.soal.bulkAdd(Array.from({ length: 30 }, (_, index) => {
        const mapelIndex = index % mapelIds.length
        const kelasIndex = index % kelasIds.length
        return createQuestion(
          index + 1,
          mapelIds[mapelIndex],
          kelasIds[kelasIndex],
          mapelIndex === 0 ? matematika.nama : bahasaIndonesia.nama,
        )
      }))

      const examQuestions = await db.soal
        .where('mapelId')
        .equals(mapelIds[0])
        .filter((soal) => soal.kelasId === kelasIds[1])
        .toArray()
      const ujianId = await db.ujian.add({
        nama: 'Simulasi Ujian Aktif',
        jenis: 'Try Out',
        mapelId: mapelIds[0],
        kelasId: kelasIds[1],
        tanggal: today,
        waktuMulai: examStart.toTimeString().slice(0, 5),
        waktuSelesai: examEnd.toTimeString().slice(0, 5),
        durasiMenit: 120,
        jumlahSoal: examQuestions.length,
        acakSoal: true,
        acakOpsi: true,
        tampilkanNilai: true,
        minimalWaktuMenit: 10,
        aturanSkorKompleks: 'proporsional',
        token: 'CBT261',
        status: 'aktif',
        createdAt: now,
      })

      await db.ujianSoal.bulkAdd(examQuestions.map((soal, index) => ({
        ujianId,
        soalId: soal.id,
        urutan: index + 1,
      })))

      await db.pengaturan.bulkPut([
        { kunci: 'identitasSekolah', nilai: { nama: 'SMA Contoh', alamat: '', kepalaSekolah: '', logo: null } },
        { kunci: 'seedInfo', nilai: { versi: 1, dibuatPada: now.toISOString() } },
      ])

      return true
    },
  )

  return { seeded }
}
