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
                {
                    argsIgnorePattern: "^",  // Ignore parameters
                    varsIgnorePattern: "^",   // Ignore variables
                    caughtErrorsIgnorePattern: "^", // Ignore caught errors
                    destructuredArrayIgnorePattern: "^", // Ignore destructured array elements
                },
            ],
            "@typescript-eslint/no-empty-object-type": [
                "error",
                { allowObjectTypes: "always" }, // Allow empty object types, NOT RECOMMENDED ON PRODUCTION
            ],
        },
    },
];

export default eslintConfig;