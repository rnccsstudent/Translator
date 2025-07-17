import React, { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('bn');
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(0);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const savedSource = localStorage.getItem('source');
    const savedTarget = localStorage.getItem('target');
    if (savedSource && savedTarget) {
      setSource(savedSource);
      setTarget(savedTarget);
    }

    // fetch stats
    fetch(`${process.env.REACT_APP_API_URL}/stats`)         //`${process.env.REACT_APP_API_URL}/stats` exchage if you do without deploy 'http://localhost:5000/stats'
      .then(res => res.json())
      .then(data => setStats(data.total_translations));
  }, []);



  const getTitle = () => {
    if (source === 'en' && target === 'bn') return 'English → Bengali Translator';
    if (source === 'bn' && target === 'en') return 'Bengali → English Translator';
    return 'Bengali ↔ English Translator';
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);  // Reset message after 1.5 sec
  };

  // const handleTranslate = async () => {
  //   const response = await fetch('http://localhost:5000/translate', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ text, source, target }),
  //   });
  //   const data = await response.json();
  //   setTranslation(data.translated_text);
  //   setHistory(prev => [{ input: text, output: data.translated_text, src: source, tgt: target }, ...prev]);
  // };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = source === 'en' ? 'en-US' : 'bn-BD';
    recognition.onresult = (event) => {
      setText(event.results[0][0].transcript);
    };
    recognition.start();
  };


  const speakText = () => {
    if (!translation.trim()) {
      toast.warning("Nothing to read.");
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = target === 'en' ? 'en-US' : 'bn-BD';
    window.speechSynthesis.speak(utterance);
  };


  const swapLanguages = () => {
    const newSource = source === 'en' ? 'bn' : 'en';
    const newTarget = target === 'en' ? 'bn' : 'en';
    setSource(newSource);
    setTarget(newTarget);
    setText('');
    setTranslation('');
    localStorage.setItem('source', newSource);
    localStorage.setItem('target', newTarget);
  };


  const downloadHistory = () => {
    window.open(`${process.env.REACT_APP_API_URL}/download`, '_blank');  //`${process.env.REACT_APP_API_URL}/download` exchange with 'http://localhost:5000/download' without deploy
  };
  
  const handleTranslate = async () => {
    if (!text.trim()) {
      toast.warning("Please enter text before translating.");
      return;
    }
  
    if (loading) return; // prevent multiple clicks
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/translate`, {     //if you run without deploy url is  'http://localhost:5000/translate' exchange of process.env.REACT_APP_API_URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, target }),
      });

      if (!response.ok) {
        throw new Error("Translation API error.");
      }
  
      const data = await response.json();
      setTranslation(data.translated_text);
      setHistory(prev => [
        { input: text, output: data.translated_text, src: source, tgt: target },
        ...prev
      ]);
    } catch (error) {
      toast.error("Translation failed. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const clearHistory = async () => {
    const confirm = window.confirm("Are you sure you want to clear the translation history?");
    if (!confirm) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/clear-history`, { method: 'POST' });   //`${process.env.REACT_APP_API_URL}/clear-history` exchange if you do without deploy 'http://localhost:5000/clear-history'
      setHistory([]);
      toast.success("History cleared.");
    } catch (error) {
      console.error("Clear history failed:", error);
      alert("Failed to clear history.");
    }
  };


  return (
    <div className="container">
      <h2>{getTitle()} 🌐</h2>
      <textarea
        className="textarea"
        rows="4"
        placeholder="Type or speak..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="button-row">
        <button onClick={swapLanguages}>🔁 Swap</button>
        <button onClick={handleTranslate} disabled={loading}>
          {loading ? "Translating..." : "🔍 Translate"}
        </button>
        <button onClick={startVoiceInput}>🎤 Speak</button>
        <button onClick={speakText}>🗣️ Listen</button>
        <button onClick={downloadHistory}>📥 Download</button>
      </div>

      <div className="output">
        <h3>📝 Translated Text:</h3>
        <p>{translation}</p>
      </div>

      <button onClick={copyToClipboard}>📋 Copy</button>
      {copied && <span style={{ marginLeft: '10px', color: 'green' }}>✅ Copied!</span>}

      <p>📊 Total translations done: <strong>{stats}</strong></p>

      <div className="history-box">
        <h3>📚 Translation History</h3>
        <div className="history-controls">
          <input
            type="text"
            placeholder="🔍 Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-box"
          />
          <button onClick={clearHistory}>🗑️ Clear History</button>
        </div>

        <div className="history-scroll">
          {history
            .filter(item =>
              item.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.output.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((item, idx) => (
            <div key={idx} className="history-entry">
              <strong>{item.src.toUpperCase()} → {item.tgt.toUpperCase()}</strong>
              <p>Input: {item.input}</p>
              <p>Output: {item.output}</p>
              <hr />
            </div>
          ))}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}

export default App;
