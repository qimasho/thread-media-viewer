import {h, RenderableProps} from 'lib/preact';
import {ns} from 'lib/utils';

interface SideViewProps {
	onClose: () => void;
}

export function SideView({onClose, children}: RenderableProps<SideViewProps>) {
	return h('div', {class: ns('SideView')}, [h('button', {class: ns('close'), onClick: onClose}, '×'), children]);
}

SideView.styles = `
/* Scrollbars in chrome since it doesn't support scrollbar-width */
.${ns('SideView')}::-webkit-scrollbar {
	width: 10px;
	background-color: transparent;
}
.${ns('SideView')}::-webkit-scrollbar-track {
	border: 0;
	background-color: transparent;
}
.${ns('SideView')}::-webkit-scrollbar-thumb {
	border: 0;
	background-color: #6f6f70;
}

.${ns('SideView')} {
	position: fixed;
	bottom: 0;
	left: 0;
	width: var(--media-list-width);
	height: calc(100vh - var(--media-list-height));
	padding: 1em 1.5em;
	color: #aaa;
	background: #161616;
	box-shadow: 0px 6px 0 3px #0003;
	overflow-x: hidden;
	overflow-y: auto;
	scrollbar-width: thin;
}
.${ns('SideView')} .${ns('close')} {
	position: sticky;
	top: 0;
	float: right;
	width: 1em;
	height: 1em;
	margin: 0 -.5em 0 0;
	padding: 0;
	background: transparent;
	border: 0;
	color: #eee;
	font-size: 2em !important;
	line-height: 1;
}
.${ns('SideView')} > *:last-child { padding-bottom: 1em; }
.${ns('SideView')} fieldset {
	border: 0;
	margin: 1em 0;
	padding: 0;
}
.${ns('SideView')} fieldset + fieldset { margin-top: 2em; }
.${ns('SideView')} fieldset > legend {
	margin: 0
	padding: 0;
	width: 100%;
}
.${ns('SideView')} fieldset > legend > .${ns('title')} {
	display: inline-block;
	font-size: 1.1em;
	color: #fff;
	min-width: 38%;
	text-align: right;
	font-weight: bold;
	vertical-align: middle;
}
.${ns('SideView')} fieldset > legend > .${ns('actions')} { display: inline-block; margin-left: 1em; }
.${ns('SideView')} fieldset > legend > .${ns('actions')} > button { height: 2em; margin-right: .3em; }
.${ns('SideView')} fieldset > article {
	display: flex;
	align-items: center;
	grid-gap: .5em 1em;
}
.${ns('SideView')} fieldset > * + article { margin-top: .8em; }
.${ns('SideView')} fieldset > article > header {
	flex: 0 0 38%;
	text-align: right;
	color: #fff;
}
.${ns('SideView')} fieldset > article > section { flex: 1 1 0; }

.${ns('SideView')} fieldset.${ns('-value-heavy')} > article > header { flex: 0 0 20%; }
.${ns('SideView')} fieldset.${ns('-compact')} > article { flex-wrap: wrap; }
.${ns('SideView')} fieldset.${ns('-compact')} legend { text-align: left; }
.${ns('SideView')} fieldset.${ns('-compact')} article > header {
	flex: 1 1 100%;
	margin-left: 1.5em;
	text-align: left;
}
.${ns('SideView')} fieldset.${ns('-compact')} article > section {
	flex: 1 1 100%;
	margin-left: 3em;
}
`;
