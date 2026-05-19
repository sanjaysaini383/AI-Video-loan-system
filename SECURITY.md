# Security Policy

## Reporting Security Vulnerabilities

🔒 **Please do not open public issues for security vulnerabilities.**

If you discover a security vulnerability, please email the maintainers directly:
- Contact: [security@example.com](mailto:security@example.com)

Please include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if available)

We will acknowledge your report within 48 hours and work with you to resolve the issue.

## Security Guidelines

### For Users

1. **Environment Variables**
   - Never commit `.env` file with real credentials
   - Use `.env.example` as template
   - Rotate API keys regularly
   - Use strong `JWT_SECRET` (minimum 32 characters)

2. **Database**
   - Change default Postgres/MongoDB passwords before production
   - Enable SSL/TLS for database connections
   - Use environment variables for credentials, never hardcode

3. **API Security**
   - All API endpoints require JWT authentication
   - Rate limiting is enabled on the gateway
   - CORS is properly configured
   - Helmet.js enforces security headers

### For Contributors

1. **Code Review**
   - All code changes require review before merging
   - Security-sensitive changes require maintainer approval

2. **Dependency Management**
   - Keep dependencies up to date
   - Run `npm audit` to check for vulnerabilities
   - Use `--exact` versions for security-critical packages

3. **Secrets Management**
   - Never commit credentials, keys, or tokens
   - Use environment variables for all secrets
   - Use `.gitignore` to prevent accidental commits

4. **Data Protection**
   - Sanitize user inputs
   - Use prepared statements for database queries
   - Validate and encode API responses
   - Don't log sensitive information

## Security Features

### Built-in Protections

- **JWT Authentication** — Secure token-based auth
- **CORS Protection** — Controlled cross-origin requests
- **Rate Limiting** — Prevents abuse and DDoS
- **Helmet.js** — Sets security HTTP headers
- **Input Validation** — Protects against injection attacks
- **Audit Logging** — Immutable compliance trails

### Recommended Practices

1. Run `npm audit` regularly
   ```bash
   npm audit
   npm audit fix
   ```

2. Use tools like OWASP ZAP for security testing
3. Keep Docker images updated
4. Monitor logs for suspicious activity
5. Use HTTPS in production

## Infrastructure Security

### Docker

- Images are based on minimal Alpine Linux
- Containers run as non-root users
- Health checks ensure service availability
- Network isolation between services

### Database

- PostgreSQL uses encrypted passwords
- MongoDB requires authentication
- Both support SSL/TLS connections
- Regular backups recommended

### API Gateway

- Rate limits: 100 requests per 15 minutes
- Token blacklist prevents replay attacks
- CORS whitelist controls allowed origins

## Third-party Services

This project integrates with:

- **Groq API** — LLM service (secure token required)
- **Gemini API** — Alternative LLM (secure token required)
- **Deepgram** — Speech-to-text service (optional, secure token required)
- **MediaPipe** — On-device computer vision (no API calls)

Never share API credentials. Use environment variables.

## Compliance

This project is designed with compliance in mind:

- **KYC/AML** — Identity verification workflows
- **Data Privacy** — Minimal data collection
- **Audit Trails** — Immutable logging
- **Consent Capture** — Recorded and timestamped

## Incident Response

If a security incident occurs:

1. Disable affected services if necessary
2. Isolate compromised components
3. Notify affected users
4. Document incident details
5. Implement fix and deploy
6. Post-incident review

## Contact

- **Security Issues**: [security@example.com](mailto:security@example.com)
- **General Questions**: GitHub Issues
- **Feature Requests**: GitHub Discussions
