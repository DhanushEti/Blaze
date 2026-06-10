/**
 * IndusVaani — Multi-Lingual NLP Resolution Matrix
 * Maps user intents across English, Hindi, Hinglish, and Tamil
 * to structured responses and UI action directives.
 */

class NLPEngine {
  constructor() {
    this.intents = this._buildIntentLibrary();
    this.fallbackResponses = {
      en: "I'm sorry, I couldn't understand your query. Could you please rephrase? You can ask about account balance, credit cards, fixed deposits, loans, and more.",
      hi: "क्षमा करें, मैं आपकी बात समझ नहीं पाया। कृपया दोबारा बताएं। आप बैलेंस, क्रेडिट कार्ड, एफडी, लोन आदि के बारे में पूछ सकते हैं।",
      hinglish: "Sorry, samajh nahi aaya. Please dobara bataiye. Aap balance, credit card, FD, loan ke baare mein pooch sakte hain.",
      ta: "மன்னிக்கவும், உங்கள் கேள்வியைப் புரிந்துகொள்ள முடியவில்லை. மீண்டும் கேளுங்கள். இருப்பு, கிரெடிட் கார்டு, FD, கடன் பற்றி கேட்கலாம்."
    };
  }

  /**
   * Resolve user input to a structured intent result.
   * @param {string} input - Raw user input text
   * @param {string} language - Active language code (en, hi, hinglish, ta)
   * @returns {object} Resolved intent with response data and UI action
   */
  resolve(input, language = 'en') {
    const normalizedInput = input.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    for (const [intentKey, intentData] of Object.entries(this.intents)) {
      const score = this._calculateMatchScore(normalizedInput, intentData.keywords, language);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { key: intentKey, ...intentData };
      }
    }

    if (bestMatch && highestScore >= 0.3) {
      return {
        matched: true,
        confidence: highestScore,
        intentKey: bestMatch.key,
        response: bestMatch.responses[language] || bestMatch.responses.en,
        uiAction: bestMatch.uiAction,
        uiData: bestMatch.uiData || {},
        category: bestMatch.category,
        icon: bestMatch.icon
      };
    }

