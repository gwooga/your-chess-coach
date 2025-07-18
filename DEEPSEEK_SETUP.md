# DeepSeek API Setup Guide

## Step 1: Get Your DeepSeek API Key

1. Go to [DeepSeek Console](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate a new API key

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root with the following content:

```env
# DeepSeek API Key
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# OpenAI API Key (keep for future use)
OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_deepseek_api_key_here` with your actual DeepSeek API key.

## Step 3: For Vercel Deployment

If you're deploying to Vercel, add the environment variable in your Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to Environment Variables
3. Add `DEEPSEEK_API_KEY` with your API key value

## Step 4: Testing

1. Start your development server: `npm run dev`
2. You should see an "AI Provider" switcher above the user form
3. The app is now configured to use DeepSeek by default
4. You can switch between OpenAI and DeepSeek using the provider switcher

## Switching Back to OpenAI

If you want to switch back to OpenAI:

1. Change the default provider in `src/utils/aiConfig.ts`:
   ```typescript
   provider: 'openai', // Change from 'deepseek' to 'openai'
   ```

2. Make sure your `OPENAI_API_KEY` is set in your environment variables

## Current Configuration

- **Default Provider**: DeepSeek
- **DeepSeek Model**: `deepseek-chat`
- **OpenAI Model**: `gpt-4o` (when switching back)

The app will automatically use the appropriate API based on your selection. 