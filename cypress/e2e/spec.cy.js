describe('template spec', () => {
  it('siswa page', () => {
    cy.visit('http://localhost:5173/')

    cy.get('#email').type('farid@gmail.com')
    cy.get('#pass').type('farid123')
    cy.contains('Sign in').click()
    cy.wait(5000)
    cy.get('#scroll').scrollTo('bottom',{ensureScrollable: false})
    cy.wait(3000)
    cy.contains('Info').click()
    cy.get('#inpo').click()
    // cy.wait(2000)
    cy.get('#searchinfo').type('Pelaksanaan UAS')
    cy.get('#inpo').click()
    // cy.wait(2000)
    cy.contains('To-Do').click()

    cy.contains('Add Task').click()
     cy.get('#namatugas').type('Proyek Akhir Vibe Coding');
    cy.get('select').eq(0).select('High'); // Ubah Urgensi jadi High
    cy.get('#status').select('To do');
    cy.get('input[type="date"]').type('2026-05-31');
    cy.wait(1000);
    
    // Simpan Tugas
    cy.contains('Simpan Tugas').click();
    cy.contains('Berhasil!').should('be.visible'); // Cek SweetAlert
    cy.wait(1500);

    // ==========================================
    // 3. EDIT TUGAS
    // ==========================================
    cy.contains('Proyek Akhir Vibe Coding').click();
    cy.wait(1000);
    
    // Ubah judul
    cy.get('#namatugas').clear().type('Proyek Akhir Vibe Coding (Revisi)');
    cy.wait(500);
    cy.contains('Simpan Tugas').click();
    cy.contains('Berhasil!').should('be.visible');
    cy.wait(1500);

    // ==========================================
    // 4. GESER KE "DOING" (Panah Kanan)
    // ==========================================
    // Cari tombol panah ➔ di sebelah tugas kita dan klik paksa (karena aslinya muncul saat di-hover)
    cy.contains('Proyek Akhir Vibe Coding (Revisi)')
      .parent()
      .find('button').contains('➔').click({ force: true });
    
    cy.wait(1500);

    // ==========================================
    // 5. GESER KE "DONE" DENGAN SWEET ALERT
    // ==========================================
    // Cari tugas yang sekarang ada di kolom Doing, klik panah ➔ lagi
    cy.contains('Doing').parent().parent().within(() => {
      cy.contains('Proyek Akhir Vibe Coding (Revisi)')
        .parent()
        .find('button').contains('➔').click({ force: true });
    });

    cy.wait(1000);
    // SweetAlert Konfirmasi Selesai muncul, klik "Ya, Selesai!"
    cy.contains('Ya, Selesai!').click();
    cy.contains('Kerja Bagus!').should('be.visible'); // Cek pop up sukses
    cy.wait(2000);

    // ==========================================
    // 6. HAPUS TUGAS DARI "DONE"
    // ==========================================
    // Cari tombol tempat sampah 🗑️ di kolom Done
    cy.contains('Done').parent().parent().within(() => {
      cy.contains('Proyek Akhir Vibe Coding (Revisi)')
        .parent()
        .parent()
        .find('button').contains('🗑️').click({ force: true });
    });

    cy.wait(1000);
    // SweetAlert Konfirmasi Hapus muncul, klik "Ya, Hapus!"
    cy.contains('Ya, Hapus!').click();
    cy.contains('Dihapus!').should('be.visible');

  

     cy.contains('AI-Assistant').click();
    cy.wait(1000); // Jeda santai untuk rekaman video

    // ==========================================
    // 3. MENGIRIM PESAN (Prompt)
    // ==========================================
    const pertanyaan = 'Tolong jelaskan secara singkat, apa itu hukum gravitasi Newton?';
    
    // Ketik pertanyaan secara natural (diberi delay agar terlihat seperti orang mengetik)
    cy.get('input[placeholder="Tanya soal rumus, sejarah, atau terjemahan..."]')
      .type(pertanyaan, { delay: 50 });
    
    cy.wait(500);

    // Tekan tombol kirim (ikon pesawat kertas)
    cy.get('form#mainChatForm button[type="submit"]').click();

    // ==========================================
    // 4. VERIFIKASI PROSES (LOADING & BALASAN)
    // ==========================================
    // Pastikan input terkunci selama AI berpikir
    cy.get('input[placeholder="Tanya soal rumus, sejarah, atau terjemahan..."]').should('be.disabled');

    // Pastikan elemen animasi titik-titik (animate-bounce) muncul
    cy.get('.animate-bounce').should('be.visible');

    // Karena API Gemini butuh beberapa detik untuk menjawab, kita naikkan waktu tunggu Cypress.
    // Default Cypress hanya 4 detik. Kita atur maksimal 15 detik agar tes tidak gagal duluan.
    cy.contains('OUR AI', { timeout: 15000 }).parent().parent().within(() => {
      // Pastikan bahwa animasi loading sudah hilang dan berganti menjadi teks panjang balasan AI.
      // Kita cek elemen yang punya teks selain dari sapaan awal
      cy.get('.whitespace-pre-wrap').last().invoke('text').should('have.length.greaterThan', 20);
    });

    cy.wait(1000);
    
    // Pastikan input terbuka kembali
    cy.get('input[placeholder="Tanya soal rumus, sejarah, atau terjemahan..."]').should('not.be.disabled');

    // ==========================================
    // 5. PERTANYAAN KEDUA (Melihat efek Auto-Scroll)
    // ==========================================
    cy.wait(1000);
    cy.get('input[placeholder="Tanya soal rumus, sejarah, atau terjemahan..."]')
      .type('Sebutkan 3 contohnya dalam kehidupan sehari-hari.', { delay: 50 });
    cy.get('form#mainChatForm button[type="submit"]').click();

    cy.get('.animate-bounce').should('be.visible');
    
    // Tunggu balasan kedua
    cy.contains('OUR AI', { timeout: 15000 }).parent().parent().within(() => {
      cy.get('.whitespace-pre-wrap').last().invoke('text').should('have.length.greaterThan', 20);
    });

    cy.wait(3000);

    cy.contains('Setting').click()
    cy.get('#scroll').scrollTo('bottom',{ensureScrollable: false})

    cy.contains('Edit Data Profil').click();
    cy.wait(1000);

    // Mengisi form Edit Profil
    cy.contains('label', 'Nama Lengkap').parent().find('input').clear().type('Test', { delay: 50 });
    cy.contains('label', 'Nomor HP').parent().find('input').clear().type('123421132', { delay: 50 });
    
    // Input Date (Format YYYY-MM-DD)
    cy.contains('label', 'Tanggal Lahir').parent().find('input').type('2005-08-17');
    
    // Select Dropdown
    cy.contains('label', 'Jenis Kelamin').parent().find('select').select('Laki-laki');
    
    cy.contains('label', 'Alamat Domisili').parent().find('input').clear().type('Jl. Bali  No. 04, Surabaya', { delay: 30 });
    cy.contains('label', 'Hobi').parent().find('textarea').clear().type('Hiking', { delay: 30 });
    cy.wait(1000);

    // Simpan Perubahan
    cy.contains('✔ Simpan Perubahan').click();
    cy.wait(500);

    // Konfirmasi SweetAlert
    cy.contains('Ya, Simpan').click(); // Sesuaikan dengan teks tombol SweetAlert kamu
    
    // Verifikasi kembali ke halaman profil awal
    cy.contains('Hallo').should('be.visible');
    cy.wait(2000);

     cy.get('.cursor-pointer > img').click();
    cy.wait(1000);

    // Klik tombol Ubah Kata Sandi di dropdown
    cy.contains('🔒 Ubah Kata Sandi').click();
    cy.wait(1000);

    // Pastikan Modal Ubah Sandi terbuka
    cy.contains('h2', 'Ubah Sandi').should('be.visible');

    // ==========================================
    // 3. MENGISI FORM UBAH SANDI
    // ==========================================
    // Ketik sandi lama
    cy.get('input[placeholder="Sandi Lama"]').type('farid123', { delay: 100 });
    cy.wait(500);
    
    // Ketik sandi baru
    const sandiBaru = 'rahasia123'; // <--- SANDI BARU (Ingat sandi ini ya!)
    cy.get('input[placeholder="Sandi Baru"]').type('farid123', { delay: 100 });
    cy.wait(500);
    
    // Ketik konfirmasi sandi baru
    cy.get('input[placeholder="Konfirmasi"]').type('farid123', { delay: 100 });
    cy.wait(1000);

    // ==========================================
    // 4. SIMPAN & VERIFIKASI SWEETALERT KONFIRMASI
    // ==========================================
    cy.contains('button', 'Simpan Kata Sandi').click();
    cy.wait(1000);

    // Memastikan SweetAlert peringatan logout muncul
    cy.contains('Anda akan keluar (logout)').should('be.visible');
    cy.wait(1500); // Tahan sebentar biar penonton bisa baca peringatannya

    // Klik "Ya, Ubah" pada SweetAlert
    cy.contains('Ya, Ubah').click();

    // ==========================================
    // 5. VERIFIKASI LOGOUT OTOMATIS & TES LOGIN ULANG
    // ==========================================
    // Memastikan SweetAlert sukses muncul
    cy.contains('Berhasil!').should('be.visible');
    cy.contains('Silakan login kembali').should('be.visible');
    
    // Klik OK di SweetAlert Sukses
    cy.contains('OK').click();
    cy.wait(1500);

    cy.get('#email').type('guru123@gmail.com')
    cy.get('#pass').type('gurubaik')
    cy.contains('Sign in').click()

    cy.wait(2000)
    cy.get('#infocepat').type('Halo saya sebagai guru ya')
    cy.contains('Kirim').click()
    cy.contains('Ya, Kirim!').click()
    cy.wait(1000)
    cy.contains('Info').click()
    cy.contains('+ Buat Pengumuman').click();
    cy.wait(1000);

    // Pastikan Modal Terbuka
    cy.contains('Buat Pengumuman Baru').should('be.visible');

    // Isi Form Pengumuman
    cy.contains('label', 'Judul Pengumuman').parent().find('input')
      .type('Pertemuan Orang Tua Wali Murid', { delay: 50 });
    
    // Pilih Kategori dari Dropdown
    cy.contains('label', 'Kategori').parent().find('select')
      .select('Pertemuan');

    cy.contains('label', 'Preview Pendek').parent().find('input')
      .type('Wajib hadir untuk pengambilan rapor semester ini.', { delay: 50 });
      
    cy.contains('label', 'Isi Pengumuman').parent().find('textarea')
      .type('Yth. Bapak/Ibu Wali Murid,\n\nKami mengundang Bapak/Ibu untuk hadir pada pengambilan rapor pada hari Jumat pukul 08:00 di Aula Utama sekolah.\n\nTerima kasih atas perhatiannya.', { delay: 30 });
    
    cy.wait(1000);

    // Simpan Pengumuman
    cy.contains('Kirim Pengumuman ➤').click();
    
    // Verifikasi SweetAlert Sukses muncul
    cy.contains('Terkirim!').should('be.visible');
    cy.wait(2000); // Tunggu modal hilang dan daftar info ter-refresh

    // ==========================================
    // 3. EDIT PENGUMUMAN
    // ==========================================
    // Klik info yang baru saja dibuat di panel kiri
    cy.contains('Pertemuan Orang Tua Wali Murid').click();
    cy.wait(1000);

    // Klik tombol Edit di panel kanan atas
    cy.contains('button', 'Edit').click();
    cy.wait(1000);

    // Ubah Judul
    cy.contains('label', 'Judul Pengumuman').parent().find('input')
      .clear()
      .type('Pertemuan Orang Tua Wali Murid (DIUNDUR)', { delay: 50 });
    
    cy.wait(500);
    cy.contains('✔ Simpan Perubahan').click();

    // Verifikasi SweetAlert Tersimpan
    cy.contains('Tersimpan!').should('be.visible');
    cy.wait(2000);

    // ==========================================
    // 4. HAPUS PENGUMUMAN
    // ==========================================
    // Pastikan info yang diedit tadi masih terpilih di panel kanan
    cy.contains('Pertemuan Orang Tua Wali Murid (DIUNDUR)').should('be.visible');
    cy.wait(1000);

    // Klik tombol Hapus (merah)
    cy.contains('button', 'Hapus').click();
    cy.wait(1000);

    // Pastikan SweetAlert Konfirmasi muncul
    cy.contains('Hapus Pengumuman?').should('be.visible');
    cy.wait(1000);

    // Klik tombol "Hapus!" di dalam SweetAlert
    cy.contains('button', 'Hapus!').click();

    // Verifikasi pesan berhasil dihapus
    cy.contains('Dihapus!').should('be.visible');
    cy.wait(1500);

    // Pastikan judulnya sudah tidak ada di panel kiri
    cy.contains('Pertemuan Orang Tua Wali Murid (DIUNDUR)').should('not.exist');
    cy.wait(2000); // Selesai
    cy.contains('Jadwal & Kalender').click()
    cy.wait(1000)
    cy.contains('29').click()

    // ==========================================
    // 2. QUICK TOUR: AI ASSISTANT
    // ==========================================
    cy.contains('button', 'AI-Assistant').click();
    cy.wait(1500);

    // Tulis 1 pesan ke AI
    cy.get('input[placeholder="Tanya saya untuk buat RPP atau soal..."]')
      .type('Tolong buatkan 2 soal pilihan ganda tentang Sejarah Indonesia.', { delay: 40 });
    cy.wait(500);
    
    // Klik tombol kirim (pesawat kertas)
    cy.get('#kirim').click();
    
    // Tunggu sampai AI merespons (hilangnya animasi loading)
    cy.get('.animate-bounce').should('be.visible');
    cy.contains('OUR AI', { timeout: 15000 }).parent().parent().within(() => {
      cy.get('.whitespace-pre-wrap').last().invoke('text').should('have.length.greaterThan', 20);
    });
    cy.wait(2000);

    // ==========================================
    // 3. QUICK TOUR: SETTING & EDIT PROFIL
    // ==========================================
    cy.contains('button', 'Setting').click();
    cy.wait(1500);

    // Lihat-lihat (Scroll dikit jika perlu)
    cy.contains('Profile & Settings').should('be.visible');
    cy.wait(1000);

    // Buka Modal Edit Data Profil
    cy.contains('button', 'Edit Data Profil').click();
    cy.wait(1500);


    // Batal edit (Tutup modal)
    cy.contains('button', 'Batal').click();
    cy.wait(1000);

    // ==========================================
    // 4. HEADER DROPDOWN & LOGOUT
    // ==========================================
    // Klik Avatar di pojok kanan atas untuk membuka menu dropdown
    cy.get('.cursor-pointer > img').click();
    cy.wait(1000);

    // Pastikan Dropdown terbuka (melihat tombol Logout)
    cy.contains('button', '🚪 Logout').should('be.visible');
    cy.wait(1000);

    // Klik Logout
    cy.contains('button', '🚪 Logout').click();
    cy.wait(1000);

    // Konfirmasi SweetAlert Keluar
    cy.contains('Keluar dari FarEd?').should('be.visible');
    cy.wait(1000);

    // Klik "Ya, Keluar"
    cy.contains('button', 'Ya, Keluar').click();

    cy.contains('Berhasil Keluar').should('be.visible');
    cy.wait(1000);
    cy.contains('Silakan Login').should('be.visible'); // Pastikan kembali ke form login

    cy.wait(2000); // Selesai!
  }) 
})