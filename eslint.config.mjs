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
            "@typescript-eslint/no-unused-vars": [
                "error",
                {argsIgnorePattern: "^", varsIgnorePattern: "^"},
            ],
            "@typescript-eslint/no-empty-object-type": [
                "error",
                { allowObjectTypes: "always" }, // Allow empty object types, NOT RECOMMENDED ON PRODUCTION
            ],
        },
    },
];

export default eslintConfig;
