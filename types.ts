export type Screen = 'setup' | 'karaoke';
export type BackgroundType = 'image' | 'video';

export interface Background {
    type: BackgroundType;
    url: string;
}
