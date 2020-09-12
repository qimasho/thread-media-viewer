export interface Serializer {
	urlMatches: RegExp;
	threadSerializer?: ThreadSerializer;
	catalogSerializer?: CatalogSerializer;
}

export interface ThreadSerializer {
	selector: string; // Thread container selector who's children are passed to serializer below
	serializer: PostSerializer;
}

export type PostSerializer = (post: HTMLElement) => SerializedPost | null | undefined;

export interface SerializedMedia {
	url: string;
	filename: string; // original filename, or fallback to file part of the main url
	thumbnailUrl: string;
	width?: number;
	height?: number;
	size?: string; // string like '10 MB'. number would make writing serializers more annoying
}

export interface SerializedPost {
	media: SerializedMedia[];
	replies?: number;
}

export interface CatalogSerializer {
	selector: string; // Catalog container selector who's children are passed to serializer below
	serializer: CatalogThreadItemSerializer;
}

export type CatalogThreadItemSerializer = (threadElement: HTMLElement) => string | undefined;

/**
 * Thread serializers.
 */
export const SERIALIZERS: Serializer[] = [
	{
		urlMatches: /^boards\.4chan(nel)?.org/i,
		threadSerializer: {
			selector: '.board .thread',
			serializer: fortunePostSerializer,
		},
		catalogSerializer: {
			selector: '#threads',
			serializer: (thread: HTMLElement) => thread.querySelector<HTMLAnchorElement>('a')?.href
		}
	},
	{
		urlMatches: /^thebarchive\.com/i,
		threadSerializer: {
			selector: '.thread .posts',
			serializer: theBArchivePostSerializer,
		},
		catalogSerializer: {
			selector: '#thread_o_matic',
			serializer: (thread: HTMLElement) => thread.querySelector<HTMLAnchorElement>('a.thread_image_link')?.href
		}
	},
];

/**
 * Post serializers.
 */

// 4chan
function fortunePostSerializer(post: HTMLElement) {
	const titleAnchor = post.querySelector<HTMLAnchorElement>('.fileText a');
	const url = post.querySelector<HTMLAnchorElement>('a.fileThumb')?.href;
	const thumbnailUrl = post.querySelector<HTMLImageElement>('a.fileThumb img')?.src;
	const meta = post.querySelector<HTMLElement>('.fileText')?.textContent?.match(/\(([^\(\)]+ *, *\d+x\d+)\)/)?.[1];
	const [size, dimensions] = meta?.split(',').map((str) => str.trim()) || [];
	const [width, height] = dimensions?.split('x').map((str) => parseInt(str, 10) || undefined) || [];
	const filename = titleAnchor?.title || titleAnchor?.textContent || url?.match(/\/([^\/]+)$/)?.[1];

	if (!url || !thumbnailUrl || !filename) return null;

	return {
		media: [{url, thumbnailUrl, filename, size, width, height}],
		replies: post.querySelectorAll<HTMLAnchorElement>('.postInfo .backlink a.quotelink')?.length ?? 0,
	};
}

// The B Archive
function theBArchivePostSerializer(post: HTMLElement) {
	const titleElement = post.querySelector<HTMLElement>('.post_file_filename');
	const url = post.querySelector<HTMLAnchorElement>('a.thread_image_link')?.href;
	const thumbnailUrl = post.querySelector<HTMLImageElement>('img.post_image')?.src;
	const meta = post.querySelector<HTMLElement>('.post_file_metadata')?.textContent;
	const [size, dimensions] = meta?.split(',').map((str) => str.trim()) || [];
	const [width, height] = dimensions?.split('x').map((str) => parseInt(str, 10) || undefined) || [];
	const filename = titleElement?.title || titleElement?.textContent || url?.match(/\/([^\/]+)$/)?.[1];

	if (!url || !thumbnailUrl || !filename) return null;

	return {
		media: [{url, size, width, height, thumbnailUrl, filename}],
		replies: post.querySelectorAll<HTMLAnchorElement>('.backlink_list a.backlink')?.length ?? 0,
	};
}
