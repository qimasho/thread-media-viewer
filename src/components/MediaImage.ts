import {h, RenderableProps, useRef, useLayoutEffect, useState} from 'lib/preact';
import {ns} from 'lib/utils';
import {useElementSize} from 'lib/hooks';
import {useSettings} from 'settings';
import {ErrorBox} from 'components/ErrorBox';
import {Spinner} from 'components/Spinner';

interface MediaImageProps {
	url: string;
	upscale?: boolean;
	upscaleThreshold?: number;
	upscaleLimit?: number;
}

interface ZoomPan {
	initTime: number;

	initialX: number;
	initialY: number;
}

const {min, max, round} = Math;

export function MediaImage({
	url,
	upscale = false,
	upscaleThreshold = 0,
	upscaleLimit = 2,
}: RenderableProps<MediaImageProps>) {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	const [zoomPan, setZoomPan] = useState<ZoomPan | false>(false);
	const [containerWidth, containerHeight] = useElementSize(containerRef);

	// Initialization
	useLayoutEffect(() => {
		const image = imageRef.current;

		if (error || !image) return;

		let checkId: ReturnType<typeof setTimeout> | null = null;
		const check = () => {
			if (image.naturalWidth > 0) setIsLoading(false);
			else checkId = setTimeout(check, 50);
		};

		setError(null);
		setIsLoading(true);
		check();

		return () => checkId != null && clearTimeout(checkId);
	}, [url, error]);

	// Upscale-ing
	useLayoutEffect(() => {
		const image = imageRef.current;

		if (!upscale || isLoading || !image || !containerWidth || !containerHeight) return;

		const naturalWidth = image.naturalWidth;
		const naturalHeight = image.naturalHeight;
		if (naturalWidth < containerWidth * upscaleThreshold && naturalHeight < containerHeight * upscaleThreshold) {
			const windowAspectRatio = containerWidth / containerHeight;
			const videoAspectRatio = naturalWidth / naturalHeight;
			let newHeight, newWidth;
			if (windowAspectRatio > videoAspectRatio) {
				newHeight = min(naturalHeight * upscaleLimit, containerHeight);
				newWidth = round(naturalWidth * (newHeight / naturalHeight));
			} else {
				newWidth = min(naturalWidth * upscaleLimit, containerWidth);
				newHeight = round(naturalHeight * (newWidth / naturalWidth));
			}
			image.setAttribute('width', `${newWidth}`);
			image.setAttribute('height', `${newHeight}`);
		}

		return () => {
			image.removeAttribute('width');
			image.removeAttribute('height');
		};
	}, [isLoading, url, upscale, upscaleThreshold, upscaleLimit, containerWidth, containerHeight]);

	// Zoom and panning
	useLayoutEffect(() => {
		const container = containerRef.current;
		const image = imageRef.current;

		if (!zoomPan || !image || !container) return;

		let awaitingShortClick = true;
		let isDraggingMode = false;
		let lastDownTime = zoomPan.initTime;
		let lastDownX = zoomPan.initialX;
		let lastDownY = zoomPan.initialY;
		let left = 0;
		let top = 0;

		const previewRect = image.getBoundingClientRect();
		const zoomFactor = image.naturalWidth / previewRect.width;
		const cursorAnchorX = previewRect.left + previewRect.width / 2;
		const cursorAnchorY = previewRect.top + previewRect.height / 2;

		const availableWidth = container.clientWidth;
		const availableHeight = container.clientHeight;

		const dragWidth = max((previewRect.width - availableWidth / zoomFactor) / 2, 0);
		const dragHeight = max((previewRect.height - availableHeight / zoomFactor) / 2, 0);

		const zoomMargin = 10;
		const translateWidth = max((image.naturalWidth - availableWidth) / 2, 0);
		const translateHeight = max((image.naturalHeight - availableHeight) / 2, 0);
		const minLeft = -translateWidth - zoomMargin;
		const maxLeft = translateWidth + zoomMargin;
		const minTop = -translateHeight - zoomMargin;
		const maxTop = translateHeight + zoomMargin;

		Object.assign(image.style, {
			maxWidth: 'none',
			maxHeight: 'none',
			width: 'auto',
			height: 'auto',
			position: 'fixed',
			top: '50%',
			left: '50%',
		});

		const applyPosition = (newLeft: number, newTop: number) => {
			left = round(min(max(newLeft, minLeft), maxLeft));
			top = round(min(max(newTop, minTop), maxTop));
			image.style.transform = `translate(-50%, -50%) translate(${left}px, ${top}px)`;
		};

		const handleMouseMove = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (isDraggingMode) {
				moveBy(event.movementX, event.movementY);
			} else {
				panTo(event.x, event.y);
			}
		};

		const moveBy = (x: number, y: number) => applyPosition(left + x, top + y);

		const panTo = (x: number, y: number) => {
			const dragFactorX = dragWidth > 0 ? -((x - cursorAnchorX) / dragWidth) : 0;
			const dragFactorY = dragHeight > 0 ? -((y - cursorAnchorY) / dragHeight) : 0;
			applyPosition(dragFactorX * translateWidth, dragFactorY * translateHeight);
		};

		const handleMouseUp = (event: MouseEvent) => {
			const pressDistance = Math.hypot(event.x - lastDownX, event.y - lastDownY);
			const isShortClick = Date.now() - lastDownTime < settings.holdTimeThreshold && pressDistance < 20;

			// Switch to dragging mode on short initial click
			if (awaitingShortClick) {
				if (isShortClick) isDraggingMode = true;
				awaitingShortClick = false;
			} else {
				if (isShortClick) isDraggingMode = false;
			}

			// Terminate zoom
			if (!isDraggingMode) {
				image.style.cssText = '';
				window.removeEventListener('mouseup', handleMouseUp);
				window.removeEventListener('mousedown', handleMouseDown);
				setZoomPan(false);
			}

			window.removeEventListener('mousemove', handleMouseMove);
		};

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button !== 0) return;
			event.preventDefault();
			event.stopPropagation();
			lastDownTime = Date.now();
			lastDownX = event.x;
			lastDownY = event.y;
			window.addEventListener('mousemove', handleMouseMove);
		};

		panTo(zoomPan.initialX, zoomPan.initialY);

		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mousedown', handleMouseDown);
	}, [zoomPan]);

	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0 || zoomPan) return;
		event.preventDefault();
		setZoomPan({initTime: Date.now(), initialX: event.clientX, initialY: event.clientY});
	}

	if (error) return h(ErrorBox, {error});

	let classNames = ns('MediaImage');
	if (isLoading) classNames += ` ${ns('-loading')}`;
	if (zoomPan) classNames += ` ${ns('-zoom-pan')}`;

	return h(
		'div',
		{class: classNames, ref: containerRef},
		isLoading && h(Spinner, null),
		h('img', {
			ref: imageRef,
			onMouseDown: handleMouseDown,
			onError: () => setError(new Error('Image failed to load')),
			src: url,
		})
	);
}

MediaImage.styles = `
.${ns('MediaImage')} {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #000d;
}
.${ns('MediaImage')}.${ns('-zoom-pan')} {
	position: fixed;
	top: 0; left: 0;
	width: 100%;
	height: 100%;
	z-index: 1000;
}
.${ns('MediaImage')} > .${ns('Spinner')} {
	position: absolute;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	font-size: 2em;
}
.${ns('MediaImage')} > img {
	display: block;
	max-width: 100%;
	max-height: 100vh;
}
.${ns('MediaImage')}.${ns('-loading')} > img {
	min-width: 200px;
	min-height: 200px;
	opacity: 0;
}
`;
