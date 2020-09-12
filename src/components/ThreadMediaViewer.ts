import {h, FunctionComponent, RenderableProps, useState, useEffect, useRef} from 'lib/preact';
import {isOfType, ns, clamp} from 'lib/utils';
import {useKey, useForceUpdate, useWindowDimensions, useGesture} from 'lib/hooks';
import {Settings, SettingsProvider} from 'settings';
import {MediaWatcher} from 'lib/mediaWatcher';
import {SyncedStorage} from 'lib/syncedStorage';
import {SideView} from 'components/SideView';
import {Settings as SettingsComponent} from 'components/Settings';
import {Help} from 'components/Help';
import {Changelog} from 'components/Changelog';
import {MediaList} from 'components/MediaList';
import {MediaView} from 'components/MediaView';

const {round} = Math;

interface ThreadMediaViewerProps {
	settings: SyncedStorage<Settings>;
	watcher: MediaWatcher;
}

export function ThreadMediaViewer({settings, watcher}: RenderableProps<ThreadMediaViewerProps>) {
	const containerRef = useRef<HTMLElement>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [sideView, setSideView] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [windowWidth] = useWindowDimensions();
	const forceUpdate = useForceUpdate();

	// Listen on media changes
	useEffect(() => {
		return watcher.subscribe(forceUpdate);
	}, [watcher]);

	// Listen on settings changes
	useEffect(() => {
		return settings._subscribe(forceUpdate);
	}, [settings]);

	// CSS variables
	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			// Media list width, set as a px unit
			const cappedListWidth = clamp(300, settings.mediaListWidth, window.innerWidth - 300);
			container.style.setProperty('--media-list-width', `${cappedListWidth}px`);

			// Calculate an item height to achieve 5:4 item size ratio. CSS sux.
			const itemHeight = round((cappedListWidth / settings.mediaListItemsPerRow) * 0.8);
			container.style.setProperty('--media-list-item-height', `${itemHeight}px`);

			// Media list height, set as rounded vh unit
			const cappedListHeight = clamp(
				200 / window.innerHeight,
				settings.mediaListHeight,
				1 - 200 / window.innerHeight
			);
			container.style.setProperty('--media-list-height', `${cappedListHeight * 100}vh`);

			// Items per row
			container.style.setProperty('--media-list-items-per-row', `${settings.mediaListItemsPerRow}`);
		}
	}, [windowWidth, settings.mediaListWidth, settings.mediaListHeight, settings.mediaListItemsPerRow]);

	// Intercept clicks to media files and open them in MediaBrowser
	useEffect(() => {
		function handleClick(event: MouseEvent) {
			const target = event.target;
			if (!isOfType<HTMLElement>(target, !!target && 'closest' in target)) return;

			const url = target?.closest('a')?.href;

			if (url && watcher.mediaByURL.has(url)) {
				const mediaIndex = watcher.media.findIndex((media) => media.url === url);
				if (mediaIndex != null) {
					event.stopPropagation();
					event.preventDefault();
					setActiveIndex(mediaIndex);
					if (event.shiftKey) setIsOpen(true);
				}
			}
		}

		watcher.container.addEventListener('click', handleClick);

		return () => {
			watcher.container.removeEventListener('click', handleClick);
		};
	}, []);

	const closeSideView = () => setSideView(null);

	function toggleList() {
		setIsOpen((isOpen) => {
			setSideView(null);
			return !isOpen;
		});
	}

	function onOpenSideView(newView: string) {
		setSideView((view: string | null) => (view === newView ? null : newView));
	}

	// Shortcuts
	useKey(settings.keyToggleUI, toggleList);
	useKey(settings.keyViewClose, () => setActiveIndex(null));

	// Mouse gestures
	useGesture('up', toggleList);
	useGesture('down', () => setActiveIndex(null));

	let SideViewContent: FunctionComponent | undefined;
	if (sideView === 'help') SideViewContent = Help;
	if (sideView === 'settings') SideViewContent = SettingsComponent;
	if (sideView === 'changelog') SideViewContent = Changelog;

	return h(
		SettingsProvider,
		{value: settings},
		h('div', {class: `${ns('ThreadMediaViewer')} ${isOpen ? ns('-is-open') : ''}`, ref: containerRef}, [
			isOpen &&
				h(MediaList, {
					media: watcher.media,
					activeIndex,
					sideView,
					onActivation: setActiveIndex,
					onOpenSideView,
				}),
			SideViewContent != null && h(SideView, {key: sideView, onClose: closeSideView}, h(SideViewContent, null)),
			activeIndex != null && watcher.media[activeIndex] && h(MediaView, {media: watcher.media[activeIndex]}),
		])
	);
}

ThreadMediaViewer.styles = `
.${ns('ThreadMediaViewer')} {
	--media-list-width: 640px;
	--media-list-height: 50vh;
	--media-list-items-per-row: 3;
	--media-list-item-height: 160px;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 0;
}
`;
