import {h, RenderableProps} from 'lib/preact';
import {ns} from 'lib/utils';

interface ErrorBoxProps {
	error?: Error | MediaError;
	message?: string;
}

export function ErrorBox({error, message}: RenderableProps<ErrorBoxProps>) {
	const code = (error as any)?.code;
	const msg = error?.message || message;
	return h('div', {class: ns('ErrorBox')}, [
		code != null && h('h1', null, `Error code: ${code}`),
		h('pre', null, h('code', null, `${msg ?? 'Unknown error'}`)),
	]);
}

ErrorBox.styles = `
.${ns('ErrorBox')} {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2em 2.5em;
	background: #a34;
	color: #fff;
}
.${ns('ErrorBox')} > h1 { font-size: 1.2em; margin: 0 0 1em; }
.${ns('ErrorBox')} > pre { margin: 0; }
`;
