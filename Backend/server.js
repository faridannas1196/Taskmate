const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { GoogleGenAI } = require('@google/genai');

// ==========================================
// IMPORT MULTER & FS (Wajib di Atas!)
// ==========================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MEMBUKA AKSES FOLDER UPLOADS KE PUBLIK
app.use('/uploads', express.static('uploads'));

// KONFIGURASI PENYIMPANAN FOTO (MULTER)
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// KONEKSI DATABASE MYSQL
// ==========================================
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

dbPool.getConnection()
    .then(() => console.log('✅ Berhasil terhubung ke Database MySQL!'))
    .catch((err) => console.error('❌ Gagal koneksi database:', err.message));

const initializeScheduleTable = async () => {
    await dbPool.execute(`
        CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guru_id INT NOT NULL,
            mata_pelajaran VARCHAR(100) NOT NULL,
            kelas VARCHAR(50) NOT NULL,
            hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
            jam_mulai TIME NOT NULL,
            jam_selesai TIME NOT NULL,
            ruangan VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_jadwal_guru FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_jadwal_guru_hari (guru_id, hari)
        ) ENGINE=InnoDB
    `);
};

// ==========================================
// MIDDLEWARE AUTENTIKASI TOKEN
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: "Akses ditolak. Token tidak ada!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token tidak valid/kadaluarsa!" });
        req.user = user; 
        next();
    });
};


// ==========================================
// ENDPOINT API
// ==========================================

app.get('/', (req, res) => {
    res.send("EduBackend API Berjalan Lancar! 🚀");
});

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await dbPool.execute(
            'INSERT INTO users (name, email, password, role, photo, address, dob, phone, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, '', '-', '-', '-', '-']
        );
        res.status(201).json({ message: "User berhasil didaftarkan!", userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Gagal mendaftar!", error: error.message });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await dbPool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) return res.status(401).json({ message: "Email tidak ditemukan!" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: "Password salah!" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: "Login Berhasil!",
            token: token,
            user: {
                id: user.id, name: user.name, email: user.email, role: user.role, photo: user.photo,
                address: user.address, gender: user.gender, hobby: user.hobby, phone: user.phone, dob: user.dob
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server!", error: error.message });
    }
});

// 3. EDIT PROFIL (Dengan Upload Foto)
app.put('/api/profile', authenticateToken, upload.single('photoFile'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, address, dob, phone, gender, hobby } = req.body;
        
        let photoPath = req.body.photo; 

        if (req.file) {
            photoPath = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        await dbPool.execute(
            'UPDATE users SET name=?, address=?, dob=?, phone=?, gender=?, hobby=?, photo=? WHERE id=?',
            [name, address, dob, phone, gender, hobby, photoPath, userId]
        );

        const [rows] = await dbPool.execute(
            'SELECT id, name, email, role, photo, address, gender, hobby, phone, dob FROM users WHERE id = ?', 
            [userId]
        );

        res.json({ message: "Profil berhasil diperbarui!", user: rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Gagal update profil", error: error.message });
    }
});

// 4. UBAH KATA SANDI
app.put('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const [rows] = await dbPool.execute('SELECT password FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Kata sandi lama salah!" });

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await dbPool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
        res.json({ message: "Kata sandi berhasil diubah!" });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// ==========================================
// 5. BERITA PENDIDIKAN (Cepat & Tanpa API Key)
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        // Menggunakan trik RSS to JSON dari portal CNN Indonesia Edukasi (Cepat & Stabil)
        const rssUrl = 'https://www.cnnindonesia.com/edukasi/rss';
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error("Gagal mengambil berita portal");
        }

        // Mapping ulang agar datanya pas dengan UI React kita
        const formattedNews = data.items.slice(0, 3).map((article, index) => ({
            id: index + 1,
            title: article.title,
            source: "CNN Edukasi", // Sumbernya kita patenkan 1 web
            url: article.link,
            tag: "Berita"
        }));

        res.json({
            message: "Berita berhasil diambil",
            articles: formattedNews
        });
    } catch (error) {
        console.error("News API Error:", error.message);
        res.status(500).json({ message: "Gagal mengambil berita", articles: [] });
    }
});

