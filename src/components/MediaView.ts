import {h, RenderableProps, useRef, useState} from 'lib/preact';
import {ns} from 'lib/utils';
import {useKey, useKeyUp} from 'lib/hooks';
import {Media} from 'lib/mediaWatcher';
import {useSettings} from 'settings';
import {MediaImage} from 'components/MediaImage';
import {MediaVideo} from 'components/MediaVideo';

interface MediaViewProps {
	media: Media;
}

export function MediaView({media: {url, isVideo}}: RenderableProps<MediaViewProps>) {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

	const toggleFullscreen = () => {
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
	};

	useKey(settings.keyViewFullScreen, toggleFullscreen);
	useKey(settings.keyViewFullPage, (event) => {
		event.preventDefault();
		if (event.repeat) return;
		if (settings.fpmActivation === 'hold') setIsExpanded(true);
		else setIsExpanded((value) => !value);
	});
	useKeyUp(settings.keyViewFullPage, () => {
		if (settings.fpmActivation === 'hold') setIsExpanded(false);
	});

	let classNames = ns('MediaView');
	if (isExpanded || isFullScreen) classNames += ` ${ns('-expanded')}`;

	return h(
		'div',
		{class: classNames, ref: containerRef, onDblClick: toggleFullscreen},
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
			  })
	);
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
`;
