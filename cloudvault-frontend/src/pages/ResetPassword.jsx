import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, { password });
      toast.success('Password updated');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleReset} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          className="input w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn w-full">Reset</button>
      </form>
    </div>
  );
};

export default ResetPassword;