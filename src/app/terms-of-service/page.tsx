import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Layanan (Terms of Service) — Tiba-Tiba Cycling",
  description:
    "Syarat dan Ketentuan Layanan penggunaan website dan keikutsertaan kegiatan komunitas sepeda Tiba-Tiba Cycling.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/terms-of-service",
  },
};

export default function TermsOfServicePage() {
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
            Syarat & Ketentuan Layanan
          </h1>
          <p className="text-xs font-mono text-gray-400">
            Terakhir diperbarui: 8 November 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              1. Penerimaan Ketentuan
            </h2>
            <p>
              Dengan mengakses dan menggunakan website Tiba-Tiba Cycling (<span className="text-[#C44341] font-mono">https://www.tibatibacyc.my.id</span>) serta berpartisipasi dalam kegiatan gowes bersama komunitas kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini (&quot;Ketentuan&quot;). Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan layanan atau website kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              2. Deskripsi Layanan Komunitas
            </h2>
            <p>
              Tiba-Tiba Cycling adalah komunitas pesepeda santai di Bekasi yang didirikan pada Juli 2026. Website ini menyediakan informasi seputar:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Jadwal, rute, dan titik kumpul kegiatan gowes akhir pekan (Weekend Rides).</li>
              <li>Generator Twibbon resmi untuk foto profil atau Instagram Story.</li>
              <li>Informasi dan formulir pemesanan merchandise/jersey resmi komunitas.</li>
              <li>Dokumentasi arsip foto dan video kegiatan yang disimpan dan dibagikan melalui Google Drive komunitas.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              3. Partisipasi Gowes & Keselamatan
            </h2>
            <p>
              Kegiatan bersepeda Tiba-Tiba Cycling bersifat rekreasi sosial dan terbuka untuk semua jenis sepeda. Setiap peserta wajib memperhatikan hal-hal berikut:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Wajib mengenakan helm keselamatan sepeda standar dan menyalakan lampu sepeda pada kondisi minim cahaya.</li>
              <li>Mematuhi rambu-rambu lalu lintas serta saling menghormati sesama pengguna jalan raya.</li>
              <li>Memastikan kondisi sepeda (rem, ban, drivetrain) dan fisik pribadi dalam kondisi layak sebelum gowes.</li>
              <li>Menjaga ritme berkendara dalam kelompok (group ride safety) dan tidak melakukan manuver berbahaya.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              4. Media, Dokumentasi & Google Drive
            </h2>
            <p>
              Selama kegiatan berlangsung, panitia atau anggota komunitas dapat mengambil foto dan video untuk keperluan arsip kenangan bersama.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Penyimpanan Google Drive:</strong> Dokumentasi kegiatan diupload oleh admin ke Google Drive komunitas menggunakan integrasi Google Drive API resmi. Folder dokumentasi dibagikan secara publik (Viewer) agar anggota dapat mengunduh foto mereka.
              </li>
              <li>
                <strong>Hak Privasi Foto:</strong> Jika terdapat foto diri Anda dalam dokumentasi yang Anda rasa kurang berkenan untuk ditampilkan, Anda dapat menghubungi admin komunitas kapan saja untuk meminta penghapusan foto tersebut.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              5. Hak Kekayaan Intelektual
            </h2>
            <p>
              Seluruh logo, merek dagang Tiba-Tiba Cycling, desain grafis twibbon, dan kode sumber website dilindungi oleh hak cipta komunitas Tiba-Tiba Cycling. Penggunaan logo untuk keperluan komersial di luar kegiatan komunitas harus mendapatkan izin tertulis terlebih dahulu dari pengurus.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              6. Batasan Tanggung Jawab (Disclaimer)
            </h2>
            <p>
              Partisipasi dalam setiap kegiatan gowes dilakukan atas kesadaran dan tanggung jawab pribadi masing-masing peserta. Tiba-Tiba Cycling, pengurus, maupun pengelola website tidak bertanggung jawab atas kerugian materiil, kerusakan perlengkapan, kecelakaan, atau cedera fisik yang timbul selama perjalanan di jalan raya. Kami selalu mengedepankan prinsip saling jaga (buddy system) demi kenyamanan bersama.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              7. Perubahan Ketentuan
            </h2>
            <p>
              Kami dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan berlaku efektif setelah halaman ini diperbarui dengan tanggal revisi terbaru.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              8. Kontak Informasi
            </h2>
            <p>
              Pertanyaan atau tanggapan terkait Syarat dan Ketentuan ini dapat disampaikan melalui:
            </p>
            <div className="font-mono text-xs space-y-1 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <p>• Komunitas: Tiba-Tiba Cycling</p>
              <p>• Lokasi: Bekasi, Jawa Barat, Indonesia</p>
              <p>• Instagram: <a href="https://www.instagram.com/tibatiba.cyc/" target="_blank" rel="noopener noreferrer" className="text-[#C44341] underline">@tibatiba.cyc</a></p>
              <p>• WhatsApp Group: <a href="https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">Join WhatsApp Group</a></p>
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

