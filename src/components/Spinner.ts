import {h} from 'lib/preact';
import {ns} from 'lib/utils';

export function Spinner() {
	return h('div', {class: ns('Spinner')});
}

Spinner.styles = `
.${ns('Spinner')} {
	width: 1.6em;
	height: 1.6em;
}
.${ns('Spinner')}::after {
	content: '';
	display: block;
	width: 100%;
	height: 100%;
	animation: Spinner-rotate 500ms infinite linear;
	border: 0.1em solid #fffa;
	border-right-color: #1d1f21aa;
	border-left-color: #1d1f21aa;
	border-radius: 50%;
}

@keyframes Spinner-rotate {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
`;
