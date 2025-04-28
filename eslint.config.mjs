import {dirname} from "path";
import {fileURLToPath} from "url";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            // Correct format for the rule
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^",
                    varsIgnorePattern: "^",
                    caughtErrorsIgnorePattern: "^",
                    destructuredArrayIgnorePattern: "^"
                }
            ],
            "@typescript-eslint/no-empty-object-type": [
                "error",
                { allowObjectTypes: "always" },
            ],
            // Add this rule to allow 'any' type
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];

export default eslintConfig;