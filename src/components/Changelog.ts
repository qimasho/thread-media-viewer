import {h} from 'lib/preact';
import {ns} from 'lib/utils';
import {defaultSettings, useSettings} from 'settings';

const TITLE = (version: string, date: string) =>
	h('h2', null, h('code', null, [version, h('span', {class: ns('-muted')}, ' ⬩ '), h('small', null, date)]));

export function Changelog() {
	const settings = useSettings();

	// Clear new version indicator
	if (settings.lastAcknowledgedVersion !== defaultSettings.lastAcknowledgedVersion) {
		settings.lastAcknowledgedVersion = defaultSettings.lastAcknowledgedVersion;
	}

	return h('div', {class: ns('Changelog')}, [
		h('h1', null, 'Changelog'),

		TITLE('2.1.1', '2020.09.13'),
		h('ul', null, [
			h('li', null, 'Added "Thumbnail fit" setting.'),
			h(
				'li',
				null,
				'Catalog cursor now pre-selects the item that is closest to the center of the screen instead of always the 1st one.'
			),
			h('li', null, 'Added new version indicator (changelog button turns green until clicked)'),
			h('li', null, 'Fixed video pausing when clicked with other then primary mouse buttons.'),
		]),

		TITLE('2.0.0', '2020.09.12'),
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
