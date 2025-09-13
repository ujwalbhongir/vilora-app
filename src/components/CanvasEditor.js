import React, { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; // Assuming you import db from firebase-config
import { db } from '../firebase-config'; // Adjust path as needed
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";

const CanvasEditor = ({ isOpen, onClose, chatId, initialContent = '', contentType = 'code', selectedPersona, userId, theme, textSize, setNotification }) => {
    const [content, setContent] = useState(initialContent);
    const [isGenerating, setIsGenerating] = useState(false);
    const editorRef = useRef(null);

    const functions = getFunctions();
    const getGeminiResponse = httpsCallable(functions, 'getGeminiResponse');

    const handleGenerate = async (prompt) => {
        setIsGenerating(true);
        try {
            const chatHistory = [{ role: 'user', parts: [{ text: `Generate ${contentType} for: ${prompt}. Current content: ${content}` }] }];
            const result = await getGeminiResponse({ chatHistory, selectedPersona, userId });
            const newContent = result.data.text;
            setContent(newContent);
            setNotification('✨ Canvas updated with AI generation!');
        } catch (error) {
            setNotification('❌ Error generating content.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (chatId && content.trim()) {
            // Save to Firestore (e.g., as a special message or separate collection)
            await updateDoc(doc(db, "chats", chatId), { canvasContent: content }); // Or add to messages
            setNotification('💾 Canvas saved to chat!');
        }
        onClose();
    };

    if (!isOpen) return null;

    const editorClass = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
    const textSizeClass = `text-${textSize}`;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col ${theme === 'dark' ? 'bg-gray-900/95 text-white border-gray-700/50' : 'bg-white/95 text-gray-900 border-gray-300/50'} rounded-3xl shadow-2xl border overflow-hidden`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700/20">
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-purple-600'}`}>
                        Grok-Style Canvas: {contentType === 'code' ? 'Code Editor' : 'Document Editor'}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleGenerate(contentType === 'code' ? 'a React component' : 'a document outline')}
                            disabled={isGenerating}
                            className={`px-4 py-2 rounded-xl font-semibold ${isGenerating ? 'bg-gray-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400'} text-white transition-all`}
                        >
                            {isGenerating ? '⏳ Generating...' : '✨ AI Edit'}
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold transition-all">💾 Save</button>
                        <button onClick={onClose} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} text-2xl transition-all`}>×</button>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-hidden">
                    <textarea
                        ref={editorRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Start ${contentType === 'code' ? 'coding' : 'writing'} here...`}
                        className={`${editorClass} ${textSizeClass} w-full h-full resize-none p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono`}
                    />
                </div>
                <div className="p-4 border-t border-gray-700/20 bg-gray-50/50">
                    <p className="text-sm text-gray-500">Pro Tip: Use "AI Edit" to collaborate with your persona. Supports code highlighting soon!</p>
                </div>
            </div>
        </div>
    );
};

export default CanvasEditor;