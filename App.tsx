import React, { useState, useEffect } from 'react';
import type { Screen, Background } from './types';
import SetupScreen from './components/SetupScreen';
import KaraokeScreen from './components/KaraokeScreen';

const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('setup');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [lyrics, setLyrics] = useState<string>('');
    const [songTitle, setSongTitle] = useState<string>('');
    const [songArtist, setSongArtist] = useState<string>('');
    const [background, setBackground] = useState<Background>({ 
        type: 'image', 
        url: 'https://i.imgur.com/8QZJ3Hj.jpeg' 
    }); // Default background set to the user's image

    useEffect(() => {
        if (!audioFile) {
            setAudioUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(audioFile);
        setAudioUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [audioFile]);

    const handleStartKaraoke = () => {
        if (audioUrl && lyrics) {
            setScreen('karaoke');
        } else {
            alert("Please upload an audio file and provide lyrics before starting.");
        }
    };

    const handleGoBack = () => {
        setScreen('setup');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {screen === 'setup' && (
                <SetupScreen
                    setAudioFile={setAudioFile}
                    lyrics={lyrics}
                    setLyrics={setLyrics}
                    songTitle={songTitle}
                    setSongTitle={setSongTitle}
                    songArtist={songArtist}
                    setSongArtist={setSongArtist}
                    onStartKaraoke={handleStartKaraoke}
                />
            )}
            {screen === 'karaoke' && audioUrl && (
                <KaraokeScreen
                    audioUrl={audioUrl}
                    lyrics={lyrics}
                    background={background}
                    setBackground={setBackground}
                    onGoBack={handleGoBack}
                />
            )}
        </div>
    );
};

export default App;