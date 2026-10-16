import { db } from './db.js'

export const DEFAULT_SUBJECTS = [
  { kode: 'MAT', nama: 'Matematika', deskripsi: 'Matematika wajib' },
  { kode: 'BIN', nama: 'Bahasa Indonesia' },
  { kode: 'SBY', nama: 'Seni Budaya' },
  { kode: 'PKN', nama: 'Pendidikan Pancasila dan Kewarganegaraan (PKn)' },
  { kode: 'PJOK', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
  { kode: 'PAI', nama: 'Pendidikan Agama Islam' },
  { kode: 'PAK', nama: 'Pendidikan Agama Kristen' },
  { kode: 'PRA', nama: 'Prakarya' },
  { kode: 'BIO', nama: 'Biologi' },
  { kode: 'EKO', nama: 'Ekonomi' },
  { kode: 'GEO', nama: 'Geografi' },
  { kode: 'KIM', nama: 'Kimia' },
  { kode: 'SOS', nama: 'Sosiologi' },
  { kode: 'BINTL', nama: 'Bahasa Indonesia Tingkat Lanjut' },
  { kode: 'SEJIND', nama: 'Sejarah Indonesia' },
  { kode: 'SEJTL', nama: 'Sejarah Tingkat Lanjut' },
  { kode: 'SEJPM', nama: 'Sejarah Peminatan' },
  { kode: 'BIG', nama: 'Bahasa Inggris' },
  { kode: 'BIGTL', nama: 'Bahasa Inggris Tingkat Lanjut' },
  { kode: 'MATTL', nama: 'Matematika Tingkat Lanjut' },
]

export async function ensureDefaultSubjects() {
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
