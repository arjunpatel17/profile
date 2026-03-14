# Netflix-Style Personal Profile

A Netflix-inspired personal portfolio webpage showcasing work experience, education, skills, and projects. Built as a static site with Docker deployment to Azure.

## Preview

Dark-themed, Netflix-style portfolio with:
- **Hero section** with profile picture and bio
- **Horizontal scrolling rows** for Experience, Education, and Projects (like Netflix content rows)
- **Card hover effects** that expand to show details
- **Skills section** with animated progress bars
- **Built-in search** (Ctrl/Cmd+K) to find anything on the page
- **Analytics dashboard** tracking page views, visitors, devices, and traffic sources
- **Contact form** for inquiries

## Quick Start

### Local Development
Open `index.html` in a browser — no build step required.

Or serve with any static server:
```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

### Docker (Local)
```bash
docker build -t netflix-profile .
docker run -p 8080:80 netflix-profile
```
Then visit `http://localhost:8080`.

## Deploy to Azure

### Prerequisites
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [Docker](https://www.docker.com/get-started) installed and running
- Logged in to Azure: `az login`

### One-Command Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Create a Resource Group
2. Deploy infrastructure via Bicep (ACR, App Service, Application Insights)
3. Inject the Application Insights connection string for cloud analytics
4. Build & push the Docker image to Azure Container Registry
5. Restart the App Service to pull the latest image

### Manual Deploy
```bash
# 1. Create resource group
az group create --name arjun-profile-rg --location eastus

# 2. Deploy Bicep infrastructure
az deployment group create \
  --resource-group arjun-profile-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json

# 3. Login to ACR and push image
az acr login --name arjunprofileacr
docker build -t arjunprofileacr.azurecr.io/netflix-profile:latest .
docker push arjunprofileacr.azurecr.io/netflix-profile:latest

# 4. Restart app
az webapp restart --name arjun-netflix-profile --resource-group arjun-profile-rg
```

## Analytics

### Built-in Dashboard
Click the chart icon (📊) in the navbar to open the analytics dashboard. It tracks:
- **Total visits** and **unique visitors**
- **Average session duration**
- **Section views** (which parts of your profile people look at most)
- **Traffic sources** (Direct, LinkedIn, Google, GitHub, etc.)
- **Device types** (Desktop, Mobile, Tablet)
- **Recent visitor log**

Data is stored in localStorage for the dashboard view.

### Azure Application Insights
When deployed via `deploy.sh`, Application Insights is automatically configured for cloud-level analytics including:
- Server-side request logging
- Real-time visitor monitoring
- Geographic distribution
- Custom events (section views, contact form submissions)
- Performance metrics

Access the Application Insights dashboard in the Azure Portal.

## Customization

### Profile Picture
Replace `assets/profile.jpg` with your photo (any aspect ratio — it crops to square).

### Company Logos
Add logos to `assets/` and update the `<img>` src attributes in `index.html`:
- `assets/keysight-logo.png`
- `assets/gtri-logo.png`
- `assets/enercon-logo.png`
- `assets/ge-logo.png`
- `assets/gt-logo.png`

### Contact Form
The form currently shows a success message client-side. To wire it to a backend:
- **FormSpree:** Change the form action to `https://formspree.io/f/YOUR_ID`
- **Azure Function:** POST to your function endpoint in the submit handler

### Colors
Edit CSS custom properties in `css/style.css`:
```css
:root {
  --netflix-red: #E50914;     /* Accent color */
  --bg-primary: #141414;       /* Main background */
  --bg-card: #232323;          /* Card background */
}
```

## Project Structure

```
netflix-profile/
├── index.html              # Main page
├── css/
│   └── style.css           # All styles (Netflix theme)
├── js/
│   ├── app.js              # UI logic, navigation, search, modals
│   └── analytics.js        # Visitor tracking & dashboard
├── assets/                 # Profile pic, logos, images
├── infra/
│   ├── main.bicep          # Azure infrastructure (ACR, App Service, App Insights)
│   └── parameters.json     # Deployment parameters
├── Dockerfile              # Multi-stage Docker build with Nginx
├── nginx.conf              # Nginx server configuration
├── deploy.sh               # One-click Azure deployment script
└── README.md               # This file
```

## Tech Stack
- **HTML5 / CSS3 / Vanilla JS** — Zero dependencies, zero build step
- **Nginx** — Static file serving with security headers
- **Docker** — Containerized deployment
- **Azure App Service** — Hosting (Linux container)
- **Azure Container Registry** — Docker image storage
- **Azure Application Insights** — Cloud analytics & monitoring
- **Google Fonts** — Bebas Neue + Inter typefaces
- **Font Awesome** — Icons
