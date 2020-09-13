import {h, FunctionComponent, RenderableProps, useState, useEffect, useRef} from 'lib/preact';
import {ns, getBoundingDocumentRect, scrollToView} from 'lib/utils';
import {useKey, useForceUpdate, useItemsPerRow, useWindowDimensions, useGesture} from 'lib/hooks';
import {Settings, SettingsProvider} from 'settings';
import {CatalogWatcher, ThreadLink} from 'lib/catalogWatcher';
import {SyncedStorage} from 'lib/syncedStorage';
import {SideView} from 'components/SideView';
import {Settings as SettingsComponent} from 'components/Settings';
import {Help} from 'components/Help';
import {Changelog} from 'components/Changelog';
import {SideNav} from 'components/SideNav';

const {min, max, round} = Math;

interface CatalogNavigatorProps {
	settings: SyncedStorage<Settings>;
	watcher: CatalogWatcher;
}

export function CatalogNavigator({settings, watcher}: RenderableProps<CatalogNavigatorProps>) {
	const catalogContainerRef = useRef<HTMLElement>(watcher.container);
	const itemsPerRow = useItemsPerRow(catalogContainerRef);
	const cursorRef = useRef<HTMLElement>(null);
	const [sideView, setSideView] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const forceUpdate = useForceUpdate();
	const [windowWidth, windowHeight] = useWindowDimensions();
	const selectedThread = watcher.threads[selectedIndex] as ThreadLink | undefined;
	const enabled = settings.catalogNavigator;

	// Listen on catalog changes
	useEffect(() => watcher.subscribe(forceUpdate), [watcher]);

	// Listen on settings changes
	useEffect(() => settings._subscribe(forceUpdate), [settings]);

	// Update cursor position
	useEffect(() => {
		const cursor = cursorRef.current;
		const container = watcher.container;
		if (!cursor || !selectedThread || !enabled) return;

		const rect = getBoundingDocumentRect(selectedThread.container);
		Object.assign(cursor.style, {
			left: `${rect.left - 4}px`,
			top: `${rect.top - 4}px`,
			width: `${rect.width + 8}px`,
			height: `${rect.height + 8}px`,
		});
		scrollToView(selectedThread.container, {block: window.innerHeight / 2 - 200, behavior: 'smooth'});
	}, [selectedThread, windowWidth, itemsPerRow, enabled]);

	// Helpers
	const clampIndex = (index: number) => setSelectedIndex(max(0, min(watcher.threads.length - 1, index)));
	const toggleSettings = () => setSideView(sideView ? null : 'settings');

	// Shortcuts
	useKey(settings.keyToggleUI, toggleSettings);
	useKey(enabled && settings.keyNavLeft, () => clampIndex(selectedIndex - 1));
	useKey(enabled && settings.keyNavRight, () => clampIndex(selectedIndex + 1));
	useKey(enabled && settings.keyNavUp, () => clampIndex(selectedIndex - itemsPerRow));
	useKey(enabled && settings.keyNavDown, () => clampIndex(selectedIndex + itemsPerRow));
	useKey(enabled && settings.keyNavPageBack, () => clampIndex(selectedIndex - itemsPerRow * 3));
	useKey(enabled && settings.keyNavPageForward, () => clampIndex(selectedIndex + itemsPerRow * 3));
	useKey(enabled && settings.keyNavStart, () => clampIndex(0));
	useKey(enabled && settings.keyNavEnd, () => clampIndex(Infinity));
	useKey(enabled && settings.keyCatalogOpenThread, () => selectedThread && (location.href = selectedThread.url));
	useKey(enabled && settings.keyCatalogOpenThreadInNewTab, () => {
		if (selectedThread) GM_openInTab(selectedThread.url, {active: true});
	});
	useKey(settings.keyCatalogOpenThreadInBackgroundTab, () => selectedThread && GM_openInTab(selectedThread.url));

	// Mouse gestures
	useGesture('up', toggleSettings);

	let SideViewContent: FunctionComponent | undefined;
	if (sideView === 'help') SideViewContent = Help;
	if (sideView === 'settings') SideViewContent = SettingsComponent;
	if (sideView === 'changelog') SideViewContent = Changelog;

	let classNames = ns('CatalogNavigator');
	if (sideView) classNames += ` ${ns('-is-open')}`;

	return h(SettingsProvider, {value: settings}, [
		enabled && selectedThread && h('div', {class: ns('CatalogCursor'), ref: cursorRef}),
		SideViewContent &&
			h('div', {class: classNames}, [
				h(SideView, {key: sideView, onClose: () => setSideView(null)}, h(SideViewContent, null)),
				h(SideNav, {active: sideView, onActive: setSideView})
			]),
	]);
}

CatalogNavigator.styles = `
.${ns('CatalogCursor')} {
	position: absolute;
	border: 2px dashed #fff8;
	border-radius: 2px;
	transition: all 66ms cubic-bezier(0.25, 1, 0.5, 1);
	pointer-events: none;
}
.${ns('CatalogCursor')}:before {
	content: '';
	display: block;
	width: 100%;
	height: 100%;
	border: 2px dashed #0006;
	border-radius: 2;
}
.${ns('CatalogNavigator')} {
	--media-list-width: 640px;
	--media-list-height: 50vh;
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 0;
}
.${ns('CatalogNavigator')} > .${ns('SideNav')} {
	position: fixed;
	left: 2px;
	bottom: calc(var(--media-list-height) - 0.2em);
	padding: 2px;
	border-radius: 3px;
	background: #161616;
}

`;
