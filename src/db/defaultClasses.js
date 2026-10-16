import { db } from './db.js'

const DEFAULT_CLASSES = ['X', 'XI', 'XII'].flatMap((tingkat) =>
  Array.from({ length: 5 }, (_, index) => ({
    tingkat,
    nama: `${tingkat}-${index + 1}`,
  })),
)

export async function ensureDefaultClasses() {
  await db.transaction('rw', [db.kelas, db.tahunAjaran, db.siswa, db.soal, db.ujian], async () => {
    const tahunAjaranAktif = (await db.tahunAjaran.toArray()).find(({ aktif }) => aktif)
    if (!tahunAjaranAktif) {
      throw new Error('Tidak dapat menambahkan kelas: tahun ajaran aktif belum tersedia.')
    }

    const existingClasses = await db.kelas
      .where('tahunAjaranId')
      .equals(tahunAjaranAktif.id)
      .toArray()
    const existingNames = new Set(existingClasses.map(({ nama }) => nama))
    const missingClasses = DEFAULT_CLASSES
      .filter(({ nama }) => !existingNames.has(nama))
      .map((schoolClass) => ({ ...schoolClass, tahunAjaranId: tahunAjaranAktif.id }))

    if (missingClasses.length) {
      await db.kelas.bulkAdd(missingClasses)
    }

    const refreshedClasses = await db.kelas
      .where('tahunAjaranId')
      .equals(tahunAjaranAktif.id)
      .toArray()
    const replacementByGrade = new Map(refreshedClasses.map((schoolClass) => [schoolClass.tingkat, schoolClass]))
    const oldClassNames = new Set(['X IPA 1', 'XI IPA 1', 'XII IPA 1'])
    const obsoleteClasses = refreshedClasses.filter(({ nama }) => oldClassNames.has(nama))
    for (const oldClass of obsoleteClasses) {
      const replacement = replacementByGrade.get(oldClass.tingkat)
      if (!replacement || replacement.id === oldClass.id) continue
      const students = await db.siswa.where('kelasId').equals(oldClass.id).toArray()
      await Promise.all(students.map((student) => db.siswa.update(student.id, {
        kelasId: replacement.id,
        ...(student.rombel === oldClass.nama ? { rombel: replacement.nama } : {}),
      })))
      await db.soal.where('kelasId').equals(oldClass.id).modify({ kelasId: replacement.id })
      await db.ujian.where('kelasId').equals(oldClass.id).modify({ kelasId: replacement.id })
      await db.kelas.delete(oldClass.id)
    }
  })
}
