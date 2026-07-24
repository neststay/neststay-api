# Project overview

An ecommerce application api built using Nestjs. 
Database - Postgres
For queues - Redis
For cache - Redis
For search and product listing - Typesense

# Claude Guidelines

## Git

- Never commit changes unless explicitly asked by the user.

## OpenSpec Apply

When running opsx:apply, implement all pending tasks within the current section in one shot, then stop and report progress before moving to the next section. Never cross section boundaries in a single run.

Before implementing any tasks, read `docs/architecture/index.md` and follow any linked documents referenced there that are relevant to the requirements (e.g. API, events, auth architecture). Use this to inform all implementation decisions.

## Implementing Multiple APIs

When a module needs several routes (e.g. create, list, view, update, delete), implement them one route at a time, end-to-end, rather than one layer at a time across all routes.

For each route, build in this order: DTO -> repository method -> service method -> controller endpoint. Only move to the next route once the current one is complete.

Do NOT batch work horizontally (e.g. writing all DTOs for every route, then all repositories, then all services, then all controllers).
