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

## 🎨 Styling Notes
Global SCSS lives in /src/assets/scss.

Component styles are encapsulated (ViewEncapsulation.Emulated).

Utility mixins + variables keep things DRY and consistent.

## 👤 Author
Szilard Ferencz • [szilardferencz.dev](www.szilardferencz.dev) • [LinkedIn](https://www.linkedin.com/in/szilard-ferencz/) • [GitHub](https://github.com/Sziszka90) 

## 📄 License
Distributed under the MIT License. See LICENSE for details.