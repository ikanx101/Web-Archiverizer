<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

```
# install dulu
apt install npm

# Update nodejs to the lates version
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

# Install dependencies
npm install

# install playwright
npx playwright install-deps
npx playwright install

sudo apt-get install chromium-browser

npm install puppeteer

npm run build
npm run dev
```
