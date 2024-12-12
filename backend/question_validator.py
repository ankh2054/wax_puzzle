from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import pronouncing  # Only needed for rhyme checking in poetry
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load classifiers with authentication
huggingface_token = os.getenv('HUGGINGFACE_TOKEN')
if not huggingface_token:
    raise EnvironmentError("HUGGINGFACE_TOKEN not found in environment variables")

# Load classifiers
question_classifier = pipeline(
    "text-classification", 
    model="shahrukhx01/question-vs-statement-classifier",
    token=huggingface_token
)
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    token=huggingface_token
)


class ValidationRequest(BaseModel):
    text: str
    challenge_number: int

class ValidationResponse(BaseModel):
    is_valid: bool
    error: str | None = None
    confidence: float | None = None

def validate_question_structure(text: str) -> tuple[bool, str | None, float | None]:
    # Basic checks
    if not text.strip():
        return False, "Please enter your question", None
    
    # Only check if it ends with a question mark
    if not text.strip().endswith('?'):
        return False, "Your submission must end with a question mark (?)", None

    # Use transformer model for question classification
    result = question_classifier(text)[0]
    confidence = result['score']
    is_question = result['label'] == 'LABEL_1'  # LABEL_1 means it's a question

    # Check confidence threshold
    if is_question and confidence < 0.90:
        return False, "Your submission should be a more clearly phrased question", confidence

    if not is_question:
        return False, "Your submission must be phrased as a question", confidence

    return True, None, confidence

def validate_emotional_expression(text: str) -> tuple[bool, str | None, float | None]:
    if not text.strip():
        return False, "Please enter text that expresses emotion", None

    # Use emotion detection model
    result = emotion_classifier(text)[0]
    print(f"DEBUG - Emotion Raw output: {result}")
    
    confidence = result['score']
    label = result['label'].lower()
    
    # Check for strong emotional expression
    is_emotional = confidence > 0.8 and label not in ['neutral', 'others']

    if not is_emotional:
        return False, "Your text should express strong emotion", confidence

    return True, None, confidence

def validate_poetic_structure(text: str) -> tuple[bool, str | None, float | None]:
    if not text.strip():
        return False, "Please enter your poem", None

    lines = text.split('\n')
    if len(lines) < 2:
        return False, "Please write at least two lines", None

    # Check for rhyming
    def get_last_word(line):
        words = line.strip().split()
        return words[-1] if words else ""

    def lines_rhyme(line1, line2):
        word1 = get_last_word(line1)
        word2 = get_last_word(line2)
        rhymes1 = pronouncing.rhymes(word1.lower())
        return word2.lower() in rhymes1

    # Check for rhyming pairs or line breaks (now more lenient)
    has_structure = False
    
    # Check for rhyming
    for i in range(0, len(lines)-1, 2):
        if i+1 < len(lines) and lines_rhyme(lines[i], lines[i+1]):
            has_structure = True
            break
    
    # Check for line breaks and formatting
    if not has_structure:
        has_structure = len([line for line in lines if line.strip()]) >= 2

    if not has_structure:
        return False, "Try writing your text in a poetic format with multiple lines", None

    return True, None, 0.8

app = FastAPI()

@app.post("/validate")
async def validate_text(request: ValidationRequest) -> ValidationResponse:
    if request.challenge_number == 1:
        is_valid, error, confidence = validate_question_structure(request.text)
    elif request.challenge_number == 2:
        is_valid, error, confidence = validate_emotional_expression(request.text)
    elif request.challenge_number == 3:
        is_valid, error, confidence = validate_poetic_structure(request.text)
    else:
        return ValidationResponse(
            is_valid=False,
            error="Invalid challenge number"
        )

    return ValidationResponse(
        is_valid=is_valid,
        error=error,
        confidence=confidence
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)