    return {
      matched: false,
      confidence: 0,
      intentKey: 'FALLBACK',
      response: this.fallbackResponses[language] || this.fallbackResponses.en,
      uiAction: 'SHOW_SUGGESTIONS',
      uiData: {},
      category: 'general',
      icon: 'help_outline'
    };
  }

  /**
   * Calculate match score between input and keyword sets.
   */
  _calculateMatchScore(input, keywords, primaryLang) {
    let maxScore = 0;

    // Check all languages (user might type in any language regardless of selection)
    for (const [lang, kwList] of Object.entries(keywords)) {
      for (const keyword of kwList) {
        const kw = keyword.toLowerCase();
        let score = 0;

        if (input === kw) {
          score = 1.0; // Exact match
        } else if (input.includes(kw)) {
          score = 0.7 + (kw.length / input.length) * 0.25; // Substring match
        } else if (kw.includes(input) && input.length > 3) {
          score = 0.5; // Reverse containment
        } else {
          // Word-level overlap
          const inputWords = input.split(/\s+/);
          const kwWords = kw.split(/\s+/);
          const overlap = inputWords.filter(w => kwWords.some(k => k.includes(w) || w.includes(k))).length;
          if (overlap > 0) {
            score = (overlap / Math.max(inputWords.length, kwWords.length)) * 0.6;
          }
        }

        // Bonus for matching the active language
        if (lang === primaryLang) score *= 1.15;
        maxScore = Math.max(maxScore, Math.min(score, 1.0));
      }
    }

    return maxScore;
  }

  /**
   * Build the complete intent library with multilingual keywords and responses.
   */
  _buildIntentLibrary() {
    return {

      // ─── ACCOUNT & BALANCE ───────────────────────────────────
      BALANCE_CHECK: {
        category: 'accounts',
        icon: 'account_balance_wallet',
        keywords: {
          en: ['check balance', 'account balance', 'balance enquiry', 'how much balance', 'available balance', 'current balance', 'my balance', 'show balance', 'what is my balance'],
          hi: ['बैलेंस चेक', 'खाता शेष', 'बैलेंस कितना है', 'मेरा बैलेंस', 'बैलेंस बताओ', 'खाते में कितना पैसा', 'पैसा कितना है', 'बैलेंस देखो'],
          hinglish: ['balance kitna hai', 'mera balance', 'balance check karo', 'kitna paisa hai', 'balance dikhao', 'account mein kitna hai', 'balance batao', 'paisa kitna hai'],
          ta: ['இருப்பு சரிபார்', 'கணக்கு இருப்பு', 'எவ்வளவு பணம்', 'பேலன்ஸ் என்ன', 'என் இருப்பு']
        },
        responses: {
          en: "Here's your account balance summary. Your accounts are in good standing with IndusInd Bank.",
          hi: "यहाँ आपके खाते का बैलेंस विवरण है। इंडसइंड बैंक में आपके खाते अच्छी स्थिति में हैं।",
          hinglish: "Yahan aapke account ka balance detail hai. IndusInd Bank mein aapke accounts achi condition mein hain.",
          ta: "உங்கள் கணக்கு இருப்புச் சுருக்கம் இங்கே உள்ளது. IndusInd வங்கியில் உங்கள் கணக்குகள் நல்ல நிலையில் உள்ளன."
        },
        uiAction: 'SHOW_BALANCE',
        uiData: {
          accounts: [
            { type: 'Savings Account', number: 'XXXX XXXX 4821', balance: '₹2,45,830.50', status: 'Active' },
            { type: 'Current Account', number: 'XXXX XXXX 7293', balance: '₹18,72,450.00', status: 'Active' }
          ]
        }
      },

      SAVINGS_RATE: {
        category: 'accounts',
        icon: 'trending_up',
        keywords: {
          en: ['savings interest rate', 'savings rate', 'interest on savings', 'savings account rate', 'what is savings rate', 'interest rate savings'],
          hi: ['बचत ब्याज दर', 'सेविंग्स रेट', 'बचत खाते पर ब्याज', 'सेविंग्स अकाउंट रेट'],
          hinglish: ['savings rate kya hai', 'savings pe interest', 'savings account ka rate', 'interest rate batao savings'],
          ta: ['சேமிப்பு வட்டி விகிதம்', 'சேமிப்பு கணக்கு வட்டி', 'சேமிப்பு விகிதம்']
        },
        responses: {
          en: "IndusInd Bank offers competitive savings account interest rates. Here are the current rates based on your account balance tier.",
          hi: "इंडसइंड बैंक प्रतिस्पर्धी बचत खाता ब्याज दरें प्रदान करता है। यहाँ आपके बैलेंस स्तर के आधार पर वर्तमान दरें हैं।",
          hinglish: "IndusInd Bank competitive savings rates offer karta hai. Yahan balance tier ke basis pe current rates hain.",
          ta: "IndusInd வங்கி போட்டி சேமிப்புக் கணக்கு வட்டி விகிதங்களை வழங்குகிறது."
        },
        uiAction: 'SHOW_SAVINGS_RATES',
        uiData: {
          rates: [
            { slab: 'Up to ₹1 Lakh', rate: '3.50%' },
            { slab: '₹1 Lakh – ₹10 Lakhs', rate: '4.00%' },
            { slab: '₹10 Lakhs – ₹2 Crore', rate: '5.00%' },
            { slab: 'Above ₹2 Crore', rate: '6.00%' },
            { slab: 'Senior Citizen (Extra)', rate: '+0.50%' }
          ]
        }
      },

      ACCOUNT_STATEMENT: {
        category: 'accounts',
        icon: 'receipt_long',
        keywords: {
          en: ['account statement', 'bank statement', 'transaction history', 'mini statement', 'last transactions', 'recent transactions', 'statement download'],
          hi: ['खाता विवरण', 'बैंक स्टेटमेंट', 'लेनदेन इतिहास', 'मिनी स्टेटमेंट', 'पिछले लेनदेन'],
          hinglish: ['statement chahiye', 'account statement do', 'transaction history dikhao', 'mini statement', 'last transactions dikhao'],
          ta: ['கணக்கு அறிக்கை', 'வங்கி அறிக்கை', 'பரிவர்த்தனை வரலாறு', 'மினி அறிக்கை']
        },
        responses: {
          en: "Here are your recent transactions from the last 7 days. You can download the full statement from net banking.",
          hi: "यहाँ पिछले 7 दिनों के आपके हालिया लेनदेन हैं। आप नेट बैंकिंग से पूरा स्टेटमेंट डाउनलोड कर सकते हैं।",
          hinglish: "Yahan aapke last 7 din ke recent transactions hain. Full statement net banking se download kar sakte hain.",
          ta: "கடந்த 7 நாட்களின் சமீபத்திய பரிவர்த்தனைகள் இங்கே உள்ளன."
        },
        uiAction: 'SHOW_MINI_STATEMENT',
        uiData: {
          transactions: [
            { date: '09 Jun 2026', desc: 'Amazon India', amount: '-₹2,499.00', type: 'debit', balance: '₹2,43,331.50' },
            { date: '08 Jun 2026', desc: 'Salary Credit – TCS Ltd', amount: '+₹85,000.00', type: 'credit', balance: '₹2,45,830.50' },
            { date: '07 Jun 2026', desc: 'Swiggy Food Order', amount: '-₹456.00', type: 'debit', balance: '₹1,60,830.50' },
            { date: '06 Jun 2026', desc: 'NEFT to Ramesh K', amount: '-₹15,000.00', type: 'debit', balance: '₹1,61,286.50' },
            { date: '05 Jun 2026', desc: 'ATM Withdrawal', amount: '-₹10,000.00', type: 'debit', balance: '₹1,76,286.50' },
            { date: '04 Jun 2026', desc: 'PhonePe – Electricity Bill', amount: '-₹3,200.00', type: 'debit', balance: '₹1,86,286.50' }
          ]
        }
      },

      // ─── CREDIT CARDS ────────────────────────────────────────
      BLOCK_CARD: {
        category: 'cards',
        icon: 'credit_card_off',
        keywords: {
          en: ['block card', 'block my card', 'card lost', 'lost card', 'stolen card', 'card stolen', 'deactivate card', 'card block', 'block credit card', 'block debit card', 'freeze card'],
          hi: ['कार्ड ब्लॉक करो', 'मेरा कार्ड खो गया', 'कार्ड चोरी', 'कार्ड ब्लॉक', 'कार्ड बंद करो', 'कार्ड खो गया है'],
          hinglish: ['mera card kho gaya block karo', 'card block karo', 'card lost ho gaya', 'card chori ho gaya', 'card band karo', 'mera card block karo', 'card freeze karo'],
          ta: ['கார்டு தடை', 'கார்டு தொலைந்தது', 'கார்டு திருடப்பட்டது', 'கார்டு பிளாக்', 'கார்டு முடக்கு']
        },
        responses: {
          en: "I understand your card needs to be secured immediately. Please confirm the card details below to proceed with blocking.",
          hi: "मैं समझता हूँ कि आपके कार्ड को तुरंत सुरक्षित करने की जरूरत है। ब्लॉक करने के लिए नीचे कार्ड विवरण की पुष्टि करें।",
          hinglish: "Samajh gaya, aapke card ko turant secure karna zaroori hai. Block karne ke liye neeche card details confirm karein.",
          ta: "உங்கள் கார்டை உடனடியாகப் பாதுகாக்க வேண்டும் என்பதை புரிந்துகொள்கிறேன். தடை செய்ய கீழே உள்ள விவரங்களை உறுதிப்படுத்தவும்."
        },
        uiAction: 'SHOW_BLOCK_CARD_MODAL',
        uiData: {
          cards: [
            { type: 'IndusInd Legend Credit Card', last4: '8834', network: 'Visa', status: 'Active' },
            { type: 'IndusInd Platinum Debit Card', last4: '2291', network: 'Mastercard', status: 'Active' }
          ]
        }
      },

      CARD_APPLY: {
        category: 'cards',
        icon: 'add_card',
        keywords: {
          en: ['apply credit card', 'new credit card', 'credit card application', 'apply for card', 'legend credit card', 'get credit card', 'credit card apply', 'want credit card', 'platinum card', 'tiger card'],
          hi: ['क्रेडिट कार्ड अप्लाई', 'नया क्रेडिट कार्ड', 'कार्ड के लिए अप्लाई', 'क्रेडिट कार्ड चाहिए', 'लीजेंड कार्ड'],
          hinglish: ['credit card apply karna hai', 'naya credit card chahiye', 'legend card apply karo', 'credit card ke liye apply', 'card apply karna hai', 'naya card chahiye'],
          ta: ['கிரெடிட் கார்டு விண்ணப்பம்', 'புதிய கிரெடிட் கார்டு', 'கார்டு விண்ணப்பிக்க', 'கிரெடிட் கார்டு வேண்டும்']
        },
        responses: {
          en: "Great choice! IndusInd Bank offers a range of premium credit cards. Here are our top picks for you based on your profile.",
          hi: "बेहतरीन चुनाव! इंडसइंड बैंक कई प्रीमियम क्रेडिट कार्ड प्रदान करता है। आपकी प्रोफाइल के आधार पर हमारे टॉप कार्ड्स।",
          hinglish: "Bahut accha choice! IndusInd Bank ke premium credit cards dekhiye. Aapki profile ke basis pe top cards hain.",
          ta: "சிறந்த தேர்வு! IndusInd வங்கியின் பிரீமியம் கிரெடிட் கார்டுகள் இங்கே உள்ளன."
        },
        uiAction: 'SHOW_CARD_CATALOG',
        uiData: {
          cards: [
            {
              name: 'Legend Credit Card',
              tagline: 'For the extraordinary lifestyle',
              annualFee: '₹10,000 + GST',
              rewards: '3X reward points on all spends',
              lounge: 'Unlimited domestic & international lounges',
              color: '#1a1a2e'
            },
            {
              name: 'Tiger Credit Card',
              tagline: 'Unleash the power within',
              annualFee: '₹2,999 + GST',
              rewards: '2X reward points on dining & travel',
              lounge: '8 domestic lounge visits per quarter',
              color: '#e65100'
            },
            {
              name: 'Platinum Aura Card',
              tagline: 'Everyday premium rewards',
              annualFee: '₹999 + GST (Waived on ₹1L spend)',
              rewards: '1.5X reward points, fuel surcharge waiver',
              lounge: '4 domestic lounge visits per quarter',
              color: '#283593'
            }
          ]
        }
      },

      CARD_LIMIT: {
        category: 'cards',
        icon: 'tune',
        keywords: {
          en: ['card limit', 'credit limit', 'increase limit', 'change card limit', 'enhance credit limit', 'my card limit', 'limit increase'],
          hi: ['कार्ड लिमिट', 'क्रेडिट लिमिट', 'लिमिट बढ़ाओ', 'कार्ड लिमिट बदलो'],
          hinglish: ['card limit kitna hai', 'limit badhao', 'credit limit increase karo', 'mera card limit'],
          ta: ['கார்டு வரம்பு', 'கிரெடிட் வரம்பு', 'வரம்பு அதிகரிக்க']
        },
        responses: {
          en: "Here are your current card limits. You can request a limit enhancement directly from here.",
          hi: "यहाँ आपकी वर्तमान कार्ड लिमिट है। आप यहाँ से सीधे लिमिट बढ़ाने का अनुरोध कर सकते हैं।",
          hinglish: "Yahan aapki current card limit hai. Aap yahan se limit enhancement request kar sakte hain.",
          ta: "உங்கள் தற்போதைய கார்டு வரம்புகள் இங்கே உள்ளன."
        },
        uiAction: 'SHOW_CARD_LIMIT',
        uiData: {
          currentLimit: '₹3,50,000',
          usedLimit: '₹87,450',
          availableLimit: '₹2,62,550',
          utilizationPercent: 25,
          eligibleEnhancement: '₹5,00,000'
        }
      },

      // ─── FIXED DEPOSITS ──────────────────────────────────────
      FD_RATES: {
        category: 'deposits',
        icon: 'savings',
        keywords: {
          en: ['fd rates', 'fixed deposit rates', 'fd interest rate', 'fixed deposit interest', 'deposit rates', 'fd rate', 'term deposit rate', 'fd plan'],
          hi: ['एफडी रेट', 'फिक्स्ड डिपॉजिट दर', 'एफडी ब्याज दर', 'एफडी प्लान', 'फिक्स्ड डिपॉजिट रेट'],
          hinglish: ['fd rates kya hain', 'fd ka rate batao', 'fixed deposit rate kya hai', 'fd mein kitna interest milega', 'fd rates dikhao', 'fd ka interest'],
          ta: ['FD விகிதங்கள்', 'நிலையான வைப்பு வட்டி', 'FD வட்டி விகிதம்', 'வைப்பு விகிதம்']
        },
        responses: {
          en: "Here are IndusInd Bank's latest Fixed Deposit interest rates. Senior citizens get an additional 0.50% on all tenures.",
          hi: "यहाँ इंडसइंड बैंक की नवीनतम फिक्स्ड डिपॉजिट ब्याज दरें हैं। वरिष्ठ नागरिकों को सभी अवधि पर अतिरिक्त 0.50% मिलता है।",
          hinglish: "Yahan IndusInd Bank ki latest FD interest rates hain. Senior citizens ko sabhi tenure pe extra 0.50% milta hai.",
          ta: "IndusInd வங்கியின் சமீபத்திய நிலையான வைப்பு வட்டி விகிதங்கள் இங்கே. மூத்த குடிமக்களுக்கு 0.50% கூடுதல் வட்டி."
        },
        uiAction: 'SHOW_FD_RATES',
        uiData: {
          rates: [
            { tenure: '7 – 14 days', general: '3.50%', senior: '4.00%' },
            { tenure: '15 – 29 days', general: '3.50%', senior: '4.00%' },
            { tenure: '30 – 45 days', general: '4.25%', senior: '4.75%' },
            { tenure: '46 – 90 days', general: '4.75%', senior: '5.25%' },
            { tenure: '91 – 120 days', general: '5.25%', senior: '5.75%' },
            { tenure: '121 – 180 days', general: '5.75%', senior: '6.25%' },
            { tenure: '181 days – 1 year', general: '6.50%', senior: '7.00%' },
            { tenure: '1 year – 18 months', general: '7.00%', senior: '7.50%' },
            { tenure: '18 months – 2 years', general: '7.25%', senior: '7.75%' },
            { tenure: '2 years – 3 years', general: '7.25%', senior: '7.75%' },
            { tenure: '3 years – 5 years', general: '7.00%', senior: '7.50%' },
            { tenure: '5 years – 10 years', general: '6.75%', senior: '7.25%' }
          ],
          highlight: '18 months – 2 years'
        }
      },

      FD_OPEN: {
        category: 'deposits',
        icon: 'add_circle',
        keywords: {
          en: ['open fd', 'open fixed deposit', 'create fd', 'new fd', 'book fd', 'start fd', 'make fd', 'fd open'],
          hi: ['एफडी खोलो', 'नया एफडी', 'एफडी बनाओ', 'फिक्स्ड डिपॉजिट खोलो'],
          hinglish: ['fd kholna hai', 'naya fd banana hai', 'fd open karo', 'fixed deposit kholna hai', 'fd start karo'],
          ta: ['FD திறக்க', 'புதிய FD', 'நிலையான வைப்பு திறக்க']
        },
        responses: {
          en: "Let's open a new Fixed Deposit for you! Choose your preferred tenure and amount below. Current best rate: 7.25% p.a.",
          hi: "चलिए आपके लिए नया एफडी खोलते हैं! नीचे अपनी पसंदीदा अवधि और राशि चुनें। वर्तमान सर्वोत्तम दर: 7.25% प्रति वर्ष।",
          hinglish: "Chaliye aapke liye naya FD kholte hain! Neeche tenure aur amount choose karein. Current best rate: 7.25% per year.",
          ta: "உங்களுக்கு புதிய FD திறப்போம்! கீழே காலம் மற்றும் தொகையைத் தேர்ந்தெடுக்கவும். தற்போதைய சிறந்த வட்டி: 7.25%."
        },
        uiAction: 'SHOW_FD_CALCULATOR',
        uiData: {
          suggestedAmounts: ['₹50,000', '₹1,00,000', '₹2,00,000', '₹5,00,000'],
          suggestedTenures: ['6 months', '1 year', '18 months', '2 years', '3 years'],
          bestRate: '7.25%',
          bestTenure: '18 months – 2 years'
        }
      },

      // ─── LOANS ────────────────────────────────────────────────
      HOME_LOAN: {
        category: 'loans',
        icon: 'home',
        keywords: {
          en: ['home loan', 'housing loan', 'mortgage', 'home loan process', 'home loan rate', 'home loan interest', 'home loan eligibility', 'buy home loan'],
          hi: ['होम लोन', 'गृह ऋण', 'घर का लोन', 'होम लोन ब्याज दर', 'होम लोन प्रक्रिया'],
          hinglish: ['home loan chahiye', 'home loan process kya hai', 'home loan rate batao', 'ghar ke liye loan', 'home loan ka interest'],
          ta: ['வீட்டுக் கடன்', 'வீட்டுக் கடன் வட்டி', 'வீட்டுக் கடன் செயல்முறை']
        },
        responses: {
          en: "IndusInd Bank Home Loans start at attractive rates of 8.40% p.a. Here's an overview of our home loan offerings and the application process.",
          hi: "इंडसइंड बैंक होम लोन 8.40% प्रति वर्ष की आकर्षक दर से शुरू होते हैं। यहाँ होम लोन ऑफर और प्रक्रिया का विवरण है।",
          hinglish: "IndusInd Bank Home Loan 8.40% per year se shuru hote hain. Yahan home loan offer aur process ka detail hai.",
          ta: "IndusInd வங்கி வீட்டுக் கடன் 8.40% வட்டியில் தொடங்குகிறது."
        },
        uiAction: 'SHOW_LOAN_INFO',
        uiData: {
          loanType: 'Home Loan',
          interestRate: '8.40% – 10.25% p.a.',
          maxAmount: '₹5 Crore',
          maxTenure: '30 years',
          processingFee: '0.50% of loan amount',
          features: [
            'No prepayment charges on floating rate',
            'Balance transfer facility available',
            'Doorstep service for documentation',
            'Top-up loan available after 12 EMIs',
            'Insurance coverage options'
          ],
          documents: ['PAN Card', 'Aadhaar Card', 'Last 6 months bank statement', 'Salary slips (3 months)', 'Property documents', 'IT Returns (2 years)'],
          steps: ['Apply Online / Branch Visit', 'Document Submission', 'Property Valuation', 'Loan Sanction', 'Disbursement']
        }
      },

      PERSONAL_LOAN: {
        category: 'loans',
        icon: 'person',
        keywords: {
          en: ['personal loan', 'personal loan rate', 'personal loan apply', 'need loan', 'loan apply', 'instant loan', 'quick loan'],
          hi: ['पर्सनल लोन', 'व्यक्तिगत ऋण', 'लोन चाहिए', 'लोन अप्लाई', 'तुरंत लोन'],
          hinglish: ['personal loan chahiye', 'loan apply karna hai', 'personal loan rate batao', 'instant loan chahiye', 'loan do'],
          ta: ['தனிநபர் கடன்', 'கடன் விண்ணப்பம்', 'உடனடி கடன்']
        },
        responses: {
          en: "IndusInd Bank Personal Loans come with competitive rates starting at 10.49% p.a. Get instant approval with minimal documentation.",
          hi: "इंडसइंड बैंक पर्सनल लोन 10.49% प्रति वर्ष से शुरू होने वाली प्रतिस्पर्धी दरों के साथ आते हैं। न्यूनतम दस्तावेज़ों के साथ तुरंत अनुमोदन।",
          hinglish: "IndusInd Bank Personal Loan 10.49% se shuru hota hai. Minimum documents mein instant approval milta hai.",
          ta: "IndusInd வங்கி தனிநபர் கடன் 10.49% வட்டியில் தொடங்குகிறது. குறைந்த ஆவணங்களில் உடனடி ஒப்புதல்."
        },
        uiAction: 'SHOW_LOAN_INFO',
        uiData: {
          loanType: 'Personal Loan',
          interestRate: '10.49% – 16.00% p.a.',
          maxAmount: '₹25 Lakhs',
          maxTenure: '5 years',
          processingFee: '2.50% of loan amount',
          features: [
            'Instant disbursal to account',
            'No collateral required',
            'Flexible EMI options',
            'Part-prepayment allowed after 6 EMIs',
            'Online application in 5 minutes'
          ],
          documents: ['PAN Card', 'Aadhaar Card', 'Last 3 months salary slips', 'Bank statement (6 months)'],
          steps: ['Online Application', 'KYC Verification', 'Credit Assessment', 'Instant Approval', 'Same Day Disbursal']
        }
      },

      CAR_LOAN: {
        category: 'loans',
        icon: 'directions_car',
        keywords: {
          en: ['car loan', 'vehicle loan', 'auto loan', 'car finance', 'two wheeler loan', 'bike loan'],
          hi: ['कार लोन', 'गाड़ी का लोन', 'वाहन ऋण', 'बाइक लोन'],
          hinglish: ['car loan chahiye', 'gaadi ke liye loan', 'car loan rate', 'vehicle loan apply'],
          ta: ['கார் கடன்', 'வாகனக் கடன்', 'கார் நிதி']
        },
        responses: {
          en: "Drive your dream car home with IndusInd Bank Auto Loans! Competitive rates starting from 8.75% p.a.",
          hi: "इंडसइंड बैंक ऑटो लोन के साथ अपनी सपनों की कार घर लाएं! 8.75% प्रति वर्ष से शुरू।",
          hinglish: "IndusInd Bank Auto Loan se apni dream car ghar laiye! 8.75% se rates shuru hain.",
          ta: "IndusInd வங்கி ஆட்டோ கடனுடன் உங்கள் கனவு காரை வீட்டிற்கு கொண்டு வாருங்கள்!"
        },
        uiAction: 'SHOW_LOAN_INFO',
        uiData: {
          loanType: 'Car / Vehicle Loan',
          interestRate: '8.75% – 12.50% p.a.',
          maxAmount: '₹75 Lakhs',
          maxTenure: '7 years',
          processingFee: '0.50% of loan amount',
          features: [
            'Up to 100% on-road price financing',
            'New & pre-owned car loans',
            'Quick processing in 48 hours',
            'No foreclosure charges after 12 EMIs',
            'Insurance bundled options'
          ],
          documents: ['PAN Card', 'Aadhaar Card', 'Income proof', 'Address proof', 'Proforma invoice'],
          steps: ['Choose Vehicle', 'Apply for Loan', 'Document Verification', 'Loan Approval', 'Disbursement to Dealer']
        }
      },

      // ─── UPI & DIGITAL ────────────────────────────────────────
      UPI_HELP: {
        category: 'digital',
        icon: 'contactless',
        keywords: {
          en: ['upi', 'upi help', 'upi problem', 'upi not working', 'upi transfer', 'upi id', 'upi pin', 'set upi', 'reset upi pin', 'upi payment failed'],
          hi: ['यूपीआई', 'यूपीआई मदद', 'यूपीआई काम नहीं कर रहा', 'यूपीआई पिन', 'यूपीआई ट्रांसफर'],
          hinglish: ['upi kaise kare', 'upi pin reset karo', 'upi kaam nahi kar raha', 'upi payment fail ho gaya', 'upi id kya hai'],
          ta: ['UPI உதவி', 'UPI வேலை செய்யவில்லை', 'UPI பின்', 'UPI பணம் அனுப்ப']
        },
        responses: {
          en: "Here's help with your UPI queries. IndusInd Bank supports UPI payments via IndusMobile app with instant transfers 24/7.",
          hi: "यहाँ आपके UPI प्रश्नों की सहायता है। इंडसइंड बैंक IndusMobile ऐप के माध्यम से 24/7 तुरंत UPI भुगतान का समर्थन करता है।",
          hinglish: "Yahan aapke UPI queries ki help hai. IndusInd Bank IndusMobile app se 24/7 instant UPI payments support karta hai.",
          ta: "UPI தொடர்பான உதவி இங்கே. IndusInd வங்கி IndusMobile மூலம் 24/7 UPI பணம் செலுத்துகிறது."
        },
        uiAction: 'SHOW_UPI_HELP',
        uiData: {
          actions: [
            { label: 'Reset UPI PIN', icon: 'lock_reset', desc: 'Change or reset your UPI PIN via IndusMobile' },
            { label: 'Check UPI ID', icon: 'badge', desc: 'Your UPI ID: customer@indus' },
            { label: 'Transaction Limit', icon: 'speed', desc: 'Per transaction: ₹1,00,000 | Daily: ₹2,00,000' },
            { label: 'Dispute Payment', icon: 'report_problem', desc: 'Raise a dispute for failed/wrong UPI transaction' }
          ]
        }
      },

      // ─── BRANCH & ATM ─────────────────────────────────────────
      BRANCH_LOCATOR: {
        category: 'support',
        icon: 'location_on',
        keywords: {
          en: ['nearest branch', 'branch locator', 'find branch', 'atm near me', 'nearest atm', 'branch address', 'branch location', 'where is branch'],
          hi: ['नज़दीकी शाखा', 'शाखा कहाँ है', 'एटीएम कहाँ है', 'नज़दीकी एटीएम', 'ब्रांच लोकेटर'],
          hinglish: ['nearest branch kahan hai', 'atm kahan hai', 'branch address batao', 'paas mein branch', 'branch dhundho'],
          ta: ['அருகிலுள்ள கிளை', 'கிளை முகவரி', 'ATM எங்கே', 'கிளை கண்டுபிடி']
        },
        responses: {
          en: "Here are the nearest IndusInd Bank branches and ATMs to your location. Full services available during banking hours.",
          hi: "यहाँ आपके स्थान के निकटतम इंडसइंड बैंक शाखाएं और एटीएम हैं।",
          hinglish: "Yahan aapke location ke nearest IndusInd Bank branches aur ATMs hain.",
          ta: "உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள IndusInd வங்கி கிளைகள் மற்றும் ATMகள்."
        },
        uiAction: 'SHOW_BRANCH_LOCATOR',
        uiData: {
          branches: [
            { name: 'IndusInd Bank – Connaught Place', address: 'N-31, Connaught Circus, New Delhi 110001', distance: '1.2 km', type: 'Branch + ATM', timing: '10:00 AM – 4:00 PM' },
            { name: 'IndusInd Bank – Janpath', address: '15-A, Janpath Road, New Delhi 110001', distance: '2.5 km', type: 'ATM Only', timing: '24/7' },
            { name: 'IndusInd Bank – Karol Bagh', address: 'DB Gupta Road, Karol Bagh, New Delhi 110005', distance: '4.1 km', type: 'Branch + ATM', timing: '10:00 AM – 4:00 PM' }
          ]
        }
      },

      // ─── CUSTOMER SUPPORT ─────────────────────────────────────
      CUSTOMER_SUPPORT: {
        category: 'support',
        icon: 'support_agent',
        keywords: {
          en: ['customer care', 'helpline', 'complaint', 'talk to agent', 'speak to agent', 'customer support', 'call center', 'help', 'grievance', 'escalate'],
          hi: ['कस्टमर केयर', 'हेल्पलाइन', 'शिकायत', 'एजेंट से बात', 'सहायता', 'मदद चाहिए'],
          hinglish: ['customer care number do', 'agent se baat karo', 'complaint karna hai', 'helpline number', 'help chahiye', 'kisi se baat karni hai'],
          ta: ['வாடிக்கையாளர் சேவை', 'உதவி எண்', 'புகார்', 'ஏஜென்ட் பேச', 'உதவி']
        },
        responses: {
          en: "We're here to help! You can reach IndusInd Bank customer support through multiple channels listed below.",
          hi: "हम मदद के लिए यहाँ हैं! आप नीचे सूचीबद्ध कई चैनलों के माध्यम से इंडसइंड बैंक ग्राहक सहायता से संपर्क कर सकते हैं।",
          hinglish: "Hum madad ke liye yahan hain! Aap neeche diye gaye channels se IndusInd Bank se contact kar sakte hain.",
          ta: "நாங்கள் உதவ இங்கே இருக்கிறோம்! கீழே உள்ள வழிகளில் IndusInd வங்கியை தொடர்பு கொள்ளுங்கள்."
        },
        uiAction: 'SHOW_SUPPORT_CHANNELS',
        uiData: {
          channels: [
            { type: 'Phone', value: '1860-267-7777', icon: 'phone', available: '24/7' },
            { type: 'Email', value: 'customercare@indusind.com', icon: 'email', available: 'Response in 24 hrs' },
            { type: 'WhatsApp', value: '+91 22 4406 6666', icon: 'chat', available: '24/7' },
            { type: 'Twitter', value: '@IndusSeva', icon: 'public', available: '9 AM – 9 PM' }
          ]
        }
      },

      // ─── GREETINGS & META ─────────────────────────────────────
      GREETING: {
        category: 'general',
        icon: 'waving_hand',
        keywords: {
          en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'],
          hi: ['नमस्ते', 'नमस्कार', 'हैलो', 'सुप्रभात'],
          hinglish: ['hello ji', 'namaste', 'hi kaise ho', 'kya haal hai'],
          ta: ['வணக்கம்', 'ஹலோ']
        },
        responses: {
          en: "Welcome to IndusVaani! 👋 I'm your AI banking assistant. How can I help you today? You can ask about accounts, cards, loans, deposits, and more.",
          hi: "IndusVaani में आपका स्वागत है! 👋 मैं आपका AI बैंकिंग सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
          hinglish: "IndusVaani mein aapka swagat hai! 👋 Main aapka AI banking assistant hoon. Aaj main aapki kaise help kar sakta hoon?",
          ta: "IndusVaani-க்கு வரவேற்கிறோம்! 👋 நான் உங்கள் AI வங்கி உதவியாளர். இன்று நான் எவ்வாறு உதவ முடியும்?"
        },
        uiAction: 'SHOW_SUGGESTIONS',
        uiData: {}
      },

      THANK_YOU: {
        category: 'general',
        icon: 'favorite',
        keywords: {
          en: ['thank you', 'thanks', 'thank', 'appreciate', 'great help'],
          hi: ['धन्यवाद', 'शुक्रिया', 'बहुत अच्छा'],
          hinglish: ['thank you', 'shukriya', 'dhanyavaad', 'bahut accha'],
          ta: ['நன்றி', 'மிக்க நன்றி']
        },
        responses: {
          en: "You're welcome! 😊 Is there anything else I can help you with? I'm always here for your banking needs.",
          hi: "आपका स्वागत है! 😊 क्या कुछ और है जिसमें मैं आपकी मदद कर सकता हूँ?",
          hinglish: "Aapka swagat hai! 😊 Kya kuch aur hai jismein main help kar sakta hoon?",
          ta: "நல்வரவு! 😊 வேறு ஏதாவது உதவ வேண்டுமா?"
        },
        uiAction: 'SHOW_SUGGESTIONS',
        uiData: {}
      }
    };
  }

  /**
   * Get suggested queries for the current language.
   */
  getSuggestions(language = 'en') {
    const suggestions = {
      en: [
        'Check my account balance',
        'Block my credit card',
        'Show FD interest rates',
        'Apply for a credit card',
        'Home loan process',
        'Nearest branch location'
      ],
      hi: [
        'मेरा बैलेंस बताओ',
        'मेरा कार्ड ब्लॉक करो',
        'एफडी रेट दिखाओ',
        'क्रेडिट कार्ड अप्लाई',
        'होम लोन प्रक्रिया',
        'नज़दीकी शाखा'
      ],
      hinglish: [
        'Balance kitna hai',
        'Card block karo',
        'FD rates kya hain',
        'Credit card apply karna hai',
        'Home loan ka process',
        'Nearest branch kahan hai'
      ],
      ta: [
        'கணக்கு இருப்பு சரிபார்',
        'கார்டு தடை செய்',
        'FD வட்டி விகிதம்',
        'கிரெடிட் கார்டு விண்ணப்பம்',
        'வீட்டுக் கடன்',
        'அருகிலுள்ள கிளை'
      ]
    };
    return suggestions[language] || suggestions.en;
  }
}
