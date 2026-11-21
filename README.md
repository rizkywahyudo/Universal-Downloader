# Universal Downloader — Lavender Premium

Next.js 14 application for inspecting and downloading **direct-access files** that the user is authorized to save.

## Important limitations
- This is not a YouTube/TikTok/Instagram extractor and does not bypass DRM, login walls, signatures, or platform download restrictions.
- Social platform URLs are detected and reported as unsupported for direct extraction. Use official export/download features or authorized APIs.
- Vercel functions are not suitable for long-running media transcoding or large-file relay. This implementation caps direct file downloads at 50 MB and uses a 60-second function limit.
- MP3 is supported only when the source itself provides an accessible MP3 file. No transcoding is performed.
- Browser download progress is available only while the browser streams the direct file.
- Batch download is sequential and limited to five URLs.

## Requirements
- Node.js 18.17+ (20 LTS recommended)
- GitHub account
- Vercel account

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy with GitHub + Vercel
1. Create a GitHub repository named `universal-downloader`.
2. Upload all project files (keep the folder structure).
3. In Vercel, choose **Add New → Project**, import the GitHub repository.
4. Framework preset: Next.js. Build command: `npm run build`; output directory: leave default.
5. No environment variables are required for this starter.
6. Click Deploy. Every push to the connected branch triggers a new deployment.
7. Test with a direct public file URL, such as a small PDF or MP4 whose owner permits downloading.

## Optional custom domain
In Vercel Project → Settings → Domains, add your domain and follow the DNS records shown by Vercel. Do not guess DNS values; use the exact values displayed in the dashboard.

## Security / production hardening
This starter validates protocols and blocks common private IPv4 host ranges, but production deployments should use a strict outbound hostname allowlist or a dedicated safe-fetch service with DNS-rebinding protection, redirect-by-redirect validation, response streaming limits, per-IP rate limits, abuse monitoring, and authentication for batch jobs. Do not expose this endpoint as an unrestricted public proxy.
