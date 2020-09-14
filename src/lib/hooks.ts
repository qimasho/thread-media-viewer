import {useState, useEffect, useLayoutEffect, Ref} from 'lib/preact';
import {throttle as throttleFn, keyEventId} from 'lib/utils';

/**
 * Force update current component.
 */
export function useForceUpdate() {
	// NaN doesn't equal anything, including itself
	const [_, setState] = useState(NaN);
	return () => setState(NaN);
}

/**
 * useKey
 */
const _useKey = (() => {
	const INTERACTIVE = {INPUT: true, TEXTAREA: true, SELECT: true};
	let handlersByShortcut = {
		keydown: new Map(),
		keyup: new Map(),
	};
	function triggerHandlers(event: KeyboardEvent) {
		// @ts-ignore
		if (INTERACTIVE[event.target.nodeName]) return;

		const eventType = event.type as keyof typeof handlersByShortcut;
		let handlers = handlersByShortcut[eventType]?.get(keyEventId(event));

		if (handlers && handlers.length > 0) {
			event.preventDefault();
			event.stopImmediatePropagation();
			event.stopPropagation();
			handlers[handlers.length - 1](event);
		}
	}

	window.addEventListener('keydown', triggerHandlers);
	window.addEventListener('keyup', triggerHandlers);

	return function _useKey(
		event: keyof typeof handlersByShortcut,
		shortcut: string | undefined | null | false,
		handler: (event: KeyboardEvent) => void
	) {
		useEffect(() => {
			if (!shortcut) return;
			let handlers = handlersByShortcut[event].get(shortcut);
			if (!handlers) {
				handlers = [];
				handlersByShortcut[event].set(shortcut, handlers);
			}
			handlers.push(handler);
			const nonNullHandlers = handlers;
			return () => {
				let indexOfHandler = nonNullHandlers.indexOf(handler);
				if (indexOfHandler >= 0) nonNullHandlers.splice(indexOfHandler, 1);
			};
		}, [shortcut, handler]);
	};
})();

export function useKey(shortcut: string | undefined | null | false, handler: (event: KeyboardEvent) => void) {
	_useKey('keydown', shortcut, handler);
}

export function useKeyUp(shortcut: string | undefined | null | false, handler: (event: KeyboardEvent) => void) {
	_useKey('keyup', shortcut, handler);
}

/**
 * Retrieves and updates window dimensions on change;
 */
