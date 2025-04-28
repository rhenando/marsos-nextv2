marsos/
├── app/
│ ├── [locale]/ ✅ (if using next-intl for i18n routing)
│ │ ├── page.js
│ │ ├── layout.js
│ ├── api/ ✅ (for server-side APIs)
│ ├── favicon.ico
│ ├── globals.css
│ └── ...
├── components/ ✅ (not inside /app)
│ ├── header/
│ ├── footer/
│ ├── rfq/
│ ├── ui/
│ └── ...
├── context/ ✅ (AuthContext, CartContext, etc.)
├── lib/ ✅ (for utility functions like toastUtils.js, firebase config)
├── public/ ✅ (static images like logo.png, icons)
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── jsconfig.json ✅ (for alias @/ to root)
└── ...
