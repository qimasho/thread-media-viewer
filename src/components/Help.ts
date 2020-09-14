import {h} from 'lib/preact';
import {ns} from 'lib/utils';
import {useSettings} from 'settings';

export function Help() {
	const s = useSettings();

	return h('div', {class: ns('Help')}, [
		h('h1', null, 'Help'),

		h('fieldset', {class: ns('-value-heavy')}, [
			h('article', null, [
				h('header', null, 'Registry'),
				h(
					'section',
					null,
					h(
						'a',
						{href: 'https://greasyfork.org/en/scripts/408038-thread-media-viewer'},
						'greasyfork.org/en/scripts/408038'
					)
				),
			]),
			h('article', null, [
				h('header', null, 'Repository'),
				h(
					'section',
					null,
					h(
						'a',
						{href: 'https://github.com/qimasho/thread-media-viewer'},
						'github.com/qimasho/thread-media-viewer'
					)
				),
			]),
			h('article', null, [
				h('header', null, 'Issues'),
				h(
					'section',
					null,
					h(
						'a',
						{href: 'https://github.com/qimasho/thread-media-viewer/issues'},
						'github.com/qimasho/thread-media-viewer/issues'
					)
				),
			]),
		]),

		h('h2', null, 'Mouse controls'),

		h('ul', {class: ns('-clean')}, [
			h('li', null, ['Right button gesture ', h('kbd', null, '↑'), ' to toggle media list.']),
			h('li', null, ['Right button gesture ', h('kbd', null, '↓'), ' to close media view.']),
			h('li', null, [h('kbd', null, 'click'), ' on thumbnail (thread or list) to open media viewer.']),
			h('li', null, [
				h('kbd', null, 'click'),
				' on text portion of thumbnail (thread media list) or thread title/snippet (catalog) to move cursor to that item.',
			]),
			h('li', null, [h('kbd', null, 'shift+click'), ' on thumbnail (thread) to open both media view and list.']),
			h('li', null, [h('kbd', null, 'double-click'), ' to toggle fullscreen.']),
			h('li', null, [h('kbd', null, 'mouse wheel'), ' on video to change audio volume.']),
			h('li', null, [h('kbd', null, 'mouse wheel'), ' on timeline to seek video.']),
			h('li', null, [h('kbd', null, 'mouse down'), ' on image for 1:1 zoom and pan.']),
		]),

		h('h2', null, 'FAQ'),

		h('dl', null, [
			h('dt', null, "Why does the page scroll when I'm navigating items?"),
			h('dd', null, 'It scrolls to place the associated post right below the media list box.'),
			h('dt', null, 'What are the small squares at the bottom of thumbnails?'),
			h('dd', null, 'Visualization of the number of replies the post has.'),
		]),
	]);
}
