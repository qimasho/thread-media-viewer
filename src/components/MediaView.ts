import {h, RenderableProps, useRef, useState} from 'lib/preact';
import {ns, isOfType, prevented} from 'lib/utils';
import {useKey} from 'lib/hooks';
import {Media} from 'lib/mediaWatcher';
import {useSettings} from 'settings';
import {MediaImage} from 'components/MediaImage';
import {MediaVideo} from 'components/MediaVideo';

interface MediaViewProps {
	media: Media;
	onClose: () => void;
}

export function MediaView({media: {url, isVideo}, onClose}: RenderableProps<MediaViewProps>) {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

	function toggleFullscreen() {
		if (containerRef.current) {
			if (!document.fullscreenElement) {
				setIsFullScreen(true);
				containerRef.current.requestFullscreen().catch((error) => {
					setIsFullScreen(false);
				});
			} else {
				setIsFullScreen(false);
				document.exitFullscreen();
			}
		}
	}

	function handleDblClick(event: MouseEvent) {
		// Filter out clicks on buttons
		const target = event.target;
		if (!isOfType<HTMLElement>(target, target != null && 'closest' in target)) return;
		if (target.closest('button') != null) return;
		toggleFullscreen();
	}

	useKey(settings.keyViewClose, onClose);
	useKey(settings.keyViewFullScreen, toggleFullscreen);
	useKey(settings.keyViewFullPage, (event) => {
		event.preventDefault();
		if (event.repeat) return;

		if (isExpanded) {
			setIsExpanded(false);
			return;
		}

		const initTime = Date.now();
		setIsExpanded(true);

		window.addEventListener(
			'keyup',
			() => {
				if (Date.now() - initTime > settings.holdTimeThreshold) setIsExpanded(false);
			},
			{once: true}
		);
	});

	let classNames = ns('MediaView');
	if (isExpanded || isFullScreen) classNames += ` ${ns('-expanded')}`;

	return h('div', {class: classNames, ref: containerRef, onDblClick: handleDblClick}, [
		isVideo
			? h(MediaVideo, {
					key: url,
					url,
					upscale: isExpanded || isFullScreen,
					upscaleThreshold: settings.fpmVideoUpscaleThreshold,
					upscaleLimit: settings.fpmVideoUpscaleLimit,
			  })
			: h(MediaImage, {
					key: url,
					url,
					upscale: isExpanded || isFullScreen,
					upscaleThreshold: settings.fpmImageUpscaleThreshold,
					upscaleLimit: settings.fpmImageUpscaleLimit,
			  }),
		h('div', {class: `${ns('controls')} ${ns('-top-right')}`}, [
			h(
				'button',
				{
					onMouseDown: prevented<MouseEvent>(
						(event) => event.button === 0 && setIsExpanded((isExpanded) => !isExpanded)
					),
					class: isExpanded ? ns('active') : undefined,
					title: 'Toggle full page mode',
				},
				'⛶'
			),
			h(
				'button',
				{
					onMouseDown: prevented<MouseEvent>((event) => event.button === 0 && onClose()),
					title: `Close (mouse gesture down, or ${settings.keyViewClose})`,
				},
				'✕'
			),
		]),
	]);
}

MediaView.styles = `
.${ns('MediaView')} {
	position: absolute;
	top: 0; right: 0;
	max-width: calc(100% - var(--media-list-width));
	max-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	align-content: center;
	justify-content: center;
}
.${ns('MediaView')} > * {
	width: 100%;
	height: 100%;
	max-width: 100%;
	max-height: 100vh;
}
.${ns('MediaView')}.${ns('-expanded')} {
	max-width: 100%;
	width: 100vw;
	height: 100vh;
	z-index: 1000;
}
.${ns('MediaView')} > .${ns('ErrorBox')} { min-height: 200px; }
.${ns('MediaView')} .${ns('controls')} {
	display: flex;
	gap: 2px;
	position: absolute;
	width: auto;
	height: auto;
	transition: all 100ms linear;
}
.${ns('MediaView')}:not(:hover) .${ns('controls')} {
	opacity: 0;
}
.${ns('MediaView')} .${ns('controls')}.${ns('-bottom-center')} {
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	margin-bottom: 5px;
}
.${ns('MediaView')} .${ns('controls')}.${ns('-top-right')} {
	top: 0;
	right: 0;
	margin: 5px 5px 0 0;
}
.${ns('MediaView')} .${ns('controls')} > button {
	display: table-cell;
	height: 24px;
	margin: 0;
	padding: 0 6px;
	border: 0;
	vertical-align: middle;
	text-align: center;
	flex: 0 0 auto;
	color: #fff;
	background: #222b;
	border-radius: 2px;
	font-size: 14px;
	text-shadow: 1px 1px 0 #000d, -1px -1px 0 #000d, -1px 1px 0 #000d, 1px -1px 0 #000d;
}
.${ns('MediaView')} .${ns('controls')} > button:hover {
	color: #fff;
	background: #666b;
}
.${ns('MediaView')} .${ns('controls')} > button.${ns('active')} {
	color: #111;
	background: #eee;
	text-shadow: none;
}
`;
