import { readFileSync, writeFileSync } from "fs";
import { minify } from "html-minifier-terser";

const INLINE_PATTERN = /<!--inline-"(.*?)"-->/g;

let resultHtml = `
	<!doctype html>
	<html lang="ru">
		<head><!--inline-"src/head.html"--></head>
		<body><!--inline-"src/body.html"--></body>
	</html>
`;

let match;
while ((match = INLINE_PATTERN.exec(resultHtml)) !== null) {
	resultHtml = resultHtml.replace(match[0], readFileSync(match[1]));
}

resultHtml = await minify(resultHtml, {
	collapseWhitespace: true,
	removeComments: true,
	minifyCSS: true,
	minifyJS: true,
	useShortDoctype: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	processConditionalComments: true,
	removeEmptyAttributes: true,
	removeOptionalTags: true,
});

writeFileSync("dist/index.html", resultHtml);
