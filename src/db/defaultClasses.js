import { db } from './db.js'

const DEFAULT_CLASSES = ['X', 'XI', 'XII'].flatMap((tingkat) =>
  Array.from({ length: 5 }, (_, index) => ({
    tingkat,
    nama: `${tingkat}-${index + 1}`,
  })),
)

export async function ensureDefaultClasses() {
  await db.transaction('rw', [db.kelas, db.tahunAjaran], async () => {
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
  })
}
