import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const New = () => {
    const [dynamicTextIndex, setDynamicTextIndex] = useState(0);
    const [showAdditionalText, setShowAdditionalText] = useState(false);
    const dynamicTexts = ["research paper", "textbook chapter", "article", "video", "audio", "philosophy paper", "blog", "lecture"];

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 200) { // Adjust this value according to your layout
                setShowAdditionalText(true);
            } else {
                setShowAdditionalText(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setDynamicTextIndex(prevIndex => (prevIndex + 1) % dynamicTexts.length);
        }, 1500); // Change text every 1.5 seconds

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    return (
        <div className="bg-black bg-cover bg-center" style={{ backgroundImage: "url('/assets/background.jpg')" }}>
            <nav className=" y" style={{ backgroundColor: "#C394FF" }}>
                <div className='mx-auto w-70vw py-4 px-6 flex justify-between items-center sticky max-w-7xl'>
                <img src="/assets/mainlogo.png" alt="memo.ai" className="h-10" />
                <Link href="/choose">
                    <button className="text-white font-medium py-2 px-12 rounded text-white-500transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white" style={{ backgroundColor: "#01214F" }}>
                        Get Started
                    </button>
                </Link>
                </div>
            </nav>
            <div className="flex justify-center mt-40 h-screen">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white">
                        Upload a <span style={{ color: '#40B966' }}>{dynamicTexts[dynamicTextIndex]}</span>.
                    </h1>
                    <h1 className="text-5xl font-bold text-white mt-4">Watch notes magically appear.</h1>
                    <h1 className='text-xl text-white mt-8'>Study smarter, faster, healthier with <span className='font-bold' style={{ color: '#40B966' }}>memo.ai</span></h1>
                    <Link href="/choose">
                        <button className='text-white font-medium py-2 px-12 rounded text-white-500 mt-5 bg-green-700 transition duration-300 ease-in-out mb-20 focus:outline-none focus:ring focus:border-white'>Get Started</button>
                    </Link>
                    <div className="flex justify-center mt-8">
  <video autoPlay loop muted className="w-full md:w-2/3 mb-20">
    <source src="/assets/back.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>
                </div>
               
            </div>
            
 
            {showAdditionalText && (
                <div className="flex flex-col items-center mt-8">
                    <h1 className="text-6xl font-bold text-white mb-4 mt-20" style={{ color: '#40B966' }}>Join Our Study Room.</h1>
                    <h1 className="text-5xl font-bold text-white mb-4" >Improve Posture & Boost Productivity.</h1>
                    <Link href='/posture'>
                    <button className='text-white font-medium py-2 px-12 rounded text-white-500 mt-5 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white'>Start Session</button>
                    </Link>
                    <img src="/assets/timer.png" alt="Timer" className="h-200 mt-20 mb-20" />
                </div>
            )}
        </div>
    );
};

export default New;
