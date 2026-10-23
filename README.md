# Personal Developer Site

My personal developer website built with **Angular 19** and **SCSS**. It highlights my projects, skills, and professional background.

## 🚀 Tech Stack

- Angular 21
- TypeScript
- HTML5 / SCSS

## 🛠️ Getting Started

### Clone

git clone https://github.com/yourusername/personal-developer-site.git
cd personal-developer-site

### Install

npm install

### Production build

ng build --configuration=production

### Dev server

ng serve

### → http://localhost:4200/

## 📦 Deployment

Any static host works (GitHub Pages, Netlify, Vercel, Firebase, etc.).

GitHub Pages example

ng build --configuration=production --base-href "/your-repo-name/"

npx angular-cli-ghpages --dir=dist/personal-developer-site

## Azure monitoring

The site includes the official Application Insights browser SDK. It records page views, browser/device information, aggregate location fields, referrer domain, campaign attribution, and selected interaction events without sending form contents or raw URLs with query strings. Persistent cookies are disabled by default, so the dashboard reports visits and sessions rather than a guaranteed count of unique people.

### 1. Create the Azure resources

Create a workspace-based Application Insights resource once. Replace the placeholders before running these commands:

```bash
az login
az account set --subscription "$subscriptionId"
resourceGroup="personal-dev-site-monitoring"
location="westeurope"
workspaceName="personal-dev-site-logs"
applicationInsightsName="personal-dev-site-insights"

az group create --name "$resourceGroup" --location "$location"
az monitor log-analytics workspace create \
	--resource-group "$resourceGroup" \
	--workspace-name "$workspaceName" \
	--location "$location"
az monitor app-insights component create \
	--app "$applicationInsightsName" \
	--location "$location" \
	--resource-group "$resourceGroup" \
	--workspace "$workspaceName"
az monitor app-insights component show \
	--app "$applicationInsightsName" \
	--resource-group "$resourceGroup" \
	--query connectionString -o tsv
```

Copy the final value into `APPLICATION_INSIGHTS_CONNECTION_STRING` in the production environment used by your build. The connection string identifies a public ingestion endpoint; it is not an application secret, but keeping it in a deployment variable avoids committing environment-specific configuration. The app remains telemetry-disabled when the value is empty.

### 2. Use separate custom URLs

Use this URL in the CV, including in a QR code if useful:

`https://www.szilardferencz.dev/?ref=cv`

Use this URL on your LinkedIn profile or featured section:

`https://www.szilardferencz.dev/?ref=linkedin`

The `ref` value is recorded as `utm_source`, so the Azure queries below show `cv` and `linkedin` as separate sources. The service keeps the source for the current browser session and adds it to later tracked events. The About section also records `cv_download` and `linkedin_click` events.

### 3. Useful Application Insights queries

Compare campaign traffic and location:

```kusto
pageViews
| where timestamp > ago(30d)
| extend source = tostring(customDimensions.utm_source)
| extend medium = tostring(customDimensions.utm_medium)
| summarize visits = dcount(operation_Id), page_views = count()
		by source, medium, client_CountryOrRegion, client_City
| order by visits desc
```

Check CV downloads and LinkedIn clicks:

```kusto
customEvents
| where timestamp > ago(30d)
| where name in ("cv_download", "linkedin_click")
| extend source = tostring(customDimensions.utm_source)
| summarize events = count() by name, source
| order by events desc
```

Application Insights derives country, region, and city from the request network information. Treat those fields as approximate, do not use them to identify an individual, and publish a privacy notice appropriate for the countries where the site is available. For EU/EEA visitors, add consent handling before enabling analytics if your legal basis requires it; disabling cookies alone is not a substitute for consent.

## 🎨 Styling Notes

Global SCSS lives in /src/assets/scss.

Component styles are encapsulated (ViewEncapsulation.Emulated).

Utility mixins + variables keep things DRY and consistent.

## 👤 Author

Szilard Ferencz • [szilardferencz.dev](www.szilardferencz.dev) • [LinkedIn](https://www.linkedin.com/in/szilard-ferencz/) • [GitHub](https://github.com/Sziszka90)

## 📄 License

Distributed under the MIT License. See LICENSE for details.
