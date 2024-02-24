import React, { useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/router';

const ChoosePage = () => {
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [mediaLink, setMediaLink] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCardClick = (mediaType) => {
    setSelectedMediaType(mediaType);
  };

  const handleSubmit = async () => {
    if (!mediaLink.trim()) {
      alert('Please enter a valid media link.');
      return;
    }
  
    // Navigate to output.js with the media link as a query parameter
    console.log(mediaLink.trim())
    router.push({
      pathname: '/output',
      query: { mediaLink: mediaLink.trim() }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center text-white" style={{backgroundImage: "url('/assets/background.jpg')"}}> 
      <h1 className="text-3xl font-bold mb-4">Choose Media Type</h1>
      <p className="text-lg text-center mb-8">We will use AI to understand your data and summarize it</p>

      <div className="flex justify-center gap-8">
        <div className={`card border border-orange-500 p-8 text-center ${selectedMediaType === 'audio' ? 'bg-gray-200' : ''}`} onClick={() => handleCardClick('audio')}>
          <Image src="/assets/volume.png" width={128} height={128} className="mx-auto" />
          <h2 className="text-xl font-semibold mt-4 px-14 text-black">Audio</h2>
        </div>

        <div className={`card border border-orange-500 p-8 text-center ${selectedMediaType === 'video' ? 'bg-gray-200' : ''}`} onClick={() => handleCardClick('video')}>
          <Image src="/assets/youtube.png" width={128} height={128} className="mx-auto" />
          <h2 className="text-xl font-semibold mt-4 px-14 text-black">Video</h2>
        </div>

        <div className={`card border border-orange-500 p-8 text-center ${selectedMediaType === 'pdf' ? 'bg-gray-200' : ''}`} onClick={() => handleCardClick('pdf')}>
          <Image src="/assets/pdf.png" width={128} height={128} className="mx-auto" />
          <h2 className="text-xl font-semibold mt-4 px-14 text-black">PDF</h2>
        </div>
      </div>

      {(selectedMediaType === 'audio' || selectedMediaType === 'video') && (
        <div className="mt-8">
          <input type="text" placeholder="Enter Media Link" className="border border-gray-300 rounded px-4 py-2 mr-4 focus:outline-none focus:border-blue-500 bg-white text-black" value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} />
          <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded focus:outline-none bg-white-200 font-semibold" disabled={loading}>
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      )}

      {selectedMediaType === 'pdf' && (
        <div className="mt-8">
          <input type="file" accept=".pdf" className="border border-gray-300 rounded px-4 py-2 mr-4 focus:outline-none focus:border-blue-500 bg-white text-black" disabled={loading} />
          <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded focus:outline-none font-semibold" disabled={loading}>
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChoosePage;
