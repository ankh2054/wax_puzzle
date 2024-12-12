# Backend Validation Service

This service handles validation for three different challenges using ML models and basic text analysis.

## Setup
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
- `HUGGINGFACE_TOKEN`: Your Hugging Face API token

3. Run the service:
```bash
python question_validator.py
```

## Challenge Validation Tests

### Challenge 1: Questions
The text must end with "?" and be classified as a question by the ML model.

✅ Valid Examples:
```
"What is the meaning of life?"
"Can you help me understand this puzzle?"
"Why do birds suddenly appear every time you are near?"
```

❌ Invalid Examples:
```
"Tell me the meaning of life"  (No question mark)
"This is not a question?"      (Statement with ? - ML model will catch this)
"?"                           (Too short)
```

### Challenge 2: Metaphors
Text must be classified as metaphorical by the ML model.

✅ Valid Examples:
```
"Life is a roller coaster with ups and downs"
"Her eyes were diamonds sparkling in the night"
"Time is a thief stealing our moments"
```

❌ Invalid Examples:
```
"The sky is blue"            (Literal statement)
"I went to the store"        (No metaphorical content)
"The cat sat on the mat"     (Plain description)
```

### Challenge 3: Poetry
Text must have at least two lines AND either rhyme or maintain poetic structure.

✅ Valid Examples:
```
"Roses are red
Violets are blue"

"Dancing in the night
Stars shining so bright"

"Autumn leaves falling down
Nature wears a golden crown"
```

❌ Invalid Examples:
```
"Single line only"           (Not enough lines)

"This is just
a normal sentence
split into lines"            (No rhyme or poetic structure)
```

## API Endpoint

POST `/validate`
```json
{
    "text": "Your text here",
    "challenge_number": 1  // 1, 2, or 3
}
```

Response:
```json
{
    "is_valid": true/false,
    "error": "Error message if invalid",
    "confidence": 0.95  // ML model confidence score
}
``` 