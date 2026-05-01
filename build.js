import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { minify } from "html-minifier-terser";

const INLINE_PATTERN = /<!--inline-"(.*?)"-->/g;

let resultHtml = readFileSync("./src/index.html", "utf8");

let match;
while ((match = INLINE_PATTERN.exec(resultHtml)) !== null) {
	resultHtml = resultHtml.replace(match[0], readFileSync(match[1]));
}

resultHtml = await minify(resultHtml, {
	collapseWhitespace: true,
	removeComments: true,
	minifyCSS: true,
	minifyJS: {
		compress: {
			unsafe: true,
			unsafe_comps: true,
			toplevel: true,
		},
		mangle: {
			toplevel: true,
		},
	},
	useShortDoctype: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	processConditionalComments: true,
	removeEmptyAttributes: true,
	removeOptionalTags: true,
	sortClassName: true,
	sortAttributes: true,
	processScripts: ["application/ld+json"],
	removeAttributeQuotes: true,
});

mkdirSync("./dist", { recursive: true });
writeFileSync("./dist/index.html", resultHtml);
