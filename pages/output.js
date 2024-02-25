"use client"
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';


const OutputPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false)
  const [outputData, setOutputData] = useState(null);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [visibleTranscript, setVisibleTranscript] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesVisible, setNotesVisible] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const Typewriter = ({ text }) => {
    const [displayText, setDisplayText] = useState('');
    const [forward, setForward] = useState(true);
  
    useEffect(() => {
      let currentIndex = 0;
      let interval;
      
      const typeText = () => {
        interval = setInterval(() => {
          setDisplayText(text.substring(0, currentIndex));
          currentIndex++;
          if (currentIndex > text.length) {
            clearInterval(interval);
            setTimeout(eraseText, 1000); // Wait for 1 second before erasing
          }
        }, 100); // Adjust the typing speed as needed
      };
  
      const eraseText = () => {
        interval = setInterval(() => {
          setDisplayText(text.substring(0, currentIndex));
          currentIndex--;
          if (currentIndex === 0) {
            clearInterval(interval);
            setTimeout(typeText, 1000); // Wait for 1 second before typing again
          }
        }, 100); // Adjust the erasing speed as needed
      };
  
      typeText();
  
      return () => clearInterval(interval);
    }, [text]);
  
    return (
      <p className="text-gray-500 text-3xl font-bold">{displayText}</p>
    );
  };
  
  console.log(router.query.mediaLink)


  useEffect(() => {
    const fetchData = async () => {
      try {
        setTranscriptLoading(true);
        setNotesLoading(true);
        const link = router.query.mediaLink;
        if (!link) {
          setError('No media link provided.');
          return;
        }
        
        const response = await fetch('http://34.133.82.6:8007/get_text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input_type: 0,
            data: link
          })
        });
  
        if (response.ok) {
          const data = await response.json();
          setOutputData(data);
          const transcriptText = data.segments.map(segment => segment.text).join(' ');
          setTranscript(transcriptText);
          // Call handleViewNotes to fetch and display notes
          handleViewNotes();
        } else {
          setError('Failed to fetch data from the API.');
        }
      } catch (error) {
        setError('An error occurred while fetching data.');
      } finally {
        setTranscriptLoading(false);
      }
    };
  
    // Fetch data only if outputData is null
    if (!outputData) {
      fetchData();
    } else {
      console.log("Information is already present");
    }
  }, [router.query.mediaLink, outputData]);
  
  const handleViewNotes = async () => {
    if (transcript === '') {
      return; // Don't proceed if transcript is empty
    }
  
    try {
      setNotesLoading(true);
      const response = await fetch('http://34.133.82.6:8007/create_notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcript
        })
      });
  
      if (response.ok) {
        const data = await response.json();
        
        setNotes(data);
        
        console.log('Notes created successfully');
        setNotesVisible(true);
      } else {
        setError('Failed to create notes.');
      }
    } catch (error) {
      setError('An error occurred while creating notes.');
    } finally {
      setNotesLoading(false);
    }
  };
  
  useEffect(() => {
    if (transcript !== '' && notes === '') {
      handleViewNotes();
    }
  }, [transcript]);
  
  

  const handleSendMessage = async () => {
    console.log(conversationHistory)
    try {
      // Add user message to conversation history
      const response = await fetch('http://34.133.82.6:8007/run_conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcript,
          user: userMessage, // Assuming 'user' as the user identifier
          messages: conversationHistory // Pass the conversation history
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        console.log([userMessage, data.text])
        setConversationHistory(prevHistory => [...prevHistory, [userMessage, data.text]]);
        console.log(conversationHistory)
        setUserMessage(''); // Clear user input after sending message
      } else {
        setError('Failed to send message.');
      }
    } catch (error) {
      setError('An error occurred while sending message.');
    } finally {
      setNotesLoading(false)
      
    }
  };

  console.log(conversationHistory)
  const extractVideoId = (url) => {
    const match = url.match(/[?&]v=([^?&]+)/);
    return match && match[1];
  };

 console.log(notes.notes)

  return (
    <div className="flex bg-cover bg-center" style={{backgroundColor: '#1B1F29'}}>
      {/* Left Section */}
      <div className="w-2/3 p-4 overflow-y-auto h-screen" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none', 'overflow': '-moz-scrollbars-none' }}>
  {/* Embed YouTube Video */}
  <iframe
    width="90%"
    height="480"
    src={`https://www.youtube.com/embed/${extractVideoId(router.query.mediaLink)}`}
    title="YouTube video player"
    frameBorder="0"
    allowFullScreen
    className="block mx-auto"
    style={{ margin: '0 auto' }}
  ></iframe>
  {/* Buttons for View Notes and View Transcript */}
  {notesLoading && (
      <div className="left-0 w-full h-full mt-12 flex justify-center">
        <Typewriter text={transcriptLoading ? 'Generating Transcript...' : 'Generating Notes...'} />
      </div>
    )}
  {/* Display Notes in a fixed-height scrollable div */}
  {notesVisible && (
  <div className="mt-10 ml-20 mr-20">
    <h1 className="text-xl font-bold mb-4 text-white">Notes</h1>
    <div className="overflow-y-auto bg-gray-800 rounded-lg shadow-lg p-4 text-gray-200">
      <ReactMarkdown>{notes.notes}</ReactMarkdown>
    </div>
  </div>
)}



</div>

  
      <div className="w-1/3 h-screen bg">
      <div className='p-4 h-full flex flex-col bg-gray-800' style={{backgroundColor: '#223446'}} >
      <h1 className="text-2xl font-bold mb-4 text-white mt-2">Chat with memo.ai</h1>
        <div className="h-full overflow-y-auto mb-4 mr-2 text-justify" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none', 'overflow': '-moz-scrollbars-none' }}>
          
          <div>
            {/* Display Conversation History if it's not undefined */}
            {conversationHistory && conversationHistory.map((message, index) => (
              <div key={index}>
                {/* Assuming the first element is user message and the second is bot response */}
                <p className='mb-2 text-gray-200'><strong>User:</strong> {message[0]}</p>
                <p className='mb-2 text-gray-300'><strong>Bot:</strong> {message[1]}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* "memo.ai bot is typing" message */}
        {loading && (
          <div className="text-gray-500 mb-4">
            <p>memo.ai bot is typing...</p>
          </div>
        )}

        {/* Input Field and Send Button */}
        <div className="flex items-center mt-auto  bg-white rounded-lg">
          <input type="text" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} className="flex-1 py-2 px-4 bg-white focus:outline-none " placeholder="Type your message..." />
          <button onClick={handleSendMessage} className="ml-4 px-6 py-2 text-white font-semibold text-white-500 bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white">Send</button>
        </div>
      </div>
    </div>
  </div>
);
  
};


export default OutputPage;
