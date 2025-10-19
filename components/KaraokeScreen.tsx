import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon, EnterFullscreenIcon, ExitFullscreenIcon, RecordIcon, StopIcon, DownloadIcon, UploadIcon } from './icons';
import type { Background } from '../types';

interface KaraokeScreenProps {
    audioUrl: string;
    lyrics: string;
    background: Background;
    setBackground: (bg: Background) => void;
    onGoBack: () => void;
}

interface TimedLine {
    text: string;
    startTime: number;
}

const animatedBackgrounds = [
    { name: 'Cosmic', url: 'https://videos.pexels.com/video-files/856627/856627-hd.mp4', thumbnail: 'https://images.pexels.com/videos/856627/free-video-856627.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500' },
    { name: 'Neon', url: 'https://videos.pexels.com/video-files/3129957/3129957-hd.mp4', thumbnail: 'https://images.pexels.com/videos/3129957/pexels-photo-3129957.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500' },
    { name: 'Ocean', url: 'https://videos.pexels.com/video-files/4434249/4434249-hd.mp4', thumbnail: 'https://images.pexels.com/videos/4434249/pexels-photo-4434249.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500' },
    { name: 'Forest', url: 'https://videos.pexels.com/video-files/1572314/1572314-hd.mp4', thumbnail: 'https://images.pexels.com/videos/1572314/pexels-photo-1572314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500' },
];

