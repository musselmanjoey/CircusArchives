# YouTube API Verification Guide

This guide covers how to verify your Google Cloud app to increase YouTube API upload limits.

## Current Limits

- **Unverified apps (Testing mode)**: ~6-10 video uploads per day
- **Verified apps**: Higher limits (varies, typically 100+ per day)

## When to Verify

You probably don't need verification if:
- You're uploading to your own channel
- 10 videos/day is sufficient for your needs
- You're the only user of the tool

Consider verification if:
- You need to upload more than 10 videos daily
- Multiple users will use the tool
- You're building a public-facing application

## Verification Process

### Prerequisites

1. A published app (not in "Testing" mode)
2. A privacy policy URL (publicly accessible)
3. A homepage URL for your app

### Step 1: Publish Your App

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Click **"Publish App"** to move from Testing to Production

### Step 2: Prepare Required URLs

You'll need:

**Privacy Policy URL** (required)
- Must be publicly accessible
- Can be a simple page explaining what data you collect
- Example: `https://circusarchives.com/privacy`

**Homepage URL** (required)
- Your app or organization's homepage
- Example: `https://circusarchives.com`

**Terms of Service URL** (optional)
- Terms for using your application

### Step 3: Create a Privacy Policy

If you don't have one, create a simple privacy policy page. Example content:

```
Privacy Policy for Circus Archives YouTube Uploader

Last updated: [DATE]

This tool is a personal utility for uploading videos to YouTube.

Data Collection:
- This tool accesses your YouTube account solely to upload videos
- No personal data is collected, stored, or shared
- OAuth tokens are stored locally on your machine only

Data Usage:
- YouTube API is used only for uploading videos to your channel
- No analytics or tracking is performed

Contact:
[Your email]
```

### Step 4: Submit for Verification

1. Go to **APIs & Services** → **OAuth consent screen**
2. Look for **"Verify App"** or **"Prepare for verification"** button
3. Fill out the verification form:

   **App Information:**
   - App name: `Circus Archives Uploader`
   - User support email: `circusarchivesyt@gmail.com`
   - App logo: (optional, 120x120px)

   **App Domain:**
   - Application homepage: `https://circusarchives.com`
   - Privacy policy: `https://circusarchives.com/privacy`
   - Terms of service: (optional)

   **Authorized Domains:**
   - Add your domain: `circusarchives.com`

   **Scopes Justification:**
   For the `youtube.upload` scope, explain your use case:

   > "This is a personal tool for uploading archival videos of FSU Flying High Circus performances to a dedicated YouTube channel (@Flying_High_Circus_Archives). The tool is only used by the channel owner to batch upload historical circus performance videos. No other users will access this application."

4. Submit the form

### Step 5: Wait for Review

- Google reviews sensitive scopes like `youtube.upload`
- Review can take **1-4 weeks**
- You may receive follow-up questions via email
- Check your Google Cloud Console for status updates

### Common Rejection Reasons

1. **Missing or invalid privacy policy** - Make sure URL is accessible
2. **Vague use case description** - Be specific about what you're doing
3. **Scope not justified** - Explain why you need upload access
4. **Commercial use concerns** - Clarify if it's personal/non-commercial

### After Verification

Once verified:
- Your daily upload limit increases significantly
- The "unverified app" warning disappears for users
- You can add more test users without limits

## Alternative: Request Quota Increase

Instead of full verification, you can request a quota increase:

1. Go to **APIs & Services** → **Quotas**
2. Find **YouTube Data API v3**
3. Click on the quota you want to increase
4. Click **"Edit Quotas"** or **"Request Increase"**
5. Fill out the form explaining your use case

This is sometimes faster than full app verification.

## Resources

- [Google OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [YouTube API Quota Documentation](https://developers.google.com/youtube/v3/getting-started#quota)
- [OAuth Consent Screen Setup](https://developers.google.com/workspace/guides/configure-oauth-consent)
