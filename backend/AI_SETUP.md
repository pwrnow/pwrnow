# AI Integration Setup

This document describes how to set up AI providers for the PwrNow application.

## Supported AI Providers

The application now supports two AI providers:
- **OpenAI** (GPT models)
- **Google Gemini** (Gemini models)

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# AI API Keys
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# AI Provider Configuration (for development/admin use only)
AI_PROVIDER=openai  # or "gemini"
```

## API Key Setup

### OpenAI API Key
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

## Usage

The AI provider is configured via the `AI_PROVIDER` environment variable. The service automatically uses the configured provider:

```python
# Service automatically uses the provider from Django settings
service = ScheduleParsingService()
```

## API Endpoint

The schedule parsing endpoint accepts only the raw text (provider is configured server-side):

```json
{
  "raw_text": "Your schedule text here..."
}
```

## Provider Configuration

The AI provider is configured via environment variable and is not exposed through the public API:

- **Development**: Set `AI_PROVIDER=gemini` in your `.env` file to use Gemini
- **Production**: Configure the provider through Django settings or environment variables
- **Admin**: View and filter AI processing logs by provider in Django admin

## Django Admin

The Django admin interface now shows:
- Provider selection in the AI Processing Log
- Filtering by provider
- Human-readable provider names

## Dependencies

The following packages are required for AI functionality:

```
langchain==0.3.15
langchain-openai==0.2.8
langchain-google-genai==2.0.4
google-generativeai==0.8.3
```

## Migration

Run the following command to apply the database migration:

```bash
python manage.py migrate ai
```
