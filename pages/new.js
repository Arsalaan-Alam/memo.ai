import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const New = () => {
    const [dynamicTextIndex, setDynamicTextIndex] = useState(0);
    const dynamicTexts = ["research paper", "textbook chapter", "article", "video", "audio", "philosophy paper", "blog", "lecture"];

    useEffect(() => {
        const interval = setInterval(() => {
            setDynamicTextIndex(prevIndex => (prevIndex + 1) % dynamicTexts.length);
        }, 1500); // Change text every second

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    return (
        <div className="bg-black bg-cover bg-center" style={{backgroundImage: "url('/assets/background.jpg')"}}>
            <nav className="mx-auto w-70vw py-4 px-6 flex justify-between items-center max-w-6xl">
                <div className="text-3xl font-bold text-white mt-5">memo.ai</div>
                <Link href="/choose">
    <button 
        className="text-white font-semibold py-2 px-4 rounded text-white-500 mt-5 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white">
        Get Started
    </button>
</Link>
            </nav>
            <div className="flex justify-center mt-40 h-screen">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-white">
                    Upload a <span style={{ color: '#40B966' }}>{dynamicTexts[dynamicTextIndex]}</span>.
                </h1>
                <h1 className="text-5xl font-bold text-white mt-4">Watch notes magically appear.</h1>
                <h1 className='text-xl text-white mt-8'>Study smarter, faster, healthier with <span className='font-bold' style={{ color: '#40B966' }}>memo.ai</span></h1>
                <Link href="/choose">
    <button className='text-white font-medium py-2 px-4 rounded text-white-500 mt-5 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white'>Get Started</button>
</Link>
            </div>
            </div>
        </div>
    );
};

export default New;
