import {h, RenderableProps, useRef, useEffect, useState, StateUpdater} from 'lib/preact';
import {ns, isOfType, clamp, scrollToView, getBoundingDocumentRect} from 'lib/utils';
import {useKey} from 'lib/hooks';
import {Media} from 'lib/mediaWatcher';
import {useSettings} from 'settings';

interface MediaListProps {
	media: Media[];
	activeIndex: number | null;
	sideView: string | null;
	onActivation: StateUpdater<number | null>;
	onOpenSideView: (view: string) => void;
}

const {max, min, round} = Math;

export function MediaList({media, activeIndex, sideView, onActivation, onOpenSideView}: RenderableProps<MediaListProps>) {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const listRef = useRef<HTMLElement>(null);
	let [selectedIndex, setSelectedIndex] = useState<number | null>(activeIndex);
	const [isDragged, setIsDragged] = useState<boolean>(false);
	const itemsPerRow = settings.mediaListItemsPerRow;

	// If there is no selected item, select the item closest to the center of the screen
	if (selectedIndex == null) {
		const centerOffset = window.innerHeight / 2;
		let lastProximity = Infinity;
		for (let i = 0; i < media.length; i++) {
			const rect = media[i].postContainer.getBoundingClientRect();
			let proximity = Math.abs(centerOffset - rect.top);

			if (rect.top > centerOffset) {
				selectedIndex = lastProximity < proximity ? i - 1 : i;
				break;
			}

			lastProximity = proximity;
		}

		if (selectedIndex == null && media.length > 0) selectedIndex = media.length - 1;
		if (selectedIndex != null && selectedIndex >= 0) setSelectedIndex(selectedIndex);
	}

	function scrollToItem(index: number, behavior: 'smooth' | 'auto' = 'smooth') {
		const targetChild = listRef.current?.children[index];
		if (isOfType<HTMLElement>(targetChild, targetChild != null)) {
			scrollToView(targetChild, {block: 'center', behavior});
		}
	}

	function selectAndScrollTo(index: number) {
		if (media.length > 0 && index >= 0 && index < media.length) {
			setSelectedIndex(index);
			scrollToItem(index);
		}
	}

	function initiateResize(event: MouseEvent) {
		const target = event.target;
		const direction = (target as any)?.dataset.direction as string | undefined;
		// Ignore double clicks and not primary button
		if (event.detail === 2 || event.button !== 0 || !direction) return;

		event.preventDefault();
		event.stopPropagation();

		const initialDocumentCursor = document.documentElement.style.cursor;
		const resizeX = direction === 'ew' || direction === 'nwse';
		const resizeY = direction === 'ns' || direction === 'nwse';
		const initialCursorToRightEdgeDelta = containerRef.current ? event.clientX - containerRef.current.offsetWidth : 0;

		function handleMouseMove(event: MouseEvent) {
			const clampedListWidth = clamp(300, event.clientX - initialCursorToRightEdgeDelta, window.innerWidth - 300);
			if (resizeX) settings.mediaListWidth = clampedListWidth;
			// mediaListHeight is a fraction that gets translated into vh units in App effect
			const clampedListHeight = clamp(
				200 / window.innerHeight,
				event.clientY / window.innerHeight,
				1 - 200 / window.innerHeight
			);
			if (resizeY) settings.mediaListHeight = clampedListHeight;
		}

		function handleMouseUp() {
			// Rounded to increments of 10 to satisfy OCD demons
			settings.mediaListWidth = round(settings.mediaListWidth / 10) * 10;
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('mousemove', handleMouseMove);
			document.documentElement.style.cursor = initialDocumentCursor;
			setIsDragged(false);
		}

		// Set temporary global cursor so it doesn't flash while moving
		document.documentElement.style.cursor = `${direction}-resize`;
		setIsDragged(true);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);
	}

	// If activeIndex changes externally, make sure selectedIndex matches it
	useEffect(() => {
		if (activeIndex != null && activeIndex != selectedIndex) selectAndScrollTo(activeIndex);
	}, [activeIndex]);

	// Scroll to selected item when list opens
	useEffect(() => {
		if (selectedIndex != null) scrollToItem(selectedIndex, 'auto');
	}, []);

	// Scroll the page to the selected item's parent post
	useEffect(() => {
		if (selectedIndex != null && media?.[selectedIndex]?.postContainer && containerRef.current) {
			let offset = getBoundingDocumentRect(containerRef.current).height;
			scrollToView(media[selectedIndex].postContainer, {block: round(offset), behavior: 'smooth'});
		}
	}, [selectedIndex]);

	// Keyboard navigation
	const selectUp = () => selectedIndex != null && selectAndScrollTo(max(selectedIndex - itemsPerRow, 0));
	const selectDown = () => {
		// Scroll the whole page to the bottom when S is pressed when already at the end of the media list.
		// This allows comfy way how to clear new posts notifications.
		if (selectedIndex == media.length - 1) {
			document.scrollingElement?.scrollTo({
				top: document.scrollingElement.scrollHeight,
				behavior: 'smooth',
			});
		}
		if (selectedIndex != null) selectAndScrollTo(min(selectedIndex + itemsPerRow, media.length - 1));
	};
	const selectPrev = () => selectedIndex != null && selectAndScrollTo(max(selectedIndex - 1, 0));
	const selectNext = () => selectedIndex != null && selectAndScrollTo(min(selectedIndex + 1, media.length - 1));
	const selectPageBack = () => selectedIndex != null && selectAndScrollTo(max(selectedIndex - itemsPerRow * 3, 0));
	const selectPageForward = () =>
		selectedIndex != null && selectAndScrollTo(min(selectedIndex + itemsPerRow * 3, media.length));
	const selectFirst = () => selectAndScrollTo(0);
	const selectLast = () => selectAndScrollTo(media.length - 1);
	const selectAndViewPrev = () => {
		if (selectedIndex != null) {
			const prevIndex = max(selectedIndex - 1, 0);
			selectAndScrollTo(prevIndex);
			onActivation(prevIndex);
		}
	};
	const selectAndViewNext = () => {
		if (selectedIndex != null) {
			const nextIndex = min(selectedIndex + 1, media.length - 1);
			selectAndScrollTo(nextIndex);
			onActivation(nextIndex);
		}
	};
	const selectAndViewUp = () => {
		if (selectedIndex != null) {
			const index = max(selectedIndex - itemsPerRow, 0);
			selectAndScrollTo(index);
			onActivation(index);
		}
	};
	const selectAndViewDown = () => {
		if (selectedIndex != null) {
			const index = min(selectedIndex + itemsPerRow, media.length - 1);
			selectAndScrollTo(index);
			onActivation(index);
		}
	};
	const toggleViewSelectedItem = () => onActivation(selectedIndex === activeIndex ? null : selectedIndex);

	useKey(settings.keyNavLeft, selectPrev);
	useKey(settings.keyNavRight, selectNext);
	useKey(settings.keyNavUp, selectUp);
	useKey(settings.keyNavDown, selectDown);
	useKey(settings.keyListViewUp, selectAndViewUp);
	useKey(settings.keyListViewDown, selectAndViewDown);
	useKey(settings.keyListViewLeft, selectAndViewPrev);
	useKey(settings.keyListViewRight, selectAndViewNext);
	useKey(settings.keyListViewToggle, toggleViewSelectedItem);
	useKey(settings.keyNavPageBack, selectPageBack);
	useKey(settings.keyNavPageForward, selectPageForward);
	useKey(settings.keyNavStart, selectFirst);
	useKey(settings.keyNavEnd, selectLast);

	function mediaItem(
		{url, thumbnailUrl, extension, isVideo, isGif, replies, size, width, height}: Media,
		index: number
	) {
		let classNames = '';
		if (selectedIndex === index) classNames += ns('selected');
		if (activeIndex === index) classNames += ` ${ns('active')}`;

		function onClick(event: MouseEvent) {
			event.preventDefault();
			setSelectedIndex(index);
			onActivation(index);
		}

		let metaStr = size;
		if (width && height) {
			const widthAndHeight = `${width}×${height}`;
			metaStr = size ? `${size}, ${widthAndHeight}` : widthAndHeight;
		}

		return h('a', {key: url, href: url, class: classNames, onClick}, [
			h('img', {src: thumbnailUrl}),
			metaStr && h('span', {class: ns('meta')}, metaStr),
			(isVideo || isGif) && h('span', {class: ns('video-type')}, null, extension),
			replies != null &&
				replies > 0 &&
				h('span', {class: ns('replies')}, null, Array(replies).fill(h('span', null))),
		]);
	}

	function sideViewAction(name: string, title: string) {
		return h(
			'button',
			{class: sideView === name && ns('-active'), onClick: () => onOpenSideView(name)},
			title
		);
	}

	return h('div', {class: ns('MediaList'), ref: containerRef}, [
		h('div', {class: ns('list'), ref: listRef}, media.map(mediaItem)),
		h('div', {class: ns('controls')}, [
			h('div', {class: ns('actions')}, [
				sideViewAction('settings', '⚙ settings'),
				sideViewAction('help', '? help'),
				sideViewAction('changelog', '☲ changelog'),
			]),
			h('div', {class: ns('position')}, [
				h('span', {class: ns('current')}, selectedIndex ? selectedIndex + 1 : 0),
				h('span', {class: ns('separator')}, '/'),
				h('span', {class: ns('total')}, media.length),
			]),
		]),
		!isDragged && h('div', {class: ns('dragger-x'), ['data-direction']: 'ew', onMouseDown: initiateResize}),
		!isDragged && h('div', {class: ns('dragger-y'), ['data-direction']: 'ns', onMouseDown: initiateResize}),
		!isDragged && h('div', {class: ns('dragger-xy'), ['data-direction']: 'nwse', onMouseDown: initiateResize}),
	]);
}

