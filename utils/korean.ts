
import { INITIAL_JAUM, MEDIAL_VOWEL, FINAL_JAUM } from '../constants';

const HANGUL_START_CODE = 0xAC00;
const HANGUL_END_CODE = 0xD7A3;

const JAUM_START_CODE = 0x3131;
const JAUM_END_CODE = 0x314E;
const MOUM_START_CODE = 0x314F;
const MOUM_END_CODE = 0x3163;


export const decomposeSyllable = (syllable: string): string[] => {
  const charCode = syllable.charCodeAt(0);

  if (charCode >= JAUM_START_CODE && charCode <= MOUM_END_CODE) {
    return [syllable];
  }
  
  if (charCode < HANGUL_START_CODE || charCode > HANGUL_END_CODE) {
    return [syllable];
  }

  const relativeCode = charCode - HANGUL_START_CODE;

  const initialIndex = Math.floor(relativeCode / 588);
  const medialIndex = Math.floor((relativeCode % 588) / 28);
  const finalIndex = relativeCode % 28;

  const result = [INITIAL_JAUM[initialIndex], MEDIAL_VOWEL[medialIndex]];
  if (finalIndex > 0) {
    result.push(FINAL_JAUM[finalIndex]);
  }

  return result;
};

export const decomposeSentence = (sentence: string): string[] => {
    let result: string[] = [];
    for (const char of sentence) {
        if (char === ' ' || char === '.' || char === '?' || char === '!') {
            result.push(char);
        } else {
            result = result.concat(decomposeSyllable(char));
        }
    }
    return result;
}
