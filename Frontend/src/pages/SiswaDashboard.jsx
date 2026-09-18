import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function SiswaDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token'); 
  
  // ================= 1. STATE UTAMA =================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInfoId, setSelectedInfoId] = useState(1);
  const [news, setNews] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // ================= 2. STATE TO-DO LIST =================
  const [tasks, setTasks] = useState([]); 
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', urgency: 'Medium', deadline: '', type: '', status: 'todo' });
  const [editingTaskId, setEditingTaskId] = useState(null);

  // ================= 3. STATE EDIT PROFIL & SANDI =================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '', address: user?.address || '', dob: user?.dob || '',
    phone: user?.phone || '', gender: user?.gender || 'Laki-laki', hobby: user?.hobby || '', photo: user?.photo || ''
  });

  const [photoFile, setPhotoFile] = useState(null); // Menyimpan file asli
  const [photoPreview, setPhotoPreview] = useState(null); // Menampilkan preview

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file)); // Buat URL lokal sementara untuk preview
    }
  };
  
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // ================= 4. STATE CHATBOT AI =================
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Halo! Saya Taskmate AI. Ada yang bisa saya bantu untuk pelajaranmu hari ini?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chatbot') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  // ================= 5. AMBIL DATA API (USE EFFECT) =================
  const [infoData, setInfoData] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/news');
        const data = await response.json();
        if (data.articles) setNews(data.articles);
      } catch (error) { console.error("Gagal ambil berita", error); }
    };

    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (Array.isArray(data)) setTasks(data);
      } catch (error) { console.error("Gagal ambil tugas", error); }
    };

    const fetchInfo = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (Array.isArray(data)) {
            setInfoData(data);
            if(data.length > 0) setSelectedInfoId(data[0].id); 
        }
      } catch (error) { console.error("Gagal ambil info", error); }
    };

    fetchNews();
    fetchTasks();
    fetchInfo();
  }, [token]);

  // ================= 6. FUNGSI LOGOUT, PROFILE, SANDI =================
  const handleLogout = async () => {
    // SweetAlert Konfirmasi Keluar
    const result = await Swal.fire({
      title: 'Keluar dari Taskmate?',
      text: "Anda harus login kembali untuk masuk.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Merah (karena aksi destructive)
      cancelButtonColor: '#6B7280', // Abu-abu
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      backdrop: `rgba(0,0,0,0.5)`
    });

    // Jika user mengklik "Ya, Keluar"
    if (result.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // SweetAlert Sampai Jumpa (Opsional agar manis)
      await Swal.fire({
        title: 'Berhasil Keluar',
        text: 'Sampai jumpa lagi!',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false
      });

      navigate('/'); // Lempar ke halaman Login
    }
  };

const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Munculkan SweetAlert Konfirmasi sebelum menyimpan
    const result = await Swal.fire({
      title: 'Simpan Perubahan?',
      text: "Apakah kamu yakin ingin mengubah data profilmu?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#087E8B',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Simpan!',
      cancelButtonText: 'Batal',
      backdrop: `rgba(0,0,0,0.4)`
    });

