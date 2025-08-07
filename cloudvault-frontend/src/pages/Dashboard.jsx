import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FileCard from '../components/FileCard';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = localStorage.getItem("token");

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data);
    } catch {
      toast.error("Failed to load files");
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file) return toast.warning("No file selected");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      toast.success("File uploaded");
      setFile(null);
      setUploadProgress(0);
      fetchFiles();
    } catch {
      toast.error("Upload failed");
    }
  };

  const deleteFile = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("File deleted");
      fetchFiles();
    } catch {
      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files.filter(f =>
    f.originalname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={uploadFile} className="mb-4 flex flex-col sm:flex-row gap-2">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
          <button type="submit" className="btn">Upload</button>
        </form>

        {uploadProgress > 0 && <p className="text-sm text-gray-600 mb-2">Uploading: {uploadProgress}%</p>}

        <input
          type="text"
          placeholder="Search files..."
          className="input mb-4"
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {filteredFiles.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No files uploaded yet.</p>
        ) : (
          <div className="grid gap-4">
            {filteredFiles.map(f => (
              <FileCard key={f._id} file={f} onDelete={() => deleteFile(f._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
