import {h, RenderableProps} from 'lib/preact';
import {ns} from 'lib/utils';
import {defaultSettings, useSettings} from 'settings';

interface SideNavProps {
	active: string | null;
	onActive: (name: string) => void;
}

export function SideNav({active, onActive}: RenderableProps<SideNavProps>) {
	const settings = useSettings();

	const isNewVersion = settings.lastAcknowledgedVersion !== defaultSettings.lastAcknowledgedVersion;

	function button(name: string, title: string, className?: string) {
		let classNames = '';
		if (active === name) classNames += ` ${ns('-active')}`;
		if (className) classNames += ` ${className}`;
		return h('button', {class: classNames, onClick: () => onActive(name)}, title);
	}

	return h('div', {class: ns('SideNav')}, [
		button('settings', '⚙ settings'),
		button('help', '? help'),
		button('changelog', '☲ changelog', isNewVersion ? ns('-success') : undefined),
	]);
}

SideNav.styles = `
.${ns('SideNav')} { display: flex; min-width: 0; }
.${ns('SideNav')} > button,
.${ns('SideNav')} > button:active {
	color: #eee;
	background: #1c1c1c;
	border: 0;
	outline: 0;
	border-radius: 2px;
	font-size: .911em;
	line-height: 1;
	height: 20px;
	padding: 0 .5em;
	white-space: nowrap;
	overflow: hidden;
}
.${ns('SideNav')} > button:hover {
	color: #fff;
	background: #333;
}
.${ns('SideNav')} > button + button {
	margin-left: 2px;
}
.${ns('SideNav')} > button.${ns('-active')} {
	color: #222;
	background: #ccc;
}
.${ns('SideNav')} > button.${ns('-success')} {
	color: #fff;
	background: #4b663f;
}
.${ns('SideNav')} > button.${ns('-success')}:hover {
	background: #b6eaa0;
}
`;
