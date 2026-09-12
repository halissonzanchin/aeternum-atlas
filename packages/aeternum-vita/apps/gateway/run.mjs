// Local Gateway entrypoint: reuse the workspace TypeScript compiler without installing tooling.
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// Reuse the running local Speech container credential only in this process.
if (!process.env.SPEECH_API_KEY) {
  try {
    const entries = JSON.parse(execFileSync('docker', ['inspect', '--format', '{{json .Config.Env}}', 'aeternum-vita-speech-1'], {encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000}));
    const entry = entries.find(value => value.startsWith('API_KEY='));
    if (entry) process.env.SPEECH_API_KEY = entry.slice('API_KEY='.length);
  } catch {
    console.warn('Local Speech credential unavailable; configure SPEECH_API_KEY for authenticated speech.');
  }
}

const sourceRoot = new URL('../../', import.meta.url).href;
registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot) && url.endsWith('.ts')) {
      const result = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        fileName: new URL(url).pathname,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: false }
      });
      return {format:'module',source:result.outputText,shortCircuit:true};
    }
    return nextLoad(url, context);
  }
});
await import('./src/index.ts');
