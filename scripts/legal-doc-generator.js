#!/usr/bin/env node
/**
 * Legal Document Generator
 * Generates Privacy Policy and Terms of Service for mobile apps
 * 
 * Usage: node legal-doc-generator.js --app "AppName" --company "Company" --email "email@example.com" --type [privacy|tos|both]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    flags[key] = args[i + 1] || true;
    i++;
  }
}

const appName = flags.app || 'Our App';
const companyName = flags.company || 'Our Company';
const contactEmail = flags.email || 'support@example.com';
const outputDir = flags.output || './output';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generatePrivacyPolicy() {
  const year = new Date().getFullYear();
  return `# Privacy Policy for ${appName}

**Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}**

## 1. Introduction

${companyName} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how ${appName} ("app") collects, uses, discloses, and safeguards your information when you use our mobile application.

## 2. Information We Collect

### 2.1 Information You Provide
- **Account Information**: When you create an account, we collect your name, email address, and password
- **Profile Data**: Any additional information you choose to provide in your profile
- **User Content**: Data you input, upload, or submit through the app

### 2.2 Information Collected Automatically
- **Device Information**: Device type, operating system version, unique device identifiers
- **Usage Data**: Features accessed, time spent, click patterns, and navigation paths
- **Log Data**: App crashes, performance metrics, and system activity logs
- **Location Data**: Precise location (if you grant permission) or approximate location based on IP

## 3. How We Use Your Information

We use collected information to:
- Provide, maintain, and improve our services
- Personalize your experience within the app
- Send you important updates and notifications
- Respond to your inquiries and support requests
- Analyze usage patterns to enhance app functionality
- Detect, prevent, and address technical issues or fraud

## 4. Data Sharing and Disclosure

### 4.1 We do NOT sell your personal information to third parties.

### 4.2 We may share information with:
- **Service Providers**: Third parties who perform services on our behalf (hosting, analytics, customer support)
- **Legal Requirements**: When required by law, subpoena, or court order
- **Business Transfers**: In connection with a merger, acquisition, or sale of assets

## 5. Data Security

We implement appropriate technical and organizational security measures to protect your data, including:
- Encryption of data in transit (HTTPS/TLS)
- Encryption of sensitive data at rest
- Regular security assessments and penetration testing
- Access controls and employee security training

## 6. Data Retention

We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.

## 7. Your Rights

Depending on your location, you may have the right to:
- **Access**: Request a copy of your personal data
- **Rectification**: Correct inaccurate personal data
- **Erasure**: Request deletion of your data ("Right to be Forgotten")
- **Data Portability**: Receive your data in a structured, commonly used format
- **Object**: Object to certain processing activities
- **Withdraw Consent**: Withdraw previously given consent

## 8. Children's Privacy

This app is not intended for children under 13 years of age (or 16 in the EU). We do not knowingly collect personal information from children. If we discover we have collected data from a child, we will take steps to delete that information.

## 9. International Data Transfers

Your information may be transferred to and processed in countries outside your country of residence. We ensure appropriate safeguards are in place for such transfers.

## 10. Third-Party Services

The app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy within the app and updating the "Last updated" date.

## 12. Contact Us

If you have questions about this Privacy Policy, please contact us:

**${companyName}**
Email: ${contactEmail}

---

*This privacy policy template was generated for ${appName} by ${companyName} on ${new Date().toLocaleDateString()}.*
`;
}

function generateTermsOfService() {
  const year = new Date().getFullYear();
  return `# Terms of Service for ${appName}

**Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}**

## 1. Acceptance of Terms

By downloading, installing, or using ${appName} ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

## 2. Description of Service

${appName} is a mobile application that helps users [brief description of app functionality]. ${companyName} reserves the right to modify, suspend, or discontinue the App at any time.

## 3. User Accounts

### 3.1 Account Registration
You may need to create an account to access certain features. You are responsible for:
- Providing accurate and complete information
- Maintaining the security of your account credentials
- All activities that occur under your account

### 3.2 Account Termination
We may suspend or terminate your account if you:
- Violate these Terms
- Engage in fraudulent or illegal activity
- Infringe on the rights of others

## 4. Acceptable Use

You agree NOT to:
- Use the App for any illegal purpose
- Attempt to gain unauthorized access to our systems
- Reverse engineer, decompile, or disassemble the App
- Remove or alter any proprietary notices
- Interfere with or disrupt the App or servers
- Upload viruses, malware, or other harmful code
- Harvest or collect information about other users

## 5. Intellectual Property

### 5.1 Our Content
The App, including all content, features, and functionality, is owned by ${companyName} and is protected by copyright, trademark, and other intellectual property laws.

### 5.2 Your Content
You retain ownership of content you create and submit through the App. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content in connection with providing the App.

## 6. Subscriptions and Payments

### 6.1 Free vs. Paid Features
The App may offer both free and paid features. Paid features are billed according to the pricing displayed at the time of purchase.

### 6.2 Subscription Management
- Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period
- You can cancel subscriptions through your account settings or device settings
- Refunds are subject to the app store's refund policy

## 7. Disclaimer of Warranties

THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${companyName} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.

## 9. Indemnification

You agree to indemnify, defend, and hold harmless ${companyName} and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses arising out of your violation of these Terms or your use of the App.

## 10. Modifications to Terms

We reserve the right to modify these Terms at any time. We will provide notice of material changes by:
- Posting the updated Terms within the App
- Updating the "Last updated" date
- Notifying you through the App (for significant changes)

Your continued use of the App after such modifications constitutes your acceptance of the updated Terms.

## 11. Governing Law

These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.

## 12. Dispute Resolution

### 12.1 Informal Resolution
Before initiating any formal dispute resolution, you agree to contact us and attempt to resolve the dispute informally.

### 12.2 Arbitration
Any dispute arising out of or relating to these Terms or the App shall be settled by binding arbitration in accordance with the rules of [Arbitration Body].

## 13. Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.

## 14. Entire Agreement

These Terms, together with our Privacy Policy and any other legal notices published by us, constitute the entire agreement between you and ${companyName} regarding your use of the App.

## 15. Contact Information

For questions about these Terms, please contact us:

**${companyName}**
Email: ${contactEmail}

---

*These Terms of Service were generated for ${appName} by ${companyName} on ${new Date().toLocaleDateString()}.*
`;
}

const type = flags.type || 'both';

if (type === 'privacy' || type === 'both') {
  const privacyPath = path.join(outputDir, 'PRIVACY_POLICY.md');
  fs.writeFileSync(privacyPath, generatePrivacyPolicy());
  console.log(`✅ Privacy Policy generated: ${privacyPath}`);
}

if (type === 'tos' || type === 'both') {
  const tosPath = path.join(outputDir, 'TERMS_OF_SERVICE.md');
  fs.writeFileSync(tosPath, generateTermsOfService());
  console.log(`✅ Terms of Service generated: ${tosPath}`);
}

console.log(`\n📄 Legal documents generated for: ${appName}`);
console.log(`Company: ${companyName}`);
console.log(`Contact: ${contactEmail}`);
console.log(`Output directory: ${outputDir}`);
