import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GuruDashboard from './pages/GuruDashboard';
import SiswaDashboard from './pages/SiswaDashboard';

// Komponen Polisi (Protected Route)
// Mengecek apakah user punya token dan rolenya sesuai
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Kalau tidak ada token, tendang ke Login
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // Kalau aman, silakan masuk
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Login */}
        <Route path="/" element={<Login />} />

        {/* Rute Guru */}
        <Route 
          path="/guru" 
          element={
            <ProtectedRoute allowedRole="guru">
              <GuruDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Rute Siswa */}
        <Route 
          path="/siswa" 
          element={
            <ProtectedRoute allowedRole="siswa">
              <SiswaDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Kalau ketik URL ngawur (404), kembalikan ke Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;