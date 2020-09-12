import {CatalogSerializer} from 'serializers';

export interface ThreadLink {
	container: HTMLElement;
	url: string;
}

export type CatalogListener = (threads: ThreadLink[]) => void;

export class CatalogWatcher {
	serializer: CatalogSerializer;
	container: HTMLElement;
	listeners: Set<CatalogListener> = new Set();
	threads: ThreadLink[] = [];
	observer: MutationObserver;

	constructor(serializer: CatalogSerializer) {
		this.serializer = serializer;
		const container = document.querySelector<HTMLElement>(serializer.selector);

		if (!container) throw new Error(`No elements matched by threadSelector: ${serializer.selector}`);

		this.container = container;

		// Initialize observer
		this.serialize();
		this.observer = new MutationObserver(this.serialize);
		this.observer.observe(container, {childList: true, subtree: true});
	}

	destroy = () => {
		this.listeners.clear();
		this.observer.disconnect();
	};

	serialize = () => {
		let newThreads: ThreadLink[] = [];
		let hasChanges = false;

		for (let i = 0; i < this.container.children.length; i++) {
			const container = this.container.children[i] as HTMLElement;
			const url = this.serializer.serializer(container);

			if (url) {
				newThreads.push({url, container});
				if (this.threads[i]?.url !== url) hasChanges = true;
			}
		}

		if (hasChanges) {
			this.threads = newThreads;
			for (let listener of this.listeners) listener(this.threads);
		}
	};

	subscribe = (callback: CatalogListener) => {
		this.listeners.add(callback);
		return () => this.unsubscribe(callback);
	};

	unsubscribe = (callback: CatalogListener) => {
		this.listeners.delete(callback);
	};
}
