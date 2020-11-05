declare function GM_addStyle(style: string): void;
declare function GM_openInTab(
	url: string,
	options?: {
		active?: boolean; // decides whether the new tab should be focused
		insert?: boolean; // inserts the new tab after the current one
		setParent?: boolean; // makes the browser re-focus the current tab on close
		incognito?: boolean; // makes the tab being opened inside a incognito mode/private mode window.
	}
): void;
declare function GM_setValue(name: string, value: unknown): void;
declare function GM_getValue<T extends unknown = unknown>(name: string, defaultValue?: T): T | undefined;
declare type ListenerID = any;
declare function GM_addValueChangeListener(
	name: string,
	callback: (name: string, oldValue: unknown, newValue: unknown) => void
): ListenerID;
declare function GM_removeValueChangeListener(listenerID: ListenerID): void;

/**
 * TS doesn't have a definition for it yet o.O. WTF it has 85% browser support.
 * Types from: https://gist.github.com/strothj/708afcf4f01dd04de8f49c92e88093c3
 */
declare class ResizeObserver {
	constructor(callback: ResizeObserverCallback);
	disconnect: () => void;
	observe: (target: Element, options?: ResizeObserverObserveOptions) => void;
	unobserve: (target: Element) => void;
}
interface ResizeObserverObserveOptions {
	box?: 'content-box' | 'border-box';
}
type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
interface ResizeObserverEntry {
	readonly borderBoxSize: ResizeObserverEntryBoxSize;
	readonly contentBoxSize: ResizeObserverEntryBoxSize;
	readonly contentRect: DOMRectReadOnly;
	readonly target: Element;
}
interface ResizeObserverEntryBoxSize {
	blockSize: number;
	inlineSize: number;
}
