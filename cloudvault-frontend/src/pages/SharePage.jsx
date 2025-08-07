import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const SharePage = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);

  useEffect(() => {
    const endpoint = id.length > 24
      ? `/files/shared-secure/${id}` // Token-based link
      : `/files/shared/${id}`;       // Public ID-based link

    axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`)
      .then(res => setFile(res.data))
      .catch(() => setFile(null));
  }, [id]);

  if (!file) return <p>Loading or Invalid Link...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Shared File: {file.originalname}</h1>
      <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
      <p>Uploaded At: {new Date(file.createdAt).toLocaleString()}</p>
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() =>
          window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${file.filename}`, '_blank')
        }
      >
        Preview File
      </button>
    </div>
  );
};

export default SharePage;
