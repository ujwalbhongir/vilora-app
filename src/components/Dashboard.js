import React, { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from '../firebase-config'; // Assuming firebase-config exports storage
import { getFunctions, httpsCallable } from "firebase/functions";
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp, onSnapshot, deleteDoc, writeBatch } from "firebase/firestore";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LogoImage from '../logo.png'; // Assuming logo path is correct

// --- Helper Components ---

const ViloraLogo = ({ className }) => (
    <div className={className}>
        <img src={LogoImage} alt="Vilora" className="w-16 h-16 drop-shadow-lg" />
    </div>
);

function NicknameSetup({ onComplete, setNotification }) {
    const [nickname, setNickname] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setNotification('Please enter a nickname.');
            return;
        }
        try {
            await updateProfile(auth.currentUser, { displayName: nickname });
            onComplete();
        } catch (error) {
            console.error("Error updating profile:", error);
            setNotification("Error: Could not save nickname.");
        }
    };
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
            <ViloraLogo className="h-24 w-24 mb-8 animate-pulse" />
            <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-tight">
                Welcome to Vilora!
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-light tracking-wide">Let's set up your unique identity.</p>
            <form onSubmit={handleSubmit} className="flex items-center gap-3 backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20">
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your nickname"
                    className="bg-black/30 border border-cyan-500/30 rounded-xl px-6 py-3 text-white font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
                    required
                />
                <button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl px-8 py-3 font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:scale-105"
                >
                    Launch 🚀
                </button>
            </form>
        </div>
    );
}

function ChatInput({ onSendMessage, disabled, setNotification, theme }) {
    const [inputText, setInputText] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('');
                setInputText(transcript);
            };
        }
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleMicClick = () => {
        if (disabled) return;
        if (!recognitionRef.current) return setNotification("Speech recognition is not supported in your browser.");
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setAttachedFile(file);
        }
    };

    const handleAddFileClick = () => {
        if (!disabled) fileInputRef.current.click();
    };

    const handleSend = () => {
        if (disabled) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
        if (inputText.trim() === '' && !attachedFile) return;
        onSendMessage(inputText, attachedFile);
        setInputText('');
        setAttachedFile(null);
    };

    const themeClasses = {
        dark: {
            bg: 'bg-gray-900/80 backdrop-blur-xl',
            border: 'border-gray-700/50',
            text: 'text-white',
            placeholder: 'placeholder-gray-400',
            buttonBg: 'bg-gray-700/70 backdrop-blur-sm',
            buttonHover: 'hover:bg-gray-600/70',
            micColor: 'text-gray-400 hover:text-cyan-400',
            filePillBg: 'bg-gray-700/70 backdrop-blur-sm',
            filePillText: 'text-white',
        },
        light: {
            bg: 'bg-white/80 backdrop-blur-xl',
            border: 'border-gray-300/50',
            text: 'text-gray-900',
            placeholder: 'placeholder-gray-500',
            buttonBg: 'bg-gray-200/70 backdrop-blur-sm',
            buttonHover: 'hover:bg-gray-300/70',
            micColor: 'text-gray-600 hover:text-purple-600',
            filePillBg: 'bg-gray-200/70 backdrop-blur-sm',
            filePillText: 'text-gray-900',
        }
    };
    const currentTheme = themeClasses[theme];

    return (
        <div className="px-6 pb-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
            <div className={`relative ${currentTheme.bg} ${currentTheme.border} border rounded-3xl p-4 flex items-center shadow-2xl ${disabled ? 'opacity-50' : ''} transition-all`}>
                <button
                    onClick={handleAddFileClick}
                    className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} rounded-full w-10 h-10 flex items-center justify-center text-white text-xl mr-3 font-bold transition-all transform hover:scale-105 shadow-lg`}
                    title="Add File"
                    disabled={disabled}
                >
                    📎
                </button>
                {attachedFile ? (
                    <div className={`flex-1 flex items-center ${currentTheme.filePillBg} rounded-2xl px-4 py-2 text-sm font-medium`}>
                        <span className={`truncate ${currentTheme.filePillText}`}>{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="ml-3 text-gray-400 hover:text-red-400 font-bold text-lg">&times;</button>
                    </div>
                ) : (
                    <input
                        type="text"
                        placeholder={isListening ? "🎤 Listening..." : (disabled ? "⏳ Thinking..." : "✨ Ask me anything magical...")}
                        className={`flex-1 bg-transparent ${currentTheme.text} ${currentTheme.placeholder} focus:outline-none font-medium text-lg`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        disabled={disabled}
                    />
                )}
                <button
                    onClick={handleMicClick}
                    className={`p-3 rounded-full transition-all transform hover:scale-110 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' : currentTheme.micColor}`}
                    title="Use Microphone"
                    disabled={disabled}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                </button>
                <button
                    onClick={handleSend}
                    className={`bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-full w-12 h-12 flex items-center justify-center text-white ml-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25`}
                    title="Send Message"
                    disabled={disabled}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    );
}

const SettingsIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const ArchiveIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>);
const LogoutIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>);

function Sidebar({ user, onLogout, chats, setNotification, openSettings, isOpen, setIsOpen, theme, activeChatId, setActiveChatId, onDeleteChat, onArchiveChat }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const menuRef = useRef(null);
    const renameInputRef = useRef(null);
    // NEW: State and ref for search voice recognition
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // NEW: Setup speech recognition for search
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('');
                setSearchTerm(transcript);
            };
        }
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // NEW: Handler for the search microphone button
    const handleMicClick = () => {
        if (!recognitionRef.current) {
            setNotification("Speech recognition is not supported in your browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const toggleMenu = (chatId) => {
        setOpenMenuId(prevId => (prevId === chatId ? null : chatId));
    };

    const handleDelete = (chatIdToDelete) => {
        onDeleteChat(chatIdToDelete);
        setOpenMenuId(null);
    };

    const handleRename = (chatId, newTitle) => {
        if (newTitle && newTitle.trim() !== '') {
            // Firestore rename logic would go here
        }
        setRenamingId(null);
    };

    const handleArchive = (chatIdToArchive) => {
        const chat = chats.find(c => c.id === chatIdToArchive);
        if (chat) {
            onArchiveChat(chatIdToArchive, chat.archived);
        }
        setOpenMenuId(null);
    };

    const filteredChats = chats.filter(chat => !chat.archived && chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const archivedChats = chats.filter(chat => chat.archived);

    useEffect(() => {
        if (renamingId !== null && renameInputRef.current) {
            renameInputRef.current.focus();
        }
    }, [renamingId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // NEW: Handle clicks outside sidebar to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.sidebar-toggle-btn')) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    const themeClasses = {
        dark: {
            bg: 'bg-gray-900/90 backdrop-blur-xl',
            hoverBg: 'hover:bg-gray-700/70',
            text: 'text-white',
            secondaryText: 'text-gray-300',
            border: 'border-gray-700/50',
            searchBg: 'bg-gray-800/50 backdrop-blur-sm',
            searchText: 'text-white',
            searchPlaceholder: 'placeholder-gray-400',
        },
        light: {
            bg: 'bg-white/90 backdrop-blur-xl',
            hoverBg: 'hover:bg-gray-100/70',
            text: 'text-gray-900',
            secondaryText: 'text-gray-700',
            border: 'border-gray-300/50',
            searchBg: 'bg-gray-100/50 backdrop-blur-sm',
            searchText: 'text-gray-900',
            searchPlaceholder: 'placeholder-gray-500',
        }
    };
    const currentTheme = themeClasses[theme];

    return (
        <div className={`sidebar-container fixed inset-y-0 left-0 z-30 flex flex-col w-80 ${currentTheme.bg} p-4 ${currentTheme.text} transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 border-r ${currentTheme.border}`}>
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-6">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-cyan-400/50 shadow-lg" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-black text-white text-lg shadow-lg">
                        {user.displayName?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="font-bold text-lg tracking-wide">{user.displayName}</p>
                    <p className="text-sm text-gray-400 font-medium">AI Explorer</p>
                </div>
            </div>

            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder={isListening ? "🎤 Listening for search..." : "🔍 Search your universe..."}
                    className={`w-full ${currentTheme.searchBg} border ${currentTheme.border} rounded-2xl py-3 pl-12 pr-12 text-sm ${currentTheme.searchText} ${currentTheme.searchPlaceholder} focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all font-medium`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                        onClick={handleMicClick}
                        className={`p-2 rounded-full transition-all transform hover:scale-110 ${isListening ? 'bg-red-500 text-white animate-pulse' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                        title="Search with voice"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                    </button>
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <button onClick={openSettings} className={`w-full flex items-center gap-4 p-3 rounded-xl ${currentTheme.secondaryText} ${currentTheme.hoverBg} font-medium transition-all transform hover:scale-105`}>
                    <SettingsIcon />
                    <span className="font-semibold">Settings</span>
                </button>
                <button onClick={() => setShowArchived(!showArchived)} className={`w-full flex items-center gap-4 p-3 rounded-xl ${currentTheme.secondaryText} ${currentTheme.hoverBg} font-medium transition-all transform hover:scale-105`}>
                    <ArchiveIcon />
                    <span className="font-semibold">Archive</span>
                </button>
                <button onClick={onLogout} className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:text-red-300 ${currentTheme.hoverBg} font-medium transition-all transform hover:scale-105`}>
                    <LogoutIcon />
                    <span className="font-semibold">Sign Out</span>
                </button>
            </div>

            <hr className={`${currentTheme.border} mb-4`} />

            <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="px-3 text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-3 tracking-wider uppercase">Your Chats</h3>
                <div className="space-y-2">
                    {filteredChats.map(chat => (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${activeChatId === chat.id ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : currentTheme.hoverBg}`}>
                            {renamingId === chat.id ? (
                                <input ref={renameInputRef} type="text" defaultValue={chat.title} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium" onBlur={(e) => handleRename(chat.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRename(chat.id, e.target.value); }} />
                            ) : (
                                <p className="truncate text-sm font-semibold">{chat.title}</p>
                            )}
                            {renamingId !== chat.id && (
                                <button onClick={(e) => { e.stopPropagation(); toggleMenu(chat.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all transform hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                </button>
                            )}
                            {openMenuId === chat.id && (
                                <div ref={menuRef} className={`absolute top-12 right-0 w-44 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-20 overflow-hidden`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setNotification('🚀 Share feature launching soon!'); setOpenMenuId(null); }} className={`block px-4 py-3 text-sm ${currentTheme.secondaryText} hover:bg-gray-700/70 font-medium transition-colors`}>✨ Share</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setRenamingId(chat.id); setOpenMenuId(null); }} className={`block px-4 py-3 text-sm ${currentTheme.secondaryText} hover:bg-gray-700/70 font-medium transition-colors`}>✏️ Rename</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleArchive(chat.id); }} className={`block px-4 py-3 text-sm ${currentTheme.secondaryText} hover:bg-gray-700/70 font-medium transition-colors`}>📦 Archive</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(chat.id); }} className={`block px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 font-medium transition-colors`}>🗑️ Delete</a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {showArchived && archivedChats.length > 0 && (
                    <div className="mt-6">
                        <h3 className="px-3 text-sm font-black text-gray-500 mb-3 tracking-wider uppercase">Archived</h3>
                        <div className="space-y-2">
                            {archivedChats.map(chat => (
                                <div key={chat.id} className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer ${currentTheme.hoverBg} transition-all`}>
                                    <p className="truncate text-sm text-gray-500 font-medium">{chat.title}</p>
                                    <button onClick={() => handleArchive(chat.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-cyan-400 transition-all transform hover:scale-110" title="Restore">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM5 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm-1 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingsModal({ user, closeSettings, setNotification, theme, setTheme, textSize, setTextSize, saveHistory, setSaveHistory }) {
    const [newNickname, setNewNickname] = useState(user.displayName);
    const [newProfilePic, setNewProfilePic] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const profilePicInputRef = useRef(null);

    const handleNicknameSave = async () => {
        if (newNickname.trim() === '' || newNickname === user.displayName) return;
        try {
            await updateProfile(auth.currentUser, { displayName: newNickname.trim() });
            setNotification("✨ Nickname updated successfully!");
        } catch (error) {
            setNotification("❌ Error updating nickname.");
        }
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setNewProfilePic(file);
        }
    };

    const handleProfilePicSave = async () => {
        if (!newProfilePic) return;
        setIsUploading(true);
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        try {
            setNotification("📸 Uploading your new avatar...");
            const snapshot = await uploadBytes(storageRef, newProfilePic);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
            setNotification("🎉 Profile picture updated successfully!");
            setNewProfilePic(null);
        } catch (error) {
            setNotification("❌ Error uploading picture.");
        } finally {
            setIsUploading(false);
        }
    };

    const themeClasses = {
        dark: {
            bg: 'bg-gray-900/95 backdrop-blur-xl',
            inputBg: 'bg-gray-800/50 backdrop-blur-sm',
            border: 'border-gray-700/50',
            text: 'text-white',
            secondaryText: 'text-gray-400',
            buttonBg: 'bg-gray-700/70 backdrop-blur-sm',
            buttonHover: 'hover:bg-gray-600/70',
        },
        light: {
            bg: 'bg-white/95 backdrop-blur-xl',
            inputBg: 'bg-gray-100/50 backdrop-blur-sm',
            border: 'border-gray-300/50',
            text: 'text-gray-900',
            secondaryText: 'text-gray-600',
            buttonBg: 'bg-gray-200/70 backdrop-blur-sm',
            buttonHover: 'hover:bg-gray-300/70',
        }
    };
    const currentTheme = themeClasses[theme];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className={`${currentTheme.bg} rounded-3xl shadow-2xl ${currentTheme.text} w-full max-w-lg p-8 border ${currentTheme.border}`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Settings</h2>
                    <button onClick={closeSettings} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} text-3xl transition-all transform hover:scale-110 hover:rotate-90`}>&times;</button>
                </div>
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={newProfilePic ? URL.createObjectURL(newProfilePic) : user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=2C2C2C&color=fff`} alt="Profile" className="w-20 h-20 rounded-full border-4 border-gradient-to-r from-cyan-400 to-purple-400 shadow-lg" />
                            {newProfilePic && <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">✓</div>}
                        </div>
                        <div className="flex flex-col gap-3">
                            <input type="file" accept="image/*" ref={profilePicInputRef} onChange={handleProfilePicChange} className="hidden" />
                            <button onClick={() => profilePicInputRef.current.click()} className={`${currentTheme.buttonBg} px-6 py-3 rounded-xl text-sm font-bold ${currentTheme.buttonHover} transition-all transform hover:scale-105 shadow-lg`}>📸 Change Avatar</button>
                            {newProfilePic && <button onClick={handleProfilePicSave} disabled={isUploading} className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 rounded-xl text-sm font-bold text-white hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg">{isUploading ? '⏳ Uploading...' : '💾 Save Avatar'}</button>}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="nickname" className={`text-sm font-bold ${currentTheme.secondaryText} tracking-wide uppercase`}>Your Identity</label>
                        <div className="flex items-center gap-3">
                            <input id="nickname" type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} className={`flex-1 ${currentTheme.inputBg} border ${currentTheme.border} rounded-xl py-3 px-4 ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all font-medium`} />
                            <button onClick={handleNicknameSave} className="bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 rounded-xl text-sm font-bold text-white hover:from-cyan-400 hover:to-purple-400 transition-all transform hover:scale-105 shadow-lg">💫 Update</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className={`text-sm font-bold ${currentTheme.secondaryText} tracking-wide uppercase`}>Visual Theme</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setTheme('dark')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : `${currentTheme.buttonBg} ${currentTheme.buttonHover}`}`}>🌙 Dark Mode</button>
                            <button onClick={() => setTheme('light')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${theme === 'light' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : `${currentTheme.buttonBg} ${currentTheme.buttonHover}`}`}>☀️ Light Mode</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className={`text-sm font-bold ${currentTheme.secondaryText} tracking-wide uppercase`}>Text Size</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setTextSize('sm')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${textSize === 'sm' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : `${currentTheme.buttonBg} ${currentTheme.buttonHover}`}`}>🔍 Small</button>
                            <button onClick={() => setTextSize('base')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${textSize === 'base' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : `${currentTheme.buttonBg} ${currentTheme.buttonHover}`}`}>📝 Medium</button>
                            <button onClick={() => setTextSize('lg')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${textSize === 'lg' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : `${currentTheme.buttonBg} ${currentTheme.buttonHover}`}`}>🔎 Large</button>
                        </div>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${currentTheme.border} ${currentTheme.inputBg}`}>
                        <div>
                            <label className={`text-sm font-bold ${currentTheme.text}`}>💾 Save Chat History</label>
                            <p className={`text-xs ${currentTheme.secondaryText} mt-1`}>Store your conversations for future reference</p>
                        </div>
                        <button onClick={() => setSaveHistory(!saveHistory)} className={`w-14 h-8 rounded-full p-1 flex items-center transition-all transform hover:scale-110 ${saveHistory ? 'bg-gradient-to-r from-green-500 to-emerald-500 justify-end shadow-lg shadow-green-500/25' : 'bg-gray-600 justify-start'}`}>
                            <span className="w-6 h-6 bg-white rounded-full block shadow-lg transition-all"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Dashboard Layout ---
function ChatDashboard({ onLogout, user }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPersonaOpen, setIsPersonaOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState('Companion');
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState('');
    const [theme, setTheme] = useState('dark');
    const [textSize, setTextSize] = useState('base');
    const [saveHistory, setSaveHistory] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [briefing, setBriefing] = useState('');
    const personas = ["🤖 Companion", "😄 Comedian", "💝 Loyal Friend", "📚 Homework Helper", "👨‍⚕️ Doc", "🧠 Therapist"];
    const chatEndRef = useRef(null);
    const isInitialLoad = useRef(true);

    const startNewChat = async () => {
        const newChatData = {
            title: "New Chat",
            userId: user.uid,
            createdAt: serverTimestamp(),
            archived: false,
        };

        try {
            const docRef = await addDoc(collection(db, "chats"), newChatData);
            setActiveChatId(docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating new chat: ", error);
            setNotification("❌ Failed to start a new chat.");
            return null;
        }
    };

    const handleDeleteChat = async (chatIdToDelete) => {
        if (!chatIdToDelete) return;

        try {
            const messagesQuery = query(collection(db, "chats", chatIdToDelete, "messages"));
            const messagesSnapshot = await getDocs(messagesQuery);
            const batch = writeBatch(db);
            messagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            await deleteDoc(doc(db, "chats", chatIdToDelete));

            if (activeChatId === chatIdToDelete) {
                setActiveChatId(null);
            }

            setNotification("🗑️ Chat deleted successfully.");
        } catch (error) {
            console.error("Error deleting chat:", error);
            setNotification("❌ Failed to delete chat.");
        }
    };

    const handleArchiveChat = async (chatId, currentArchivedStatus) => {
        if (!chatId) return;
        try {
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                archived: !currentArchivedStatus
            });
            setNotification(`${!currentArchivedStatus ? '📦 Chat archived' : '📤 Chat restored'} successfully.`);
            if (activeChatId === chatId) {
                setActiveChatId(null);
            }
        } catch (error) {
            console.error("Error archiving chat:", error);
            setNotification("❌ Failed to update chat status.");
        }
    };

    const addBotMessageToChat = async (text, chatId) => {
        if (!chatId || !text) return;
        const newBotMessage = { text, sender: 'bot', createdAt: serverTimestamp() };
        await addDoc(collection(db, "chats", chatId, "messages"), newBotMessage);
    };
    
    // --- IMPROVED: Error Handling in useEffect ---
    useEffect(() => {
        if (isInitialLoad.current && user) {
            isInitialLoad.current = false;

            const getBriefing = async () => {
                setNotification("🌅 Getting your daily briefing...");
                const functions = getFunctions();
                const getWeather = httpsCallable(functions, 'getWeather');
                const getNews = httpsCallable(functions, 'getNews');

                try {
                    const position = await new Promise((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject)
                    );
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setUserLocation(location);

                    let weatherText = "";
                    let newsText = "";

                    try {
                        const weatherResult = await getWeather(location);
                        const weather = weatherResult.data.weather;
                        weatherText = `🌡️ The current temperature is ${weather.temperature}°C.`;
                    } catch (weatherError) {
                        console.error("Weather fetch failed:", weatherError);
                        weatherText = "🌦️ Weather data unavailable.";
                    }

                    try {
                        const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`);
                        const geoData = await geoResponse.json();
                        const countryCode = geoData.countryCode.toLowerCase();

                        const newsResult = await getNews({ country: countryCode });
                        const articles = newsResult.data.articles;
                        if (articles && articles.length > 0) {
                            newsText = `📰 Top headline: ${articles[0].title}`;
                        }
                    } catch (newsError) {
                        console.error("News fetch failed:", newsError);
                        newsText = "📰 News data unavailable.";
                    }

                    setBriefing(`Good morning, ${user.displayName}! ✨ ${weatherText} ${newsText}`);
                } catch (locationError) {
                    setNotification("📍 Location access denied.");
                    setBriefing(`Good morning, ${user.displayName}! ✨ How can I help you create something amazing today?`);
                } finally {
                    setNotification("");
                }
            };
            getBriefing();
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "chats"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userChats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), messages: [] }));
            setChats(userChats);
        }, (error) => {
            console.error("Error fetching chats: ", error);
            setNotification("❌ Could not load chat history.");
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        // Stop any speaking when the active chat changes
        window.speechSynthesis.cancel();
        
        if (!activeChatId) return;
        const messagesQuery = query(collection(db, "chats", activeChatId, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setChats(currentChats =>
                currentChats.map(chat =>
                    chat.id === activeChatId ? { ...chat, messages } : chat
                )
            );
        });
        return () => unsubscribe();
    }, [activeChatId]);


    useEffect(() => {
        if (activeChatId) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chats]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => { setNotification(''); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- IMPROVED: handleSendMessage with Better Error Handling ---
    const handleSendMessage = async (text, file) => {
        if (!text.trim() && !file) return;

        let currentChatId = activeChatId;

        if (!currentChatId) {
            const newChatId = await startNewChat();
            if (!newChatId) {
                setNotification("❌ Could not create a new chat. Please try again.");
                return;
            }
            currentChatId = newChatId;
        }

        const newUserMessage = { text, sender: 'user', createdAt: serverTimestamp() };
        await addDoc(collection(db, "chats", currentChatId, "messages"), newUserMessage);
        setIsLoading(true);

        try {
            const lowerCaseText = text.toLowerCase();
            const functions = getFunctions();

            if (lowerCaseText.includes("weather")) {
                const getWeather = httpsCallable(functions, 'getWeather');
                if (!userLocation) {
                    await addBotMessageToChat("🌍 I need your location to get the weather. Please allow location access when prompted.", currentChatId);
                    setIsLoading(false);
                    return;
                }
                const result = await getWeather(userLocation);
                if (!result.data || !result.data.weather) throw new Error("Invalid weather data");
                const weather = result.data.weather;
                const weatherMarkdown = `🌡️ The current temperature is **${weather.temperature}°C** with wind speeds of **${weather.windspeed} km/h**.`;
                await addBotMessageToChat(weatherMarkdown, currentChatId);

            } else if (lowerCaseText.includes("news")) {
                const getNews = httpsCallable(functions, 'getNews');
                const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation?.latitude || 34.0522}&longitude=${userLocation?.longitude || -118.2437}&localityLanguage=en`);
                if (!geoResponse.ok) throw new Error("Geolocation API failed");
                const geoData = await geoResponse.json();
                const countryCode = geoData.countryCode.toLowerCase();

                const result = await getNews({ country: countryCode || 'us' });
                if (!result.data || !result.data.articles) throw new Error("Invalid news data");
                const articles = result.data.articles;
                let newsMarkdown = "📰 **Here are the latest headlines for you:**\n\n";
                articles.forEach((article, index) => {
                    newsMarkdown += `${index + 1}. **[${article.title}](${article.url})**\n`;
                });
                await addBotMessageToChat(newsMarkdown, currentChatId);

            } else {
                const currentChat = chats.find(c => c.id === currentChatId);
                const messagesForApi = [...(currentChat?.messages || []), newUserMessage];
                const chatHistory = messagesForApi.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));

                const chatToUpdate = chats.find(c => c.id === currentChatId);
                if (chatToUpdate && chatToUpdate.title === "New Chat") {
                    const newTitle = text.substring(0, 40) + (text.length > 40 ? "..." : "");
                    await updateDoc(doc(db, "chats", currentChatId), { title: newTitle });
                }

                const getGeminiResponse = httpsCallable(functions, 'getGeminiResponse');
                const result = await getGeminiResponse({ chatHistory, selectedPersona, userId: user.uid });
                if (!result.data || !result.data.text) throw new Error("Invalid Gemini response");
                await addBotMessageToChat(result.data.text, currentChatId);
            }
        } catch (error) {
            console.error("Error in handleSendMessage: ", error);
            setNotification(`❌ An error occurred: ${error.message}. Please try again.`);
            await addBotMessageToChat("😅 Sorry, I ran into a problem trying to respond. Let's try that again!", currentChatId);
        } finally {
            setIsLoading(false);
        }
    };
    
    // NEW: Function to handle text-to-speech
    const handleSpeak = (textToSpeak) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous speech
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            window.speechSynthesis.speak(utterance);
        } else {
            setNotification("Sorry, your browser doesn't support text-to-speech.");
        }
    };

    if (!user.displayName) {
        return <NicknameSetup onComplete={() => { }} setNotification={setNotification} />;
    }

    const activeChat = chats.find(chat => chat.id === activeChatId);
    const messagesToDisplay = activeChat ? activeChat.messages || [] : [];
    const textSizeClass = `text-${textSize}`;

    const markdownComponents = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl overflow-hidden shadow-lg"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={`${className} bg-gray-800/50 px-2 py-1 rounded text-cyan-400 font-mono`} {...props}>
                    {children}
                </code>
            );
        },
    };

    return (
        <div className={`h-screen w-full flex font-sans relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
            <Sidebar
                user={user} onLogout={onLogout} chats={chats}
                setNotification={setNotification} openSettings={() => setIsSettingsOpen(true)}
                isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} theme={theme}
                activeChatId={activeChatId} setActiveChatId={setActiveChatId}
                onDeleteChat={handleDeleteChat}
                onArchiveChat={handleArchiveChat}
            />

            {isSettingsOpen && <SettingsModal
                user={user} closeSettings={() => setIsSettingsOpen(false)} setNotification={setNotification}
                theme={theme} setTheme={setTheme} textSize={textSize} setTextSize={setTextSize}
                saveHistory={saveHistory} setSaveHistory={setSaveHistory}
            />}

            <div className="flex-1 flex flex-col">
                <div className="p-6 flex justify-between items-center h-20 backdrop-blur-xl bg-white/5 border-b border-gray-700/20">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`sidebar-toggle-btn p-3 rounded-xl ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-black hover:bg-gray-200/50'} transition-all transform hover:scale-110`} title="Toggle Sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <h1 
                        className="text-2xl font-light tracking-[0.3em] bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        VILORA
                    </h1>
                    <button onClick={() => startNewChat()} className={`p-3 rounded-xl ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-black hover:bg-gray-200/50'} transition-all transform hover:scale-110`} title="New Chat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                </div>

                <div className={`flex-1 p-8 overflow-y-auto ${textSizeClass} custom-scrollbar`}>
                    {activeChatId && messagesToDisplay.length > 0 ? (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {messagesToDisplay.map((msg, index) => (
                                <div key={msg.id || index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                                    <div className={`max-w-3xl px-6 py-4 rounded-3xl prose prose-invert transition-all transform hover:scale-[1.02] ${msg.sender === 'user' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25' : (theme === 'dark' ? 'bg-gray-800/70 backdrop-blur-xl border border-gray-700/30 shadow-xl' : 'bg-white/70 backdrop-blur-xl border border-gray-200/50 text-gray-900 shadow-xl')}`}>
                                        <ReactMarkdown components={markdownComponents}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.sender === 'bot' && (
                                        <button 
                                            onClick={() => handleSpeak(msg.text)} 
                                            className={`mt-2 p-2 rounded-full transition-all transform hover:scale-110 ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
                                            title="Read aloud"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start animate-pulse">
                                    <div className={`max-w-xl px-6 py-4 rounded-3xl ${theme === 'dark' ? 'bg-gray-800/70 backdrop-blur-xl text-white border border-gray-700/30' : 'bg-white/70 backdrop-blur-xl text-gray-900 border border-gray-200/50'} shadow-xl`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex space-x-2">
                                                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="font-medium">AI is thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight leading-tight">
                                    Hey there, {user.displayName}! 👋
                                </h1>
                                <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-4 font-light leading-relaxed max-w-2xl mx-auto`}>
                                    {briefing || '✨ Ready to explore the infinite possibilities of AI? Let\'s create something extraordinary together!'}
                                </p>
                            </div>
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                                        className={`${theme === 'dark' ? 'bg-gray-800/70 backdrop-blur-xl border-gray-700/50 hover:bg-gray-700/70 text-white' : 'bg-white/70 backdrop-blur-xl border-gray-300/50 hover:bg-white/90 text-gray-900'} border rounded-2xl px-8 py-4 text-lg font-bold flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg`}
                                    >
                                        🎭 Choose Your AI Persona
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                    {isPersonaOpen && (
                                        <div className={`absolute top-full mt-3 w-72 ${theme === 'dark' ? 'bg-gray-900/95 backdrop-blur-xl border-gray-700/50' : 'bg-white/95 backdrop-blur-xl border-gray-200/50'} border rounded-2xl shadow-2xl z-10 overflow-hidden`}>
                                            {personas.map(persona => (
                                                <button
                                                    key={persona}
                                                    onClick={() => { setSelectedPersona(persona); setIsPersonaOpen(false); }}
                                                    className={`w-full text-left px-6 py-4 text-lg font-semibold ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-800/70' : 'text-gray-800 hover:bg-gray-100/70'} transition-all hover:scale-105 transform`}
                                                >
                                                    {persona}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                    Currently: {selectedPersona}
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
                                <button
                                    onClick={() => handleSendMessage("What's the weather like today?", null)}
                                    className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/30' : 'bg-white/50 hover:bg-white/70 border-gray-200/30'} border backdrop-blur-xl transition-all transform hover:scale-105 shadow-lg text-left`}
                                >
                                    <div className="text-3xl mb-2">🌤️</div>
                                    <div className="font-bold text-lg mb-1">Weather Update</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Get current weather conditions</div>
                                </button>

                                <button
                                    onClick={() => handleSendMessage("What's in the news today?", null)}
                                    className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/30' : 'bg-white/50 hover:bg-white/70 border-gray-200/30'} border backdrop-blur-xl transition-all transform hover:scale-105 shadow-lg text-left`}
                                >
                                    <div className="text-3xl mb-2">📰</div>
                                    <div className="font-bold text-lg mb-1">Latest News</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Stay updated with headlines</div>
                                </button>

                                <button
                                    onClick={() => handleSendMessage("Help me brainstorm creative ideas", null)}
                                    className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/30' : 'bg-white/50 hover:bg-white/70 border-gray-200/30'} border backdrop-blur-xl transition-all transform hover:scale-105 shadow-lg text-left`}
                                >
                                    <div className="text-3xl mb-2">💡</div>
                                    <div className="font-bold text-lg mb-1">Creative Spark</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Generate innovative ideas</div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} setNotification={setNotification} theme={theme} />
            </div>

            {notification && (
                <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-900/95 backdrop-blur-xl text-white border-gray-700/50' : 'bg-white/95 backdrop-blur-xl text-gray-900 border-gray-200/50'} px-6 py-4 rounded-2xl shadow-2xl border font-semibold text-lg animate-bounce z-40`}>
                    {notification}
                </div>
            )}

            <style jsx>{`
                /* NEW: Zoom out the entire application */
                :global(body) {
                    zoom: 75%;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #06b6d4, #8b5cf6);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #0891b2, #7c3aed);
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700;800;900&display=swap');
                
                * {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .font-black {
                    font-weight: 900;
                    letter-spacing: -0.02em;
                }
                
                .tracking-tight {
                    letter-spacing: -0.025em;
                }
                
                .tracking-wide {
                    letter-spacing: 0.025em;
                }
                
                .prose h1, .prose h2, .prose h3 {
                    font-weight: 700;
                    background: linear-gradient(to right, #06b6d4, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .prose code {
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                    font-weight: 500;
                }
                
                .prose blockquote {
                    border-left: 4px solid #06b6d4;
                    background: rgba(6, 182, 212, 0.1);
                    border-radius: 0 12px 12px 0;
                    padding: 16px 20px;
                    margin: 16px 0;
                }
                
                .prose a {
                    color: #06b6d4;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                
                .prose a:hover {
                    color: #8b5cf6;
                    text-decoration: underline;
                }
                
                .prose ul, .prose ol {
                    padding-left: 1.5rem;
                }
                
                .prose li {
                    margin: 0.5rem 0;
                }
                
                .prose strong {
                    font-weight: 700;
                    color: #06b6d4;
                }
                
                .prose em {
                    font-style: italic;
                    color: #8b5cf6;
                }
            `}</style>
        </div>
    );
}

export default ChatDashboard;