// 6. TO-DO LIST (CRUD)
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, urgency, type, deadline, status } = req.body;
        const [result] = await dbPool.execute(
            'INSERT INTO tasks (user_id, title, status, urgency, type, deadline) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, status, urgency, type, deadline]
        );
        res.status(201).json({ message: "Tugas ditambahkan!", taskId: result.insertId });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { title, urgency, type, deadline, status } = req.body;
        await dbPool.execute(
            'UPDATE tasks SET title=?, urgency=?, type=?, deadline=?, status=? WHERE id=? AND user_id=?',
            [title, urgency, type, deadline, status, req.params.id, req.user.id]
        );
        res.json({ message: "Tugas diupdate!" });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        await dbPool.execute('DELETE FROM tasks WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        res.json({ message: "Tugas dihapus!" });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

// 7. INFO / PENGUMUMAN (CRUD)
app.get('/api/announcements', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.execute(`
            SELECT a.id, a.title, a.preview, a.content, a.tags, a.created_at, 
                   u.name AS sender_name, u.role AS sender_role, u.photo AS sender_photo
            FROM announcements a 
            JOIN users u ON a.sender_id = u.id 
            ORDER BY a.created_at DESC
        `);
        const formattedData = rows.map(item => ({
            id: item.id, sender: item.sender_name, 
            role: item.sender_role === 'admin' ? 'Administrasi' : 'Guru Pengajar',
            photo: item.sender_photo, // <--- Menyisipkan foto ke React
            time: "Baru saja", date: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            title: item.title, preview: item.preview, content: item.content, tags: item.tags.split(',').map(tag => tag.trim())
        }));
        res.json(formattedData);
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.post('/api/announcements', authenticateToken, async (req, res) => {
    try {
        const { title, preview, content, tags } = req.body;
        const [result] = await dbPool.execute(
            'INSERT INTO announcements (sender_id, title, preview, content, tags) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, preview, content, tags]
        );
        res.status(201).json({ message: "Dibuat!", id: result.insertId });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.put('/api/announcements/:id', authenticateToken, async (req, res) => {
    try {
        const { title, preview, content, tags } = req.body;
        await dbPool.execute('UPDATE announcements SET title=?, preview=?, content=?, tags=? WHERE id=? AND sender_id=?',
            [title, preview, content, tags, req.params.id, req.user.id]);
        res.json({ message: "Diupdate!" });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

app.delete('/api/announcements/:id', authenticateToken, async (req, res) => {
    try {
        await dbPool.execute('DELETE FROM announcements WHERE id=? AND sender_id=?', [req.params.id, req.user.id]);
        res.json({ message: "Dihapus!" });
    } catch (error) { res.status(500).json({ message: "Gagal", error: error.message }); }
});

// 8. JADWAL MENGAJAR GURU
app.get('/api/guru/jadwal', authenticateToken, async (req, res) => {
    try {
        const [rows] = await dbPool.execute(`
            SELECT id, mata_pelajaran, kelas, hari,
                   TIME_FORMAT(jam_mulai, '%H:%i') AS jam_mulai,
                   TIME_FORMAT(jam_selesai, '%H:%i') AS jam_selesai,
                   ruangan
            FROM jadwal_pelajaran
            WHERE guru_id = ?
            ORDER BY FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), jam_mulai
        `, [req.user.id]);

        const [summary] = await dbPool.execute(`
            SELECT COUNT(*) AS total_ngajar, COUNT(DISTINCT mata_pelajaran) AS total_mata_pelajaran
            FROM jadwal_pelajaran
            WHERE guru_id = ?
        `, [req.user.id]);

        res.json({ jadwal: rows, totalNgajar: Number(summary[0].total_ngajar), totalMataPelajaran: Number(summary[0].total_mata_pelajaran) });
    } catch (error) { res.status(500).json({ message: "Gagal mengambil jadwal", error: error.message }); }
});

app.post('/api/guru/jadwal', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'guru') return res.status(403).json({ message: "Hanya guru yang dapat menambahkan jadwal" });
        const { mataPelajaran, kelas, hari, jamMulai, jamSelesai, ruangan } = req.body;
        if (!mataPelajaran || !kelas || !hari || !jamMulai || !jamSelesai) {
            return res.status(400).json({ message: "Data jadwal belum lengkap" });
        }

        const [result] = await dbPool.execute(`
            INSERT INTO jadwal_pelajaran (guru_id, mata_pelajaran, kelas, hari, jam_mulai, jam_selesai, ruangan)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [req.user.id, mataPelajaran, kelas, hari, jamMulai, jamSelesai, ruangan || null]);

        res.status(201).json({ message: "Jadwal berhasil ditambahkan", id: result.insertId });
    } catch (error) { res.status(500).json({ message: "Gagal menambahkan jadwal", error: error.message }); }
});

// 9. CHATBOT GEMINI AI
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Pesan kosong" });

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: { systemInstruction: "Kamu adalah 'FarEd AI', asisten pendidikan ramah. Jawab bahasa Indonesia singkat tanpa markdown (bintang/pagar berlebih)." }
        });

        res.json({ reply: response.text });
    } catch (error) { res.status(500).json({ message: "AI Sibuk/Error", error: error.message }); }
});

// ==========================================
// JALANKAN SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
initializeScheduleTable()
    .then(() => app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`)))
    .catch((error) => {
        console.error('❌ Gagal menyiapkan tabel jadwal:', error.message);
        process.exit(1);
    });