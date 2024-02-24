"use client"
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const OutputPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [outputData, setOutputData] = useState(null);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [visibleTranscript, setVisibleTranscript] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesVisible, setNotesVisible] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [midList, setMidList] = useState([]);
  
  console.log(router.query.mediaLink)

  let mainList = [];
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        } else {
          setError('Failed to fetch data from the API.');
        }
      } catch (error) {
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };
  
    // Fetch data only if outputData is null
    if (!outputData) {
      fetchData();
    } else {
      console.log("Information is already present");
    }
  }, [router.query.mediaLink, outputData]);
  

  const handleViewTranscript = () => {
    setVisibleTranscript(!visibleTranscript);
  };

  const handleViewNotes = async () => {
    if (notes === '') { 
      try {
        setLoading(true);
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
        setLoading(false);
      }
    } else {
      setNotesVisible(!notesVisible);
    }
  };

  const handleSendMessage = async () => {
    console.log(conversationHistory)
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };
  console.log(conversationHistory)
  const extractVideoId = (url) => {
    const match = url.match(/[?&]v=([^?&]+)/);
    return match && match[1];
  };

 

  return (
    <div className="flex">
    <div className="w-1/2 p-4">
  {/* Embed YouTube Video */}
  <iframe
    width="100%"
    height="360"
    src={`https://www.youtube.com/embed/${extractVideoId(router.query.mediaLink)}`}
    title="YouTube video player"
    frameBorder="0"
    allowFullScreen
  ></iframe>
  {/* Buttons for View Notes and View Transcript */}
  <div className="mt-4">
    <button onClick={handleViewTranscript}>{visibleTranscript ? 'Hide Transcript' : 'View Transcript'}</button>
  </div>
  {/* Display Transcript in a fixed-height scrollable div */}
  {visibleTranscript && (
    <div className="mt-4 h-80 overflow-y-auto over">
      <h1 className="text-xl font-bold mb-4">Transcript</h1>
      <ul className="list-disc pl-6">
        {outputData.segments.map((segment, index) => (
          <li key={index} className="mb-2">
            <span className="font-bold">{segment.start.toFixed(2)}s:</span> {segment.text}
          </li>
        ))}
      </ul>
    </div>
  )}
</div>


<div className="w-1/2 p-4">
  {loading && <p>Loading...</p>}
  {error && <p>Error: {error}</p>}
  
  {/* Chat Section */}
  <div className='bg-gray-100 p-4 rounded-lg'>
  <div className="h-80 overflow-y-auto ">
    <h1 className="text-xl font-bold mb-4">Chat</h1>
    <div>
      {/* Display Conversation History if it's not undefined */}
      {conversationHistory && conversationHistory.map((message, index) => (
        <div key={index}>
          {/* Assuming the first element is user message and the second is bot response */}
          <p><strong>User:</strong> {message[0]}</p>
          <p><strong>Bot:</strong> {message[1]}</p>
        </div>
      ))}
    </div>
  </div>
  
  {/* Input Field for User Message */}
  <div className="flex items-center mt-4 bg-white-500 rounded-lg">
    <input type="text" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} className="flex-1 rounded-lg py-2 px-4 bg-white-500 focus:outline-none focus:ring focus:border-blue-300" placeholder="Type your message..." />
    <button onClick={handleSendMessage} className="ml-4 px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300">Send</button>
  </div>
  </div>

  <button onClick={handleViewNotes} className="mt-4">{notesVisible ? 'Hide Notes' : 'View Notes'}</button>

  {/* Display Notes in a fixed-height scrollable div */}
  {notesVisible && (
    <div className="mt-4 h-80 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">Notes</h1>
      <div className="overflow-y-auto">
        <ReactMarkdown>{notes.notes}</ReactMarkdown>
      </div>
    </div>
  )}
</div>


    </div>
  );
};


export default OutputPage;
