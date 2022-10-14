import {createContext, useState, useContext, useEffect} from 'lib/preact';
import {SyncedSettings} from 'lib/syncedSettings';

export type Settings = {
	lastAcknowledgedVersion: string;

	mediaListWidth: number;
	mediaListHeight: number;
	mediaListItemsPerRow: number;
	thumbnailFit: 'contain' | 'cover',

	// Video player
	volume: number, // 0-1
	fastForwardActivation: 'hold' | 'toggle',
	fastForwardRate: number,
	adjustVolumeBy: number, // 0-1
	adjustSpeedBy: number, // 0-1
	seekBy: number, // seconds
	tinySeekBy: number, // seconds 0-1
	endTimeFormat: 'total' | 'remaining',

	// Full page mode
	fpmVideoUpscaleThreshold: number,
	fpmVideoUpscaleLimit: number,
	fpmImageUpscaleThreshold: number,
	fpmImageUpscaleLimit: number,

	// Other
	catalogNavigator: boolean,
	holdTimeThreshold: number,

	// Global navigation shortcuts (catalog & media list)
	keyToggleUI: string | null,
	keyNavLeft: string | null,
	keyNavRight: string | null,
	keyNavUp: string | null,
	keyNavDown: string | null,
	keyNavPageBack: string | null,
	keyNavPageForward: string | null,
	keyNavStart: string | null,
	keyNavEnd: string | null,

	// Media list shortcuts
	keyListViewToggle: string | null,
	keyListViewLeft: string | null,
	keyListViewRight: string | null,
	keyListViewUp: string | null,
	keyListViewDown: string | null,

	// Media view shortcuts
	keyViewClose: string | null,
	keyViewFullPage: string | null,
	keyViewPause: string | null,
	keyViewFastForward: string | null,
	keyViewVolumeDown: string | null,
	keyViewVolumeUp: string | null,
	keyViewSpeedDown: string | null,
	keyViewSpeedUp: string | null,
	keyViewSpeedReset: string | null,
	keyViewSeekBack: string | null,
	keyViewSeekForward: string | null,
	keyViewTinySeekBack: string | null,
	keyViewTinySeekForward: string | null,
	keyViewSeekTo0: string | null,
	keyViewSeekTo10: string | null,
	keyViewSeekTo20: string | null,
	keyViewSeekTo30: string | null,
	keyViewSeekTo40: string | null,
	keyViewSeekTo50: string | null,
	keyViewSeekTo60: string | null,
	keyViewSeekTo70: string | null,
	keyViewSeekTo80: string | null,
	keyViewSeekTo90: string | null,

	// Catalog shortcuts
	keyCatalogOpenThread: string;
	keyCatalogOpenThreadInNewTab: string;
	keyCatalogOpenThreadInBackgroundTab: string;
}

export const defaultSettings: Settings = {
	lastAcknowledgedVersion: '2.7.0',

	mediaListWidth: 640,
	mediaListHeight: 0.5,
	mediaListItemsPerRow: 3,
	thumbnailFit: 'contain',

	// Video Player
	volume: 0.5,
	fastForwardActivation: 'hold',
	fastForwardRate: 5,
	adjustVolumeBy: 0.125,
	adjustSpeedBy: 0.5,
	seekBy: 5,
	tinySeekBy: 0.033,
	endTimeFormat: 'total',

	// Full page mode
	fpmVideoUpscaleThreshold: 0.5,
	fpmVideoUpscaleLimit: 2,
	fpmImageUpscaleThreshold: 0,
	fpmImageUpscaleLimit: 2,

	// Catalog navigator
	catalogNavigator: true,
	holdTimeThreshold: 200,

	// Global navigation shortcuts (catalog & media list)
	keyToggleUI: '`',
	keyNavLeft: 'a',
	keyNavRight: 'd',
	keyNavUp: 'w',
	keyNavDown: 's',
	keyNavPageBack: 'PageUp',
	keyNavPageForward: 'PageDown',
	keyNavStart: 'Home',
	keyNavEnd: 'End',

	// Media list shortcuts
	keyListViewToggle: 'f',
	keyListViewLeft: 'A',
	keyListViewRight: 'D',
	keyListViewUp: 'W',
	keyListViewDown: 'S',

	// Media view shortcuts
	keyViewClose: 'F',
	keyViewFullPage: 'Tab',
	keyViewPause: 'Space',
	keyViewFastForward: 'Shift+Space',
	keyViewVolumeDown: 'Q',
	keyViewVolumeUp: 'E',
	keyViewSpeedDown: 'Alt+q',
	keyViewSpeedUp: 'Alt+e',
	keyViewSpeedReset: 'Alt+w',
	keyViewSeekBack: 'q',
	keyViewSeekForward: 'e',
	keyViewTinySeekBack: 'Alt+a',
	keyViewTinySeekForward: 'Alt+d',
	keyViewSeekTo0: '0',
	keyViewSeekTo10: '1',
	keyViewSeekTo20: '2',
	keyViewSeekTo30: '3',
	keyViewSeekTo40: '4',
	keyViewSeekTo50: '5',
	keyViewSeekTo60: '6',
	keyViewSeekTo70: '7',
	keyViewSeekTo80: '8',
	keyViewSeekTo90: '9',

	// Catalog shortcuts
	keyCatalogOpenThread: 'f',
	keyCatalogOpenThreadInNewTab: 'Ctrl+F',
	keyCatalogOpenThreadInBackgroundTab: 'F'
};

const SettingsContext = createContext<SyncedSettings<Settings> | null>(null);

/**
 * Updates settings when they change
 */
export function useSettings(): SyncedSettings<Settings> {
	const syncedSettings = useContext(SettingsContext);
	if (!syncedSettings) throw new Error();
	const [_, update] = useState(NaN);

	useEffect(() => {
		return syncedSettings._subscribe(() => update(NaN));
	}, []);

	return syncedSettings;
}

export const SettingsProvider = SettingsContext.Provider;
