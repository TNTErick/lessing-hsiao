
export const romanisationSchemes = ['original', 'lessing' ,'ala-lc' , 'hsiao' ,'xine' ,'kuribayashi', 'traditional'] as const;
export type RomanizationScheme = typeof romanisationSchemes[number];

// a, b, c, č, d, e, f, g, h, i, ǰ (ǰ), k, ḵ, l, m, n, o, ö, ȯ, p, q, r, s, š, t, u, ü, v, w, x, y, γ, -, _
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalAlphabet = ['a', 'b', 'c', 'č', 'd', 'e', 'f', 'g', 'h', 'i', 'ǰ', 'k', 'ḵ', 'l', 'm', 'n', 'o', 'ö', 'ȯ', 'p', 'q', 'r', 's', 'š', 't', 'u', 'ü', 'v', 'w', 'x', 'y', 'γ', '-', '_'] as const;
type OriginalChar = typeof originalAlphabet[number];

const dictForm2Traditional = {
    ... Object.fromEntries(originalAlphabet.map(char => [char, char])),
    'a': 'ᠠ',
    'b': 'ᠪ',
    // 'c': 'c',
    'č': 'ᠴ',
    'd': 'ᠳ',
    'e': 'ᠡ',
    'f': 'ᠹ',
    'g': 'ᠭ', 
    'γ': 'ᠭ',
    'h': 'ᠬ',
    'i': 'ᠢ',
    'ǰ': 'ᠵ',
    'k': 'ᠬ',
    'ḵ': 'ᠺ',
    'l': 'ᠯ',
    'm': 'ᠮ',
    'n': 'ᠨ',
    'o': 'ᠣ',
    'ö': 'ᠥ',
    'ȯ': '᠂ᠤ', // temporarily using a Mongolian comma.
    'p': 'ᠫ',
    'q': 'ᠬ',
    'r': 'ᠷ',
    's': 'ᠰ',
    'š': 'ᠱ',
    't': 'ᠲ',
    'u': 'ᠤ',
    'ü': 'ᠦ',
    'v': 'ᠸ',
    'w': 'ᠸ',
    // 'x': 'x',
    'y': 'ᠶ',
    '-': ' ',
    '_': '᠎',
} as const as Record<OriginalChar, string> satisfies Record<OriginalChar, string>;


// const mappings: Record<RomanizationScheme, > = {
//     'original': {},
//     'lessing': {
//         // Placeholder for Lessing's system mappings
//     },
//     'ala-lc': {
//         // Placeholder for ALA-LC system mappings
//     },
//     'hsiao': {
//         // Placeholder for Hsiao's system mappings
//     },
//     'xine': {
//         // Placeholder for Xine's system mappings
//     },
//     'kuribayashi': {
//         // Placeholder for Kuribayashi's system mappings
//     },
//     'traditional': {
//         'a': 'ᠠ',
//         'b': 'ᠪ',
//         'c': 'c',
//         'č': 'ᠴ',
//         'd': 'ᠳ',
//         'e': 'ᠡ',
//         'f': 'ᠹ',
//         'g': 'ᠬ',
//         'γ': 'ᠭ',
//         'h': 'ᠬ',
//         'i': 'ᠢ',
//         'ǰ': 'ᠵ',
//         'k': 'ᠬ',
//         'ḵ': 'ᠺ',
//         'l': 'ᠯ',
//         'm': 'ᠮ',
//         'n': 'ᠨ',
//         'o': 'ᠣ',
//         'ö': 'ᠥ',
//         'ȯ': '᠂ᠤ', // temporarily using a Mongolian comma.
//         'p': 'ᠫ',
//         'q': 'ᠬ',
//         'r': 'ᠷ',
//         's': 'ᠰ',
//         'š': 'ᠱ',
//         't': 'ᠲ',
//         'u': 'ᠤ',
//         'ü': 'ᠦ',
//         'v': 'ᠸ',
//         'w': 'ᠸ',
//         'x': 'x',
//         'y': 'ᠶ',
//         '-': ' ',
//         '_': '_',
//     }
// }as const;

export function convertToRomanised(dictionaryForm: string, scheme: RomanizationScheme): string 
{
    if (scheme === 'original' || scheme === 'lessing')
        // Implement original system conversion logic here
        return dictionaryForm; // Placeholder implementation
    else if (scheme === 'traditional') {
        const suppleted = dictionaryForm.startsWith('-') ? (
                                    dictionaryForm.endsWith('-') ? 
                                        '᠊' + dictionaryForm.slice(1, dictionaryForm.lastIndexOf('-')) + '᠊':
                                        '᠊' + dictionaryForm.slice(1) // Handle leading hyphen with Mongolian punctuation
                                ) : 
                                dictionaryForm.endsWith('-') ? verbify(dictionaryForm.slice(0, dictionaryForm.lastIndexOf('-'))) : 
                                dictionaryForm; // Handle leading hyphen with Mongolian punctuation
        // replace ayi, eyi, oyi, uyi, 
        return suppleted.split('').map(char => dictForm2Traditional[char as OriginalChar] || char).join('');
    }
    else return dictionaryForm;

}

export const convertToTraditional = (dictionaryForm: string): string => convertToRomanised(dictionaryForm, 'traditional');

const isFrontal = (stem: string): boolean => !/[aouqγ]/.test(stem); // If it contains any back vowels it is not frontal.
const verbify = (stem: string): string => isFrontal(stem) ? stem + 'kü' : stem + 'qu';