import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

/**
 * ESLint 설정 (flat config).
 *
 * 타입 검사는 `npm run build` 의 tsc 가 맡는다. 여기서는 tsc 가 잡지 못하는 것 —
 * 훅 규칙 위반, 쓰지 않는 변수, Fast Refresh 를 깨는 export — 을 본다.
 */
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 컴포넌트 파일에서 컴포넌트 외의 값을 함께 export 하면 Fast Refresh 가 깨진다.
      // 상수 export 는 실무에서 흔하므로 경고로만 알린다.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // 의도적으로 쓰지 않는 인자는 밑줄로 표시한다.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // effect 안에서 setState 를 부르지 말라는 React 19 의 성능 권고.
      // 이 프로젝트의 데이터 로딩 훅(useAsync)과 폼 초기화는 "요청 시작 → 로딩 표시" 를
      // effect 에서 켜는 통상적인 형태다. 규칙을 지키려면 Suspense 로 구조를 바꿔야 하는데
      // 그건 이 템플릿의 범위를 넘는다. 오류로 막지 않고 경고로 남겨 둔다.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // 테스트 파일에는 Vitest 전역이 들어온다.
    files: ['src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
)
