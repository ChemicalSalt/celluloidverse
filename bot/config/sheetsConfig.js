module.exports = {
  japanese: {
    SPREADSHEET_ID: process.env.SPREADSHEET_ID_JAPANESE,
    SPREADSHEET_RANGE: "Sheet1!A:H",
    FIELDS: [
      "Kanji",
      "HiraganaKatakana",
      "Romanization",
      "EnglishMeaning",
      "SentenceKanji",
      "SentenceHiraganaKatakana",
      "SentenceRomanization",
      "SentenceMeaning",
    ],
  },

  hindi: {
    SPREADSHEET_ID: process.env.SPREADSHEET_ID_HINDI,
    SPREADSHEET_RANGE: "Sheet1!A:F",
    FIELDS: [
      "Word",
      "Romanization",
      "Meaning",
      "Sentence",
      "SentenceRomanization",
      "SentenceMeaning",
    ],
  },

  english: {
    SPREADSHEET_ID: process.env.SPREADSHEET_ID_ENGLISH,
    SPREADSHEET_RANGE: "Sheet1!A:E",
    FIELDS: [
      "Word",
      "Synonym",
      "PartOfSpeech",
      "Meaning",
      "Sentence",
    ],
  },

  mandarin: {
    SPREADSHEET_ID: process.env.SPREADSHEET_ID_MANDARIN,
    SPREADSHEET_RANGE: "Sheet1!A:F",
    FIELDS: [
      "Word",
      "Romanization",
      "Meaning",
      "Sentence",
      "SentenceRomanization",
      "SentenceMeaning",
    ],
  },

  arabic: {
    SPREADSHEET_ID: process.env.SPREADSHEET_ID_ARABIC,
    SPREADSHEET_RANGE: "Sheet1!A:F",
    FIELDS: [
      "Word",
      "Romanization",
      "Meaning",
      "Sentence",
      "SentenceRomanization",
      "SentenceMeaning",
    ],
  },
};
