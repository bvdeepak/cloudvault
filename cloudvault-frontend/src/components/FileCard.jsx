import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FileCard = ({ file, onDelete }) => {
  const token = localStorage.getItem('token');
  const [showDetails, setShowDetails] = useState(false);

  const downloadFile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/files/download/${file._id}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalname);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Download failed");
    }
  };

 const previewFile = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/files/download/${file._id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: file.mimetype }));
    window.open(url, '_blank');
  } catch (err) {
    toast.error("Preview failed");
  }
};

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/share/${file._id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Shareable link copied!");
  };

  const copySecureLink = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/files/generate-share-token/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const secureLink = `${window.location.origin}/share-secure/${res.data.token}`;
      await navigator.clipboard.writeText(secureLink);
      toast.success("Secure link copied!");
    } catch (err) {
      toast.error("Failed to generate secure link");
    }
  };

  const copyShareMessage = () => {
    const link = `${window.location.origin}/share/${file._id}`;
    const message = `Here's a file I shared with you via CloudVault: ${link}`;
    navigator.clipboard.writeText(message);
    toast.success("Message copied!");
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith("image")) return "🖼️";
    if (mimetype === "application/pdf") return "📄";
    if (mimetype === "text/plain") return "📃";
    return "📁";
  };

  const formatDate = (isoString) => new Date(isoString).toLocaleString();

  return (
    <div className="border p-4 rounded shadow-sm mb-4 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{getFileIcon(file.mimetype)} {file.originalname}</p>
          <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <div className="flex gap-2">
          <button onClick={previewFile} className="btn-sm bg-indigo-500 text-white">Preview</button>
          <button onClick={downloadFile} className="btn-sm bg-blue-500 text-white">Download</button>
          <button onClick={onDelete} className="btn-sm bg-red-500 text-white">Delete</button>
          <button onClick={() => setShowDetails(!showDetails)} className="btn-sm bg-gray-700 text-white">
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded">
          <p><strong>File Name:</strong> {file.originalname}</p>
          <p><strong>Type:</strong> {file.mimetype}</p>
          <p><strong>Uploaded:</strong> {formatDate(file.createdAt)}</p>
          <div className="mt-3 space-y-1">
            <button onClick={copyShareLink} className="underline text-blue-600 hover:text-blue-800 block">
              Copy Basic Share Link
            </button>
            <button onClick={copySecureLink} className="underline text-green-600 hover:text-green-800 block">
              Copy Secure Link (expires in 15 mins)
            </button>
            <button onClick={copyShareMessage} className="underline text-purple-600 hover:text-purple-800 block">
              Copy Share Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileCard;
