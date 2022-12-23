import {ThreadSerializer, SerializedMedia} from 'serializers';

export interface Media extends SerializedMedia {
	extension: string;
	isVideo: boolean;
	isGif: boolean;
	postContainer: HTMLElement;
	replies?: number;
}

export type MediaListener = (newMedia: Media[], allMedia: Media[]) => void;

export class MediaWatcher {
	serializer: ThreadSerializer;
	container: HTMLElement;
	listeners: Set<MediaListener> = new Set();
	mediaByID: Map<string, Media> = new Map();
	media: Media[] = [];
	observer: MutationObserver;

	constructor(serializer: ThreadSerializer) {
		this.serializer = serializer;
		const container = document.querySelector<HTMLElement>(serializer.selector);

		if (!container) throw new Error(`No elements matched by threadSelector: ${serializer.selector}`);

		this.container = container;

		// Initialize observer
		this.serialize();
		this.observer = new MutationObserver(this.serialize);
		this.observer.observe(container, {childList: true, subtree: true, attributeFilter: ['href', 'src']});
	}

	destroy = () => {
		this.listeners.clear();
		this.observer.disconnect();
	};

	serialize = () => {
		let addedMedia = [];
		let hasNewMedia = false;
		let hasChanges = false;

		for (let child of this.container.children) {
			const postContainer = child as HTMLElement;
			const serializedPost = this.serializer.serializer(postContainer);

			if (serializedPost == null) continue;

			for (let serializedMedia of serializedPost.media) {
				const extension = String(serializedMedia.url.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
				const mediaItem: Media = {
					...serializedMedia,
					extension,
					isVideo: !!extension.match(/webm?|mp4/),
					isGif: extension === 'gif',
					postContainer,
					replies: serializedPost.replies,
				};

				let existingItem = this.mediaByID.get(mediaItem.id);

				// Update existing items (for stuff like reply counts)
				if (existingItem) {
					if (JSON.stringify(existingItem) !== JSON.stringify(mediaItem)) {
						Object.assign(existingItem, mediaItem);
						hasChanges = true;
					}
					continue;
				}

				this.mediaByID.set(mediaItem.id, mediaItem);
				addedMedia.push(mediaItem);
				hasNewMedia = true;
			}
		}

		if (hasNewMedia) this.media = this.media.concat(addedMedia);

		if (hasNewMedia || hasChanges) {
			for (let listener of this.listeners) listener(addedMedia, this.media);
		}
	};

	subscribe = (callback: MediaListener) => {
		this.listeners.add(callback);
		return () => this.unsubscribe(callback);
	};

	unsubscribe = (callback: MediaListener) => {
		this.listeners.delete(callback);
	};
}
