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
  
  console.log(router.query.mediaLink)


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
    <div className="flex bg-cover bg-center" style={{backgroundColor: '#1B1F29'}}>
      {/* Left Section */}
      <div className="w-2/3 p-4 overflow-y-auto h-screen">
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
  <button onClick={handleViewNotes} className="mt-4">{notesVisible ? 'Hide Notes' : 'View Notes'}</button>

  {/* Display Notes in a fixed-height scrollable div */}
  {notesVisible && (
    <div className="mt-4 h-80">
      <h1 className="text-xl font-bold mb-4 text-white">Notes</h1>
      <div className="overflow-y-auto text-white">
        <ReactMarkdown>{notes.notes}</ReactMarkdown>
      </div>
    </div>
  )}
</div>

  
      <div className="w-1/3 h-screen bg">
      <div className='p-4 h-full flex flex-col bg-gray-800' style={{backgroundColor: '#223446'}} >
      <h1 className="text-2xl font-bold mb-4 text-white mt-2">Chat with memo.ai</h1>
        <div className="h-full overflow-y-auto mb-4">
          
          <div>
            {/* Display Conversation History if it's not undefined */}
            {conversationHistory && conversationHistory.map((message, index) => (
              <div key={index}>
                {/* Assuming the first element is user message and the second is bot response */}
                <p className='mb-2'><strong>User:</strong> {message[0]}</p>
                <p className='mb-2'><strong>Bot:</strong> {message[1]}</p>
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
