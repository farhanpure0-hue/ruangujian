import Dexie from 'dexie'

export const db = new Dexie('RuangUjianCBT')

db.version(1).stores({
  users: '++id, &username, role, siswaId, guruId, aktif',
  siswa: '++id, &nisn, nomorPeserta, nama, kelasId, rombel, aktif',
  guru: '++id, &nip, nama, mapelId, aktif',
  kelas: '++id, tingkat, nama, tahunAjaranId',
  mapel: '++id, &kode, nama',
  tahunAjaran: '++id, nama, semester, aktif',
  soal: '++id, mapelId, kelasId, tipe, tingkatKesulitan, aktif, updatedAt',
  ujian: '++id, nama, mapelId, kelasId, tanggal, status, token',
  ujianSoal: '++id, ujianId, soalId, urutan, &[ujianId+soalId]',
  pesertaUjian: '++id, ujianId, siswaId, status, waktuMulai, &[ujianId+siswaId]',
  jawaban: '++id, pesertaUjianId, soalId, ditandaiRagu, &[pesertaUjianId+soalId]',
  hasil: '++id, ujianId, siswaId, pesertaUjianId, statusPenilaian, nilai, &[ujianId+siswaId]',
  pelanggaran: '++id, pesertaUjianId, waktu, jenis',
  pengaturan: '&kunci',
})

export async function getDatabaseCounts() {
  const tables = ['users', 'siswa', 'guru', 'kelas', 'mapel', 'soal', 'ujian']
  const counts = await Promise.all(tables.map((tableName) => db.table(tableName).count()))
  return Object.fromEntries(tables.map((tableName, index) => [tableName, counts[index]]))
}
