import {h, useRef} from 'lib/preact';
import {ns, isOfType, keyEventId, withValue} from 'lib/utils';
import {useElementSize} from 'lib/hooks';
import {useSettings, defaultSettings, Settings as SettingsType} from 'settings';

const {round} = Math;

export function Settings() {
	const settings = useSettings();
	const containerRef = useRef<HTMLElement>(null);
	const [containerWidth] = useElementSize(containerRef, 'content-box', 100);

	// Binding shortcuts
	function handleShortcutsKeyDown(event: KeyboardEvent) {
		const target = event.target as any;

		if (!isOfType<HTMLInputElement>(target, target?.nodeName === 'INPUT')) return;
		if (target.name.indexOf('key') !== 0) return;
		// Need to ignore shift keys as there is a bunch of issues otherwise.
		// For example, Pressing Shift+Numpad2 triggers phantom Shift keydown event after Numpad2 is released...
		// Hopefully none want's to bind anything to Shift only.
		// How is anyone supposed to produce a good product in environment this unpredictable? I hate browsers so much.
		if (event.key === 'Shift') return;

		event.preventDefault();
		event.stopPropagation();

		(settings as any)[target.name] = keyEventId(event);
	}

	// Unbinding shortcuts
	function handleShortcutsMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;

		const target = event.target;
		if (!isOfType<HTMLButtonElement>(target, (target as any)?.nodeName === 'BUTTON')) return;

		const name = target.name;
		if (!isOfType<keyof SettingsType>(name, name in settings) || name.indexOf('key') !== 0) return;

		if (target.value === 'unbind') (settings as any)[name] = null;
		else if (target.value === 'reset') (settings as any)[name] = defaultSettings[name];
	}

	function shortcutsFieldset(title: string, shortcuts: [keyof SettingsType, string, string?][]) {
		function all(action: 'reset' | 'unbind') {
			settings._assign(
				shortcuts.reduce((acc, [name, title, flag]) => {
					if ((action !== 'unbind' || flag !== 'required') && name.indexOf('key') === 0) {
						acc[name] = (action === 'reset' ? defaultSettings[name] : null) as any;
					}
					return acc;
				}, {} as Partial<SettingsType>) as Partial<SettingsType>
			);
		}

		return h(
			'fieldset',
			{...compactPropsS, onKeyDown: handleShortcutsKeyDown, onMouseDown: handleShortcutsMouseDown},
			[
				h('legend', null, [
					h('span', {class: ns('title')}, title),
					h('span', {class: ns('actions')}, [
						h(
							'button',
							{class: ns('reset'), title: 'Reset category', onClick: () => all('reset')},
							'↻ reset'
						),
						h(
							'button',
							{class: ns('unbind'), title: 'Unbind category', onClick: () => all('unbind')},
							'⦸ unbind'
						),
					]),
				]),
				shortcuts.map(([name, title, flag]) => shortcutItem(name as keyof SettingsType, title, flag)),
			]
		);
	}

	function shortcutItem(name: keyof SettingsType, title: string, flag?: string) {
		const isDefault = settings[name] === defaultSettings[name];
		return h('article', null, [
			h('header', null, title),
			h('section', null, [
				h('input', {
					type: 'text',
					name,
					value: settings[name] || '',
					placeholder: !settings[name] ? 'unbound' : undefined,
				}),
				h(
					'button',
					{
						class: ns('reset'),
						name,
						value: 'reset',
						title: isDefault ? 'Default value' : 'Reset to default',
						disabled: isDefault,
					},
					isDefault ? '⦿' : '↻'
				),
				flag === 'required'
					? h('button', {class: ns('unbind'), title: `Required, can't unbind`, disabled: true}, '⚠')
					: settings[name] !== null &&
					  h('button', {class: ns('unbind'), name, value: 'unbind', title: 'Unbind'}, '⦸'),
			]),
		]);
	}

	const compactPropsM = containerWidth && containerWidth < 450 ? {class: ns('-compact')} : null;
	const compactPropsS = containerWidth && containerWidth < 340 ? compactPropsM : null;

	return h('div', {class: ns('Settings'), ref: containerRef}, [
		h('h1', null, ['Settings ']),
		h(
			'button',
			{class: ns('defaults'), onClick: settings._reset, title: 'Reset all settings to default values.'},
			'↻ defaults'
		),

		h('fieldset', compactPropsM, [
			h('article', null, [
				h('header', null, 'Media list width × height'),
				h(
					'section',
					null,
					h('code', null, [
						`${settings.mediaListWidth}px × ${round(settings.mediaListHeight * 100)}%`,
						' ',
						h('small', null, '(drag edges)'),
					])
				),
			]),

			h('article', null, [
				h('header', null, 'Items per row'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 2,
						max: 6,
						step: 1,
						name: 'mediaListItemsPerRow',
						value: settings.mediaListItemsPerRow,
						onInput: withValue((value) => {
							const defaultValue = settings._defaults.mediaListItemsPerRow;
							settings.mediaListItemsPerRow = parseInt(value, 10) || defaultValue;
						}),
					}),
					' ',
					h('code', null, settings.mediaListItemsPerRow),
				]),
			]),

			h('article', null, [
				h('header', null, 'Thumbnail fit'),
				h('section', null, [
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'thumbnailFit',
							value: 'contain',
							checked: settings.thumbnailFit === 'contain',
							onInput: () => (settings.thumbnailFit = 'contain'),
						}),
						' contain',
					]),
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'thumbnailFit',
							value: 'cover',
							checked: settings.thumbnailFit === 'cover',
							onInput: () => (settings.thumbnailFit = 'cover'),
						}),
						' cover',
					]),
				]),
			]),
		]),

		h('fieldset', compactPropsM, [
			h('legend', null, h('span', {class: ns('title')}, 'Full page mode')),

			h('article', null, [
				h('header', null, [
					'Activation ',
					h('small', {class: ns('-muted')}, [
						'key: ',
						h('kbd', {title: 'Rebind below.'}, `${settings.keyViewFullPage}`),
					]),
				]),
				h('section', null, [
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'fpmActivation',
							value: 'hold',
							checked: settings.fpmActivation === 'hold',
							onInput: () => (settings.fpmActivation = 'hold'),
						}),
						' hold',
					]),
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'fpmActivation',
							value: 'toggle',
							checked: settings.fpmActivation === 'toggle',
							onInput: () => (settings.fpmActivation = 'toggle'),
						}),
						' toggle',
					]),
				]),
			]),

			h('article', null, [
				h(
					'header',
					{
						title: `Upscale only videos that cover less than ${round(
							round(settings.fpmVideoUpscaleThreshold * 100)
						)}% of the available dimensions (width<threshold and height<threshold).
Set to 100% to always upscale if video is smaller than available area.
Set to 0% to never upscale.`,
					},
					[h('span', {class: ns('help-indicator')}), ' Video upscale threshold']
				),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 0,
						max: 1,
						step: 0.05,
						name: 'fpmVideoUpscaleThreshold',
						value: settings.fpmVideoUpscaleThreshold,
						onInput: withValue((value) => (settings.fpmVideoUpscaleThreshold = parseFloat(value) || 0)),
					}),
					' ',
					h(
						'code',
						null,
						settings.fpmVideoUpscaleThreshold === 0
							? '⦸'
							: `${round(settings.fpmVideoUpscaleThreshold * 100)}%`
					),
				]),
			]),

			h('article', null, [
				h(
					'header',
					{
						title: `Don't upscale videos more than ${settings.fpmVideoUpscaleLimit}x of their original size.`,
					},
					[h('span', {class: ns('help-indicator')}), ' Video upscale limit']
				),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 1,
						max: 10,
						step: 0.5,
						name: 'fpmVideoUpscaleLimit',
						value: settings.fpmVideoUpscaleLimit,
						onInput: withValue((value) => (settings.fpmVideoUpscaleLimit = parseInt(value, 10) || 0.025)),
					}),
					' ',
					h('code', null, settings.fpmVideoUpscaleLimit === 1 ? '⦸' : `${settings.fpmVideoUpscaleLimit}x`),
				]),
			]),

			h('article', null, [
				h(
					'header',
					{
						class: ns('title'),
						title: `Upscale only images that cover less than ${round(
							round(settings.fpmImageUpscaleThreshold * 100)
						)}% of the available dimensions (width<threshold and height<threshold).
Set to 100% to always upscale if image is smaller than available area.
Set to 0% to never upscale.`,
					},
					[h('span', {class: ns('help-indicator')}), ' Image upscale threshold']
				),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 0,
						max: 1,
						step: 0.05,
						name: 'fpmImageUpscaleThreshold',
						value: settings.fpmImageUpscaleThreshold,
						onInput: withValue((value) => (settings.fpmImageUpscaleThreshold = parseFloat(value) || 0)),
					}),
					' ',
					h(
						'code',
						null,
						settings.fpmImageUpscaleThreshold === 0
							? '⦸'
							: `${round(settings.fpmImageUpscaleThreshold * 100)}%`
					),
				]),
			]),

			h('article', null, [
				h(
					'header',
					{
						title: `Don't upscale images more than ${settings.fpmImageUpscaleLimit}x of their original size.`,
					},
					[h('span', {class: ns('help-indicator')}), ' Image upscale limit']
				),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 1,
						max: 10,
						step: 0.5,
						name: 'fpmImageUpscaleLimit',
						value: settings.fpmImageUpscaleLimit,
						onInput: withValue((value) => (settings.fpmImageUpscaleLimit = parseInt(value, 10) || 0.025)),
					}),
					' ',
					h('code', null, settings.fpmImageUpscaleLimit === 1 ? '⦸' : `${settings.fpmImageUpscaleLimit}x`),
				]),
			]),
		]),

		h('fieldset', compactPropsM, [
			h('legend', null, h('span', {class: ns('title')}, 'Video player')),

			h('article', null, [
				h('header', null, 'Volume'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 0,
						max: 1,
						step: settings.adjustVolumeBy,
						name: 'volume',
						value: settings.volume,
						onInput: withValue((value) => (settings.volume = parseFloat(value) || 0.025)),
					}),
					' ',
					h('code', null, `${(settings.volume * 100).toFixed(1)}%`),
				]),
			]),

			h('article', null, [
				h('header', null, 'Adjust volume by'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 0.025,
						max: 0.5,
						step: 0.025,
						name: 'adjustVolumeBy',
						value: settings.adjustVolumeBy,
						onInput: withValue((value) => (settings.adjustVolumeBy = parseFloat(value) || 0.025)),
					}),
					' ',
					h('code', null, `${(settings.adjustVolumeBy * 100).toFixed(1)}%`),
				]),
			]),

			h('article', null, [
				h('header', null, 'Adjust speed by'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 0.05,
						max: 1,
						step: 0.05,
						name: 'adjustSpeedBy',
						value: settings.adjustSpeedBy,
						onInput: withValue((value) => (settings.adjustSpeedBy = parseFloat(value) || 0.025)),
					}),
					' ',
					h('code', null, `${(settings.adjustSpeedBy * 100).toFixed(1)}%`),
				]),
			]),

			h('article', null, [
				h('header', null, 'Seek by'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 1,
						max: 60,
						step: 1,
						name: 'seekBy',
						value: settings.seekBy,
						onInput: withValue((value) => (settings.seekBy = parseInt(value, 10) || 0.025)),
					}),
					' ',
					h('code', null, `${settings.seekBy} seconds`),
				]),
			]),

			h('article', null, [
				h('header', null, 'End time format'),
				h('section', null, [
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'endTimeFormat',
							value: 'total',
							checked: settings.endTimeFormat === 'total',
							onInput: () => (settings.endTimeFormat = 'total'),
						}),
						' total',
					]),
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'endTimeFormat',
							value: 'remaining',
							checked: settings.endTimeFormat === 'remaining',
							onInput: () => (settings.endTimeFormat = 'remaining'),
						}),
						' remaining',
					]),
				]),
			]),

			h('article', null, [
				h('header', null, [
					'Fast forward activation',
					' ',
					h('small', {class: ns('-muted'), style: 'white-space: nowrap'}, [
						'key: ',
						h('kbd', {title: 'Rebind below.'}, `${settings.keyViewFastForward}`),
					]),
				]),
				h('section', null, [
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'fastForwardActivation',
							value: 'hold',
							checked: settings.fastForwardActivation === 'hold',
							onInput: () => (settings.fastForwardActivation = 'hold'),
						}),
						' hold',
					]),
					h('label', null, [
						h('input', {
							type: 'radio',
							name: 'fastForwardActivation',
							value: 'toggle',
							checked: settings.fastForwardActivation === 'toggle',
							onInput: () => (settings.fastForwardActivation = 'toggle'),
						}),
						' toggle',
					]),
				]),
			]),

			h('article', null, [
				h('header', null, 'Fast forward rate'),
				h('section', null, [
					h('input', {
						type: 'range',
						min: 1.5,
						max: 10,
						step: 0.5,
						name: 'fastForwardRate',
						value: settings.fastForwardRate,
						onInput: withValue((value) => (settings.fastForwardRate = Math.max(1, parseFloat(value) || 2))),
					}),
					' ',
					h('code', null, `${settings.fastForwardRate.toFixed(1)}x`),
				]),
			]),
		]),

		h('fieldset', null, [
			h('legend', null, h('span', {class: ns('title')}, 'Catalog navigator')),

			h('article', null, [
				h('header', null, 'Enabled'),
				h('section', null, [
					h('input', {
						type: 'checkbox',
						name: 'catalogNavigator',
						value: 'toggle',
						checked: settings.catalogNavigator,
						onInput: (event: InputEvent) => (settings.catalogNavigator = (event.target as any)?.checked),
					}),
				]),
			]),
		]),

		shortcutsFieldset('Navigation shortcuts', [
			['keyToggleUI', 'Toggle UI', 'required'],
			['keyNavLeft', 'Select left'],
			['keyNavRight', 'Select right'],
			['keyNavUp', 'Select up'],
			['keyNavDown', 'Select down'],
			['keyNavPageBack', 'Page back'],
			['keyNavPageForward', 'Page forward'],
			['keyNavStart', 'To start'],
			['keyNavEnd', 'To end'],
		]),

		shortcutsFieldset('Media list shortcuts', [
			['keyListViewToggle', 'View selected'],
			['keyListViewLeft', 'Select left & view'],
			['keyListViewRight', 'Select right & view'],
			['keyListViewUp', 'Select up & view'],
			['keyListViewDown', 'Select down & view'],
		]),

		shortcutsFieldset('Media view shortcuts', [
			['keyViewClose', 'Close view'],
			['keyViewFullPage', 'Full page mode'],
			['keyViewFullScreen', 'Full screen mode'],
			['keyViewPause', 'Pause'],
			['keyViewFastForward', 'Fast forward'],
			['keyViewVolumeDown', 'Volume down'],
			['keyViewVolumeUp', 'Volume up'],
			['keyViewSpeedDown', 'Speed down'],
			['keyViewSpeedUp', 'Speed up'],
			['keyViewSpeedReset', 'Speed reset'],
			['keyViewSeekBack', 'Seek back'],
			['keyViewSeekForward', 'Seek forward'],
			['keyViewSeekTo0', 'Seek to 0%'],
			['keyViewSeekTo10', 'Seek to 10%'],
			['keyViewSeekTo20', 'Seek to 20%'],
			['keyViewSeekTo30', 'Seek to 30%'],
			['keyViewSeekTo40', 'Seek to 40%'],
			['keyViewSeekTo50', 'Seek to 50%'],
			['keyViewSeekTo60', 'Seek to 60%'],
			['keyViewSeekTo70', 'Seek to 70%'],
			['keyViewSeekTo80', 'Seek to 80%'],
			['keyViewSeekTo90', 'Seek to 90%'],
		]),

		shortcutsFieldset('Catalog shortcuts', [
			['keyCatalogOpenThread', 'Open'],
			['keyCatalogOpenThreadInNewTab', 'Open in new tab'],
			['keyCatalogOpenThreadInBackgroundTab', 'Open in background tab'],
		]),
	]);
}

Settings.styles = `
.${ns('Settings')} .${ns('defaults')} {
	position: absolute;
	top: 1em; right: 4em;
	height: 2em;
}
.${ns('Settings')} label {
	margin-right: .5em;
	background: #fff1;
	padding: .3em;
	border-radius: 2px;
}
.${ns('Settings')} input::placeholder {
	font-style: italic;
	color: #000a;
	font-size: .9em;
}
.${ns('Settings')} button.${ns('reset')}:not(:disabled):hover {
	color: #fff;
	border-color: #1196bf;
	background: #1196bf;
}
.${ns('Settings')} button.${ns('unbind')}:not(:disabled):hover {
	color: #fff;
	border-color: #f44;
	background: #f44;
}
.${ns('Settings')} article button.${ns('reset')},
.${ns('Settings')} article button.${ns('unbind')} { margin-left: 0.3em; }
`;
