# 1. Create the Next.js project
npx create-next-app@latest edutechmoney --typescript --tailwind --eslint

# 2. Navigate to directory
cd edutechmoney

# 3. Install SkoolDime & Icons
npm install lucide-react clsx tailwind-merge tailwind-variant-class-merge

# 4. Initialize Shadcn UI (Follow prompts - use "Slate" or "Zinc" for FinTech)
npx shadcn-ui@latest init

# 5. Install Backend/Database tools
npm install @prisma/client zod
npm i -D prisma

# 6. Install Security & Utilities
npm install crypto-js @types/crypto-js axios @tanstack/react-query

# 7. Initialize Prisma
npx prisma init