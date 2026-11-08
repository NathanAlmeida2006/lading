import hooks from "eslint-plugin-react-hooks";

// Alcance: src/, scripts/ e os arquivos de configuracao da raiz. So o que a auditoria [3.3-B] pede:
// dependencia de hook (inclusive a do useMovimento, que repassa as deps ao useEffect) e HTML montado por texto.
// O que o .gitignore ja ignora fica fora, para o lint de um clone limpo ser igual ao local.
const SEM_HTML = "Texto nao vira HTML: monte com JSX.";

export default [
  {
    ignores: [
      "node_modules/**", "dist/**", "dist-ssr/**", ".regressao/**", "output/**", "docs/**", "public/**",
      "midia-fonte/**", ".claude/**", ".wrangler/**", ".playwright-cli/**", ".superpowers/**", "graphify-out/**",
      "scripts/verificar*.mjs", "!scripts/verificar-tamanho.mjs", "scripts/medir-carga*", "scripts/retestar-*",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    linterOptions: { reportUnusedDisableDirectives: "error" },
    languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["error", { additionalHooks: "^useMovimento$" }],
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: SEM_HTML },
        { selector: "Property[key.name='dangerouslySetInnerHTML']", message: SEM_HTML },
      ],
      "no-restricted-properties": [
        "error",
        ...["innerHTML", "outerHTML", "insertAdjacentHTML"].map((property) => ({ property, message: SEM_HTML })),
      ],
    },
  },
  // Unica excecao: o Wordmark injeta o SVG de src/assets/wordmark.svg (?raw, versionado, nao e entrada de terceiro).
  // O no-restricted-properties continua valendo no arquivo.
  { files: ["src/componentes/ui/Wordmark.jsx"], rules: { "no-restricted-syntax": "off" } },
];
