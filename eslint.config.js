import hooks from "eslint-plugin-react-hooks";

// Alcance: src/, scripts/ e os arquivos de configuracao da raiz. So o que a auditoria [3.3-B] pede:
// dependencia de hook (inclusive a do useMotion, que repassa as deps ao useEffect), HTML montado por texto e nome sem uso.
// O que o .gitignore ja ignora fica fora, para o lint de um clone limpo ser igual ao local.
const SEM_HTML = "Texto nao vira HTML: monte com JSX.";

// O `no-unused-vars` do ESLint nao enxerga o uso em JSX (`<Dock />`): esta regra marca o nome da tag como usado,
// como a `jsx-uses-vars` do eslint-plugin-react, sem trazer o plugin inteiro.
const jsx = {
  rules: {
    "uses-vars": {
      create: (context) => ({
        JSXOpeningElement(node) {
          let name = node.name;
          while (name.type === "JSXMemberExpression") name = name.object;
          if (name.type === "JSXIdentifier") context.sourceCode.markVariableAsUsed(name.name, node);
        },
      }),
    },
  },
};

export default [
  {
    ignores: [
      "node_modules/**", "dist/**", "dist-ssr/**", ".regressao/**", "output/**", "docs/**", "public/**",
      "source-media/**", ".claude/**", ".wrangler/**", ".playwright-cli/**", ".superpowers/**", "graphify-out/**",
      "scripts/verificar*.mjs", "scripts/medir-carga*", "scripts/retestar-*",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    linterOptions: { reportUnusedDisableDirectives: "error" },
    languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": hooks, jsx },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["error", { additionalHooks: "^useMotion$" }],
      "jsx/uses-vars": "error",
      "no-unused-vars": ["error", { ignoreRestSiblings: true, caughtErrors: "none" }],
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
  { files: ["src/components/ui/Wordmark.jsx"], rules: { "no-restricted-syntax": "off" } },
];