export function useWindowDimensions() {
	let [dimensions, setDimensions] = useState([window.innerWidth, window.innerHeight]);

	useEffect(() => {
		let handleResize = throttleFn(() => setDimensions([window.innerWidth, window.innerHeight]), 100);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return dimensions;
}

/**
 * Sets up element Resize Observer, extracts element sizes, and returns them as
 * a `[number, number]` tuple. Initial call returns `[null, null]`.
 *
 * Note: `padding-box` is potentially slower to retrieve. Don't use it when you
 * don't need to.
 *
 * ```ts
 * const containerRef = useRef<HTMLElement>();
 * const [width, height] = useElementSize(containerRef, 'content-box');
 * ```
 */
export function useElementSize(
	ref: Ref<HTMLElement>,
	box: 'border-box' | 'content-box' | 'padding-box' = 'border-box',
	throttle: number | false = false
) {
	const [sizes, setSizes] = useState<[number, number] | [null, null]>([null, null]);

	useLayoutEffect(() => {
		if (!ref.current) throw new Error();

		const checker = (entries: ResizeObserverEntry[]) => {
			let lastEntry = entries[entries.length - 1];

			if (box === 'padding-box') {
				setSizes([ref.current!.clientWidth, ref.current!.clientHeight]);
			} else if (box === 'content-box') {
				setSizes([lastEntry.contentRect.width, lastEntry.contentRect.height]);
			} else {
				// border-box
				setSizes([lastEntry.borderBoxSize.inlineSize, lastEntry.borderBoxSize.blockSize]);
			}
		};
		const check = throttle !== false ? throttleFn(checker, throttle) : checker;
		const resizeObserver = new ResizeObserver(check);

		resizeObserver.observe(ref.current);

		return () => resizeObserver.disconnect();
	}, [box]);

	return sizes;
}

/**
 * Checks how many items fit per row in grid styled containers, and updates the
 * value every time the container size or it's children count changes.
 *
 * In case there is not more than 1 row of items in the container, it will
 * return the current number of items in a container.
 *
 * ```ts
 * const containerRef = useRef<HTMLElement>();
 * const itemsPerRow = useItemsPerRow(containerRef, 100);
 * ```
 */
export function useItemsPerRow(ref: Ref<HTMLElement>, throttle: number | false = false) {
	const [itemsPerRow, setItemsPerRow] = useState<number>(0);

	useLayoutEffect(() => {
		const container = ref.current;
		if (!container) throw new Error();

		const checker = () => {
			let currentTop: number | null = null;
			for (let i = 0; i < container.children.length; i++) {
				const item = container.children[i] as HTMLElement;
				const rect = item.getBoundingClientRect();
				if (currentTop != null && currentTop !== rect.top) {
					setItemsPerRow(i);
					return;
				}
				currentTop = rect.top;
			}
			setItemsPerRow(container.children.length);
		};
		const check = throttle !== false ? throttleFn(checker, throttle) : checker;

		const resizeObserver = new ResizeObserver(check);
		resizeObserver.observe(container);

		const childrenObserver = new MutationObserver(check);
		childrenObserver.observe(container, {childList: true});

		return () => {
			resizeObserver.disconnect();
			childrenObserver.disconnect();
		};
	}, []);

	return itemsPerRow;
}

/**
 * Allows binding callbacks to right mouse gestures.
 * Really basic, just 1 direction support.
 *
 * ```ts
 * useGesture('up', () => {});
 * ```
 */
export const useGesture = (() => {
	let callbacksByGesture: Map<string, (() => void)[]> = new Map();

	function startGesture({button, x, y}: {button: number; x: number; y: number}) {
		if (button !== 2) return;

		const gestureStart = {x, y};

		window.addEventListener('mouseup', endGesture);

		function endGesture({button, x, y}: {button: number; x: number; y: number}) {
			window.removeEventListener('mouseup', endGesture);

			if (button !== 2) return;

			const dragDistance = Math.hypot(x - gestureStart.x, y - gestureStart.y);

			if (dragDistance < 30) return;

			let gesture;
			if (Math.abs(gestureStart.x - x) < dragDistance / 2) {
				gesture = gestureStart.y < y ? 'down' : 'up';
			} else if (Math.abs(gestureStart.y - y) < dragDistance / 2) {
				gesture = gestureStart.x < x ? 'right' : 'left';
			}

			if (gesture) {
				// Trigger callback
				let callbacks = callbacksByGesture.get(gesture);
				if (callbacks && callbacks.length > 0) callbacks[callbacks.length - 1]();

				// Prevent context menu
				const preventContext = (event: Event) => event.preventDefault();
				window.addEventListener('contextmenu', preventContext, {once: true});
				// Unbind after a couple milliseconds to not clash with other
				// tools that prevent context, such as gesture extensions.
				setTimeout(() => window.removeEventListener('contextmenu', preventContext), 10);
			}
		}
	}

	window.addEventListener('mousedown', startGesture);

	return function useGesture(gesture: string | undefined | null | false, callback: () => void) {
		useEffect(() => {
			if (!gesture) return;
			let callbacks = callbacksByGesture.get(gesture);
			if (!callbacks) {
				callbacks = [];
				callbacksByGesture.set(gesture, callbacks);
			}
			callbacks.push(callback);
			const nonNullHandlers = callbacks;
			return () => {
				let callbackIndex = nonNullHandlers.indexOf(callback);
				if (callbackIndex >= 0) nonNullHandlers.splice(callbackIndex, 1);
			};
		}, [gesture, callback]);
	};
})();
