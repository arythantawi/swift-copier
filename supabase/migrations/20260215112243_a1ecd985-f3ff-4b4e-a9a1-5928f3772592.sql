
-- Create table for legal/info pages (Syarat & Ketentuan, Kebijakan Privasi, etc.)
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read active legal pages"
ON public.legal_pages FOR SELECT
USING (is_active = true);

-- Admin write
CREATE POLICY "Admins can manage legal pages"
ON public.legal_pages FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_legal_pages_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default content
INSERT INTO public.legal_pages (slug, title, content) VALUES
('terms', 'Syarat & Ketentuan', '## Syarat & Ketentuan Layanan 44 Trans Jawa Bali

### 1. Ketentuan Umum
Dengan menggunakan layanan 44 Trans Jawa Bali, Anda menyetujui semua syarat dan ketentuan yang berlaku. Layanan kami mencakup transportasi antar kota menggunakan armada minibus yang terawat dan profesional.

### 2. Pemesanan & Pembayaran
- Pemesanan dapat dilakukan melalui website, WhatsApp, atau telepon.
- Pembayaran harus dilakukan sebelum keberangkatan.
- Pembatalan pemesanan yang dilakukan kurang dari 24 jam sebelum keberangkatan akan dikenakan biaya pembatalan sebesar 50% dari total harga.
- Pembatalan yang dilakukan lebih dari 24 jam sebelum keberangkatan akan mendapatkan pengembalian dana penuh.

### 3. Keberangkatan
- Penumpang wajib hadir di titik penjemputan minimal 15 menit sebelum waktu keberangkatan.
- Keterlambatan penumpang lebih dari 30 menit akan dianggap sebagai pembatalan sepihak.
- Jadwal keberangkatan dapat berubah sewaktu-waktu karena kondisi tertentu (cuaca, bencana alam, dll).

### 4. Bagasi & Barang Bawaan
- Setiap penumpang diperbolehkan membawa 1 koper besar dan 1 tas kabin.
- Barang berharga menjadi tanggung jawab penumpang.
- Dilarang membawa barang berbahaya, ilegal, atau mudah terbakar.

### 5. Tanggung Jawab
- 44 Trans bertanggung jawab atas keselamatan penumpang selama perjalanan.
- Kami tidak bertanggung jawab atas kehilangan atau kerusakan barang pribadi penumpang.
- Asuransi perjalanan disarankan untuk perlindungan tambahan.

### 6. Perubahan Ketentuan
44 Trans berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.'),
('privacy', 'Kebijakan Privasi', '## Kebijakan Privasi 44 Trans Jawa Bali

### 1. Informasi yang Kami Kumpulkan
Kami mengumpulkan informasi berikut saat Anda menggunakan layanan kami:
- Nama lengkap
- Nomor telepon / WhatsApp
- Alamat email
- Alamat penjemputan dan tujuan
- Riwayat pemesanan

### 2. Penggunaan Informasi
Informasi yang dikumpulkan digunakan untuk:
- Memproses dan mengelola pemesanan Anda
- Menghubungi Anda terkait layanan dan pemesanan
- Mengirimkan informasi promo dan penawaran khusus (dengan persetujuan Anda)
- Meningkatkan kualitas layanan kami

### 3. Perlindungan Data
- Kami menggunakan enkripsi dan langkah keamanan standar industri untuk melindungi data Anda.
- Data pribadi Anda tidak akan dijual atau dibagikan kepada pihak ketiga tanpa persetujuan Anda.
- Akses ke data dibatasi hanya untuk karyawan yang membutuhkan.

### 4. Penyimpanan Data
- Data pemesanan disimpan selama diperlukan untuk tujuan operasional dan hukum.
- Anda dapat meminta penghapusan data pribadi Anda kapan saja dengan menghubungi kami.

### 5. Cookie & Teknologi Pelacakan
Website kami menggunakan cookie untuk meningkatkan pengalaman pengguna. Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.

### 6. Hak Pengguna
Anda berhak untuk:
- Mengakses data pribadi Anda yang kami simpan
- Meminta koreksi data yang tidak akurat
- Meminta penghapusan data pribadi Anda
- Menolak penggunaan data untuk pemasaran

### 7. Hubungi Kami
Untuk pertanyaan tentang kebijakan privasi ini, hubungi kami di:
- WhatsApp: +62 812-3333-0042
- Email: info@travelminibus.com');
