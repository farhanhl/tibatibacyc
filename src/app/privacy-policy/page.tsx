import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi (Privacy Policy) — Tiba-Tiba Cycling",
  description:
    "Kebijakan Privasi Tiba-Tiba Cycling mengenai pengumpulan, penggunaan data pengguna, dan integrasi Google Drive API.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0c0d0e] text-[#EAE6DD] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C44341] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C44341] flex items-center justify-center text-lg text-white shadow-md group-hover:bg-[#A93434] transition-colors">
              🚲
            </div>
            <span
              className="text-lg font-black uppercase text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tiba-Tiba Cycling
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1
            className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kebijakan Privasi
          </h1>
          <p className="text-xs font-mono text-gray-400">
            Terakhir diperbarui: 8 November 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              1. Pendahuluan
            </h2>
            <p>
              Tiba-Tiba Cycling (&quot;kami&quot;, &quot;komunitas&quot;) menghormati privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data saat Anda mengunjungi website kami (<span className="text-[#C44341] font-mono">https://www.tibatibacyc.my.id</span>) dan saat sistem dashboard kami menggunakan layanan pihak ketiga seperti Google Drive API.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              2. Data yang Kami Kumpulkan
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Data Pengunjung Publik:</strong> Kami mencatat statistik kunjungan sederhana (jumlah pengunjung anonim) untuk mengetahui antusiasme pesepeda di Bekasi tanpa melacak data pribadi individual atau riwayat penelusuran pribadi Anda.
              </li>
              <li>
                <strong className="text-white">Dokumentasi Gowes (Foto & Video):</strong> Foto dan video dokumentasi kegiatan yang diambil selama kegiatan gowes bersama dapat diarsipkan ke folder Google Drive resmi komunitas untuk dibagikan kembali kepada peserta gowes.
              </li>
              <li>
                <strong className="text-white">Data Pesanan Merchandise:</strong> Jika Anda melakukan pemesanan jersey/merchandise resmi, nama, nomor kontak (WhatsApp), dan ukuran jersey disimpan untuk keperluan administrasi dan konfirmasi pesanan.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              3. Penggunaan Google User Data & Google Drive API
            </h2>
            <p>
              Aplikasi kami menggunakan layanan <strong>Google Drive API</strong> khusus untuk modul pengelolaan media dokumentasi oleh administrator komunitas.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <p className="font-bold text-white font-mono text-xs">
                Cakupan Akses (Google OAuth Scope):
              </p>
              <code className="block p-2 rounded bg-black/60 text-emerald-400 font-mono text-xs break-all">
                https://www.googleapis.com/auth/drive.file
              </code>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Akses Terbatas (drive.file):</strong> Aplikasi hanya mengakses file dan folder yang dibuat oleh aplikasi ini sendiri (yaitu folder kegiatan dokumentasi Tiba-Tiba Cycling). Aplikasi <strong>tidak memiliki akses</strong> untuk melihat, membaca, mengedit, atau menghapus file atau dokumen pribadi Anda lainnya di Google Drive.
              </li>
              <li>
                <strong className="text-white">Tujuan Penggunaan:</strong> Akses Google Drive digunakan semata-mata untuk mengunggah foto dan video dokumentasi gowes dari dashboard pengelola ke folder arsip komunitas.
              </li>
              <li>
                <strong className="text-white">Kepatuhan Kebijakan Data Pengguna Google:</strong> Penggunaan dan transfer informasi yang diterima dari Google APIs oleh Tiba-Tiba Cycling ke aplikasi lain akan selalu mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">Google API Services User Data Policy</a>, termasuk persyaratan <em>Limited Use</em>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              4. Keamanan & Penyimpanan Data
            </h2>
            <p>
              Kredensial otorisasi Google (seperti Refresh Token dan Client Secret) disimpan secara aman pada environment variable server dan <strong>tidak pernah dipublikasikan atau dikirim ke browser pengguna umum</strong>. Kami tidak menjual, menyewakan, atau membagikan data pengguna kepada pihak ketiga mana pun untuk tujuan komersial atau periklanan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              5. Pencabutan Izin Akses (Revoke Access)
            </h2>
            <p>
              Pemilik akun Google dapat mencabut izin akses aplikasi Tiba-Tiba Cycling kapan saja melalui pengaturan keamanan akun Google Anda di:
            </p>
            <p>
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline font-mono text-xs"
              >
                https://myaccount.google.com/permissions ↗
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              6. Hubungi Kami
            </h2>
            <p>
              Jika Anda memiliki pertanyaan seputar Kebijakan Privasi ini atau pengelolaan data di Tiba-Tiba Cycling, silakan hubungi kami melalui:
            </p>
            <div className="font-mono text-xs space-y-1 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <p>• Komunitas: Tiba-Tiba Cycling (Bekasi, Jawa Barat, Indonesia)</p>
              <p>• Instagram: <a href="https://www.instagram.com/tibatiba.cyc/" target="_blank" rel="noopener noreferrer" className="text-[#C44341] underline">@tibatiba.cyc</a></p>
              <p>• Website: <a href="https://www.tibatibacyc.my.id" target="_blank" rel="noopener noreferrer" className="text-[#C44341] underline">https://www.tibatibacyc.my.id</a></p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs font-mono text-gray-500 pt-4">
          © 2026 Tiba-Tiba Cycling. All rights reserved.
        </div>
      </div>
    </main>
  );
}
