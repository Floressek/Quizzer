import OpenAI from "openai";
import {logger} from "./server-logger";

// Inicjalizacja klienta OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface OutputFormat {
    [key: string]: string | string[] | OutputFormat;
}

// Interfejs dla pojedynczego elementu wyjściowego
export interface OutputItem {
    [key: string]: string | string[] | OutputItem;
}

export async function strict_output(
    system_prompt: string,
    user_prompt: string | string[],
    output_format: OutputFormat,
    default_category: string = "",
    output_value_only: boolean = false,
    model: string = "gpt-4o-2024-08-06", // Domyślnie nowszy model
    temperature: number = 1,
    num_tries: number = 3,
    verbose: boolean = false,
    verify_content: boolean = true
) {
    logger.debug(`[strict_output] Rozpoczęcie generowania. Model: ${model}, liczba prób: ${num_tries}`);

    // if the user input is in a list, we also process the output as a list of json
    const list_input: boolean = Array.isArray(user_prompt);
    // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
    const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
    // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
    const list_output: boolean = /\[.*?]/.test(JSON.stringify(output_format));

    if (list_input) {
        logger.debug(`[strict_output] Wykryto ${Array.isArray(user_prompt) ? user_prompt.length : 0} promptów wejściowych`);
    }

    // start off with no error message
    let error_msg: string = "";

    // Dla wielu promptów, używamy podejścia z grupowaniem
    if (list_input && Array.isArray(user_prompt) && user_prompt.length > 1) {
        // Maksymalna liczba promptów w jednej grupie
        const BATCH_SIZE = 10;

        // Liczba grup
        const numBatches = Math.ceil(user_prompt.length / BATCH_SIZE);

        if (numBatches > 1) {
            logger.debug(`[strict_output] Przetwarzanie ${user_prompt.length} promptów w ${numBatches} grupach po ${BATCH_SIZE}`);
            const results: OutputItem[] = [];

            // Przetwarzamy grupami
            for (let i = 0; i < numBatches; i++) {
                const start = i * BATCH_SIZE;
                const end = Math.min(start + BATCH_SIZE, user_prompt.length);
                const batchPrompts = user_prompt.slice(start, end);

                logger.debug(`[strict_output] Grupa ${i + 1}/${numBatches}: prompty ${start + 1}-${end}`);

                try {
                    const batchResults = await strict_output(
                        system_prompt,
                        batchPrompts,
                        output_format,
                        default_category,
                        output_value_only,
                        model,
                        temperature,
                        num_tries,
                        verbose,
                        verify_content
                    );

                    if (Array.isArray(batchResults)) {
                        results.push(...batchResults);
                        logger.debug(`[strict_output] Grupa ${i + 1}: otrzymano ${batchResults.length} wyników`);
                    } else {
                        results.push(batchResults as OutputItem);
                        logger.debug(`[strict_output] Grupa ${i + 1}: otrzymano 1 wynik`);
                    }
                } catch (error) {
                    logger.error(`[strict_output] Błąd podczas przetwarzania grupy ${i + 1}:`, error);

                    // Dodajemy puste wyniki dla wszystkich promptów w tej grupie
                    for (let j = 0; j < batchPrompts.length; j++) {
                        const emptyResult: any = {};
                        for (const key in output_format) {
                            if (Array.isArray(output_format[key])) {
                                emptyResult[key] = default_category || "N/A";
                            } else if (output_format[key] === "string") {
                                emptyResult[key] = "N/A";
                            } else {
                                emptyResult[key] = null;
                            }
                        }
                        results.push(emptyResult);
                    }
                }
            }

            logger.debug(`[strict_output] Zakończono przetwarzanie grup, zwracam ${results.length}/${user_prompt.length} wyników`);
            return results;
        }
    }

    for (let i = 0; i < num_tries; i++) {
        logger.debug(`[strict_output] Próba ${i + 1}/${num_tries}`);
        try {
            // Wybieramy odpowiedni format instrukcji w zależności od liczby promptów
            let format_instruction: string;

            // Dla tablicy promptów używamy specjalnego formatu, który wymusza wiele odpowiedzi
            if (list_input) {
                const promptCount = Array.isArray(user_prompt) ? user_prompt.length : 1;

                format_instruction = `
                You need to generate exactly ${promptCount} different items based on the ${promptCount} prompts I provide.
                
                IMPORTANT: Your response must contain EXACTLY ${promptCount} items, one for each prompt.
                
                For EACH item, use this JSON format: ${JSON.stringify(output_format)}
                
                Return your answer as a JSON object with a single key "items" containing an array of ${promptCount} objects, like this:
                {
                  "items": [
                    ${Array(Math.min(3, promptCount)).fill(JSON.stringify(output_format)).join(",\n    ")}
                    ${promptCount > 3 ? ",\n    ..." : ""}
                  ]
                }
                
                Ensure each item is different and specifically tailored to its corresponding prompt.
                Do not generate duplicate content between items.
                `;
            } else {
                // Dla pojedynczego promptu używamy standardowego formatu
                format_instruction = `
                Return your answer as a JSON object using this format: ${JSON.stringify(output_format)}
                `;
            }

            // Dodatkowe instrukcje dla specjalnych formatów
            if (list_output) {
                format_instruction += `\nIf output field is a list, classify output into the best element of the list.`;
            }

            if (dynamic_elements) {
                format_instruction += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
            }

            // Przygotuj treść zapytania
            let userContent;
            if (list_input && Array.isArray(user_prompt)) {
                // Formatujemy czytelną listę promptów z numeracją
                userContent = `Generate answers for the following ${user_prompt.length} prompts:\n\n` +
                    user_prompt.map((p, idx) => `PROMPT ${idx + 1}: ${p}`).join('\n\n');
            } else {
                userContent = user_prompt.toString();
            }

            logger.debug(`[strict_output] Wysyłanie zapytania do API, długość promptu: ${userContent.length} znaków`);

            // Użyj OpenAI z JSON mode
            const response = await openai.chat.completions.create({
                temperature: temperature,
                model: model,
                response_format: {type: "json_object"},
                messages: [
                    {
                        role: "system",
                        content: system_prompt + "\n" + format_instruction + error_msg,
                    },
                    {
                        role: "user",
                        content: userContent
                    },
                ],
            });

            const content = response.choices[0].message?.content || "{}";
            logger.debug(`[strict_output] Otrzymano odpowiedź, długość: ${content.length} znaków`);

            if (verbose) {
                logger.debug("System prompt:", system_prompt + "\n" + format_instruction + error_msg);
                logger.debug("\nUser prompt:", userContent);
                logger.debug("\nGPT response:", content);
            }

            // Parsowanie i obsługa odpowiedzi
            try {
                const parsedOutput = JSON.parse(content);
                let output: OutputItem[] = [];

                // Próbujemy wyciągnąć elementy z różnych możliwych formatów odpowiedzi
                if (list_input) {
                    // Najpierw sprawdzamy format z "items"
                    if (parsedOutput.items && Array.isArray(parsedOutput.items)) {
                        output = parsedOutput.items;
                        logger.debug(`[strict_output] Znaleziono ${output.length} elementów w formacie "items"`);
                    }
                    // Następnie format z "results"
                    else if (parsedOutput.results && Array.isArray(parsedOutput.results)) {
                        output = parsedOutput.results;
                        logger.debug(`[strict_output] Znaleziono ${output.length} elementów w formacie "results"`);
                    }
                    // Sprawdzamy, czy to array bezpośrednio
                    else if (Array.isArray(parsedOutput)) {
                        output = parsedOutput;
                        logger.debug(`[strict_output] Znaleziono ${output.length} elementów w tablicy bezpośredniej`);
                    }
                    // Sprawdzamy, czy to obiekt z numerycznymi kluczami
                    else if (typeof parsedOutput === 'object' && parsedOutput !== null) {
                        const keys = Object.keys(parsedOutput);
                        const isNumericObject = keys.some(key => !isNaN(Number(key)));

                        if (isNumericObject) {
                            output = Object.values(parsedOutput);
                            logger.debug(`[strict_output] Znaleziono ${output.length} elementów w obiekcie z kluczami numerycznymi`);
                        } else {
                            // Jeśli to pojedynczy obiekt, opakowujemy go
                            output = [parsedOutput];
                            logger.debug(`[strict_output] Znaleziono pojedynczy obiekt, opakowuję w tablicę`);
                        }
                    } else {
                        throw new Error("Nieprawidłowy format odpowiedzi, brak oczekiwanej struktury");
                    }

                    // Sprawdź liczbę elementów
                    if (Array.isArray(user_prompt) && output.length !== user_prompt.length) {
                        if (i < num_tries - 1) {
                            logger.warn(`[strict_output] Niezgodna liczba odpowiedzi: ${output.length}/${user_prompt.length}. Ponawiam próbę...`);
                            error_msg = `\n\nERROR: I asked for exactly ${user_prompt.length} items but you generated ${output.length}. Please generate EXACTLY ${user_prompt.length} items, one for each prompt.`;
                            throw new Error(`Incorrect number of items (${output.length} vs expected ${user_prompt.length})`);
                        } else {
                            logger.warn(`[strict_output] Niezgodna liczba odpowiedzi w ostatniej próbie: ${output.length}/${user_prompt.length}`);

                            // W ostatniej próbie, dopasowujemy liczbę elementów
                            if (output.length < user_prompt.length) {
                                logger.debug(`[strict_output] Dodaję ${user_prompt.length - output.length} brakujących elementów`);
                                // Dodaj brakujące elementy
                                while (output.length < user_prompt.length) {
                                    const emptyItem: any = {};
                                    for (const key in output_format) {
                                        if (Array.isArray(output_format[key])) {
                                            emptyItem[key] = default_category || "N/A";
                                        } else if (output_format[key] === "string") {
                                            emptyItem[key] = "N/A";
                                        } else {
                                            emptyItem[key] = null;
                                        }
                                    }
                                    output.push(emptyItem);
                                }
                            } else if (output.length > user_prompt.length) {
                                logger.debug(`[strict_output] Przycinam ${output.length - user_prompt.length} nadmiarowych elementów`);
                                // Przytnij nadmiarowe elementy
                                output = output.slice(0, user_prompt.length);
                            }
                        }
                    }
                } else {
                    // Dla pojedynczego promptu
                    output = [parsedOutput];
                    logger.debug(`[strict_output] Przetworzono pojedynczy prompt`);
                }

                // Sprawdź poprawność formatu każdego elementu
                logger.debug(`[strict_output] Walidacja ${output.length} elementów wyjściowych...`);
                let missingFields = 0;

                for (let index = 0; index < output.length; index++) {
                    for (const key in output_format) {
                        // Pomijamy sprawdzanie dynamicznych nagłówków
                        if (/<.*?>/.test(key)) {
                            continue;
                        }

                        // Jeśli brakuje pola wyjściowego, zgłaszamy błąd lub dodajemy wartość domyślną
                        if (!(key in output[index])) {
                            missingFields++;
                            if (i < num_tries - 1) {
                                throw new Error(`Brakujące pole '${key}' w elemencie ${index}`);
                            } else {
                                logger.warn(`[strict_output] Brakujące pole '${key}' w elemencie ${index}, dodaję wartość domyślną`);
                                if (Array.isArray(output_format[key])) {
                                    output[index][key] = default_category || "N/A";
                                } else if (output_format[key] === "string") {
                                    output[index][key] = "N/A";
                                }
                            }
                        }

                        // Sprawdzamy, czy jeden z wyborów podanych dla listy słów jest poprawny
                        if (Array.isArray(output_format[key])) {
                            const choices = output_format[key] as string[];
                            // Upewniamy się, że wyjście nie jest listą
                            if (Array.isArray(output[index][key])) {
                                output[index][key] = (output[index][key] as string[])[0];
                            }
                            // Używamy kategorii domyślnej, jeśli trzeba
                            if (!choices.includes(output[index][key] as string) && default_category) {
                                output[index][key] = default_category;
                            }
                            // Jeśli wyjście jest w formacie opisu, pobierz tylko etykietę
                            if ((output[index][key] as string)?.includes?.(':')) {
                                output[index][key] = (output[index][key] as string).split(":")[0];
                            }
                        }
                    }

                    // Jeśli chcemy tylko wartości dla wyjść
                    if (output_value_only) {
                        const values = Object.values(output[index]);
                        if (values.length === 1) {
                            output[index] = {value: values[0]} as unknown as OutputItem;
                        } else {
                            output[index] = {values: values} as unknown as OutputItem;
                        }
                    }
                }

                if (missingFields > 0) {
                    logger.warn(`[strict_output] Uzupełniono ${missingFields} brakujących pól`);
                } else {
                    logger.debug(`[strict_output] Wszystkie elementy mają prawidłową strukturę`);
                }

                // Weryfikacja tematyczna treści, jeśli jest włączona
                if (verify_content && output.length > 0) {
                    logger.debug(`[strict_output] Rozpoczęcie weryfikacji tematycznej treści...`);
                    try {
                        if (list_input) {
                            // Dla listy, weryfikujemy każdy element osobno
                            logger.debug(`[strict_output] Weryfikacja ${output.length} elementów osobno`);
                            const verifiedOutput: OutputItem[] = [];
                            let verifiedCount = 0;

                            for (let j = 0; j < output.length; j++) {
                                try {
                                    const singlePrompt = Array.isArray(user_prompt) ? user_prompt[j] : user_prompt;
                                    const verifiedItem = await verifyJsonOutput(
                                        output[j],
                                        output_format,
                                        singlePrompt,
                                        system_prompt
                                    );
                                    verifiedOutput.push(verifiedItem as OutputItem);
                                    verifiedCount++;
                                } catch (verifyError) {
                                    logger.warn(`[strict_output] Błąd weryfikacji elementu ${j}:`, verifyError);
                                    verifiedOutput.push(output[j]);
                                }
                            }

                            logger.debug(`[strict_output] Pomyślnie zweryfikowano ${verifiedCount}/${output.length} elementów`);
                            return verifiedOutput;
                        } else {
                            // Dla pojedynczego elementu
                            logger.debug(`[strict_output] Weryfikacja pojedynczego elementu`);
                            const verifiedResult = await verifyJsonOutput(
                                output[0],
                                output_format,
                                user_prompt,
                                system_prompt
                            );
                            logger.debug(`[strict_output] Weryfikacja zakończona pomyślnie`);
                            return verifiedResult;
                        }
                    } catch (verifyError) {
                        logger.warn(`[strict_output] Błąd podczas weryfikacji treści:`, verifyError);
                        // W przypadku błędu weryfikacji, zwracamy oryginalny wynik
                        return list_input ? output : output[0];
                    }
                } else {
                    logger.debug(`[strict_output] Pomijam weryfikację treści, zwracam wyniki bezpośrednio`);
                    return list_input ? output : output[0];
                }
            } catch (e) {
                const error = e as Error;
                error_msg = `\n\nError: ${error.message}\nPlease try again and ensure your output is a valid JSON matching the required format.`;
                logger.warn(`[strict_output] Błąd przetwarzania JSON (próba ${i + 1}/${num_tries}): ${error.message}`);

                // Jeśli to ostatnia próba, dodajmy plan awaryjny z alternatywnym modelem
                if (i === num_tries - 1 && model === "gpt-4o-2024-08-06") {
                    logger.debug(`[strict_output] Przełączam na alternatywny model gpt-4o-mini...`);

                    // Rekurencyjne wywołanie z alternatywnym modelem
                    try {
                        return await strict_output(
                            system_prompt,
                            user_prompt,
                            output_format,
                            default_category,
                            output_value_only,
                            "gpt-4o-mini", // Model zapasowy
                            temperature,
                            1, // Jedna próba z modelem zapasowym
                            verbose,
                            verify_content
                        );
                    } catch (fallbackError) {
                        logger.error(`[strict_output] Alternatywny model również zawiódł:`, fallbackError);
                    }
                }
            }
        } catch (e) {
            const error = e as Error;
            error_msg = `\n\nError: ${error.message}\nPlease try again and ensure your output is a valid JSON matching the required format.`;
            logger.warn(`[strict_output] Błąd wywołania API (próba ${i + 1}/${num_tries}): ${error.message}`);

            if (i === num_tries - 1) {
                logger.error(`[strict_output] Wszystkie próby wywołania API zawiodły`);
            }
        }
    }

    // Jeśli wszystkie próby zawiodły, tworzymy puste struktury dla każdego elementu
    if (list_input && Array.isArray(user_prompt)) {
        const emptyResults: OutputItem[] = [];
        for (let i = 0; i < user_prompt.length; i++) {
            const emptyItem: any = {};
            for (const key in output_format) {
                if (Array.isArray(output_format[key])) {
                    emptyItem[key] = default_category || "N/A";
                } else if (output_format[key] === "string") {
                    emptyItem[key] = "N/A";
                } else {
                    emptyItem[key] = null;
                }
            }
            emptyResults.push(emptyItem);
        }
        logger.warn(`[strict_output] Wszystkie próby nie powiodły się, zwracam pustą strukturę z ${emptyResults.length} elementami`);
        return emptyResults;
    }

    logger.error(`[strict_output] Wszystkie próby nie powiodły się, zwracam pusty wynik`);
    return list_input ? [] as OutputItem[] : {} as OutputItem;
}

