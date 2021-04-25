import {h, FunctionComponent, RenderableProps, useState, useEffect, useRef} from 'lib/preact';
import {ns, getBoundingDocumentRect, scrollToView, isOfType} from 'lib/utils';
import {useKey, useForceUpdate, useItemsPerRow, useWindowDimensions, useGesture} from 'lib/hooks';
import {Settings, SettingsProvider} from 'settings';
import {CatalogWatcher, ThreadLink} from 'lib/catalogWatcher';
import {SyncedSettings} from 'lib/syncedSettings';
import {SideView} from 'components/SideView';
import {Settings as SettingsComponent} from 'components/Settings';
import {Help} from 'components/Help';
import {Changelog} from 'components/Changelog';
import {SideNav} from 'components/SideNav';

const {min, max, sqrt, pow} = Math;
const get2DDistance = (ax: number, ay: number, bx: number, by: number) => sqrt(pow(ax - bx, 2) + pow(ay - by, 2));

interface CatalogNavigatorProps {
	settings: SyncedSettings<Settings>;
	watcher: CatalogWatcher;
}

export function CatalogNavigator({settings, watcher}: RenderableProps<CatalogNavigatorProps>) {
	const catalogContainerRef = useRef<HTMLElement>(watcher.container);
	const itemsPerRow = useItemsPerRow(catalogContainerRef);
	const cursorRef = useRef<HTMLElement>(null);
	const [sideView, setSideView] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const forceUpdate = useForceUpdate();
	const [windowWidth, windowHeight] = useWindowDimensions();
	const selectedThread =
		selectedIndex != null ? (watcher.threads[selectedIndex] as ThreadLink | undefined) : undefined;
	const enabled = settings.catalogNavigator;

	// Listen on catalog changes
	useEffect(() => watcher.subscribe(forceUpdate), [watcher]);

	// Listen on settings changes
	useEffect(() => settings._subscribe(forceUpdate), [settings]);

	// Handle thread pre-selection on load and enable
	useEffect(() => {
		// Deselect when disabling
		if (selectedThread && !enabled) {
			setSelectedIndex(null);
			return;
		}

		// On load, select thread closest to the center of the screen
		if (enabled && !selectedThread && watcher.threads.length > 0) {
			const centerX = window.innerWidth / 2;
			const centerY = window.innerHeight / 2;
			let closest: {distance: number; index: number | null} = {distance: Infinity, index: null};

			for (let i = 0; i < watcher.threads.length; i++) {
				const rect = watcher.threads[i].container.getBoundingClientRect();
				const distance = get2DDistance(
					rect.left + rect.width / 2,
					rect.top + rect.height / 2,
					centerX,
					centerY
				);
				if (distance < closest.distance) {
					closest.distance = distance;
					closest.index = i;
				}
			}

			if (closest.index != null) setSelectedIndex(closest.index);
		}
	}, [selectedThread, watcher.threads, enabled]);

	// Update cursor position
	useEffect(() => {
		const cursor = cursorRef.current;

		if (!cursor || !selectedThread || !enabled) return;

		const rect = getBoundingDocumentRect(selectedThread.container);
		Object.assign(cursor.style, {
			left: `${rect.left - 4}px`,
			top: `${rect.top - 4}px`,
			width: `${rect.width + 8}px`,
			height: `${rect.height + 8}px`,
		});
	}, [selectedThread, watcher.threads, windowWidth, itemsPerRow, enabled]);

	// Select thread if user clicks on it (enables clicking on title/description to move cursor on that thread)
	useEffect(() => {
		function handleCLick(event: MouseEvent) {
			const target = event.target;

			if (!isOfType<HTMLElement>(target, !!target && 'closest' in target)) return;

			const threadContainer = target.closest<HTMLElement>(`${watcher.serializer.selector} > *`);

			if (threadContainer) {
				const index = watcher.threads.findIndex((thread) => thread.container === threadContainer);
				if (index != null) setSelectedIndex(index);
			}
		}

		watcher.container.addEventListener('click', handleCLick);
		return () => watcher.container.removeEventListener('click', handleCLick);
	}, [watcher.container]);

	// Helpers
	const navToIndex = (index: number) => {
		const clampedIndex = max(0, min(watcher.threads.length - 1, index));
		const selectedThreadContainer = watcher.threads[clampedIndex].container;
		if (selectedThreadContainer) {
			setSelectedIndex(clampedIndex);
			scrollToView(selectedThreadContainer, {block: window.innerHeight / 2 - 200, behavior: 'smooth'});
		}
	};
	const navBy = (amount: number) => selectedIndex != null && navToIndex(selectedIndex + amount);
	const toggleSettings = () => setSideView(sideView ? null : 'settings');

	// Shortcuts
	useKey(settings.keyToggleUI, toggleSettings);
	useKey(enabled && settings.keyNavLeft, () => navBy(-1));
	useKey(enabled && settings.keyNavRight, () => navBy(+1));
	useKey(enabled && settings.keyNavUp, () => navBy(-itemsPerRow));
	useKey(enabled && settings.keyNavDown, () => navBy(+itemsPerRow));
	useKey(enabled && settings.keyNavPageBack, () => navBy(-itemsPerRow * 3));
	useKey(enabled && settings.keyNavPageForward, () => navBy(+itemsPerRow * 3));
	useKey(enabled && settings.keyNavStart, () => navToIndex(0));
	useKey(enabled && settings.keyNavEnd, () => navToIndex(Infinity));
	useKey(enabled && settings.keyCatalogOpenThread, () => selectedThread && (location.href = selectedThread.url));
	useKey(enabled && settings.keyCatalogOpenThreadInNewTab, () => {
		if (selectedThread) GM_openInTab(selectedThread.url, {active: true});
	});
	useKey(
		settings.keyCatalogOpenThreadInBackgroundTab,
		() => selectedThread && GM_openInTab(selectedThread.url, {active: false})
	);

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
				h(SideNav, {active: sideView, onActive: setSideView}),
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
