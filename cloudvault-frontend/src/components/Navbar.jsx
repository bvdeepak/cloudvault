import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <h1 className="font-bold text-lg">CloudVault</h1>
      <button onClick={logout} className="bg-white text-blue-600 px-3 py-1 rounded">Logout</button>
    </nav>
  );
};

export default Navbar;
