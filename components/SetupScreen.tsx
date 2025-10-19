import React, { useState, useRef } from 'react';
import { findLyrics } from '../services/geminiService';
import { MusicNoteIcon, SparklesIcon, SpinnerIcon } from './icons';

interface SetupScreenProps {
    setAudioFile: (file: File | null) => void;
    lyrics: string;
    setLyrics: (lyrics: string) => void;
    songTitle: string;
    setSongTitle: (title: string) => void;
    songArtist: string;
    setSongArtist: (artist: string) => void;
    onStartKaraoke: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
    setAudioFile,
    lyrics,
    setLyrics,
    songTitle,
    setSongTitle,
    songArtist,
    setSongArtist,
    onStartKaraoke
}) => {
    const [fileName, setFileName] = useState<string>('');
    const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseFileName = (name: string) => {
        // Clear previous data
        setLyrics('');
        setError('');
        // Remove file extension
        const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
        // Common format: "Artist - Title"
        const parts = nameWithoutExt.split('-').map(p => p.trim());
        if (parts.length >= 2) {
            setSongArtist(parts[0]);
            setSongTitle(parts.slice(1).join('-').trim());
        } else {
            // If no separator, assume the whole name is the title
            setSongTitle(nameWithoutExt);
            setSongArtist(''); // Clear artist if format is unknown
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioFile(file);
            setFileName(file.name);
            parseFileName(file.name);
        }
    };

    const handleFindLyrics = async () => {
        if (!songTitle) {
            setError('Please enter a song title to find lyrics.');
            return;
        }
        setIsLoadingLyrics(true);
        setError('');
        try {
            const fetchedLyrics = await findLyrics(songTitle, songArtist);
            setLyrics(fetchedLyrics);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoadingLyrics(false);
        }
    };
    
    const isReady = !!fileName && !!lyrics;

    return (
        <div className="container mx-auto max-w-2xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">
            <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        AI Karaoke Studio
                    </h1>
                    <p className="text-slate-400 mt-2">Create your personal karaoke stage.</p>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Upload Audio */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">1. Upload Your Song</label>
                        <div 
                            className="mt-2 flex justify-center items-center w-full h-32 px-4 transition bg-slate-700/50 border-2 border-slate-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-slate-500 focus:outline-none"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span className="flex items-center space-x-2 text-center">
                                <MusicNoteIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                                <span className="font-medium text-slate-300">
                                    {fileName ? `Selected: ${fileName}` : 'Click to select audio file'}
                                </span>
                            </span>
                            <input type="file" name="file_upload" className="hidden" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                    </div>

                    {/* Step 2: Verify and Get Lyrics */}
                    {fileName && (
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                       <label className="text-lg font-semibold text-slate-300">2. Verify Song Details & Get Lyrics</label>
                       <p className="text-sm text-slate-400 mt-1">Please confirm the song details are correct for the best results.</p>
                       <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input 
                                type="text"
                                placeholder="Artist Name"
                                value={songArtist}
                                onChange={(e) => setSongArtist(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            />
                            <input 
                                type="text"
                                placeholder="Song Title"
                                value={songTitle}
                                onChange={(e) => setSongTitle(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            />
                       </div>
                       <button
                            onClick={handleFindLyrics}
                            disabled={isLoadingLyrics || !songTitle}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-300"
                        >
                            {isLoadingLyrics ? <SpinnerIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5" />}
                            {isLoadingLyrics ? 'Finding Lyrics...' : 'Find Lyrics with AI'}
                        </button>
                        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                       <textarea
                            placeholder="...or paste lyrics manually (LRC format recommended for timing)."
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            rows={8}
                            className="mt-4 w-full bg-slate-700/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                       />
                    </div>
                    )}
                    
                    {/* Step 3: Start */}
                    <button
                        onClick={onStartKaraoke}
                        disabled={!isReady}
                        className="w-full text-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold py-4 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                        Start Karaoke!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupScreen;