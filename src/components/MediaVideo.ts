import {h, Ref, RenderableProps, useRef, useLayoutEffect, useEffect, useState, useMemo} from 'lib/preact';
import {ns, formatSeconds, getBoundingDocumentRect, throttle, prevented} from 'lib/utils';
import {useKey, useKeyUp, useElementSize} from 'lib/hooks';
import {useSettings} from 'settings';
import {ErrorBox} from 'components/ErrorBox';
import {Spinner} from 'components/Spinner';

interface MediaVideoProps {
	url: string;
	upscale?: boolean;
	upscaleThreshold?: number;
	upscaleLimit?: number;
	isExpanded?: boolean;
	onExpand?: () => void;
}

const {min, max, round} = Math;

export function MediaVideo({
	url,
	upscale = false,
	upscaleThreshold = 0.5,
	upscaleLimit = 2,
	isExpanded,
	onExpand,
}: RenderableProps<MediaVideoProps>) {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const volumeRef = useRef<HTMLElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [hasAudio, setHasAudio] = useState<boolean>(false);
	const [isFastForward, setIsFastForward] = useState(false);
	const [error, setError] = useState<Error | MediaError | null>(null);
	const [containerWidth, containerHeight] = useElementSize(containerRef);
	const [speed, setSpeed] = useState<number>(1);

	// Initialization
	useLayoutEffect(() => {
		const video = videoRef.current;

		if (error || !video) return;

		let checkId: null | ReturnType<typeof setTimeout> = null;
		const check = () => {
			if (video?.videoHeight > 0) {
				// TS doesn't know about `audioTracks` or `mozHasAudio`
				setHasAudio((video as any).audioTracks?.length > 0 || (video as any).mozHasAudio);
				setIsLoading(false);
			} else {
				checkId = setTimeout(check, 50);
			}
		};

		setError(null);
		setIsLoading(true);
		setHasAudio(false);
		setIsFastForward(false);
		check();

		return () => checkId != null && clearTimeout(checkId);
	}, [url, error]);

	// Upscale-ing
	useLayoutEffect(() => {
		const container = containerRef.current;
		const video = videoRef.current;

		if (!upscale || isLoading || !video || !container || !containerWidth || !containerHeight) return;

		const naturalWidth = video.videoWidth;
		const naturalHeight = video.videoHeight;

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
			video.style.cssText = `width:${newWidth}px;height:${newHeight}px`;
		}

		return () => {
			video.style.cssText = '';
		};
	}, [isLoading, url, upscale, upscaleThreshold, upscaleLimit, containerWidth, containerHeight]);

	function initializeVolumeDragging(event: MouseEvent) {
		const volume = volumeRef.current;
		if (event.button !== 0 || !volume) return;
		event.preventDefault();
		event.stopPropagation();

		const pointerTimelineSeek = throttle((moveEvent: MouseEvent) => {
			let {top, height} = getBoundingDocumentRect(volume);
			let pos = min(max(1 - (moveEvent.pageY - top) / height, 0), 1);
			settings.volume = round(pos / settings.adjustVolumeBy) * settings.adjustVolumeBy;
		}, 100);

		function unbind() {
			window.removeEventListener('mousemove', pointerTimelineSeek);
			window.removeEventListener('mouseup', unbind);
		}

		window.addEventListener('mousemove', pointerTimelineSeek);
		window.addEventListener('mouseup', unbind);

		pointerTimelineSeek(event);
	}

	function handleContainerWheel(event: WheelEvent) {
		event.preventDefault();
		event.stopPropagation();
		settings.volume = min(max(settings.volume + settings.adjustVolumeBy * (event.deltaY > 0 ? -1 : 1), 0), 1);
	}

	const playPause = () => {
		const video = videoRef.current;
		if (video) {
			if (video.paused || video.ended) video.play();
			else video.pause();
		}
	};

	const flashVolume = useMemo(() => {
		let timeoutId: null | ReturnType<typeof setTimeout> = null;
		return () => {
			const volume = volumeRef.current;
			if (timeoutId) clearTimeout(timeoutId);
			if (volume) volume.style.opacity = '1';
			timeoutId = setTimeout(() => {
				if (volume) volume.style.cssText = '';
			}, 400);
		};
	}, []);

	// Shortcuts
	useKey(settings.keyViewPause, playPause);
	useKey(settings.keyViewSeekBack, () => {
		const video = videoRef.current;
		if (video) video.currentTime = max(video.currentTime - settings.seekBy, 0);
	});
	useKey(settings.keyViewSeekForward, () => {
		const video = videoRef.current;
		if (video) video.currentTime = min(video.currentTime + settings.seekBy, video.duration);
	});
	useKey(settings.keyViewTinySeekBack, () => {
		const video = videoRef.current;
		if (video) {
			video.pause();
			video.currentTime = max(video.currentTime - settings.tinySeekBy, 0);
		}
	});
	useKey(settings.keyViewTinySeekForward, () => {
		const video = videoRef.current;
		if (video) {
			video.pause();
			video.currentTime = min(video.currentTime + settings.tinySeekBy, video.duration);
		}
	});
	useKey(settings.keyViewVolumeDown, () => {
		settings.volume = max(settings.volume - settings.adjustVolumeBy, 0);
		flashVolume();
	});
	useKey(settings.keyViewVolumeUp, () => {
		settings.volume = min(settings.volume + settings.adjustVolumeBy, 1);
		flashVolume();
	});
	useKey(settings.keyViewSpeedDown, () =>
		setSpeed((speed) => Math.max(settings.adjustSpeedBy, speed - settings.adjustSpeedBy))
	);
	useKey(settings.keyViewSpeedUp, () => setSpeed((speed) => speed + settings.adjustSpeedBy));
	useKey(settings.keyViewSpeedReset, () => setSpeed(1));
	useKey(settings.keyViewFastForward, (event) => {
		if (event.repeat) return;
		if (settings.fastForwardActivation === 'hold') {
			setIsFastForward(true);
			window.addEventListener('keyup', () => setIsFastForward(false), {once: true});
		} else {
			setIsFastForward((value) => !value);
		}
	});

	// Time navigation by numbers, 1=10%, 5=50%, ... 0=0%
	for (let index of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
		useKey((settings as any)[`keyViewSeekTo${index * 10}`], () => {
			const video = videoRef.current;
			if (video) if (video.duration > 0) video.currentTime = video.duration * (index / 10);
		});
	}

	if (error) return h(ErrorBox, {error});

	let classNames = ns('MediaVideo');
	if (isLoading) classNames += ` ${ns('-loading')}`;

	return h(
		'div',
		{
			class: ns('MediaVideo'),
			ref: containerRef,
			onMouseDown: ({button}: MouseEvent) => button === 0 && playPause(),
			onWheel: handleContainerWheel,
		},
		[
			isLoading && h(Spinner, null),
			h('video', {
				ref: videoRef,
				autoplay: true,
				preload: false,
				controls: false,
				loop: true,
				volume: settings.volume,
				playbackRate: isFastForward ? settings.fastForwardRate : speed,
				onError: () => setError(new Error('Video failed to load')),
				src: url,
			}),
			h(VideoTimeline, {videoRef}),
			h('div', {class: ns('controls')}, [
				h(
					'button',
					{
						onMouseDown: prevented<MouseEvent>((event) => event.button === 0 && onExpand?.()),
						class: isExpanded ? ns('active') : undefined,
					},
					'⛶'
				),
				h('span', {class: ns('spacer')}),
				h(
					'button',
					{
						onMouseDown: prevented<MouseEvent>((event) => event.button === 0 && setSpeed(1)),
						class: speed === 1 ? ns('active') : undefined,
					},
					'1x'
				),
				h(
					'button',
					{
						onMouseDown: prevented<MouseEvent>((event) => event.button === 0 && setSpeed(1.5)),
						class: speed === 1.5 ? ns('active') : undefined,
					},
					'1.5x'
				),
				h(
					'button',
					{
						onMouseDown: prevented<MouseEvent>((event) => event.button === 0 && setSpeed(2)),
						class: speed === 2 ? ns('active') : undefined,
					},
					'2x'
				),
				h('span', {class: ns('spacer')}),
				h('span', {class: ns('symmetry-dummy')}),
			]),
			h(
				'div',
				{
					class: ns('volume'),
					ref: volumeRef,
					onMouseDown: initializeVolumeDragging,
					style: hasAudio ? 'display: hidden' : '',
				},
				h('div', {
					class: ns('bar'),
					style: `height: ${Number(settings.volume) * 100}%`,
				})
			),
			speed !== 1 && h('div', {class: ns('speed')}, `${speed.toFixed(2)}x`),
		]
	);
}

interface VideoTimelineProps {
	videoRef: Ref<HTMLVideoElement>;
}

interface BufferedRanges {
	start: number;
	end: number;
}

function VideoTimeline({videoRef}: RenderableProps<VideoTimelineProps>) {
	const settings = useSettings();
	const [state, setState] = useState({progress: 0, elapsed: 0, remaining: 0, duration: 0});
	const [bufferedRanges, setBufferedRanges] = useState<BufferedRanges[]>([]);
	const timelineRef = useRef<HTMLElement>(null);

	// Video controls and settings synchronization
	useEffect(() => {
		const video = videoRef.current;
		const timeline = timelineRef.current;

		if (!video || !timeline) return;

		const handleTimeupdate = () => {
			setState({
				progress: video.currentTime / video.duration,
				elapsed: video.currentTime,
				remaining: video.duration - video.currentTime,
				duration: video.duration,
			});
		};

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button !== 0) return;
			event.preventDefault();
			event.stopPropagation();

			const wasPaused = video.paused;

			const pointerTimelineSeek = throttle((mouseEvent) => {
				video.pause();
				let {left, width} = getBoundingDocumentRect(timeline);
				let pos = min(max((mouseEvent.pageX - left) / width, 0), 1);
				video.currentTime = pos * video.duration;
			}, 100);

			const unbind = () => {
				window.removeEventListener('mousemove', pointerTimelineSeek);
				window.removeEventListener('mouseup', unbind);
				pointerTimelineSeek.flush();
				if (!wasPaused) video.play();
			};

			window.addEventListener('mousemove', pointerTimelineSeek);
			window.addEventListener('mouseup', unbind);

			pointerTimelineSeek(event);
		};

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			event.stopPropagation();
			video.currentTime = video.currentTime + 5 * (event.deltaY > 0 ? 1 : -1);
		};

		const handleProgress = () => {
			const buffer = video.buffered;
			const duration = video.duration;
			const ranges = [];

			for (let i = 0; i < buffer.length; i++) {
				ranges.push({
					start: buffer.start(i) / duration,
					end: buffer.end(i) / duration,
				});
			}

			setBufferedRanges(ranges);
		};

		// `progress` event doesn't fire properly for some reason. Majority of videos get a single `progress`
		// event when `video.buffered` ranges are not yet initialized (useless), than another event when
		// buffered ranges are at like 3%, and than another event when ranges didn't change from before,
		// and that's it... no event for 100% done loading, nothing. I've tried debugging this for hours
		// with no success. The only solution is to just interval it until we detect the video is fully loaded.
		const progressInterval = setInterval(() => {
			handleProgress();
			// clear interval when done loading - this is a naive check that doesn't account for missing middle parts
			if (video.buffered.length > 0 && video.buffered.end(video.buffered.length - 1) == video.duration) {
				clearInterval(progressInterval);
			}
		}, 200);
		// video.addEventListener('progress', handleProgress);

		video.addEventListener('timeupdate', handleTimeupdate);
		timeline.addEventListener('wheel', handleWheel);
		timeline.addEventListener('mousedown', handleMouseDown);

		return () => {
			// video.removeEventListener('progress', handleProgress);
			video.removeEventListener('timeupdate', handleTimeupdate);
			timeline.removeEventListener('wheel', handleWheel);
			timeline.removeEventListener('mousedown', handleMouseDown);
		};
	}, []);

	const elapsedTime = formatSeconds(state.elapsed);
	const totalTime =
		settings.endTimeFormat === 'total' ? formatSeconds(state.duration) : `-${formatSeconds(state.remaining)}`;

	return h('div', {class: ns('timeline'), ref: timelineRef}, [
		...bufferedRanges.map(({start, end}) =>
			h('div', {
				class: ns('buffered-range'),
				style: {
					left: `${start * 100}%`,
					right: `${100 - end * 100}%`,
				},
			})
		),
		h('div', {class: ns('elapsed')}, elapsedTime),
		h('div', {class: ns('total')}, totalTime),
		h('div', {class: ns('progress'), style: `width: ${state.progress * 100}%`}, [
			h('div', {class: ns('elapsed')}, elapsedTime),
			h('div', {class: ns('total')}, totalTime),
		]),
	]);
}

