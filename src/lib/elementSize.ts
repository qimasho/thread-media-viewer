interface Change {
	element: HTMLElement;
	offset: [number, number];
	client: [number, number];
}
type ElementSizeObserverCallback = (box: [number, number]) => void;
type ElementSizeObserver = (change: Change) => void;
type DisposeFunction = () => void;

let commitId: number | null = null;
const changedElements = new Set<HTMLElement>();
const elementObservers = new Map<HTMLElement, Set<ElementSizeObserver>>();

function requestCommit(element: HTMLElement) {
	changedElements.add(element);
	if (commitId === null) commitId = setTimeout(commit, 34);
}

/**
 * First retrieves sizes of all changed elements, and than runs callbacks
 * listening on them. This eliminates layout thrashing by batching layout
 * reading->writing.
 */
function commit() {
	commitId = null;
	const changes: Change[] = [];

	for (const element of changedElements) {
		changes.push({
			element: element,
			offset: [element.offsetWidth, element.offsetHeight],
			client: [element.clientWidth, element.clientHeight],
		});
	}

	changedElements.clear();

	for (const change of changes) {
		const callbacks = elementObservers.get(change.element);
		if (callbacks) for (const callback of callbacks) callback(change);
	}
}

/**
 * Observe element size.
 *
 * Batches all observer commits to prevent layout trashing if there is a lot of
 * observers active on the same page.
 */
export function observeElementSize(
	element: HTMLElement,
	callback: ElementSizeObserverCallback,
	options: {
		box?: 'border-box' | 'padding-box';
		precheck?: boolean;
	} = {}
) {
	const borderBox = options.box !== 'padding-box';
	const observer = borderBox
		? (change: Change) => callback(change.offset)
		: (change: Change) => callback(change.client);
	const triggerChange = () => requestCommit(element);
	let observers = elementObservers.get(element) || new Set<ElementSizeObserver>();

	if (!elementObservers.has(element)) elementObservers.set(element, observers);
	observers.add(observer);

	const resizeObserver = new ResizeObserver(triggerChange);
	resizeObserver.observe(element);

	if (options.precheck) triggerChange();

	return () => {
		resizeObserver.disconnect();
		observers.delete(observer);
		if (observers.size === 0) elementObservers.delete(element);
	};
}

/**
 * Returns element size and starts observing its changes. Intended to be used
 * inside effects. Example:
 * ```
 * useEffect(() => {
 *   let [width, height, dispose] = tapElementSize(elementRef.current, (box) => {
 *     width = box[0];
 *     height = box[1];
 *     updateStuff();
 *   });
 *
 *   return dispose;
 * }, []);
 * ```
 */
export function tapElementSize(
	element: HTMLElement,
	callback: ElementSizeObserverCallback,
	options: {
		box?: 'border-box' | 'padding-box';
	} = {}
): [number, number, DisposeFunction] {
	const dispose = observeElementSize(element, callback, options);

	return options.box === 'padding-box'
		? [element.clientWidth, element.clientHeight, dispose]
		: [element.offsetWidth, element.offsetHeight, dispose];
}
