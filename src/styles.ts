import {ns} from 'lib/utils';
import {ThreadMediaViewer} from 'components/ThreadMediaViewer';
import {CatalogNavigator} from 'components/CatalogNavigator';
import {ErrorBox} from 'components/ErrorBox';
import {MediaImage} from 'components/MediaImage';
import {MediaList} from 'components/MediaList';
import {MediaVideo} from 'components/MediaVideo';
import {MediaView} from 'components/MediaView';
import {Settings} from 'components/Settings';
import {SideView} from 'components/SideView';
import {Spinner} from 'components/Spinner';

const componentStyles = [
	ThreadMediaViewer,
	CatalogNavigator,
	ErrorBox,
	MediaImage,
	MediaList,
	MediaVideo,
	MediaView,
	Settings,
	SideView,
	Spinner,
]
	.map(({styles}) => styles)
	.join('\n');
const baseStyles = `
.${ns('CONTAINER')},
.${ns('CONTAINER')} *,
.${ns('CONTAINER')} *:before,
.${ns('CONTAINER')} *:after {
	box-sizing: border-box;
	font-family: inherit;
	line-height: 1.4;
}
.${ns('CONTAINER')} {
	font-family: arial, helvetica, sans-serif;
	font-size: 16px;
	color: #aaa;
}

.${ns('CONTAINER')} a { color: #c4b256 !important; }
.${ns('CONTAINER')} a:hover { color: #fde981 !important; }
.${ns('CONTAINER')} a:active { color: #000 !important; }

.${ns('CONTAINER')} input,
.${ns('CONTAINER')} button {
	box-sizing: border-box;
	display: inline-block;
	vertical-align: middle;
	margin: 0;
	padding: 0 0.3em;
	height: 1.6em;
	font-size: inherit;
	border-radius: 2px;
}
.${ns('CONTAINER')} input:focus { box-shadow: 0 0 0 3px #fff2; }
.${ns('CONTAINER')} input[type=text] {
	border: 0 !important;
	width: 8em;
	font-family: "Lucida Console", Monaco, monospace;
	color: #222;
}
.${ns('CONTAINER')} input[type=text].small { width: 4em; }
.${ns('CONTAINER')} input[type=text].large { width: 12em; }
.${ns('CONTAINER')} input[type=range] { width: 10em; }
.${ns('CONTAINER')} input[type=radio],
.${ns('CONTAINER')} input[type=range],

.${ns('CONTAINER')} input[type=checkbox] { padding: 0; }
.${ns('CONTAINER')} button {
	color: #fff;
	background: transparent;
	border: 1px solid #333;
}
.${ns('CONTAINER')} button:not(:disabled):hover {
	color: #222;
	background: #fff;
	border-color: #fff;
}
.${ns('CONTAINER')} button:disabled { opacity: .5; border-color: transparent; }

.${ns('CONTAINER')} h1,
.${ns('CONTAINER')} h2,
.${ns('CONTAINER')} h3 { margin: 0; font-weight: normal; color: #fff; }
.${ns('CONTAINER')} * + h1,
.${ns('CONTAINER')} * + h2,
.${ns('CONTAINER')} * + h3 { margin-top: 1em; }
.${ns('CONTAINER')} h1 { font-size: 1.5em !important; }
.${ns('CONTAINER')} h2 { font-size: 1.2em !important; }
.${ns('CONTAINER')} h3 { font-size: 1em !important; font-weight: bold; }

.${ns('CONTAINER')} ul { list-style: square; padding-left: 1em; margin: 1em 0; }
.${ns('CONTAINER')} ul.${ns('-clean')} { list-style: none; }
.${ns('CONTAINER')} li { padding: 0.3em 0; list-style: inherit; }
.${ns('CONTAINER')} code {
	font-family: "Lucida Console", Monaco, monospace;
	padding: 0;
	background-color: transparent;
	color: inherit;
}

.${ns('CONTAINER')} pre { white-space: pre-wrap; }
.${ns('CONTAINER')} kbd {
	padding: .17em .2em;
	font-family: "Lucida Console", Monaco, monospace;
	color: #fff;
	font-size: .95em;
	border-radius: 2px;
	background: #363f44;
	text-shadow: -1px -1px #0006;
	border: 0;
	box-shadow: none;
	line-height: inherit;
}

.${ns('CONTAINER')} dl { margin: 1em 0; }
.${ns('CONTAINER')} dt { font-weight: bold; }
.${ns('CONTAINER')} dd { margin: .1em 0 .8em; color: #888; }
.${ns('CONTAINER')} [title] { cursor: help; }
.${ns('CONTAINER')} .${ns('help-indicator')} {
	display: inline-block;
	vertical-align: middle;
	background: #333;
	color: #aaa;
	border-radius: 50%;
	width: 1.3em;
	height: 1.3em;
	text-align: center;
	font-size: .8em;
	line-height: 1.3;
}

.${ns('CONTAINER')} .${ns('help-indicator')}::after { content: '?'; }
.${ns('CONTAINER')} .${ns('-muted')} { opacity: .5; }
`;

GM_addStyle(baseStyles + componentStyles);
