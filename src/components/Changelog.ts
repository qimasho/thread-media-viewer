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

		TITLE('2.6.0', '2021.02.12'),
		h('ul', null, [
			h(
				'li',
				null,
				`Clicking on media in a thread will no longer scroll the media list box when it's open. I don't recall a single time this behavior was useful, but almost always annoying, making me loose scroll position in the list box, so... removed.`
			),
		]),

		TITLE('2.5.0', '2021.01.13'),
		h('ul', null, [
			h('li', null, `Re-arranged media view control buttons.`),
			h(
				'li',
				null,
				`Added a button to close media view for people that miss the existence of the mouse gesture and shortcut.`
			),
			h('li', null, `Some styling and UX tweaks/improvements.`),
		]),

		TITLE('2.4.0', '2020.11.05'),
		h('ul', null, [
			h('li', null, [
				`Settings are now saved in script's greasemonkey storage instead of website's localStorage. This makes settings persist between all websites the script runs on.`,
				h('br', {}),
				`Your old settings should migrate automatically, in a weird case they don't - sorry for the inconvenience.`,
			]),
		]),

		TITLE('2.3.0', '2020.10.26'),
		h('ul', null, [h('li', null, 'Added viewer control buttons (fullpage toggle and speed).')]),

		TITLE('2.2.1', '2020.09.26'),
		h('ul', null, [h('li', null, 'Fixed dragging timeline sometimes not resuming video properly.')]),

		TITLE('2.2.0', '2020.09.15'),
		h('ul', null, [
			h('li', null, 'Added shortcuts to adjust video speed and setting for the adjustment amount.'),
			h(
				'li',
				null,
				`Added shortcuts for tiny video seeking by configurable amount of milliseconds. This is a poor man's frame step in an environment where we don't know video framerate.`
			),
		]),

		TITLE('2.1.2', '2020.09.14'),
		h('ul', null, [
			h('li', null, 'Style tweaks.'),
			h(
				'li',
				null,
				'Added an option to click on the text portion of the thumbnail (media list) or thread title/snippet (catalog) to move cursor to that item.'
			),
		]),

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
