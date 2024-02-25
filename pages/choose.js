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
    if (selectedMediaType !== 'pdf' && !mediaLink.trim()) {
      alert('Please enter a valid media link.');
      return;
    }
    // Check if the submitted media type is a video or not
    const isVideo = selectedMediaType !== 'pdf';
  
    // If it's a video, navigate to output.js
    if (isVideo) {
      router.push({
        pathname: '/output',
        query: { mediaLink: mediaLink.trim() }
      });
    } else {
      // If it's not a video (i.e., PDF), navigate to output_pdf.js
      const fileInput = document.querySelector('input[type="file"]');
      const file = fileInput.files[0];
  
      if (!file) {
        alert('Please select a PDF file.');
        return;
      }
  
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Extract base64 data
        router.push({
          pathname: '/output_pdf',
          query: { mediaData: base64String }
        });
      };
      reader.readAsDataURL(file);
    }
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
  <div className="mt-8 flex items-center w-full md:w-3/4 lg:w-1/2 xl:w-1/3">
    <input type="text" placeholder="Enter Media Link" className="flex-1 border border-gray-300 rounded px-4 py-2 mr-4 focus:outline-none focus:border-blue-500 bg-white text-black" value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} />
    <button onClick={handleSubmit} className="text-white font-semibold py-2 px-4 rounded text-white-500 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white" disabled={loading}>
      {loading ? 'Loading...' : 'Submit'}
    </button>
  </div>
)}


      {selectedMediaType === 'pdf' && (
        <div className="mt-8">
          <input type="file" accept=".pdf" className="border border-gray-300 rounded px-4 py-2 mr-4 focus:outline-none focus:border-blue-500 bg-white text-black" disabled={loading} />
          <button onClick={handleSubmit} className="text-white font-semibold py-2 px-4 rounded text-white-500 mt-5 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white" disabled={loading}>
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChoosePage;
