import { defineConfig } from '@rsbuild/core';

export default defineConfig({
    mode: 'production',
    html: {
        template: './src/template.html',
        scriptLoading: 'defer',
    },
    performance: {
        removeConsole: true,
    },
    output: {
        legalComments: 'none',
        minify: true,
        sourceMap: { js: false, css: false, },
        inlineScripts: true,
        inlineStyles: true,
    },
});
