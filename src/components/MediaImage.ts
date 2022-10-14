import {h, RenderableProps, useRef, useLayoutEffect, useState} from 'lib/preact';
import {ns} from 'lib/utils';
import {useElementSize} from 'lib/hooks';
import {useSettings} from 'settings';
import {ErrorBox} from 'components/ErrorBox';
import {Spinner} from 'components/Spinner';

const {min, max, round} = Math;

interface MediaImageProps {
	url: string;
	expand?: boolean;
	upscaleThreshold?: number;
	upscaleLimit?: number;
	onExpandChange?: (value: boolean) => void;
}

interface PointerInit {
	readonly time: number;
	readonly x: number;
	readonly y: number;
	click: boolean;
}

export function MediaImage({
	url,
	expand = false,
	upscaleThreshold = 0,
	upscaleLimit = 2,
	onExpandChange,
}: RenderableProps<MediaImageProps>) {
	const containerRef = useRef<HTMLElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	const [zoomPan, setZoomPan] = useState(false);
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

		if (!expand || isLoading || !image || !containerWidth || !containerHeight) return;

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
	}, [isLoading, url, expand, upscaleThreshold, upscaleLimit, containerWidth, containerHeight]);

	// Zoom and panning
	useLayoutEffect(() => {
		const container = containerRef.current;
		const image = imageRef.current;

		if (!image || !container) return;

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button !== 0) return;

			if (!expand) {
				onExpandChange?.(true);
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			let pointerInit: PointerInit | null = null;
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
				if (pointerInit?.click && Math.hypot(event.x - pointerInit.x, event.y - pointerInit.y) > 5) {
					pointerInit.click = false;
				}
				panTo(event);
			};

			const panTo = ({x, y}: {x: number, y: number}) => {
				const dragFactorX = dragWidth > 0 ? -((x - cursorAnchorX) / dragWidth) : 0;
				const dragFactorY = dragHeight > 0 ? -((y - cursorAnchorY) / dragHeight) : 0;
				applyPosition(dragFactorX * translateWidth, dragFactorY * translateHeight);
			};

			const handleMouseUp = () => {
				if (!pointerInit) return;

				// Terminate zoom
				image.style.cssText = '';
				window.removeEventListener('mouseup', handleMouseUp);
				window.removeEventListener('mousemove', handleMouseMove);

				setZoomPan(false);
				if (pointerInit?.click) onExpandChange?.(!expand);
			};

			pointerInit = {time: Date.now(), x: event.x, y: event.y, click: true};
			const _pointerInit: PointerInit = pointerInit;
			setTimeout(() => (_pointerInit.click = false), 160);
			window.addEventListener('mouseup', handleMouseUp);
			window.addEventListener('mousemove', handleMouseMove);
			setZoomPan(true);
			panTo(pointerInit);
		};

		container.addEventListener('mousedown', handleMouseDown);

		return () => {
			container.removeEventListener('mousedown', handleMouseDown);
		};
	}, [expand]);

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
