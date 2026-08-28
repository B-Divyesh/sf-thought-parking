import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'graphify-out/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', '*.ts'],
    languageOptions: {
      globals: {
        Blob: 'readonly',
        caches: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        document: 'readonly',
        Event: 'readonly',
        fetch: 'readonly',
        FileReader: 'readonly',
        history: 'readonly',
        indexedDB: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        matchMedia: 'readonly',
        MediaRecorder: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        sessionStorage: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        window: 'readonly'
      }
    }
  },
  {
    files: ['public/sw.js', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        caches: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        Response: 'readonly',
        self: 'readonly',
        URL: 'readonly'
      }
    }
  }
);