if (result.isConfirmed) {
      try {
        // KITA PAKAI FORMDATA KARENA MENGIRIM FILE!
        const formData = new FormData();
        formData.append('name', editForm.name);
        formData.append('address', editForm.address);
        formData.append('dob', editForm.dob);
        formData.append('phone', editForm.phone);
        formData.append('gender', editForm.gender);
        formData.append('hobby', editForm.hobby);
        formData.append('photo', editForm.photo); // Foto lama

        if (photoFile) {
          formData.append('photoFile', photoFile); // File foto baru
        }

        const response = await fetch('http://localhost:5000/api/profile', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }, // JANGAN pakai Content-Type json kalau pakai FormData
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) { 
          localStorage.setItem('user', JSON.stringify(data.user)); 
          setIsEditingProfile(false); 
          
          // SweetAlert Sukses sebelum refresh
          await Swal.fire({
            title: 'Berhasil!',
            text: 'Data profilmu telah diperbarui.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          window.location.reload(); 
        } else {
          Swal.fire('Gagal!', data.message || 'Gagal menyimpan profil', 'error');
        }
      } catch (error) { 
        Swal.fire('Error!', 'Terjadi kesalahan koneksi.', 'error');
      }
    }
  };

  const openPasswordModal = () => {
    setIsHeaderDropdownOpen(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordError('Konfirmasi tidak cocok!');
    if (passwordForm.newPassword.length < 6) return setPasswordError('Minimal 6 karakter!');
    
    const result = await Swal.fire({
      title: 'Ubah Kata Sandi?', text: "Anda akan keluar (logout) dan harus login ulang setelah sandi diubah. Lanjutkan?", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#F59E0B', cancelButtonColor: '#6B7280', confirmButtonText: 'Ya, Ubah', cancelButtonText: 'Batal'
    });

    if(result.isConfirmed){
      try {
        const response = await fetch('http://localhost:5000/api/change-password', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // SWEETALERT BERHASIL (Dilengkapi fungsi Logout Otomatis tanpa konfirmasi lagi)
        await Swal.fire({
          title: 'Berhasil!', 
          text: 'Sandi diubah. Silakan login kembali.', 
          icon: 'success',
          confirmButtonColor: '#5D4289'
        }).then(() => {
          // Aksi yang dijalankan SETELAH tombol OK di SweetAlert diklik
          setIsPasswordModalOpen(false); 
          localStorage.removeItem('token'); 
          localStorage.removeItem('user'); 
          navigate('/'); // Lempar paksa ke halaman login
        });

      } catch (error) { setPasswordError(error.message); }
    }
  };

  // ================= 7. FUNGSI TO-DO LIST =================
  const openTaskModal = (status) => { setEditingTaskId(null); setNewTask({ title: '', urgency: 'Medium', deadline: '', type: '', status: status }); setIsTaskModalOpen(true); };
  const openEditModal = (task) => { setEditingTaskId(task.id); setNewTask(task); setIsTaskModalOpen(true); };

const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) return; // Pastikan title & deadline terisi
    
    console.log("Mengirim data task:", newTask); // <--- LOG UNTUK DEBUGGING

    try {
      if (editingTaskId) {
        const response = await fetch(`http://localhost:5000/api/tasks/${editingTaskId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newTask)
        });
        
        if(response.ok) {
           setTasks(tasks.map(t => t.id === editingTaskId ? { ...newTask, id: editingTaskId } : t));
           Swal.fire({ title: 'Berhasil!', text: 'Tugas berhasil diubah.', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
           const data = await response.json();
           throw new Error(data.message);
        }
      } else {
        const response = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newTask)
        });
        
        if (response.ok) {
           const data = await response.json();
           setTasks([{ ...newTask, id: data.taskId }, ...tasks]);
           Swal.fire({ title: 'Berhasil!', text: 'Tugas baru ditambahkan.', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
           const data = await response.json();
           throw new Error(data.message);
        }
      }
      setIsTaskModalOpen(false); 
    } catch (error) { 
      console.error("Error Simpan Task:", error.message);
      Swal.fire('Error', error.message || 'Gagal menyimpan tugas.', 'error');
    }
  };

  const moveTask = async (taskId, newStatus) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // Jika digeser ke 'done', munculkan SweetAlert Konfirmasi
    if (newStatus === 'done') {
      const result = await Swal.fire({
        title: 'Sudah Selesai?',
        text: `Apakah kamu yakin tugas "${taskToMove.title}" sudah selesai dikerjakan?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10B981', // Hijau
        cancelButtonColor: '#6B7280', // Abu-abu
        confirmButtonText: 'Ya, Selesai!',
        cancelButtonText: 'Batal',
        backdrop: `rgba(0,0,0,0.4)` // Menggelapkan background sedikit
      });

      if (!result.isConfirmed) return; // Kalau dibatalkan, hentikan proses
    }

    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ...taskToMove, status: newStatus })
      });
      if(newStatus === 'done'){
         Swal.fire({ title: 'Kerja Bagus! 🎉', text: 'Satu tugas berhasil diselesaikan.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    } catch (error) { 
       Swal.fire('Error', 'Gagal memindah tugas.', 'error');
    }
  };

  const deleteTask = async (taskId, taskTitle) => {
    // Konfirmasi sebelum menghapus
    const result = await Swal.fire({
      title: 'Hapus Tugas?',
      text: `Tugas "${taskTitle}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444', // Merah
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        setTasks(tasks.filter(t => t.id !== taskId));
        Swal.fire({ title: 'Dihapus!', text: 'Tugas telah dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus tugas.', 'error');
      }
    }
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === 'High') return 'bg-red-100 text-red-600';
    if (urgency === 'Medium') return 'bg-orange-100 text-orange-600';
    return 'bg-blue-100 text-blue-600';
  };

  // ================= 8. FUNGSI CHATBOT AI =================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput(''); 
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Maaf, koneksi ke server AI terputus." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ================= PERHITUNGAN STATISTIK TO-DO =================
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'doing').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  
  // Hitung persentase selesai (Hindari pembagian dengan 0)
  const percentCompleted = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // ================= FUNGSI QUICK AI ASSISTANT =================
  const handleQuickAiSubmit = (e) => {
    e.preventDefault();
    const message = e.target.quickAiInput.value;
    if (!message.trim()) return;
    
    // Set pesan ke dalam form input chat utama, lalu pindah tab
    setChatInput(message);
    setActiveTab('chatbot');
    
    // Opsional: Langsung trigger submit di halaman chatbot
    // Tapi butuh timeout kecil agar DOM tab chatbot selesai di-render dulu
    setTimeout(() => {
      document.getElementById('mainChatForm')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  // ================= 9. FILTER INFO & MENU =================
  const menus = [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'info', label: 'Info' }, { id: 'todo', label: 'To-Do' },
    { id: 'chatbot', label: 'AI-Assistant' }, { id: 'setting', label: 'Setting' },
  ];

  const selectedInfo = infoData.find(info => info.id === selectedInfoId);
  const filteredInfoData = infoData.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen bg-[#F8F9FA] font-sans text-gray-900 overflow-hidden relative flex flex-col">
      
      {/* HEADER */}
      <div className="flex-none px-8 py-6 flex justify-between items-center bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <img src="/001_UNIVERSITAS%20TRUNODJOYO%20MADURA.png" alt="Universitas Trunojoyo Madura" className="w-10 h-10 object-contain rounded-xl bg-white shadow-md" />
          <span className="font-extrabold text-2xl tracking-tight text-[#083B4C]">Taskmate</span>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:block text-sm font-semibold text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)} className="cursor-pointer border-2 border-transparent hover:border-[#5D4289] rounded-full transition-all">
            <img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Siswa'}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-200 shadow-sm object-cover" />
          </div>
          {isHeaderDropdownOpen && (
            <div className="absolute top-14 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 animate-fade-in flex flex-col">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <p className="text-xs text-gray-400 font-bold uppercase">Masuk sebagai</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
              </div>
              <button onClick={openPasswordModal} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#F3E8FF] hover:text-[#5D4289] transition-colors">🔒 Ubah Kata Sandi</button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50">🚪 Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 px-4 sm:px-8 py-8 no-scrollbar transition-all duration-300" id='scroll'>
        <div className="max-w-[1400px] mx-auto h-150">
          
{/* ================= TAB: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-3 gap-6" id='dashboard'>
              
              {/* KOLOM KIRI: PROFIL & STATISTIK TO-DO */}
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col xl:col-span-1">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-bold text-xl text-gray-800">Status</span>
                  <span className="bg-[#F3E8FF] text-[#5D4289] px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Siswa</span>
                </div>
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-4">
                    <div className="w-28 h-28 rounded-full border-4 border-[#5D4289] p-1 overflow-hidden">
                      <img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Siswa'}`} alt="Profile" className="w-full h-full rounded-full bg-gray-100 object-cover" />
                    </div>
                  </div>
                  <section className="text-2xl font-bold text-gray-900 text-center">Hallo, <br/>{user?.name || 'Siswa'} 👋</section>
                </div>
                
                {/* Dinamis Persentase To-Do List */}
                <div className="mb-8 mt-auto">
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-light text-gray-900">{percentCompleted}<span className="text-3xl">%</span></span>
                    <span className="text-gray-400 font-medium text-sm mb-1 leading-tight">Tugas<br/>Selesai</span>
                  </div>
                  {totalTasks > 0 ? (
                    <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden">
                      {/* Bar Hijau = Done */}
                      <div className="bg-green-500 h-full transition-all" style={{width: `${(completedTasks/totalTasks)*100}%`}}></div>
                      {/* Bar Ungu = Doing */}
                      <div className="bg-[#9333EA] h-full transition-all" style={{width: `${(inProgressTasks/totalTasks)*100}%`}}></div>
                      {/* Bar Abu-abu = To do */}
                      <div className="bg-gray-200 h-full transition-all" style={{width: `${(todoTasks/totalTasks)*100}%`}}></div>
                    </div>
                  ) : (
                     <div className="w-full h-2 bg-gray-100 rounded-full"></div>
                  )}
                  
                  <div className="flex justify-between mt-3 text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Selesai</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#9333EA]"></div> Proses</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Belum</span>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                
                {/* BERITA EKSTERNAL DARI API */}
                <div className="bg-[#5D4289] rounded-[2rem] p-8 shadow-lg text-white">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Berita Terbaru</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {news.length > 0 ? news.map((article) => (
                      <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="bg-white rounded-2xl p-5 text-gray-900 shadow-sm flex flex-col h-full hover:scale-105 transition-transform cursor-pointer">
                        <h3 className="font-bold text-base mb-2 line-clamp-2">{article.title}</h3>
                        <div className="pt-4 mt-auto border-t border-gray-100 flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium truncate">📰 {article.source}</span>
                        </div>
                      </a>
                    )) : <p className="text-white/70 italic text-sm">Sedang memuat berita dari internet...</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  
                  {/* KOTAK PENGUMUMAN TERBARU (Menggantikan To-Do List) */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <section className="text-xl font-bold text-gray-800">Pengumuman Sekolah</section>
                      <button onClick={() => setActiveTab('info')} className="text-xs font-bold text-[#5D4289] hover:underline">Lihat Semua</button>
                    </div>
                    <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                      {infoData.slice(0, 3).map(info => (
                        <div 
                          key={info.id} 
                          onClick={() => { setSelectedInfoId(info.id); setActiveTab('info'); }}
                          className="p-4 rounded-xl border border-gray-100 hover:border-[#5D4289] hover:bg-[#F3E8FF] transition cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-[#5D4289] uppercase">{info.tags && info.tags[0]}</span>
                            <span className="text-[10px] text-gray-400">{info.date}</span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-800 group-hover:text-[#3C2366] line-clamp-2">{info.title}</h4>
                        </div>
                      ))}
                      {infoData.length === 0 && <p className="text-sm text-gray-400 italic">Belum ada pengumuman.</p>}
                    </div>
                  </div>
                  
                  {/* KOTAK AI ASSISTANT QUICK */}
                  <div className="rounded-[2rem] p-8 shadow-lg bg-gradient-to-br from-[#E9D5FF] to-[#D8B4FE] relative overflow-hidden flex flex-col justify-end min-h-[250px]">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/40 blur-3xl rounded-full"></div>
                    <div className="relative z-10">
                      <section className="text-xl font-bold text-[#3C2366] mb-4">AI Assistant Quick</section>
                      <form onSubmit={handleQuickAiSubmit} className="bg-white/80 backdrop-blur-md rounded-2xl p-2 flex items-center shadow-sm">
                        <input 
                          type="text" 
                          name="quickAiInput"
                          placeholder="Ketik lalu tekan Enter..." 
                          className="w-full bg-transparent border-none focus:outline-none text-sm px-3" 
                          autoComplete="off"
                        />
                        <button type="submit" className="w-8 h-8 rounded-full bg-[#5D4289] text-white shrink-0 hover:bg-[#3C2366]">➤</button>
                      </form>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: INFO ================= */}
          {activeTab === 'info' && (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[calc(100vh-10px)] min-h-[500px] flex overflow-hidden border border-gray-100">
              <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-5 border-b border-gray-100">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input type="text" placeholder="Cari berdasarkan judul..." className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#5D4289]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} id='searchinfo'/>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {filteredInfoData.length > 0 ? (
                    filteredInfoData.map((item) => (
                      <div key={item.id} onClick={() => setSelectedInfoId(item.id)} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedInfoId === item.id ? 'bg-[#F3E8FF] border-[#5D4289] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`} id='inpo'>
                        <div className="flex justify-between items-start mb-1"><span className="font-bold text-gray-900 text-sm">{item.sender}</span><span className="text-[10px] text-gray-500 font-medium">{item.time}</span></div>
                        <section className="font-semibold text-sm text-gray-800 mb-1 truncate">{item.title}</section>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{item.preview}</p>
                        <div className="flex gap-2">
                          {item.tags && item.tags.map((tag, idx) => (<span key={idx} className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${selectedInfoId === item.id ? 'bg-[#3C2366] text-white' : 'bg-gray-800 text-white'}`}>{tag}</span>))}
                        </div>
                      </div>
                    ))
                  ) : <div className="text-center text-sm text-gray-400 mt-10">{searchQuery ? 'Pencarian tidak ditemukan.' : 'Belum ada pengumuman.'}</div>}
                </div>
              </div>
              <div className="hidden md:flex md:w-2/3 flex-col bg-white">
                {selectedInfo ? (
                  <>
                    <div className="p-8 border-b border-gray-100 flex justify-between items-start">
              <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl overflow-hidden shadow-sm">
                          {/* Logika Baru: Kalau guru punya foto asli, pakai! Kalau tidak ada, pakai Dicebear */}
                          <img 
                            src={selectedInfo.photo ? selectedInfo.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedInfo.sender}`} 
                            className="w-full h-full object-cover bg-gray-100" 
                            alt="sender" 
                          />
                        </div>
                        <div>
                          <section className="font-bold text-lg text-gray-900 leading-tight">{selectedInfo.sender}</section>
                          <p className="text-sm text-gray-500">{selectedInfo.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{selectedInfo.date}</span>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
                      <section className="text-4xl font-bold text-[#3C2366] mb-8">{selectedInfo.title}</section>
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed text-sm">{selectedInfo.content}</div>
                    </div>
                  </>
                ) : <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Pilih pesan untuk melihat detail</div>}
              </div>
            </div>
          )}

{/* ================= TAB: TO-DO ================= */}
          {activeTab === 'todo' && (
            <div className="animate-fade-in h-[calc(100vh-160px)] min-h-[500px] flex flex-col">
              <div className="mb-6"><section className="text-3xl font-bold text-[#3C2366] mb-1">My Tasks</section><p className="text-gray-500 text-sm">Kelola tugasmu</p></div>
              <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                
                {/* KOLOM TO DO */}
                <div className="bg-gray-50/80 rounded-2xl p-4 min-w-[320px] w-1/3 flex flex-col border border-gray-100">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <section className="font-bold text-gray-800 text-lg">To do</section>
                    <span className="bg-white text-gray-600 font-bold text-xs px-2 py-1 rounded-md shadow-sm">{tasks.filter(t => t.status === 'todo').length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
                    {tasks.filter(t => t.status === 'todo').map(task => (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                        
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 cursor-pointer" onClick={() => openEditModal(task)}>
                            <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${getUrgencyColor(task.urgency)}`}>{task.urgency}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{task.type}</span>
                          </div>
                          {/* TOMBOL HAPUS */}
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id, task.title); }} className="text-gray-300 hover:text-red-500 transition px-1 text-sm">🗑️</button>
                        </div>

                        <todo className="font-bold text-gray-900 text-sm mb-3 cursor-pointer" onClick={() => openEditModal(task)}>{task.title}</todo>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 cursor-pointer" onClick={() => openEditModal(task)}>🗓️ {task.deadline}</div>
                          <button onClick={() => moveTask(task.id, 'doing')} className="w-6 h-6 rounded-full bg-purple-50 text-[#5D4289] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-purple-200 transition">➔</button>
                        </div>

                      </div>
                    ))}
                  </div>
                  <button onClick={() => openTaskModal('todo')} className="mt-3 bg-white border border-dashed border-gray-300 text-gray-500 hover:text-[#5D4289] font-bold py-3 rounded-xl transition">+ Add Task</button>
                </div>

                {/* KOLOM DOING */}
                <div className="bg-gray-50/80 rounded-2xl p-4 min-w-[320px] w-1/3 flex flex-col border border-gray-100">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-gray-800 text-lg">Doing</h3>
                    <span className="bg-white text-gray-600 font-bold text-xs px-2 py-1 rounded-md shadow-sm">{tasks.filter(t => t.status === 'doing').length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
                    {tasks.filter(t => t.status === 'doing').map(task => (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-[#5D4289] border-y border-r border-gray-100 hover:shadow-md transition group">
                        
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 cursor-pointer" onClick={() => openEditModal(task)}>
                            <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${getUrgencyColor(task.urgency)}`}>{task.urgency}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{task.type}</span>
                          </div>
                          {/* TOMBOL HAPUS */}
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id, task.title); }} className="text-gray-300 hover:text-red-500 transition px-1 text-sm">🗑️</button>
                        </div>

                        <h4 className="font-bold text-gray-900 text-sm mb-3 cursor-pointer" onClick={() => openEditModal(task)}>{task.title}</h4>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 cursor-pointer" onClick={() => openEditModal(task)}>🗓️ {task.deadline}</div>
                          <button onClick={() => moveTask(task.id, 'done')} className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-green-200 transition">➔</button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* KOLOM DONE */}
                <div className="bg-gray-50/80 rounded-2xl p-4 min-w-[320px] w-1/3 flex flex-col border border-gray-100">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-gray-800 text-lg">Done</h3>
                    <span className="bg-white text-gray-600 font-bold text-xs px-2 py-1 rounded-md shadow-sm">{tasks.filter(t => t.status === 'done').length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
                    {tasks.filter(t => t.status === 'done').map(task => (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-green-500 border-y border-r border-gray-100 opacity-60 hover:opacity-100 transition group">
                        
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 cursor-pointer" onClick={() => openEditModal(task)}>
                            <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${getUrgencyColor(task.urgency)}`}>{task.urgency}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{task.type}</span>
                          </div>
                          {/* TOMBOL HAPUS */}
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id, task.title); }} className="text-gray-300 hover:text-red-500 transition px-1 text-sm">🗑️</button>
                        </div>

                        <section className="font-bold text-gray-500 line-through text-sm mb-3 cursor-pointer" onClick={() => openEditModal(task)}>{task.title}</section>
                        
                        <div className="flex items-center text-xs text-green-600 font-bold cursor-pointer" onClick={() => openEditModal(task)}>✅ Selesai</div>
                      
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= TAB: CHATBOT AI ================= */}
          {activeTab === 'chatbot' && (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[calc(100vh-20px)] min-h-[500px] flex flex-col relative overflow-hidden border border-gray-100 mb-20">
              
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#E9D5FF] blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-[#C4B5FD] blur-[120px] rounded-full"></div>
                <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-[#FBCFE8] blur-[100px] rounded-full"></div>
              </div>

              <div className="flex-none pt-8 pb-2 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-white to-transparent">
                <svg className="w-6 h-6 text-[#5D4289] mb-2" viewBox="0 0 24 24" fill="currentColor"><path d="M11.644 1.838a.5.5 0 01.712 0l1.294 1.293a6.5 6.5 0 004.219 1.849l1.837.262a.5.5 0 010 .98l-1.837.262a6.5 6.5 0 00-4.219 1.85l-1.294 1.292a.5.5 0 01-.712 0l-1.294-1.292a6.5 6.5 0 00-4.219-1.85l-1.837-.262a.5.5 0 010-.98l1.837-.262a6.5 6.5 0 004.219-1.85l1.294-1.293zm5.72 13.064a.5.5 0 01.712 0l.647.647a4.5 4.5 0 002.92.128l.918-.131a.5.5 0 010 .98l-.918.132a4.5 4.5 0 00-2.92.128l-.647.647a.5.5 0 01-.712 0l-.647-.647a4.5 4.5 0 00-2.92-.128l-.918-.132a.5.5 0 010-.98l.918.131a4.5 4.5 0 002.92-.128l.647-.647z" /></svg>
                <section className="text-lg font-bold text-[#083B4C]">Ask Taskmate AI</section>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-10 lg:px-24 py-4 space-y-5 no-scrollbar z-10 flex flex-col">
                <div className="mt-auto"></div>
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex flex-col w-full ${chat.role === 'user' ? 'items-end' : 'items-start pb-4'}`}>
                    <span className={`text-[9px] font-bold mb-1 uppercase tracking-widest flex items-center gap-1 ${chat.role === 'user' ? 'text-gray-400 mr-2' : 'text-[#5D4289] ml-2'}`}>
                      {chat.role === 'ai' && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>}
                      {chat.role === 'user' ? 'ME' : 'OUR AI'}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${chat.role === 'user' ? 'bg-white border border-gray-100 text-gray-800 rounded-tr-sm font-medium' : 'bg-white/60 backdrop-blur-md border border-white text-gray-800 rounded-tl-sm'}`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex flex-col items-start w-full pb-4">
                    <span className="text-[9px] font-bold text-[#5D4289] mb-1 ml-2 uppercase tracking-widest flex items-center gap-1">OUR AI</span>
                    <div className="bg-white/60 backdrop-blur-md border border-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#5D4289] rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-[#5D4289] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div><div className="w-1.5 h-1.5 bg-[#5D4289] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              <form id="mainChatForm" onSubmit={handleSendMessage} className="flex-none p-4 sm:px-10 lg:px-24 pb-8 z-30 bg-white/50 backdrop-blur-sm border-t border-white/50">                 <div className="relative flex items-center">
                  <input type="text" placeholder="Tanya soal rumus, sejarah, atau terjemahan..." className="w-full bg-white border border-gray-200 rounded-full py-3 pl-5 pr-12 text-sm text-gray-800 focus:outline-none focus:border-[#5D4289] focus:ring-1 focus:ring-[#5D4289] shadow-sm transition-all relative z-40" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isChatLoading} />
                  <button type="submit" disabled={isChatLoading} className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5D4289] bg-purple-50 hover:bg-purple-100 transition-colors rounded-full disabled:opacity-50 z-50 cursor-pointer">
                    <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB: SETTING / PROFILE ================= */}
          {activeTab === 'setting' && (
            <div className="animate-fade-in h-[calc(100vh-10px)] min-h-[500px] flex flex-col overflow-y-auto no-scrollbar pb-10">
              {!isEditingProfile ? (
                <>
                  <div className="mb-6"><section className="text-3xl font-bold text-[#3C2366] mb-1">Profile & Settings</section></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                      <section className="text-2xl font-extrabold text-gray-900 mb-1">{user?.name || 'Siswa'}</section><span className="text-[#5D4289] font-bold text-sm mb-8">Siswa Aktif</span>
                      <div className="w-48 h-48 rounded-full border-[10px] border-gray-50 mb-8 overflow-hidden"><img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Felix'}`} alt="Profile" className="w-full h-full bg-gray-100 object-cover" /></div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-10">
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Alamat</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.address || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tgl Lahir</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.dob || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">No HP</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.phone || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Kelamin</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.gender || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Hobi / Bio</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.hobby || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Email Address</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.email}</p></div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="flex gap-3">
                          <button onClick={() => setIsEditingProfile(true)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-[#5D4289] font-bold py-3 rounded-xl">Edit Data Profil</button>                       </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-fade-in max-w-4xl w-full mx-auto bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100"><div><h2 className="text-2xl font-bold text-[#3C2366]">Edit Profile</h2></div><button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">✕</button></div>
                  <form onSubmit={handleSaveProfile}>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm">
                          {/* Tampilkan preview foto baru JIKA ada, kalau tidak pakai foto lama */}
                          <img 
                            src={photoPreview || editForm.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                            className="w-full h-full object-cover bg-gray-100" 
                            alt="avatar" 
                          />
                        </div>
                      </div>
                      <div className="flex-1 w-full mt-2 sm:mt-0">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Foto Profil Baru</label>
                        <div className="flex items-center gap-4">
                          {/* Input File asli disembunyikan */}
                          <input 
                            type="file" 
                            id="uploadPhoto"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                          {/* Tombol Kustom pengganti input file */}
                          <label 
                            htmlFor="uploadPhoto" 
                            className="cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-[#5D4289] hover:text-[#5D4289] text-gray-500 font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
                          >
                            📷 Pilih Gambar
                          </label>
                          <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">
                            {photoFile ? photoFile.name : 'Tidak ada file dipilih'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">*Format didukung: JPG, PNG. Maks: 2MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Nama Lengkap</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289]" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Nomor HP</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289]" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Tanggal Lahir</label><input type="date" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289]" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Jenis Kelamin</label><select className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289] bg-white" value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                      <div className="md:col-span-2"><label className="text-sm font-bold text-gray-700 mb-2 block">Alamat Domisili</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289]" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="text-sm font-bold text-gray-700 mb-2 block">Hobi / Bio</label><textarea rows="3" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#5D4289]" value={editForm.hobby} onChange={(e) => setEditForm({...editForm, hobby: e.target.value})}></textarea></div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6"><button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition">Batal</button><button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-[#5D4289] hover:bg-[#3C2366] transition shadow-md">✔ Simpan Perubahan</button></div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto overflow-x-auto no-scrollbar">
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-full p-2 flex items-center gap-1 sm:gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] min-w-max">
          {menus.map((menu) => (
            <button key={menu.id} onClick={() => setActiveTab(menu.id)} className={`px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === menu.id ? 'bg-[#2A2A2A] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
              {activeTab === menu.id && <span className="text-lg opacity-80 leading-none mb-[2px]">⊞</span>}
              {menu.label}
            </button>
          ))}
        </div>
      </div>

{/* ================= MODAL ADD/EDIT TASK ================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-md shadow-2xl relative animate-fade-in border border-gray-100">
            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold transition">✕</button>
            <section className="text-2xl font-bold text-[#3C2366] mb-6">{editingTaskId ? 'Edit Tugas' : 'Tambah Tugas Baru'}</section>            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Tugas</label>
                <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289]" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} required id='namatugas'/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Urgensi</label>
                  <select className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-white font-medium" value={newTask.urgency} onChange={(e) => setNewTask({...newTask, urgency: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-white font-medium" value={newTask.status} onChange={(e) => setNewTask({...newTask, status: e.target.value})} id='status'>
                    <option value="todo">To do</option>
                    <option value="doing">Doing</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipe Tugas</label>
                  <select className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289]" value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} required >
                  <option value="Tugas Harian">Tugas Harian</option>
                  <option value="Tugas Kelompok">Tugas Kelompok</option>
                  <option value="Tugas Akhir">Tugas Akhir</option>
                  <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
                  {/* Tipe date sudah benar. Gunakan format bawaan dari input ini */}
                  <input type="date" className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289]" value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} required />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-[#5D4289] hover:bg-[#3C2366] shadow-md">Simpan Tugas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL UBAH KATA SANDI ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-sm shadow-2xl relative animate-fade-in border border-gray-100">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold transition">✕</button>
            <h2 className="text-2xl font-bold text-[#3C2366] mb-2">Ubah Sandi</h2>
            {passwordError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-4 rounded-xl text-xs font-bold">{passwordError}</div>}
            <form onSubmit={handleSavePassword} className="space-y-4">
              <input type="password" placeholder="Sandi Lama" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
              <input type="password" placeholder="Sandi Baru" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
              <input type="password" placeholder="Konfirmasi" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white bg-[#5D4289] hover:bg-[#3C2366]">Simpan Kata Sandi</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SiswaDashboard;