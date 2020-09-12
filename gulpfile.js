const {promisify} = require('util');
const FS = require('fs');
const readFile = promisify(FS.readFile);
const gulp = require('gulp');
const clipboardy = require('clipboardy');
const esbuild = require('esbuild');

// Builds into clipboard
async function build() {
	try {
		const result = await esbuild.build({
			entryPoints: ['./src/index.ts'],
			minify: false,
			bundle: true,
			write: false,
		});

		if (result.outputFiles?.length > 0) {
			const meta = (await readFile('./meta'));
			const file = result.outputFiles[0];
			const buildString = Buffer.from(file.contents).toString();

			await clipboardy.write(`${meta.toString()}\n${buildString}`);
			console.log('Copied to clipboard:', (file.contents.byteLength / 1024).toFixed(2), 'KB');
		}
	} catch (error) {
		console.error(error);
	}
}

function watch() {
	gulp.watch(['meta', 'src/**/*'], build);
}

exports.build = build;
exports.watch = watch;
exports.default = gulp.series(build, watch);
