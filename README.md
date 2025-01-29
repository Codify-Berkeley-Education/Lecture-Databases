# Lecture-Databases
Lecture starter and solution code for database lectures

# Setup
Install dependencies and create starter and solution databases
```bash
bun install
cp .env.template .env
touch starter/myDB.sqlite
touch solution/solutionDB.sqlite
```

This will create a starter and solution database in the `starter` and `solution` directories respectively.

All scripts in the package.json have either a `starter` or `solution` suffix to indicate which database they are running on.

To push your schema to the database, run:
```bash
bun db:push:starter # For starter database
bun db:push:solution # For solution database
```

Once you have a schema, you can also run a the provided seed script for either the starter or solution database.
```bash
bun starter/seed.ts # For solution database
bun solution/seed.ts # For starter database
```

## Lecture 8: Relational Data Modeling

Create a data model for a blogging platform.

## Lecture 9: Querying and Modifying Data

Write Drizzle queries to interact with the database.

keyset vs ordered pagination: https://medium.com/@alina.glumova/from-offset-to-cursors-exploring-the-spectrum-of-pagination-techniques-in-relational-databases-6ca7e1b561b0

planet scale mysql course: https://planetscale.com/learn/courses/mysql-for-developers

## Lecture 10: Advanced Operations

Learn advanced database topics: foreign key actions, transactions, and migrations.