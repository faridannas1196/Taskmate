import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <--- Tambahan SweetAlert

function GuruDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  // ================= 1. STATE UTAMA =================
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ================= 2. STATE PROFIL & SANDI =================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '', address: user?.address || '', dob: user?.dob || '',
    phone: user?.phone || '', gender: user?.gender || 'Laki-laki', hobby: user?.hobby || '', photo: user?.photo || ''
  });

  // State Upload Foto
  const [photoFile, setPhotoFile] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null); 

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file)); 
    }
  };

  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // ================= 3. STATE INFO & SEARCH =================
  const [infoData, setInfoData] = useState([]);
  const [selectedInfoId, setSelectedInfoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState([]);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [totalTeaching, setTotalTeaching] = useState(0);

  // State Modal Info (Buat / Edit)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editingInfoId, setEditingInfoId] = useState(null);
  const [newInfo, setNewInfo] = useState({ title: '', preview: '', content: '', tags: 'Umum' });

  // ================= 4. STATE KALENDER =================
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 7 : today.getDay();
  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const currentDayName = dayNames[currentDayIndex - 1];
  const [selectedDayIndex, setSelectedDayIndex] = useState(currentDayIndex);

  // ================= 5. STATE CHATBOT AI =================
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Halo Bapak/Ibu Guru! Saya Taskmate AI. Saya siap membantu Anda menyusun materi, membuat kuis, atau mengevaluasi tugas siswa hari ini.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll AI
  useEffect(() => {
    if (activeTab === 'chatbot') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  // ================= 6. AMBIL DATA DARI BACKEND =================
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/news');
        const data = await response.json();
        if (data.articles) setNews(data.articles);
      } catch (error) { console.error("Gagal ambil berita", error); }
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

    const fetchTeacherSchedule = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/guru/jadwal', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) {
          setTeacherSchedule(Array.isArray(data.jadwal) ? data.jadwal : []);
          setTotalTeaching(Number(data.totalNgajar) || 0);
        }
      } catch (error) { console.error("Gagal ambil jadwal guru", error); }
    };
    
    fetchNews();
    fetchInfo();
    fetchTeacherSchedule();
  }, [token]);

  // ================= 7. FUNGSI PROFIL & LOGOUT =================
  const handleLogout = async () => {
    // SweetAlert Konfirmasi Logout
    const result = await Swal.fire({
      title: 'Keluar dari Taskmate?', text: "Anda harus login kembali untuk masuk.", icon: 'question',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6B7280', confirmButtonText: 'Ya, Keluar', cancelButtonText: 'Batal', backdrop: `rgba(0,0,0,0.5)`
    });

    if (result.isConfirmed) {
      localStorage.removeItem('token'); 
      localStorage.removeItem('user'); 
      await Swal.fire({ title: 'Berhasil Keluar', icon: 'success', timer: 1000, showConfirmButton: false });
      navigate('/');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    // SweetAlert Konfirmasi Simpan Profil
    const result = await Swal.fire({
      title: 'Simpan Perubahan?', text: "Apakah Anda yakin ingin mengubah data profil?", icon: 'question',
      showCancelButton: true, confirmButtonColor: '#F59E0B', cancelButtonColor: '#6B7280', confirmButtonText: 'Ya, Simpan', cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const formData = new FormData();
        formData.append('name', editForm.name); formData.append('address', editForm.address);
        formData.append('dob', editForm.dob); formData.append('phone', editForm.phone);
        formData.append('gender', editForm.gender); formData.append('hobby', editForm.hobby);
        formData.append('photo', editForm.photo); 
        if (photoFile) formData.append('photoFile', photoFile);

        const response = await fetch('http://localhost:5000/api/profile', {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
        const data = await response.json();
        if (response.ok) { 
          localStorage.setItem('user', JSON.stringify(data.user)); 
          setIsEditingProfile(false); 
          await Swal.fire({title: 'Berhasil!', text: 'Profil diperbarui.', icon: 'success', timer: 1500, showConfirmButton: false});
          window.location.reload(); 
        }
      } catch (error) { Swal.fire('Error', 'Gagal update profil', 'error'); }
    }
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

  // ================= 8. FUNGSI CRUD INFO =================
  const openCreateInfoModal = () => {
    setEditingInfoId(null);
    setNewInfo({ title: '', preview: '', content: '', tags: 'Umum' });
    setIsInfoModalOpen(true);
  };

  const openEditInfoModal = (info) => {
    setEditingInfoId(info.id);
    setNewInfo({ title: info.title, preview: info.preview, content: info.content, tags: info.tags.join(', ') });
    setIsInfoModalOpen(true);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!newInfo.title || !newInfo.content) return;
    const finalPreview = newInfo.preview || newInfo.content.substring(0, 60) + "...";
    const payload = { ...newInfo, preview: finalPreview };

    try {
      if (editingInfoId) {
        await fetch(`http://localhost:5000/api/announcements/${editingInfoId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
        });
        setInfoData(infoData.map(i => i.id === editingInfoId ? { ...i, ...payload, tags: payload.tags.split(',') } : i));
        Swal.fire({ title: 'Tersimpan!', text: 'Pengumuman diubah.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const response = await fetch('http://localhost:5000/api/announcements', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
        });
        const data = await response.json();
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const newEntry = {
          id: data.id, sender: user?.name, role: 'Guru Pengajar', time: "Baru saja", date: dateStr,
          title: payload.title, preview: payload.preview, content: payload.content, tags: payload.tags.split(',')
        };
        setInfoData([newEntry, ...infoData]);
        setSelectedInfoId(newEntry.id);
        Swal.fire({ title: 'Terkirim! 📢', text: 'Pengumuman disiarkan.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      setIsInfoModalOpen(false);
    } catch (error) { Swal.fire('Error', 'Gagal simpan info', 'error'); }
  };

  const handleQuickAnnounce = async (e) => {
    e.preventDefault();
    const message = e.target.quickMessage.value;
    const targetClass = e.target.targetClass.value; 
    if (!message) return;

    // SweetAlert Info Cepat
    const result = await Swal.fire({
      title: 'Kirim Pengumuman?',
      text: `Pengumuman ini akan dikirim ke: ${targetClass}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B', 
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Kirim!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('http://localhost:5000/api/announcements', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            title: `Pengumuman Kelas (${targetClass})`, 
            preview: message.substring(0, 50) + "...", 
            content: message, 
            tags: "Penting, Cepat" 
          })
        });
        
        if (response.ok) {
          Swal.fire({ title: 'Terkirim! 🚀', text: 'Pengumuman darurat berhasil disiarkan.', icon: 'success', timer: 1500, showConfirmButton: false });
          e.target.quickMessage.value = ""; 
          const resInfo = await fetch('http://localhost:5000/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } });
          const dataInfo = await resInfo.json();
          if (Array.isArray(dataInfo)) setInfoData(dataInfo);
        }
      } catch (error) { 
        Swal.fire('Error', 'Gagal mengirim pengumuman', 'error');
      }
    }
  };

  const handleDeleteInfo = async (id) => {
    // SweetAlert Hapus Info
    const result = await Swal.fire({
      title: 'Hapus Pengumuman?', text: "Pengumuman yang dihapus tidak bisa dikembalikan.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6B7280', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    });

    if(result.isConfirmed){
      try {
        await fetch(`http://localhost:5000/api/announcements/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
        setInfoData(infoData.filter(i => i.id !== id));
        setSelectedInfoId(null);
        Swal.fire({ title: 'Dihapus!', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) { Swal.fire('Error', 'Gagal hapus', 'error'); }
    }
  };

  // ================= 9. FUNGSI CHATBOT AI =================
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

  // FILTER SEARCH & MENUS
  const selectedInfo = infoData.find(info => info.id === selectedInfoId);
  const filteredInfoData = infoData.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const menus = [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'info', label: 'Info' }, { id: 'todo', label: 'Jadwal & Kalender' },
    { id: 'chatbot', label: 'AI-Assistant' }, { id: 'setting', label: 'Setting' }
  ];

  return (
    <div className="h-screen bg-[#F8F9FA] font-sans text-gray-900 overflow-hidden relative flex flex-col">
      
      {/* HEADER */}
      <div className="flex-none px-8 py-6 flex justify-between items-center bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <img src="/001_UNIVERSITAS%20TRUNODJOYO%20MADURA.png" alt="Universitas Trunojoyo Madura" className="w-10 h-10 object-contain rounded-xl bg-white shadow-md" />
          <span className="font-extrabold text-2xl tracking-tight text-[#083B4C]">Taskmate</span>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:block text-sm font-semibold text-gray-500">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)} className="cursor-pointer border-2 border-transparent hover:border-[#5D4289] rounded-full transition-all">
            <img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guru'}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-200 shadow-sm object-cover" />
          </div>
          {isHeaderDropdownOpen && (
            <div className="absolute top-14 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 animate-fade-in flex flex-col">
              <div className="px-4 py-3 border-b border-gray-50 bg-amber-50">
                <p className="text-xs text-amber-600 font-bold uppercase">Masuk sebagai</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
              </div>
              <button onClick={() => {setIsHeaderDropdownOpen(false); setIsPasswordModalOpen(true);}} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-colors">🔒 Ubah Kata Sandi</button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50">🚪 Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 overflow-y-auto pb-32 px-4 sm:px-8 py-8 no-scrollbar transition-all duration-300">
        <div className="max-w-[1400px] mx-auto h-100">
          
          {/* ================= TAB: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI: PROFIL GURU */}
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col xl:col-span-1 border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-bold text-xl text-gray-800">Status</span>
                  <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">Guru</span>
                </div>
                
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-4">
                    <div className="w-28 h-28 rounded-full border-[5px] p-1 overflow-hidden shadow-inner">
                      <img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guru'}`} alt="Profile" className="w-full h-full rounded-full bg-gray-100 object-cover" />
                    </div>
                  </div>
                  <section className="text-2xl font-bold text-gray-900 mt-2 text-center">Hallo, <br/>{user?.name || 'Pak Guru'} 👋</section>
                </div>

                <div className="mt-auto grid gap-4">
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center transition-transform hover:scale-105">
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg mb-2">🏫</span>
                    <span className="text-2xl font-black text-gray-900 leading-none mb-1">{totalTeaching}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">Total Ngajar</span>
                  </div>

                </div>
              </div>

              <div className="xl:col-span-2 flex flex-col gap-6">
                
                <div className="bg-[#5D4289] rounded-[2rem] p-8 shadow-lg text-white">
                  <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-semibold">Berita Terbaru</h2></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {news.length > 0 ? news.map((article) => (
                      <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="bg-white rounded-2xl p-5 text-gray-900 shadow-sm flex flex-col h-full hover:scale-105 transition-transform cursor-pointer">
                        <h3 className="font-bold text-base mb-2 line-clamp-2">{article.title}</h3>
                        <div className="pt-4 mt-auto border-t border-gray-100 flex items-center gap-2"><span className="text-xs text-gray-500 font-medium truncate">📰 {article.source}</span></div>
                      </a>
                    )) : <p className="text-white/70 italic text-sm">Sedang memuat berita dari internet...</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  
                  <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                    <section className="text-xl font-bold text-gray-800 mb-6">Jadwal Hari Ini</section>
                    <div className="space-y-4">
                      {teacherSchedule.filter(schedule => schedule.hari === currentDayName).length > 0 ? (
                        teacherSchedule
                          .filter(schedule => schedule.hari === currentDayName)
                          .map(schedule => (
                            <div key={schedule.id} className="flex gap-4 items-center p-3 hover:bg-gray-50 rounded-xl transition">
                              <div className="font-bold text-[#5D4289]">{schedule.jam_mulai}</div><div className="w-1 h-10 bg-amber-400 rounded-full"></div>
                              <div><section className="font-bold text-gray-800 text-sm">{schedule.mata_pelajaran}</section><p className="text-xs text-gray-500">{schedule.kelas} {schedule.ruangan ? `• ${schedule.ruangan}` : ''}</p></div>
                            </div>
                          ))
                      ) : <p className="text-gray-400 text-sm italic">Tidak ada jadwal mengajar hari ini.</p>}
                    </div>
                  </div>

                  <div className="rounded-[2rem] p-8 shadow-lg bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden flex flex-col justify-end min-h-[250px] border border-amber-200">
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <section className="text-xl font-bold text-amber-900">Tulis Cepat</section>
                        <span className="bg-white/60 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Ke Siswa 📢</span>
                      </div>
                      <p className="text-sm text-amber-700 mb-4">Buat pengumuman darurat.</p>
                      
                      <form onSubmit={handleQuickAnnounce} className="bg-white/80 backdrop-blur-md rounded-2xl p-3 flex flex-col shadow-sm mt-auto">
                        <textarea 
                          name="quickMessage" 
                          rows="2" 
                          placeholder="Ketik pengumuman..." 
                          className="w-full bg-transparent border-none focus:outline-none text-sm px-2 text-gray-800 resize-none mb-2" 
                          required
                          id='infocepat'
                        ></textarea>
                        <div className="flex justify-between items-center px-2">
                           <select name="targetClass" className="text-xs bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-700 font-bold focus:outline-none cursor-pointer hover:bg-gray-200 transition" defaultValue="Kelas 10">
                              <option name="targetClass" value="Kelas 10">Kelas 10</option>
                           </select>
                           <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors">
                             Kirim
                           </button>
                        </div>
                      </form>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: INFO GURU ================= */}
          {activeTab === 'info' && (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[calc(100vh-160px)] min-h-[500px] flex overflow-hidden border border-gray-100">
              
              <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-5 border-b border-gray-100 space-y-4">
                  <button onClick={openCreateInfoModal} className="w-full bg-[#5D4289] hover:bg-[#3C2366] text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                    <span className="text-xl leading-none">+</span> Buat Pengumuman
                  </button>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input type="text" placeholder="Cari info..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#5D4289]" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {filteredInfoData.map((item) => (
                    <div key={item.id} onClick={() => setSelectedInfoId(item.id)} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedInfoId === item.id ? 'bg-[#F3E8FF] border-[#5D4289]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                      <div className="flex justify-between mb-1"><span className="font-bold text-sm">{item.sender}</span></div>
                      <h4 className="font-semibold text-sm mb-1 truncate">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{item.preview}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex md:w-2/3 flex-col bg-white">
                {selectedInfo ? (
                  <>
                    <div className="p-8 border-b border-gray-100 flex justify-between items-start relative">
                      {selectedInfo.sender === user?.name && (
                         <div className="absolute top-8 right-8 flex gap-2">
                           <button onClick={() => openEditInfoModal(selectedInfo)} className="text-[#5D4289] bg-purple-50 hover:bg-purple-100 px-4 py-1.5 rounded-lg text-xs font-bold transition">Edit</button>
                           <button onClick={() => handleDeleteInfo(selectedInfo.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-lg text-xs font-bold transition">Hapus</button>
                         </div>
                      )}
                      <div className="flex gap-4">
                        <img src={selectedInfo.sender === user?.name && user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedInfo.sender}`} className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 object-cover" alt="sender" />
                        <div><section className="font-bold text-lg">{selectedInfo.sender}</section><p className="text-sm text-gray-500">{selectedInfo.role}</p></div>
                      </div>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto no-scrollbar relative">
                      <span className="text-xs text-gray-400 font-medium block mb-2">{selectedInfo.date}</span>
                      <section className="text-4xl font-bold text-[#3C2366] mb-8">{selectedInfo.title}</section>
                      <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">{selectedInfo.content}</div>
                    </div>
                  </>
                ) : <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Pilih pesan untuk melihat detail</div>}
              </div>
            </div>
          )}

          {/* ================= TAB: KALENDER & JADWAL ================= */}
          {activeTab === 'todo' && (() => {
            const daysName = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            const daysShortName = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
            const calendarDates = Array.from({length: 7}).map((_, i) => {
              const d = new Date();
              const diff = today.getDate() - currentDayIndex + (i + 1);
              d.setDate(diff);
              const dIndex = d.getDay() === 0 ? 7 : d.getDay();
              return { day: daysShortName[i], date: d.getDate(), active: dIndex === selectedDayIndex, index: dIndex };
            });
            const selectedDayName = daysName[selectedDayIndex - 1];
            const schedules = teacherSchedule
              .filter(schedule => schedule.hari === selectedDayName)
              .map(schedule => {
                const startMinutes = Number(schedule.jam_mulai.slice(0, 2)) * 60 + Number(schedule.jam_mulai.slice(3, 5));
                const endMinutes = Number(schedule.jam_selesai.slice(0, 2)) * 60 + Number(schedule.jam_selesai.slice(3, 5));
                return {
                  ...schedule,
                  title: schedule.mata_pelajaran,
                  subtitle: `${schedule.kelas}${schedule.ruangan ? ` • ${schedule.ruangan}` : ''}`,
                  start: schedule.jam_mulai,
                  duration: Math.max((endMinutes - startMinutes) / 60, 1),
                  startMinutes,
                  color: 'bg-[#F3E8FF] border-[#D8B4FE] text-[#3C2366]'
                };
              });
            const firstHour = Math.min(7, ...schedules.map(schedule => Math.floor(schedule.startMinutes / 60)));
            const lastHour = Math.max(15, ...schedules.map(schedule => Math.ceil((schedule.startMinutes + schedule.duration * 60) / 60)));
            const hoursList = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => `${String(firstHour + index).padStart(2, '0')}:00`);

            return (
              <div className="animate-fade-in bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[calc(100vh-160px)] min-h-[500px] flex flex-col border border-gray-100 p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#3C2366] hidden sm:block">Kalender Mengajar</h2>
                  <select className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl"><option id='hari'>{today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option></select>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 border-b border-gray-100">
                  {calendarDates.map((item, idx) => (
                    <div key={idx} onClick={() => setSelectedDayIndex(item.index)} className={`min-w-[70px] flex flex-col items-center justify-center py-3 rounded-2xl cursor-pointer transition-colors border shadow-sm ${item.active ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      <span className={`text-2xl font-bold mb-1 leading-none ${item.active ? 'text-amber-900' : 'text-gray-700'}`}>{item.date}</span><span className={`text-xs font-semibold ${item.active ? 'text-amber-700' : 'text-gray-400'}`}>{item.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto mt-6 pr-2 no-scrollbar relative">
                  <div className="relative">
                    {hoursList.map((hour) => (<div key={hour} className="flex h-[100px] w-full relative"><div className="w-14 text-xs font-bold text-gray-400 -mt-2 bg-white pr-2">{hour}</div><div className="flex-1 border-t-2 border-dashed border-gray-200"></div></div>))}
                    {schedules.length > 0 ? schedules.map(schedule => {
                        const topPos = ((schedule.startMinutes - firstHour * 60) / 60) * 100;
                        const heightPx = Math.max(schedule.duration * 100 - 10, 40);
                        return (
                          <div key={schedule.id} className={`absolute left-14 right-2 sm:right-6 rounded-2xl p-5 shadow-sm border flex flex-col hover:shadow-md transition-all cursor-pointer ${schedule.color}`} style={{ top: `${topPos}px`, height: `${heightPx}px` }}>
                            <h4 className="font-bold text-base leading-tight">{schedule.title}</h4><p className="text-xs opacity-80 mt-1">{schedule.subtitle}</p>
                          </div>
                        )
                      }) : <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-gray-50 border border-gray-200 px-6 py-3 rounded-full text-sm font-bold text-gray-400">🎉 Tidak ada jadwal mengajar hari ini.</div></div>}
                  </div>
                  <div className="h-[40px]"></div>
                </div>
              </div>
            );
          })()}

          {/* ================= TAB: CHATBOT AI ================= */}
          {activeTab === 'chatbot' && (
            <div className="animate-fade-in bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[calc(100vh-160px)] min-h-[500px] flex flex-col relative overflow-hidden border border-gray-100">
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#E9D5FF] blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-[#C4B5FD] blur-[120px] rounded-full"></div>
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
              <form onSubmit={handleSendMessage} className="flex-none p-4 sm:px-10 lg:px-24 pb-8 z-30 bg-white/50 backdrop-blur-sm border-t border-white/50">
                <div className="relative flex items-center">
                  <input type="text" placeholder="Tanya saya untuk buat RPP atau soal..." className="w-full bg-white border border-gray-200 rounded-full py-3 pl-5 pr-12 text-sm text-gray-800 focus:outline-none focus:border-[#5D4289] focus:ring-1 focus:ring-[#5D4289] shadow-sm transition-all relative z-40" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isChatLoading} />
                  <button type="submit" disabled={isChatLoading} className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5D4289] bg-purple-50 hover:bg-purple-100 transition-colors rounded-full disabled:opacity-50 z-50 cursor-pointer" id='kirim'>➤</button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB: SETTING / PROFILE ================= */}
          {activeTab === 'setting' && (
            <div className="animate-fade-in h-[calc(100vh-160px)] min-h-[500px] flex flex-col overflow-y-auto no-scrollbar pb-10">
              {!isEditingProfile ? (
                <>
                  <div className="mb-6"><section className="text-3xl font-bold text-[#3C2366] mb-1">Profile & Settings</section><p className="text-gray-500 text-sm">Kelola informasi pribadi.</p></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                      <section className="text-2xl font-extrabold text-gray-900 mb-1">{user?.name || 'Pak Guru'}</section><span className="text-amber-600 font-bold text-sm mb-8">Guru Aktif</span>
                      <div className="w-48 h-48 rounded-full border-[10px] border-amber-50 mb-8 overflow-hidden"><img src={user?.photo ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guru'}`} alt="Profile" className="w-full h-full bg-gray-100 object-cover" /></div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-10">
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Alamat</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.address || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tgl Lahir</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.dob || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">No HP</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.phone || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Kelamin</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.gender || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Info / Bio</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.hobby || '-'}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Email Address</p><p className="text-sm font-semibold border-b border-gray-100 pb-2">{user?.email}</p></div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="flex gap-3">
                          <button onClick={() => setIsEditingProfile(true)} className="flex-1 bg-white border border-gray-200 hover:bg-amber-50 text-amber-700 font-bold py-3 rounded-xl transition">Edit Data Profil</button>
                        </div>
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
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-50 shadow-sm">
                          <img src={photoPreview || editForm.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="w-full h-full object-cover bg-gray-100" alt="avatar" />
                        </div>
                      </div>
                      <div className="flex-1 w-full mt-2 sm:mt-0">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Foto Profil Baru</label>
                        <div className="flex items-center gap-4">
                          <input type="file" id="uploadPhoto" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                          <label htmlFor="uploadPhoto" className="cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-amber-500 hover:text-amber-500 text-gray-500 font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2">📷 Pilih Gambar</label>
                          <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{photoFile ? photoFile.name : 'Tidak ada file dipilih'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Nama Lengkap</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Nomor HP</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Tanggal Lahir</label><input type="date" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} /></div>
                      <div><label className="text-sm font-bold text-gray-700 mb-2 block">Jenis Kelamin</label><select className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500 bg-white" value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                      <div className="md:col-span-2"><label className="text-sm font-bold text-gray-700 mb-2 block">Alamat Domisili</label><input type="text" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="text-sm font-bold text-gray-700 mb-2 block">Info / Gelar / Bio Singkat</label><textarea rows="3" className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" value={editForm.hobby} onChange={(e) => setEditForm({...editForm, hobby: e.target.value})}></textarea></div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6"><button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition">Batal</button><button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition shadow-md">✔ Simpan Perubahan</button></div>
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
            <button key={menu.id} onClick={() => setActiveTab(menu.id)} className={`px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === menu.id ? 'bg-[#2A2A2A] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} id='#pencet'>
              {activeTab === menu.id && <span className="text-lg opacity-80 leading-none mb-[2px]">⊞</span>}
              {menu.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= MODAL TAMBAH/EDIT INFO ================= */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[95%] max-w-2xl shadow-2xl relative animate-fade-in border border-gray-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold transition">✕</button>
            <section className="text-2xl font-bold text-[#3C2366] mb-6 flex items-center gap-2">
              <span className="text-2xl">📢</span> {editingInfoId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
            </section>            
            <form onSubmit={handleSaveInfo} className="space-y-5">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Judul Pengumuman</label><input type="text" className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-gray-50/50" value={newInfo.title} onChange={(e) => setNewInfo({...newInfo, title: e.target.value})} required /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
              <select className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-gray-50/50 text-sm" value={newInfo.tags} onChange={(e) => setNewInfo({...newInfo, tags: e.target.value})} required >
              <option value="Informasi Umum">Informasi Umum</option>
              <option value="Tugas">Tugas</option>
              <option value="Ujian">Ujian</option>
              <option value="Pertemuan">Pertemuan</option>
              </select>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Preview Pendek (Opsional)</label><input type="text" placeholder="Akan diisi otomatis dari konten jika kosong" className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-gray-50/50 text-sm" value={newInfo.preview} onChange={(e) => setNewInfo({...newInfo, preview: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Isi Pengumuman</label><textarea rows="6" className="w-full p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D4289] bg-gray-50/50 resize-none text-sm leading-relaxed" value={newInfo.content} onChange={(e) => setNewInfo({...newInfo, content: e.target.value})} required ></textarea></div>
              <div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsInfoModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Batal</button><button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-[#5D4289] hover:bg-[#3C2366] transition shadow-md">{editingInfoId ? '✔ Simpan Perubahan' : 'Kirim Pengumuman ➤'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL UBAH SANDI ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-sm shadow-2xl relative animate-fade-in border border-gray-100">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold transition">✕</button>
            <h2 className="text-2xl font-bold text-[#3C2366] mb-2">Ubah Sandi</h2>
            {passwordError && <div className="bg-red-50 text-red-600 border p-3 mb-4 rounded-xl text-xs font-bold">{passwordError}</div>}
            <form onSubmit={handleSavePassword} className="space-y-4">
              <input type="password" placeholder="Sandi Lama" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
              <input type="password" placeholder="Sandi Baru" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
              <input type="password" placeholder="Konfirmasi" className="w-full p-3 rounded-xl border focus:border-[#5D4289]" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white bg-[#5D4289] hover:bg-[#3C2366] transition shadow-md">Simpan Kata Sandi</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default GuruDashboard;