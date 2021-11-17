import {h, RenderableProps, useRef, useLayoutEffect, useState} from 'lib/preact';
import {ns} from 'lib/utils';
import {useElementSize} from 'lib/hooks';
import {ErrorBox} from 'components/ErrorBox';
import {Spinner} from 'components/Spinner';

interface MediaImageProps {
	url: string;
	upscale?: boolean;
	upscaleThreshold?: number;
	upscaleLimit?: number;
}

interface ZoomPan {
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

		const zoomMargin = 10;
		const previewRect = image.getBoundingClientRect();
		const zoomFactor = image.naturalWidth / previewRect.width;
		const cursorAnchorX = previewRect.left + previewRect.width / 2;
		const cursorAnchorY = previewRect.top + previewRect.height / 2;

		const availableWidth = container.clientWidth;
		const availableHeight = container.clientHeight;

		const dragWidth = max((previewRect.width - availableWidth / zoomFactor) / 2, 0);
		const dragHeight = max((previewRect.height - availableHeight / zoomFactor) / 2, 0);

		const translateWidth = max((image.naturalWidth - availableWidth) / 2, 0);
		const translateHeight = max((image.naturalHeight - availableHeight) / 2, 0);

		Object.assign(image.style, {
			maxWidth: 'none',
			maxHeight: 'none',
			width: 'auto',
			height: 'auto',
			position: 'fixed',
			top: '50%',
			left: '50%',
		});

		const panTo = (x: number, y: number) => {
			const dragFactorX = dragWidth > 0 ? -((x - cursorAnchorX) / dragWidth) : 0;
			const dragFactorY = dragHeight > 0 ? -((y - cursorAnchorY) / dragHeight) : 0;
			const left = round(
				min(max(dragFactorX * translateWidth, -translateWidth - zoomMargin), translateWidth + zoomMargin)
			);
			const top = round(
				min(max(dragFactorY * translateHeight, -translateHeight - zoomMargin), translateHeight + zoomMargin)
			);
			image.style.transform = `translate(-50%, -50%) translate(${left}px, ${top}px)`;
		};

		const handleMouseMove = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			panTo(event.clientX, event.clientY);
		};

		const handleMouseUp = () => {
			image.style.cssText = '';
			document.body.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('mousemove', handleMouseMove);
			setZoomPan(false);
		};

		panTo(zoomPan.initialX, zoomPan.initialY);

		window.addEventListener('mousemove', handleMouseMove);
		document.body.addEventListener('mouseup', handleMouseUp);
	}, [zoomPan]);

	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		event.preventDefault();
		setZoomPan({initialX: event.clientX, initialY: event.clientY});
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
