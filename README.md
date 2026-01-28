# SOW Builder

An interactive Statement of Work builder for Primer payment integrations.

## 🎯 Overview

This tool helps create comprehensive SOWs by guiding users through:
- Go Live Date selection
- Payment Methods & PSPs configuration
- 3DS Strategies
- Purchase Channels & Transaction Flows
- Token Migration requirements

## 🎨 Features

- **5-Step Wizard**: Easy-to-follow questionnaire
- **53+ Payment Methods**: Pre-populated list with "Other" option
- **44+ PSPs**: Major payment service providers included
- **Multi-select Options**: Choose multiple methods, PSPs, channels, and flows
- **Summary View**: Comprehensive overview of all selections
- **Documentation Links**: Quick access to Primer docs for each section
- **Export-ready Output**: Clean, formatted SOW summary

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/sow-builder.git
cd sow-builder

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📝 Making Changes

### Adding/Removing Payment Methods

Edit `app/page.tsx` and modify the `PAYMENT_METHODS` array (around line 37):

```typescript
const PAYMENT_METHODS = [
  'ACH',
  'Afterpay',
  // Add your new payment method here
  'Your New Payment Method',
];
```

### Adding/Removing PSPs

Edit `app/page.tsx` and modify the `PSPS` array (around line 93):

```typescript
const PSPS = [
  '2C2P',
  'Adyen',
  // Add your new PSP here
  'Your New PSP',
];
```

### Updating Questions

Navigate to the relevant case in the `renderFormField()` function in `app/page.tsx`:
- Go Live Date: `case 'date'` (line ~260)
- PSPs & APMs: `case 'psp-apms'` (line ~270)
- 3DS: `case '3ds'` (line ~224)
- Channels: `case 'channels'` (line ~305)
- Token: `case 'token'` (line ~456)

### Updating Documentation Links

Edit the `categoryContent` object in `app/page.tsx` (around line 527) to change documentation URLs.

## 🎨 Customization

### Colors

The color scheme is defined in `app/globals.css` using CSS variables:
- Primary (Coral): `#FF7C4F`
- Primary Dark (Ember): `#FFC6AE`
- Primary Light (Blush): `#FFF6AE`

### Styling

Component styles are in `app/page.module.css`. Each section has its own class namespace.

## 📦 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments on every push to `main`.

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test locally with `npm run dev`
4. Push to your branch and create a Pull Request

## 📋 Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **CSS Modules**

## 📄 License

Internal use only - Primer.io

## 🆘 Support

For questions or issues, contact the Payments Solutions team.
