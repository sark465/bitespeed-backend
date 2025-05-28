BitSpeed Backend

Overview:
---------
BitSpeed Backend is a Node.js REST API built with Express and Prisma ORM
to manage contacts with email and phone number details stored in a PostgreSQL database.
It supports identifying and linking contacts, managing primary and secondary contact relationships.

Tech Stack:
-----------
- Node.js with TypeScript
- Express.js framework
- Prisma ORM
- PostgreSQL database

Folder Structure:
-----------------
bitespeed-backend/
│
├── src/
│   ├── controllers/         # Business logic for routes
│   │   └── identifyController.ts
│   │
│   ├── models/              # Prisma schema or other data models
│   │   └── contactModel.ts
│   │
│   ├── routes/              # Express route definitions
│   │   └── identifyRoutes.ts
│   │
│   ├── services/            # Optional: for complex business/service layer logic
│   │   └── contactService.ts
│   │
│   ├── prisma/              # Prisma related files and schema
│   │   └── schema.prisma
│   │
│   ├── utils/               # Utility/helper functions
│   │   └── logger.ts
│   │
│   ├── db.ts                # Prisma client instance
│   ├── app.ts               # Express app setup (middlewares, routes)
│   └── server.ts            # Server startup and listening
│
├── .env                     # Environment variables
├── package.json             # NPM dependencies and scripts
├── tsconfig.json            # TypeScript config
├── README.txt               # Project documentation
-----------------
Setup Instructions:
-------------------
1. Prerequisites:
   - Node.js (v18+ recommended)
   - PostgreSQL (Ensure server is running)
   - npm or yarn package manager

2. Clone the repository:
   git clone <repo-url>
   cd bitespeed-backend

3. Create a `.env` file with the following content:
   DATABASE_URL="postgresql://bitespeed_user:your_password@localhost:5432/bitespeed?schema=public"

4. Install dependencies:
   npm install

5. Setup Prisma:
   - Generate Prisma client:
     npx prisma generate

   - Run migrations (if needed):
     npx prisma migrate dev --name init

6. Start the server:
   - For development (auto reload):
     npm run dev

   - For production:
     npm start

7. The API will run at http://localhost:3000 by default.

API Endpoint:
-------------
POST /identify

Request body JSON:
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}

Response JSON:
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}

- Either `email` or `phoneNumber` is required.
- The endpoint identifies linked contacts and maintains primary/secondary contact relationships.

Prisma Schema (schema.prisma):
------------------------------
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Contact {
  id             Int      @id @default(autoincrement())
  email          String?  @unique
  phoneNumber    String?  @unique
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime @default(now())
}

TypeScript and Express Setup:
-----------------------------
- Uses Express with body-parser to handle JSON requests.
- Routes are modularized; `/identify` handled in `identifyRoutes.ts`.
- PrismaClient is instantiated once in `identify.ts` for DB queries.
- Implements logic to create new contacts or link existing ones,
  auto promoting the earliest contact as primary.

Scripts (package.json):
----------------------
"scripts": {
  "start": "ts-node src/index.ts",
  "dev": "ts-node-dev src/index.ts"
}

Development dependencies include TypeScript, ts-node, ts-node-dev, Prisma, and type definitions.

TypeScript Config (tsconfig.json):
----------------------------------
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

---

Thank you for using BitSpeed Backend!
