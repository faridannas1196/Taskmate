import { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal login!');
      }

      // Simpan token dan data user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); 
      
      // SweetAlert Login Sukses
      await Swal.fire({
        title: 'Login Berhasil!',
        text: `Selamat datang kembali, ${data.user.name}!`,
        icon: 'success',
        timer: 1500, // Hilang otomatis dalam 1.5 detik
        showConfirmButton: false,
        backdrop: `rgba(60, 35, 102, 0.4)` // Warna backdrop ungu FarEd transparan
      });

      // Arahkan ke halaman sesuai Role
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'guru') navigate('/guru');
      else if (data.user.role === 'siswa') navigate('/siswa');
      
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    // Tambahan text-black agar tidak terpengaruh dark mode bawaan
    <div className="absolute inset-0 w-full h-full flex font-sans bg-white text-left text-black">
      
      {/* BAGIAN KIRI: Form Login */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 bg-white relative">
        
        {/* Logo EduVibe */}
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3C2366] rounded flex items-center justify-center font-bold text-white text-sm">
            F
          </div>
          <span className="font-bold text-xl text-black tracking-tight">FarEd</span>
        </div>

        {/* Kontainer Utama Form */}
        <div className="w-full max-w-[450px] mx-auto lg:mx-0 mt-16 lg:mt-5">
          <section className="font-extrabold text-purple-900 mb-7 text-2xl"> Silakan Login</section>
          
          <p className="text-gray-500 font-medium mb-10 text-base mb-7">
            Please enter your details
          </p>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-6 rounded-lg text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black block">Email</label>
              <input 
                type="email" 
                className="w-full p-3.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#3C2366] focus:ring-1 focus:ring-[#3C2366] text-sm text-black" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                id='email'
              />
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black block">Password</label>
              <input 
                type="password" 
                className="w-full p-3.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#3C2366] focus:ring-1 focus:ring-[#3C2366] text-sm text-black" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                id='pass'
              />
            </div>

            {/* Bungkus Tombol biar jaraknya rapi */}
            <div className="pt-2 space-y-4">
              {/* Tombol Sign In */}
              <button 
                type="submit" 
                className="w-full bg-[#5D4289] hover:bg-[#432A6B] text-white font-bold text-base py-3.5 rounded-lg transition-colors shadow-sm"
                id='sign'
              >
                Sign in
              </button>

             
            </div>
          </form>

        </div>
      </div>

      {/* BAGIAN KANAN: Gambar Ilustrasi */}
      <div className="hidden lg:block lg:w-1/2 h-full bg-[#3C2366]">
        <img src="/bg-login.png" alt="Decoration" className="w-full h-full object-cover"/>
      </div>
      
    </div>
  );
}

export default Login;