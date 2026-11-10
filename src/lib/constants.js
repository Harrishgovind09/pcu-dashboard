export const ORDER = ['kaunseling', 'program', 'ujian', 'tatatertib', 'dass', 'intervensi'];

export const SEV_COLORS = ['#BFDCD9', '#6FB3AE', '#F0B84A', '#DD6A2C', '#8F2A1B'];
export const SEV_KEYS = ['sev0', 'sev1', 'sev2', 'sev3', 'sev4'];

export const MONTHS = {
  ms: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
export const MONTHS_FULL = {
  ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

export const GENDERS = ['Perempuan', 'Lelaki'];
export const SOURCES = ['sukarela', 'rujukan'];
export const RESPONDENTS = ['pelajar', 'staf'];
export const STRESS_STATUS = ['stabil', 'sederhana', 'teruk'];

// Lookup "kind" used for each dropdown
export const LOOKUP_KINDS = [
  'ptj', 'kampus', 'kes_kaunseling', 'kes_tatatertib', 'ujian', 'intervensi', 'jabatan', 'kategori_penyertaan'
];

// stored Malay values -> English display
export const VALUE_EN = {
  Perempuan: 'Female', Lelaki: 'Male',
  rujukan: 'Referral', sukarela: 'Voluntary',
  pelajar: 'Students', staf: 'Staff',
  stabil: 'Stable', sederhana: 'Moderate', teruk: 'Severe',
  'Lain-lain': 'Others',
  'Emosi dan tekanan': 'Emotional and stress', Akademik: 'Academic', Hubungan: 'Relationships', Keluarga: 'Family', Kewangan: 'Financial',
  'Ponteng kelas': 'Skipping class', 'Salah laku kampus': 'Campus misconduct', 'Ketidakjujuran akademik': 'Academic dishonesty',
  'Pelanggaran kod pakaian': 'Dress code violation', 'Penyalahgunaan ICT': 'ICT misuse',
  'Inventori Minat Kerjaya': 'Career Interest Inventory', 'Inventori Personaliti': 'Personality Inventory', 'Ujian Gaya Pembelajaran': 'Learning Style Test',
  'Kaunseling individu': 'Individual counselling', 'Kaunseling kelompok': 'Group counselling', 'Bengkel pengurusan stres': 'Stress management workshop',
  'Rujukan klinikal': 'Clinical referral', 'Susulan berkala': 'Periodic follow-up',
  Pelajar: 'Students', Staf: 'Staff', 'Komuniti luar': 'External community', Fakulti: 'Faculty',
  'Parit Raja': 'Parit Raja', Pagoh: 'Pagoh',
  'Minggu Kesedaran Kesihatan Mental': 'Mental Health Awareness Week', 'Kem Motivasi Pelajar Baharu': 'New Student Motivation Camp',
  'Bengkel Pengurusan Stres': 'Stress Management Workshop', 'Sesi Sokongan Rakan Sebaya': 'Peer Support Sessions', 'Program lain': 'Other programmes'
};

export const ICONS = {
  home: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
  kaunseling: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.1A8.5 8.5 0 1 1 21 12z',
  program: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ujian: 'M9 3h6v4H9z M8 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 15l2 2 4-4',
  tatatertib: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z',
  dass: 'M3 12h4l3-8 4 16 3-8h4',
  intervensi: 'M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21z',
  entry: 'M12 5v14 M5 12h14',
  import: 'M12 3v12 M7 10l5 5 5-5 M4 21h16',
  admin: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  chevron: 'M6 9l6 6 6-6',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9'
};

// DASS-21 (x2) severity cut-offs: upper bound of each level 0..3 (level 4 = above)
export const DASS_CUTS = {
  depression: [9, 13, 20, 27],
  anxiety: [7, 9, 14, 19],
  stress: [14, 18, 25, 33]
};
export const dassLevel = (scale, score) => {
  const cuts = DASS_CUTS[scale];
  for (let i = 0; i < cuts.length; i++) if (score <= cuts[i]) return i;
  return 4;
};
