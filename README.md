# 🇺🇦 Ukraine Economic Output Dashboard

ASP.NET Core + Vite (React) дашборд для аналізу обсягу виробленої продукції суб'єктів підприємництва України за 2013–2024 роки.

## Структура проекту

```
ukraine-dashboard/
├── Program.cs          # ASP.NET Core Minimal API (backend)
├── backend.csproj      # .NET 8 проект
├── NuGet.config        # локальні пакети (без nuget.org)
├── data.json           # 11 628 записів, спарсені з xlsx
├── appsettings.json
└── frontend-src/       # Vite + React фронтенд
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── components/
    │       ├── Summary.jsx      # Огляд: KPI + графіки
    │       ├── SectorsChart.jsx # Галузі: bar + trend charts
    │       └── KvedExplorer.jsx # Провідник КВЕД + порівняння
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## Запуск

### 1. Backend (ASP.NET Core)
```bash
cd ukraine-dashboard
dotnet run --urls http://localhost:5100
```

### 2. Frontend (Vite)
```bash
cd ukraine-dashboard/frontend-src
npm install
npm run dev
```
Відкрийте http://localhost:5173

## API Endpoints

| Endpoint | Опис |
|----------|------|
| `GET /api/summary` | Зведені дані по всіх роках (TOTAL) |
| `GET /api/sections` | Топ-рівневі секції КВЕД (A-S) з даними по роках |
| `GET /api/kved/{code}` | Дані для конкретного коду КВЕД |
| `GET /api/top?year=2023&limit=10` | Топ галузей за обсягом |
| `GET /api/search?q=...` | Пошук по назві або коду КВЕД |
| `GET /api/kved-tree` | Дерево всіх кодів КВЕД |

## Дані

Джерело: `ovpsg_vsmm_ek_2013_2022_u.xlsx`  
- **969** унікальних кодів КВЕД  
- **11 628** записів (кожен = код × рік)  
- Роки: 2013–2024  
- Колонки: загальний обсяг, великий/середній/малий/мікро бізнес (тис.грн + %), ФОП  
