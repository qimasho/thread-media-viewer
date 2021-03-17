/**
 * Naive quick type guard. Casts `value` to `T` when `condition` is `true`.
 * ```ts
 * isOfType<MouseEvent>(event, 'clientX' in event)
 * ```
 */
export function isOfType<T>(value: any, condition: boolean): value is T {
	return condition;
}

/**
 * String namespacing util.
 */
export const ns = (name: string) => `_tmv_${name}`;

/**
 * Clamp number between specified limits.
 */
export function clamp(min: number, value: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

/**
 * Utility to check and cast event targets to silence TypeScript.
 */
export function withTarget(type: 'DIV', callback: (target: HTMLElement) => void): (event: Event) => void;
export function withTarget(type: 'A', callback: (target: HTMLAnchorElement) => void): (event: Event) => void;
export function withTarget(type: 'BUTTON', callback: (target: HTMLButtonElement) => void): (event: Event) => void;
export function withTarget(type: 'INPUT', callback: (target: HTMLInputElement) => void): (event: Event) => void;
export function withTarget(type: string, callback: (target: any) => void): (event: Event) => void {
	return (event: Event) => {
		const target = event.target as any;
		if (isOfType<HTMLInputElement>(target, target?.nodeName === 'INPUT')) callback(target);
	};
}

/**
 * Utility to extract value from event target.
 */
export function withValue(callback: (value: string) => void) {
	return (event: Event) => {
		const target = event.target as any;
		if (
			isOfType<HTMLInputElement>(target, target && (target.nodeName === 'INPUT' || target.nodeName === 'BUTTON'))
		) {
			callback(target.value);
		}
	};
}

/**
 * Like `element.getBoundingClientRect()`, but position is relative to HTML
 * document root.
 */
export function getBoundingDocumentRect(element: HTMLElement) {
	const {width, height, top, left, bottom, right} = element.getBoundingClientRect();
	return {
		width,
		height,
		top: window.scrollY + top,
		left: window.scrollX + left,
		bottom: window.scrollY + bottom,
		right: window.scrollX + right,
	};
}

/**
 * Because native `element.scrollIntoView()` is broken in Chrome.
 * I'm having SO MUCH FUN PATCHING STUPID FUCKING DOM BUGS!
 * - `block` can also be an offset from top
 */
export function scrollToView(
	element: HTMLElement,
	{
		block = 'start',
		behavior = 'auto',
		container: forcedContainer,
	}: {block?: 'start' | 'center' | 'end' | number; behavior?: 'auto' | 'smooth'; container?: HTMLElement | null} = {}
): void {
	if (!document.body.contains(element)) return;

	let container: HTMLElement | undefined | null;

	if (forcedContainer) {
		if (!isScrollableY(forcedContainer)) return;
		container = forcedContainer;
	} else {
		container = element.parentElement;

		while (container) {
			if (isScrollableY(container)) break;
			else container = container.parentElement;
		}

		if (!container) return;
	}

	const containerRect = getBoundingDocumentRect(container);
	const elementRect = getBoundingDocumentRect(element);

	const topOffset =
		elementRect.top - containerRect.top + (container === document.scrollingElement ? 0 : container.scrollTop);
	let requestedOffset: number;

	if (block === 'start') requestedOffset = topOffset;
	else if (block === 'center') requestedOffset = topOffset - container.clientHeight / 2 + element.offsetHeight / 2;
	else if (block === 'end') requestedOffset = topOffset - container.clientHeight + element.offsetHeight;
	else requestedOffset = topOffset - block;

	container.scrollTo({top: requestedOffset, behavior});
}

/**
 * It's insane that in 2020 there still isn't a reliable way how to check
 * if element is scrollable. Fuck DOM, and fuck web browsers.
 */
export function isScrollableY(element: HTMLElement): boolean {
	if (element.scrollHeight === element.clientHeight) return false;
	if (getComputedStyle(element).overflowY === 'hidden') return false;
	if (element.scrollTop > 0) return true;
	element.scrollTop = 1;
	if (element.scrollTop > 0) {
		element.scrollTop = 0;
		return true;
	}
	return false;
}

/**
 * Formats seconds into human readable format. Example: `formatSeconds(90) => '01:30'`.
 */
export function formatSeconds(seconds: number): string {
	let minutes = Math.floor(seconds / 60);
	let leftover = Math.round(seconds - minutes * 60);
	return `${String(minutes).padStart(2, '0')}:${String(leftover).padStart(2, '0')}`;
}

type UnknownFn = (...args: any[]) => unknown;
export type Throttled<T extends UnknownFn> = T & {cancel: () => void; flush: () => void};

/**
 * Throttles the function by `timeout`.
 */
export function throttle<T extends UnknownFn>(fn: T, timeout: number = 100, noTrailing: boolean = false): Throttled<T> {
	let timeoutID: ReturnType<typeof setTimeout> | null;
	let args: any;
	let context: any;
	let last: number = 0;

	function call() {
		fn.apply(context, args);
		last = Date.now();
		timeoutID = context = args = null;
	}

	function throttled(this: any) {
		let delta = Date.now() - last;
		context = this;
		args = arguments;
		if (delta >= timeout) {
			throttled.cancel();
			call();
		} else if (!noTrailing && timeoutID == null) {
			timeoutID = setTimeout(call, timeout - delta);
		}
	}

	throttled.cancel = () => {
		if (timeoutID !== null) {
			clearTimeout(timeoutID);
			timeoutID = null;
		}
	};

	throttled.flush = () => {
		if (timeoutID !== null) {
			clearTimeout(timeoutID);
			timeoutID = null;
			call();
		}
	};

	return throttled as Throttled<T>;
}

/**
 * Creates a string ID for KeyboardEvent, such as `Alt+Ctrl+Shift+Home`.
 */
export function keyEventId(event: KeyboardEvent) {
	let key = String(event.key);
	const keyAsNumber = Number(event.key);
	const isNumpadKey = event.code.indexOf('Numpad') === 0;
	const isNumpadNumber = keyAsNumber >= 0 && keyAsNumber <= 9 && isNumpadKey;
	if (key === ' ' || isNumpadNumber) key = event.code;
	let id = '';
	if (event.altKey) id += 'Alt';
	if (event.ctrlKey) id += id.length > 0 ? '+Ctrl' : 'Ctrl';
	// This condition tries to identify keys that have no alternative input when pressing shift
	if (event.shiftKey && (key.length > 1 || isNumpadKey)) id += id.length > 0 ? '+Shift' : 'Shift';
	if (key !== 'Alt' && key !== 'Ctrl' && key !== 'Shift') id += (id.length > 0 ? '+' : '') + key;
	return id;
}

/**
 * Creates event handler that automatically prevents default action and propagation.
 */
export function prevented<E extends Event>(callback: (event: E) => void) {
	return function (event: E) {
		event.preventDefault();
		event.stopPropagation();
		callback(event);
	};
}
