// Test script for keyword generation utility

const generateSearchKeywords = (productName) => {
  const keywords = new Set();
  
  // Helper: Roman to Devanagari transliteration
  const romanToDevanagari = (text) => {
    const charMap = {
      'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
      'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
      'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ch': 'च', 'chh': 'छ',
      'j': 'ज', 'jh': 'झ', 't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ',
      'n': 'न', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
      'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व', 'sh': 'श',
      's': 'स', 'h': 'ह', 'z': 'ज', 'f': 'फ'
    };
    
    let result = '';
    let i = 0;
    const lower = text.toLowerCase();
    
    while (i < lower.length) {
      let matched = false;
      // Try 3-char, 2-char, then 1-char matches
      for (let len = 3; len >= 1; len--) {
        const substr = lower.substr(i, len);
        if (charMap[substr]) {
          result += charMap[substr];
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += lower[i];
        i++;
      }
    }
    return result;
  };
  
  // Helper: Devanagari to Roman transliteration
  const devanagariToRoman = (text) => {
    const charMap = {
      'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
      'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
      'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'च': 'ch', 'छ': 'chh',
      'ज': 'j', 'झ': 'jh', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh',
      'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
      'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
      'य': 'y', 'र': 'र', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh',
      'स': 's', 'ह': 'h', 'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u',
      'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', '्': ''
    };
    
    let result = '';
    for (let char of text) {
      result += charMap[char] || char;
    }
    return result;
  };
  
  // Helper: Apply phonetic substitutions
  const applyPhoneticSubstitutions = (text) => {
    const variants = [text];
    const rules = [
      { from: /k/g, to: 'c' },
      { from: /c/g, to: 'k' },
      { from: /ph/g, to: 'f' },
      { from: /f/g, to: 'ph' },
      { from: /v/g, to: 'w' },
      { from: /w/g, to: 'v' },
      { from: /z/g, to: 'j' },
      { from: /j/g, to: 'z' },
      { from: /s/g, to: 'sh' },
      { from: /sh/g, to: 's' }
    ];
    
    // Apply each rule once to create variants
    rules.forEach(rule => {
      if (rule.from.test(text)) {
        variants.push(text.replace(rule.from, rule.to));
      }
    });
    
    return variants;
  };
  
  // Helper: Normalize delimiters
  const normalizeDelimiters = (text) => {
    const variants = [text];
    if (text.includes('-') || text.includes('_')) {
      variants.push(text.replace(/[-_]/g, ' '));
      variants.push(text.replace(/[-_]/g, ''));
    }
    if (text.includes(' ')) {
      variants.push(text.replace(/\s+/g, '-'));
      variants.push(text.replace(/\s+/g, '_'));
      variants.push(text.replace(/\s+/g, ''));
    }
    return variants;
  };
  
  // Helper: Check if text is primarily Devanagari
  const isDevanagari = (text) => {
    return /[\u0900-\u097F]/.test(text);
  };
  
  // Step 1: Add original and case variants
  keywords.add(productName);
  keywords.add(productName.toLowerCase());
  keywords.add(productName.toUpperCase());
  keywords.add(productName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
  
  // Step 2: Normalize delimiters
  normalizeDelimiters(productName).forEach(variant => {
    keywords.add(variant);
    keywords.add(variant.toLowerCase());
  });
  
  // Step 3: Split into words and add individual words
  const words = productName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 0);
  words.forEach(word => {
    keywords.add(word);
    keywords.add(word.toLowerCase());
  });
  
  // Step 4: Bidirectional transliteration
  const baseTexts = [productName, ...words];
  baseTexts.forEach(text => {
    if (isDevanagari(text)) {
      // Devanagari → Roman
      const romanized = devanagariToRoman(text);
      keywords.add(romanized);
      keywords.add(romanized.toLowerCase());
      
      // Apply phonetic substitutions on romanized
      applyPhoneticSubstitutions(romanized).forEach(v => keywords.add(v.toLowerCase()));
    } else {
      // Roman → Devanagari
      const devanagariVariant = romanToDevanagari(text);
      keywords.add(devanagariVariant);
      
      // Apply phonetic substitutions on original
      applyPhoneticSubstitutions(text).forEach(v => {
        keywords.add(v.toLowerCase());
        // Also transliterate phonetic variants
        keywords.add(romanToDevanagari(v));
      });
    }
  });
  
  // Step 5: Smart filtering - keep meaningful keywords
  const filtered = Array.from(keywords).filter(kw => {
    // Remove empty, very short (< 2 chars), or pure punctuation
    return kw && kw.trim().length >= 2 && /[a-zA-Z\u0900-\u097F]/.test(kw);
  });
  
  // Step 6: Limit to ~20-30 most relevant keywords
  // Prioritize: original, lowercase, words, then variants
  const prioritized = [];
  const addUnique = (kw) => {
    const normalized = kw.trim().toLowerCase();
    if (!prioritized.some(p => p.toLowerCase() === normalized)) {
      prioritized.push(kw);
    }
  };
  
  // Priority 1: Original forms
  addUnique(productName);
  addUnique(productName.toLowerCase());
  
  // Priority 2: Words
  words.forEach(w => addUnique(w));
  
  // Priority 3: Other variants
  filtered.forEach(kw => {
    if (prioritized.length < 30) {
      addUnique(kw);
    }
  });
  
  return prioritized.slice(0, 30);
};

// Test cases
console.log('\n=== Test 1: English Product Name ===');
console.log('Input: "Tomato Seeds"');
const result1 = generateSearchKeywords('Tomato Seeds');
console.log('Generated Keywords:', result1);
console.log('Count:', result1.length);

console.log('\n=== Test 2: Product with Hyphens ===');
console.log('Input: "NPK-19-19-19"');
const result2 = generateSearchKeywords('NPK-19-19-19');
console.log('Generated Keywords:', result2);
console.log('Count:', result2.length);

console.log('\n=== Test 3: Devanagari Product Name ===');
console.log('Input: "युरिया खत"');
const result3 = generateSearchKeywords('युरिया खत');
console.log('Generated Keywords:', result3);
console.log('Count:', result3.length);

console.log('\n=== Test 4: Mixed Product Name ===');
console.log('Input: "Chilli Mirchi Seeds"');
const result4 = generateSearchKeywords('Chilli Mirchi Seeds');
console.log('Generated Keywords:', result4);
console.log('Count:', result4.length);

console.log('\n=== Test 5: Product with "ph" and "f" ===');
console.log('Input: "Phosphate Fertilizer"');
const result5 = generateSearchKeywords('Phosphate Fertilizer');
console.log('Generated Keywords:', result5);
console.log('Count:', result5.length);
