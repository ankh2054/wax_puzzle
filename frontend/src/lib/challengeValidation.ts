import nlp from 'compromise'

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ValidationResponse {
  is_valid: boolean;
  error: string | null;
  confidence: number | null;
}

export async function validateChallenge(challengeNumber: number, input: string): Promise<ValidationResult> {
  try {
    const response = await fetch('http://localhost:3002/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: input,
        challenge_number: challengeNumber
      })
    });

    if (!response.ok) {
      throw new Error('Validation request failed');
    }

    const data: ValidationResponse = await response.json();
    
    return {
      isValid: data.is_valid,
      error: data.error || undefined
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate input. Please try again.'
    };
  }
} 