MediaList.styles = `
/* Scrollbars in chrome since it doesn't support scrollbar-width */
.${ns('MediaList')} > .${ns('list')}::-webkit-scrollbar {
	width: 10px;
	background-color: transparent;
}
.${ns('MediaList')} > .${ns('list')}::-webkit-scrollbar-track {
	border: 0;
	background-color: transparent;6F6F70
}
.${ns('MediaList')} > .${ns('list')}::-webkit-scrollbar-thumb {
	border: 0;
	background-color: #6f6f70;
}

.${ns('MediaList')} {
	--item-border-size: 1px;
	--item-meta-height: 18px;
	--list-meta-height: 24px;
	--active-color: #fff;
	position: absolute;
	top: 0;
	left: 0;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr var(--list-meta-height);
	width: var(--media-list-width);
	height: var(--media-list-height);
	background: #111;
	box-shadow: 0px 0px 0 3px #0003;
}
.${ns('MediaList')} > .${ns('dragger-x')} {
	position: absolute;
	left: 100%; top: 0;
	width: 12px; height: 100%;
	cursor: ew-resize;
	z-index: 2;
}
.${ns('MediaList')} > .${ns('dragger-y')} {
	position: absolute;
	top: 100%; left: 0;
	width: 100%; height: 12px;
	cursor: ns-resize;
	z-index: 2;
}
.${ns('MediaList')} > .${ns('dragger-xy')} {
	position: absolute;
	bottom: -10px; right: -10px;
	width: 20px; height: 20px;
	cursor: nwse-resize;
	z-index: 2;
}
.${ns('MediaList')} > .${ns('list')} {
	display: grid;
	grid-template-columns: repeat(var(--media-list-items-per-row), 1fr);
	grid-auto-rows: var(--media-list-item-height);
	overflow-y: scroll;
	overflow-x: hidden;
	scrollbar-width: thin;
}
.${ns('MediaList')} > .${ns('list')} > a {
	position: relative;
	display: block;
	background: none;
	border: var(--item-border-size) solid transparent;
	padding: 0;
	background-color: #222;
	background-clip: padding-box;
	outline: none;
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('selected')} {
	border-color: var(--active-color);
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('active')} {
	background-color: var(--active-color);
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('selected')}:after {
	content: '';
	display: block;
	position: absolute;
	top: 0; left: 0;
	width: 100%;
	height: 100%;
	border: 1px solid #2225;
	pointer-events: none;
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('active')}.${ns('selected')}:after { border-color: #222a; }
.${ns('MediaList')} > .${ns('list')} > a > img {
	display: block;
	width: 100%;
	height: calc(var(--media-list-item-height) - var(--item-meta-height) - (var(--item-border-size) * 2));
	background-clip: padding-box;
	object-fit: contain;
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('active')} > img {
	border: 1px solid transparent;
	border-bottom: 0;
}
.${ns('MediaList')} > .${ns('list')} > a > .${ns('meta')} {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: var(--item-meta-height);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: calc(var(--item-meta-height) * 0.71);
	line-height: 1;
	background: #0003;
	text-shadow: 1px 1px #0003, -1px -1px #0003, 1px -1px #0003, -1px 1px #0003,
		0px 1px #0003, 0px -1px #0003, 1px 0px #0003, -1px 0px #0003;
	white-space: nowrap;
	overflow: hidden;
	pointer-events: none;
}
.${ns('MediaList')} > .${ns('list')} > a.${ns('active')} > .${ns('meta')} {
	color: #222;
	text-shadow: none;
	background: #0001;
}
.${ns('MediaList')} > .${ns('list')} > a > .${ns('video-type')} {
	display: block;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: .5em .5em;
	font-size: 12px !important;
	text-transform: uppercase;
	font-weight: bold;
	line-height: 1;
	color: #222;
	background: #eeeeee88;
	border-radius: 2px;
	border: 1px solid #0000002e;
	background-clip: padding-box;
	pointer-events: none;
}
.${ns('MediaList')} > .${ns('list')} > a > .${ns('replies')} {
	display: block;
	position: absolute;
	bottom: calc(var(--item-meta-height) + 2px);
	left: 0;
	width: 100%;
	display: flex;
	justify-content: center;
	flex-wrap: wrap-reverse;
}
.${ns('MediaList')} > .${ns('list')} > a > .${ns('replies')} > span {
	display: block;
	width: 6px;
	height: 6px;
	margin: 1px;
	background: var(--active-color);
	background-clip: padding-box;
	border: 1px solid #0008;
}
.${ns('MediaList')} > .${ns('controls')} {
	display: grid;
	grid-template-columns: 1fr auto;
	grid-template-rows: 1fr;
	margin: 0 2px;
	font-size: calc(var(--list-meta-height) * 0.64);
}
.${ns('MediaList')} > .${ns('controls')} > * {
	display: flex;
	align-items: center;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} { min-width: 0; }
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} > button,
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} > button:active {
	color: #eee;
	background: #1c1c1c;
	border: 0;
	outline: 0;
	border-radius: 2px;
	font-size: .911em;
	line-height: 1;
	height: 20px;
	padding: 0 .5em;
	white-space: nowrap;
	overflow: hidden;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} > button:hover {
	color: #fff;
	background: #333;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} > button + button {
	margin-left: 2px;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('actions')} > button.${ns('-active')} {
	color: #222;
	background: #ccc;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('position')} {
	margin: 0 .4em;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('position')} > .${ns('current')} {
	font-weight: bold;
}
.${ns('MediaList')} > .${ns('controls')} > .${ns('position')} > .${ns('separator')} {
	font-size: 1.05em;
	margin: 0 0.15em;
}
`;
