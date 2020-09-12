import {h} from 'lib/preact';
import {ns} from 'lib/utils';

export function Changelog() {
	return h('div', {class: ns('Changelog')}, [
		h('h1', null, 'Changelog'),

		h('h2', null, h('code', null, ['2.0.0', h('span', {class: ns('-muted')}, ' ⬩ '), h('small', null, '2020.09.11')])),
		h('ul', null, [
			h(
				'li',
				null,
				'Complete rewrite in TypeScript and restructure into a proper code base (',
				h('a', {href: 'https://github.com/qimasho/thread-media-viewer'}, 'github'),
				').'
			),
			h('li', null, 'Added catalog navigation to use same shortcuts to browse and open threads in catalogs.'),
			h('li', null, 'Added settings with knobs for pretty much everything.'),
			h('li', null, 'Added changelog (hi).'),
			h(
				'li',
				null,
				`Further optimized all media viewing features and interactions so they are more robust, stable, and responsive (except enter/exit fullscreen, all glitchiness and slow transitions there are browser's fault and I can't do anything about it T.T).`
			),
		]),
	]);
}