MediaVideo.styles = `
.${ns('MediaVideo')} {
	--timeline-max-size: 40px;
	--timeline-min-size: 20px;
	position: relative;
	display: flex;
	max-width: 100%;
	max-height: 100vh;
	align-items: center;
	justify-content: center;
	background: #000d;
}
.${ns('MediaVideo')} > .${ns('Spinner')} {
	position: absolute;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	font-size: 2em;
}
.${ns('MediaVideo')} > video {
	display: block;
	max-width: 100%;
	max-height: calc(100vh - var(--timeline-min-size));
	margin: 0 auto var(--timeline-min-size);
	outline: none;
	background: #000d;
}
.${ns('MediaVideo')}.${ns('-loading')} > video {
	min-width: 200px;
	min-height: 200px;
	opacity: 0;
}
.${ns('MediaView')} .${ns('MediaVideo')} > .${ns('controls')} {
	bottom: var(--timeline-max-size);
}
.${ns('MediaVideo')} > .${ns('timeline')} {
	position: absolute;
	left: 0; bottom: 0;
	width: 100%;
	height: var(--timeline-max-size);
	font-size: 14px !important;
	line-height: 1;
	color: #eee;
	background: #111c;
	border: 1px solid #111c;
	transition: height 100ms ease-out;
	user-select: none;
}
.${ns('MediaVideo')}:not(:hover) > .${ns('timeline')} {
	height: var(--timeline-min-size);
}
.${ns('MediaVideo')} > .${ns('timeline')} > .${ns('buffered-range')} {
	position: absolute;
	bottom: 0;
	height: 100%;
	background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVQImWNgQAL/////TyqHgYEBAB5CD/FVFp/QAAAAAElFTkSuQmCC') left bottom repeat;
	opacity: .17;
	transition: right 200ms ease-out;
}
.${ns('MediaVideo')} > .${ns('timeline')} > .${ns('progress')} {
	height: 100%;
	background: #eee;
	clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
.${ns('MediaVideo')} > .${ns('timeline')} .${ns('elapsed')},
.${ns('MediaVideo')} > .${ns('timeline')} .${ns('total')} {
	position: absolute;
	top: 0;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 .2em;
	text-shadow: 1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000, 0px 1px #000, 0px -1px #000, 1px 0px #000, -1px 0px #000;
	pointer-events: none;
}
.${ns('MediaVideo')} > .${ns('timeline')} .${ns('elapsed')} {left: 0;}
.${ns('MediaVideo')} > .${ns('timeline')} .${ns('total')} {right: 0;}
.${ns('MediaVideo')} > .${ns('timeline')} > .${ns('progress')} .${ns('elapsed')},
.${ns('MediaVideo')} > .${ns('timeline')} > .${ns('progress')} .${ns('total')} {
	color: #111;
	text-shadow: none;
}

.${ns('MediaVideo')} > .${ns('volume')} {
	position: absolute;
	right: 10px;
	top: calc(25% - var(--timeline-min-size));
	width: 30px;
	height: 50%;
	background: #111c;
	border: 1px solid #111c;
	transition: opacity 100ms linear;
}
.${ns('MediaVideo')}:not(:hover) > .${ns('volume')} {opacity: 0;}
.${ns('MediaVideo')} > .${ns('volume')} > .${ns('bar')} {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 100%;
	background: #eee;
}
.${ns('MediaVideo')} > .${ns('speed')} {
	position: absolute;
	left: 10px;
	top: 10px;
	padding: .5em .7em;
	font-size: 0.9em;
	font-family: "Lucida Console", Monaco, monospace;
	color: #fff;
	text-shadow: 1px 1px 0 #000a, -1px -1px 0 #000a, -1px 1px 0 #000a, 1px -1px 0 #000a, 0 1px 0 #000a, 1px 0 0 #000a;
}
`;
