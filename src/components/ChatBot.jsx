import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Mic, Volume2, Copy, Check } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import Draggable from 'react-draggable';

const ChatbotPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your website assistant. Ask me anything about this page!", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTTSEnabled, setIsTTSEnabled] = useState(true);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Track position state
    
    const messagesEndRef = useRef(null);
    const recognition = useRef(null);
    const synthesis = useRef(null);
    const nodeRef = useRef(null); // Reference for the draggable component
    const genAI = new GoogleGenerativeAI("AIzaSyBl3_mHNipRQCQfk9RFeFfWl59QrExzLjw");
    // Speech setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognition.current.onerror = () => {
                setIsListening(false);
            };
        }

        synthesis.current = window.speechSynthesis;
        synthesis.current.onvoiceschanged = () => {
            // Voice list loaded
        };
    }, []);

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessageIndex(index);
            // Reset copy icon after 2 seconds
            setTimeout(() => {
                setCopiedMessageIndex(null);
            }, 2000);
        });
    };

    const extractPageInfo = () => {
        const pageTitle = document.querySelector('h1')?.textContent || document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const mainContent = document.querySelector('main')?.textContent || document.body.textContent;

        return {
            pageTitle,
            metaDescription,
            mainContent: mainContent?.substring(0, 5000),
            fullUrl: window.location.href
        };
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Voice loading
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                synthesis.current = window.speechSynthesis;
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Modified speak function
    const speak = (text) => {
        if (!isTTSEnabled || !window.speechSynthesis) {
            console.error('TTS not available');
            return;
        }

        window.speechSynthesis.cancel();

        const cleanText = removeMarkdown(text);

        const utterance = new SpeechSynthesisUtterance(cleanText);

        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = voices.filter(v =>
            v.lang === 'en-US' &&
            (v.name.includes('Google') || v.name.includes('Natural'))
        );

        utterance.voice = preferredVoices[0] || voices.find(v => v.lang === 'en-IN');

        // Natural sounding parameters
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
        };

        window.speechSynthesis.speak(utterance);
    };

    function removeMarkdown(text) {
        let cleanedText = text.replace(/\[([^\]]+)]\([^)]+\)/g, '$1');
        cleanedText = cleanedText.replace(/([*_]{1,3})(.*?)\1/g, '$2');
        cleanedText = cleanedText.replace(/^(#{1,6})\s*(.*)/gm, '$2');
        cleanedText = cleanedText.replace(/^[\*\-\+]\s+/gm, '');
        cleanedText = cleanedText.replace(/^\d+\.\s+/gm, '');
        cleanedText = cleanedText.replace(/^>\s+/gm, '');
        cleanedText = cleanedText.replace(/`(.*?)`/g, '$1');
        cleanedText = cleanedText.replace(/```(.*?)```/g, '$1');
        cleanedText = cleanedText.replace(/[-\*\_]{3,}/g, '');
        return cleanedText.trim();
    }

    // Browser support check 
    useEffect(() => {
        if (!('speechSynthesis' in window)) {
            alert("Text-to-speech is not supported in this browser.");
            setIsTTSEnabled(false);
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!recognition.current) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (isListening) {
            recognition.current.stop();
        } else {
            recognition.current.start();
        }
        setIsListening(!isListening);
    };

    const generateBotResponse = async (userInput) => {
        setIsLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const pageInfo = extractPageInfo();

            const prompt = `As a website assistant, use this page info to answer:
                Page Title: ${pageInfo.pageTitle}
                URL: ${pageInfo.fullUrl}
                Content: ${pageInfo.mainContent}
                
                User Question: ${userInput}
                
                Provide a concise, markdown-formatted answer. If unsure, say so.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (isTTSEnabled) speak(text);
            return text;
        } catch (error) {
            console.error('Error:', error);
            return "Sorry, I'm having trouble. Please try again.";
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // User message
        const newMessage = { text: input, isBot: false };
        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Bot response
        try {
            const botResponse = await generateBotResponse(input);
            setMessages(prev => [...prev, {
                text: botResponse,
                isBot: true,
                pageInfo: extractPageInfo()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                text: "Connection error. Please try again.",
                isBot: true
            }]);
        }
    };

    // Handle drag stop to update position state
    const handleDragStop = (e, data) => {
        setPosition({ x: data.x, y: data.y });
    };

    // Reset position when closing/opening
    useEffect(() => {
        if (!isOpen) {
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            ) : (
                <Draggable
                    nodeRef={nodeRef}
                    handle=".chat-header"
                    position={position}
                    onStop={handleDragStop}
                >
                    <div 
                        ref={nodeRef} 
                        className="bg-white rounded-lg shadow-xl w-80 sm:w-96 h-[500px] flex flex-col"
                    >
                        <div
                            className="chat-header bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center cursor-move"
                        >
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                <h3 className="font-semibold">Voice Assistant</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                                    className={`p-1 rounded-full ${isTTSEnabled ? 'bg-white/20' : 'opacity-50'}`}
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={toggleVoiceInput}
                                    className={`p-1 rounded-full ${isListening ? 'animate-pulse bg-red-500' : 'bg-white/20'}`}
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-white/20 rounded-full p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                                >
                                    {message.isBot && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div className={`group relative max-w-[80%] p-3 rounded-lg ${message.isBot
                                            ? 'bg-white shadow-sm border border-gray-100'
                                            : 'bg-blue-600 text-white'
                                        }`}
                                    >
                                        <ReactMarkdown>{message.text}</ReactMarkdown>
                                        <button
                                            onClick={() => copyToClipboard(message.text, index)}
                                            className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${message.isBot ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-700 hover:bg-blue-800'
                                                }`}
                                            title="Copy text"
                                        >
                                            {copiedMessageIndex === index ?
                                                <Check className={`w-4 h-4 ${message.isBot ? 'text-blue-600' : 'text-white'}`} /> :
                                                <Copy className={`w-4 h-4 ${message.isBot ? 'text-blue-600' : 'text-white'}`} />
                                            }
                                        </button>
                                    </div>
                                    {!message.isBot && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-3">
                                        <div className="flex space-x-2">
                                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-300"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type or speak your question..."
                                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            {isListening && (
                                <p className="text-sm text-gray-500 mt-2 animate-pulse">Listening...</p>
                            )}
                        </form>
                    </div>
                </Draggable>
            )}
        </div>
    );
};

export default ChatbotPopup;