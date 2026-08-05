# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a potential security vulnerability within the Visual AI Browser Agent (Chrome Extension or Express Backend API), please report it responsibly.

### Disclosure Process

1. Email your findings directly to the repository maintainers or open a private security advisory.
2. Include a detailed description of the vulnerability, steps to reproduce, and impact.
3. Please do **not** disclose the issue publicly until we have reviewed and addressed it.

### Security Principles

- **Manifest V3 Least Privilege**: The Chrome extension requests only required permissions (`tabs`, `activeTab`, `scripting`, `storage`).
- **No Unsafe Execution**: No `eval()` or remote script injection is used.
- **Environment Isolation**: API keys (`GEMINI_API_KEY`) are kept strictly server-side and never exposed to the extension client.