// Funkcja weryfikująca poprawność JSON i jego zawartości tematycznej
export async function verifyJsonOutput(
    jsonOutput: OutputItem | OutputItem[],
    output_format: OutputFormat,
    user_prompt: string | string[],
    system_prompt: string = "Jesteś ekspertem w weryfikacji danych."
): Promise<OutputItem | OutputItem[]> {
    // Jeśli otrzymaliśmy pusty obiekt lub tablicę, nie ma co weryfikować
    if (
        (Array.isArray(jsonOutput) && jsonOutput.length === 0) ||
        (typeof jsonOutput === 'object' && Object.keys(jsonOutput).length === 0)
    ) {
        return jsonOutput;
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Dla tablicy, weryfikujemy każdy element osobno
        if (Array.isArray(jsonOutput)) {
            const verifiedArray: OutputItem[] = [];

            for (let item of jsonOutput) {
                try {
                    const verified = await verifyJsonOutput(
                        item,
                        output_format,
                        Array.isArray(user_prompt) ? user_prompt[0] : user_prompt,
                        system_prompt
                    );
                    verifiedArray.push(verified as OutputItem);
                } catch (error) {
                    logger.error(`[verifyJsonOutput] Błąd podczas weryfikacji elementu tablicy:`, error);
                    verifiedArray.push(item);
                }
            }

            return verifiedArray;
        }

        const jsonString = JSON.stringify(jsonOutput);
        const formatString = JSON.stringify(output_format);
        const originalPrompt = Array.isArray(user_prompt) ? user_prompt.join(" ") : user_prompt;

        logger.debug(`[verifyJsonOutput] Wydobywanie głównego tematu z promptu...`);

        // Wydobądź główny temat z oryginalnego zapytania
        const topicResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: {type: "json_object"},
            messages: [
                {
                    role: "system",
                    content: "Twoim zadaniem jest wydobycie głównego tematu/kategorii z zapytania. Zwróć wynik jako JSON z polem 'topic'."
                },
                {
                    role: "user",
                    content: originalPrompt
                }
            ]
        });

        const topicData = JSON.parse(topicResponse.choices[0].message?.content || '{"topic": ""}');
        const mainTopic = topicData.topic || "";

        logger.debug(`[verifyJsonOutput] Wykryty temat: "${mainTopic}"`);
        logger.debug(`[verifyJsonOutput] Weryfikacja struktury i zawartości JSON...`);

        // Weryfikacja struktury i zawartości JSON
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: {type: "json_object"},
            messages: [
                {
                    role: "system",
                    content: `${system_prompt}
                    
                    Twoim zadaniem jest:
                    1. Sprawdzić, czy podany JSON jest zgodny z wymaganym formatem strukturalnym.
                    2. Sprawdzić, czy zawartość JSON jest zgodna tematycznie z głównym tematem zapytania: "${mainTopic}".
                    3. Poprawić treść, jeśli nie jest związana z głównym tematem.
                    4. Zachować strukturę, ale poprawić zawartość, jeśli jest off-topic.
                    
                    Wymagany format: ${formatString}
                    Główny temat: ${mainTopic}
                    Oryginalne zapytanie: ${originalPrompt}
                    
                    Zwróć poprawiony JSON, który jest zgodny zarówno strukturalnie, jak i tematycznie.`
                },
                {
                    role: "user",
                    content: jsonString
                }
            ]
        });

        const verifiedJson = JSON.parse(response.choices[0].message?.content || "{}");

        // Dodatkowa weryfikacja
        if (mainTopic) {
            logger.debug(`[verifyJsonOutput] Sprawdzanie zgodności tematycznej...`);

            const contentCheckResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                temperature: 0.3,
                response_format: {type: "json_object"},
                messages: [
                    {
                        role: "system",
                        content: `Sprawdź dokładnie, czy zawartość podanego JSON jest zgodna z tematem: "${mainTopic}".
                        Oceń każdy element pod kątem zgodności tematycznej.
                        
                        Zwróć JSON z polem "is_relevant" (boolean) i "explanation" (string).
                        Jeśli treść nie jest zgodna z tematem, wskaż problematyczne elementy.`
                    },
                    {
                        role: "user",
                        content: JSON.stringify(verifiedJson)
                    }
                ]
            });

            const relevanceCheck = JSON.parse(contentCheckResponse.choices[0].message?.content || '{"is_relevant": true}');

            // Jeśli treść dalej nie jest zgodna z tematem, spróbuj poprawić używając głównego modelu
            if (!relevanceCheck.is_relevant) {
                logger.warn(`[verifyJsonOutput] Zawartość niezgodna z tematem: ${relevanceCheck.explanation}`);
                logger.debug(`[verifyJsonOutput] Poprawianie treści za pomocą głównego modelu...`);

                // Użyjmy głównego modelu do korekty
                const fixResponse = await openai.chat.completions.create({
                    model: "gpt-4o-2024-08-06", // Używamy głównego modelu dla lepszej jakości
                    temperature: 0.7,
                    response_format: {type: "json_object"},
                    messages: [
                        {
                            role: "system",
                            content: `Przetwórz podany JSON tak, aby jego zawartość ściśle odpowiadała tematowi: "${mainTopic}".
                            Problem z obecną treścią: ${relevanceCheck.explanation}
                            
                            Zachowaj dokładnie taką samą strukturę, ale zmodyfikuj zawartość, aby była w 100% na temat.
                            Oryginalne zapytanie brzmiało: "${originalPrompt}"
                            
                            Zwróć kompletny, poprawiony JSON.`
                        },
                        {
                            role: "user",
                            content: JSON.stringify(verifiedJson)
                        }
                    ]
                });

                logger.debug(`[verifyJsonOutput] Poprawiono treść, zwracam zaktualizowane dane`);
                return JSON.parse(fixResponse.choices[0].message?.content || "{}");
            }

            logger.debug(`[verifyJsonOutput] Treść zgodna z tematem, zwracam zweryfikowane dane`);
        } else {
            logger.debug(`[verifyJsonOutput] Pomijam sprawdzanie zgodności tematycznej (prosty JSON)`);
        }

        return verifiedJson;
    } catch (error) {
        logger.error(`[verifyJsonOutput] Błąd podczas weryfikacji JSON:`, error);
        return jsonOutput; // W przypadku błędu zwracamy oryginalny JSON
    }
}