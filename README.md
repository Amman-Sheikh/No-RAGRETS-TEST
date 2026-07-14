# No Ragrets Laser Consultation Landing Page

This project is a static HTML landing page with a Vercel Serverless Function for handling consultation form submissions.

The workflow collects consultation details, uploads tattoo reference images to Cloudinary, creates or updates contacts in Brevo CRM, and displays the Cal.com booking calendar for appointment scheduling.

---

# Project Structure

```
/
│── index.html
│── README.md
│
└── api/
      submit-lead.js
```

---

# Requirements

Before deploying, ensure you have access to:

- Vercel Account
- Brevo Account
- Brevo API Key
- Cloudinary Account
- Cal.com Account

---

# Deployment

## Step 1 – Create a New Vercel Project

1. Log in to Vercel.
2. Click **New Project**.
3. Import the project from GitHub or upload the project folder.
4. Vercel will automatically detect the project.

No framework configuration is required.

---

## Step 2 – Configure Environment Variables

Before deploying, add the following Environment Variable:

| Name | Value |
|------|-------|
| BREVO_API_KEY | Your Brevo API Key |

The API key should **never** be hardcoded inside the project files.

---

## Step 3 – Deploy

Click **Deploy**.

Vercel will automatically deploy:

- Static HTML
- CSS
- JavaScript
- Serverless Function (`api/submit-lead.js`)

---

# Workflow

The application follows this workflow:

1. Visitor completes the consultation form.
2. Tattoo reference images are uploaded to Cloudinary.
3. The form is submitted to the Vercel Serverless Function.
4. The Serverless Function creates or updates the contact in Brevo.
5. The consultation calendar loads.
6. Visitor books an appointment through Cal.com.
7. Booking confirmation is displayed.

---

# Features

- Responsive Landing Page
- Multi-Step Consultation Form
- Image Upload Support
- Cloudinary Integration
- Brevo CRM Integration
- Contact Upsert
- Cal.com Appointment Booking
- Progress Step Indicator
- Client-side Validation
- Accessibility Improvements
- Optimized Calendar Loading
---

# Post Deployment Checklist

After deployment, verify the following:

- Form submits successfully
- Images upload correctly
- Contact appears in Brevo
- Contact attributes are populated
- Cal.com calendar loads
- Appointment booking works
- Confirmation screen appears
- Progress indicator reaches **Confirmed**

---

# Environment Variables

Required:

```
BREVO_API_KEY:
```

---

# External Services

This project uses the following services:

- Vercel
- Brevo
- Cloudinary
- Cal.com

---

# Notes

This project has been developed according to the agreed scope.

The current implementation includes:

- Lead creation/update in Brevo
- Image uploads
- Appointment booking through Cal.com
- Functional step indicator

---

# Security

For security reasons:

- Do not expose the Brevo API Key.
- Store API keys only in Vercel Environment Variables.
- Do not commit secrets to GitHub.
- Rotate the API key immediately if it is accidentally exposed.

---

# Support

If you make changes to:

- Brevo Attributes
- Cloudinary Upload Settings
- Cal.com Booking Links

ensure the corresponding values inside the project are updated accordingly.

---

# License

This project was developed exclusively for **No Ragrets Laser**.

# Project Handover

The project has been tested and verified with the following workflow:

- Form submission
- Cloudinary image upload
- Brevo contact creation/update
- Cal.com booking flow
- Booking confirmation
- Progress indicator

The application is production-ready according to the agreed project scope.