const BackgroundPanel: React.FC<{ setBackground: (bg: Background) => void; currentBackgroundUrl: string; }> = ({ setBackground, currentBackgroundUrl }) => {
    const [mode, setMode] = useState<'image' | 'animate'>('image');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    
    // Clean up old object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (currentBackgroundUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentBackgroundUrl);
            }
        };
    }, [currentBackgroundUrl]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setError('');
                const objectUrl = URL.createObjectURL(file);
                setBackground({ type: 'image', url: objectUrl });
            } else {
                setError('Please select a valid image file.');
            }
        }
    };

    return (
        <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 w-full max-w-xs sm:max-w-sm shadow-lg z-20">
            <div className="flex border-b border-slate-600 mb-4">
                <button onClick={() => setMode('image')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-t-md transition ${mode === 'image' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
                    <PhotoIcon className="w-5 h-5" /> Custom Image
                </button>
                <button onClick={() => setMode('animate')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-t-md transition ${mode === 'animate' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
                    <VideoCameraIcon className="w-5 h-5" /> Animated
                </button>
            </div>

            {mode === 'image' && (
                 <div>
                    <p className="font-semibold mb-2 text-slate-200 text-sm">Custom Background Image</p>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold p-2 rounded-md transition"
                    >
                        <UploadIcon className="w-5 h-5" />
                        Upload from PC
                    </button>
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
            )}
            
            {mode === 'animate' && (
                <div>
                    <p className="font-semibold mb-2 text-slate-200 text-sm">Select an Animated Background</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {animatedBackgrounds.map(bg => (
                            <button key={bg.name} onClick={() => setBackground({ type: 'video', url: bg.url })} className="relative rounded-md overflow-hidden aspect-video group focus:ring-2 focus:ring-pink-500 outline-none">
                                <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                                    <p className="text-white font-bold text-sm">{bg.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const KaraokeScreen: React.FC<KaraokeScreenProps> = ({
    audioUrl,
    lyrics,
    background,
    setBackground,
    onGoBack,
}) => {
    const [timedLyrics, setTimedLyrics] = useState<TimedLine[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [timingOffset, setTimingOffset] = useState(-0.3);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [animationStyle, setAnimationStyle] = useState<'highlight' | 'pop' | 'glow'>('highlight');
    const [isMarqueeMode, setIsMarqueeMode] = useState(false);
    const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'ended'>('idle');

    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const compositeStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Parse lyrics and create timings
    useEffect(() => {
        const audio = audioRef.current;
        if (!lyrics || !audio) return;
        const lines = lyrics.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) { setTimedLyrics([]); return; }
        const lrcTimestampRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;
        const parsedLrcLines: TimedLine[] = [];
        let isLrc = false;
        for (const line of lines) {
            const timestamps = [...line.matchAll(lrcTimestampRegex)];
            if (timestamps.length > 0) {
                isLrc = true;
                const text = line.replace(lrcTimestampRegex, '').trim();
                for (const match of timestamps) {
                    const minutes = parseInt(match[1], 10);
                    const seconds = parseInt(match[2], 10);
                    const fraction = parseInt(match[3], 10);
                    const startTime = minutes * 60 + seconds + (match[3].length === 2 ? fraction / 100 : fraction / 1000);
                    parsedLrcLines.push({ text, startTime });
                }
            }
        }
        if (isLrc && parsedLrcLines.length > 0) {
            parsedLrcLines.sort((a, b) => a.startTime - b.startTime);
            setTimedLyrics(parsedLrcLines);
        } else {
            const calculateTimings = () => {
                const duration = audio.duration;
                if (!isFinite(duration) || duration <= 0) { setTimedLyrics(lines.map(text => ({ text, startTime: 0 }))); return; }
                const timePerLine = duration / lines.length;
                setTimedLyrics(lines.map((text, index) => ({ text, startTime: index * timePerLine, })));
            };
            if (audio.readyState >= 1) { calculateTimings(); } 
            else {
                setTimedLyrics(lines.map(text => ({ text, startTime: 0 })));
                audio.addEventListener('loadedmetadata', calculateTimings, { once: true });
                return () => audio.removeEventListener('loadedmetadata', calculateTimings);
            }
        }
    }, [lyrics, audioUrl]);

    // Manage playback state for cinematic intro/outro
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handlePlay = () => setPlaybackState('playing');
        const handlePause = () => { if (audio.currentTime === 0) setPlaybackState('idle'); };
        const handleEnded = () => setPlaybackState('ended');
        setPlaybackState('idle'); // Reset on new song
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl]);

    // Animation loop for lyric synchronization
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || timedLyrics.length === 0) return;
        const animate = () => {
            const currentTime = audio.currentTime;
            let newIndex = -1;
            for (let i = timedLyrics.length - 1; i >= 0; i--) {
                if (currentTime >= timedLyrics[i].startTime + timingOffset) {
                    newIndex = i;
                    break;
                }
            }
            setCurrentLineIndex(prevIndex => (prevIndex !== newIndex ? newIndex : prevIndex));
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        const handlePlay = () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        const handlePauseOrEnd = () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
        const handleSongEnd = () => { handlePauseOrEnd(); setCurrentLineIndex(-1); };
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePauseOrEnd);
        audio.addEventListener('ended', handleSongEnd);
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePauseOrEnd);
            audio.removeEventListener('ended', handleSongEnd);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [timedLyrics, timingOffset]);

    // Scroll active line into view
    useEffect(() => {
        if (currentLineIndex < 0 || !lyricsContainerRef.current || isMarqueeMode) return;
        const container = lyricsContainerRef.current;
        const activeLineElement = container.children[currentLineIndex] as HTMLElement;
        if (activeLineElement) {
            const topOffset = container.clientHeight * 0.25;
            const scrollTarget = activeLineElement.offsetTop - topOffset;
            container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
    }, [currentLineIndex, isMarqueeMode]);

    // Control audio playback speed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Manage fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleToggleFullscreen = () => {
        if (!fullscreenContainerRef.current) return;
        if (!isFullscreen) {
            fullscreenContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            compositeStreamRef.current?.getTracks().forEach(track => track.stop());
            audioCtxRef.current?.close();
            setIsRecording(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false // We will mix our own audio
                });
                
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                const audio = audioRef.current;
                if (!audio) throw new Error("Audio element not ready.");
                audio.crossOrigin = "anonymous";

                const audioCtx = new AudioContext();
                audioCtxRef.current = audioCtx;
                const songSource = audioCtx.createMediaElementSource(audio);
                const micSource = audioCtx.createMediaStreamSource(micStream);
                const dest = audioCtx.createMediaStreamDestination();
                
                songSource.connect(dest);
                micSource.connect(dest);

                const mixedAudioStream = dest.stream;

                const combinedStream = new MediaStream([
                    ...screenStream.getVideoTracks(),
                    ...mixedAudioStream.getAudioTracks()
                ]);
                compositeStreamRef.current = combinedStream;

                recordedChunksRef.current = [];
                setRecordedVideoUrl(null);

                const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) recordedChunksRef.current.push(event.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setRecordedVideoUrl(url);
                };

                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error starting recording:", err);
                alert("Could not start recording. Please grant screen and microphone permissions and try again.");
            }
        }
    };
    
    const getActiveLineClass = (style: typeof animationStyle): string => {
        switch (style) {
            case 'pop':
                return 'text-cyan-300 scale-115';
            case 'glow':
                return 'text-fuchsia-400 scale-110 [text-shadow:0_0_15px_rgba(240,82,240,0.8),0_2px_20px_rgba(0,0,0,0.8)]';
            case 'highlight':
            default:
                return 'text-yellow-300 scale-110';
        }
    };
    
    const animationClass = background.type === 'image' 
        ? 'animate-[kenburns_30s_ease-out_infinite_alternate]' 
        : '';
        
    const getMarqueeDuration = (): number => {
        if (currentLineIndex < 0 || timedLyrics.length === 0) return 0;
        const currentLine = timedLyrics[currentLineIndex];
        const nextLine = timedLyrics[currentLineIndex + 1];
        if (nextLine) {
            return nextLine.startTime - currentLine.startTime;
        }
        if (audioRef.current && audioRef.current.duration) {
            return audioRef.current.duration - currentLine.startTime;
        }
        return 5; // Default duration for the last line if audio duration is not available
    };


    return (
        <div ref={fullscreenContainerRef} className="relative w-screen h-screen overflow-hidden bg-black">
            {background.type === 'image' ? (
                <div className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${animationClass}`} style={{ backgroundImage: `url(${background.url})` }} />
            ) : (
                <video key={background.url} className="absolute top-0 left-0 w-full h-full object-cover" src={background.url} autoPlay loop muted />
            )}
            <div className="absolute inset-0 bg-black/60" />

            {!isFullscreen && (
                <>
                    <button onClick={onGoBack} className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800/70 p-2 rounded-full transition text-white" aria-label="Go back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <BackgroundPanel setBackground={setBackground} currentBackgroundUrl={background.url} />
                </>
            )}

            <div className="relative z-10 flex flex-col h-full p-4 sm:p-8 md:p-12">
                <div className={`flex-grow flex items-center justify-center overflow-hidden [mask-image:linear-gradient(transparent,black_20%,black_80%,transparent)] transition-opacity duration-1000 ${playbackState === 'playing' ? 'opacity-100' : 'opacity-0'} ${isFullscreen ? 'h-full' : ''}`}>
                    {isMarqueeMode ? (
                        <div className="w-full overflow-hidden">
                           {currentLineIndex >= 0 && (
                               <p 
                                   key={currentLineIndex} // Re-triggers animation on line change
                                   className={`inline-block whitespace-nowrap text-3xl md:text-5xl font-bold p-4 animate-[marquee] ${getActiveLineClass(animationStyle)}`}
                                   style={{ 
                                       animationDuration: `${getMarqueeDuration()}s`,
                                       animationTimingFunction: 'linear',
                                       textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                                    }}
                               >
                                   {timedLyrics[currentLineIndex].text || '\u00A0'}
                               </p>
                           )}
                        </div>
                    ) : (
                        <div ref={lyricsContainerRef} className="text-center font-bold text-white whitespace-pre-wrap max-h-[80vh] sm:max-h-[60vh] overflow-y-auto scroll-smooth no-scrollbar">
                             {timedLyrics.map((line, index) => (
                                <p key={index} 
                                    className={`text-3xl md:text-5xl leading-tight md:leading-snug p-4 transition-all duration-150 ${
                                        index === currentLineIndex
                                            ? getActiveLineClass(animationStyle)
                                            : 'text-white/70 opacity-80'
                                    }`}
                                    style={
                                        index !== currentLineIndex || animationStyle !== 'glow'
                                            ? { textShadow: '0 2px 20px rgba(0,0,0,0.8)' }
                                            : {}
                                    }
                                >
                                    {line.text || '\u00A0'}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {!isFullscreen && (
                    <div className="flex-shrink-0 mt-4">
                        <div className="w-full max-w-3xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4 px-4">
                                <div>
                                    <label htmlFor="timing-offset" className="block text-center text-sm font-medium text-slate-300 mb-2">
                                        Lyric Sync ({timingOffset > 0 ? '+' : ''}{timingOffset.toFixed(1)}s)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400">Earlier</span>
                                        <input id="timing-offset" type="range" min="-5" max="5" step="0.1" value={timingOffset} onChange={(e) => setTimingOffset(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-300" />
                                        <span className="text-xs text-slate-400">Later</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="playback-rate" className="block text-center text-sm font-medium text-slate-300 mb-2">
                                        Speed ({playbackRate.toFixed(2)}x)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400">Slow</span>
                                        <input id="playback-rate" type="range" min="0.5" max="2" step="0.05" value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-300" />
                                        <span className="text-xs text-slate-400">Fast</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4 px-4 items-center">
                                <div>
                                    <label className="block text-center text-sm font-medium text-slate-300 mb-2">Lyric Animation</label>
                                    <div className="flex justify-center items-center gap-2 bg-slate-700/50 p-1 rounded-full w-full">
                                        <button onClick={() => setAnimationStyle('highlight')} className={`px-4 py-1 w-full rounded-full text-sm font-semibold transition ${animationStyle === 'highlight' ? 'bg-yellow-400 text-slate-900' : 'hover:bg-slate-600'}`}>Highlight</button>
                                        <button onClick={() => setAnimationStyle('pop')} className={`px-4 py-1 w-full rounded-full text-sm font-semibold transition ${animationStyle === 'pop' ? 'bg-cyan-400 text-slate-900' : 'hover:bg-slate-600'}`}>Pop</button>
                                        <button onClick={() => setAnimationStyle('glow')} className={`px-4 py-1 w-full rounded-full text-sm font-semibold transition ${animationStyle === 'glow' ? 'bg-fuchsia-400 text-slate-900' : 'hover:bg-slate-600'}`}>Glow</button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <label htmlFor="marquee-toggle" className="block text-sm font-medium text-slate-300 mb-2">Marquee Mode</label>
                                    <button
                                        id="marquee-toggle"
                                        onClick={() => setIsMarqueeMode(!isMarqueeMode)}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isMarqueeMode ? 'bg-pink-600' : 'bg-slate-600'}`}
                                    >
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isMarqueeMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-4 sm:px-0">
                                <audio ref={audioRef} controls src={audioUrl} className="flex-grow w-full rounded-full shadow-lg" />
                                <button onClick={handleToggleRecording} className={`p-2 rounded-full transition ${isRecording ? 'bg-red-500/80 animate-pulse' : 'bg-slate-700/70 hover:bg-slate-600/70'}`} aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}>
                                    {isRecording ? <StopIcon className="w-6 h-6" /> : <RecordIcon className="w-6 h-6" />}
                                </button>
                                <button onClick={handleToggleFullscreen} className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/70 transition" aria-label="Toggle Fullscreen">
                                    {isFullscreen ? <ExitFullscreenIcon className="w-6 h-6" /> : <EnterFullscreenIcon className="w-6 h-6" />}
                                </button>
                            </div>
                            {recordedVideoUrl && (
                                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <h3 className="text-lg font-semibold text-center mb-3">Your Performance Video</h3>
                                    <div>
                                        <video controls src={recordedVideoUrl} className="w-full rounded-lg shadow-inner mb-4" />
                                        <a 
                                            href={recordedVideoUrl} 
                                            download={`karaoke-performance-${new Date().toISOString()}.webm`} 
                                            className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition text-white font-bold text-lg" 
                                            aria-label="Download Performance Video"
                                        >
                                            <DownloadIcon className="w-6 h-6" />
                                            <span>Download Video</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KaraokeScreen;