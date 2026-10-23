import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request, { type Agent } from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { connectDb } from '../config/db.js';
import { hashPassword } from '../services/auth.service.js';
import { User } from '../models/index.js';

let mongo: MongoMemoryServer | undefined;

export async function startApp(): Promise<Express> {
  if (process.env.TEST_MONGODB_URI) {
    await connectDb(process.env.TEST_MONGODB_URI);
  } else {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  }
  return createApp();
}

export async function stopApp(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

export async function resetDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export function csrfFrom(setCookie: string[] | undefined): string {
  const row = (setCookie || []).find((cookie) => cookie.startsWith('tms_csrf='));
  if (!row) throw new Error('missing csrf cookie');
  return decodeURIComponent(row.split(';')[0].slice('tms_csrf='.length));
}

export async function asUser(app: Express, email: string, password: string): Promise<{ agent: Agent; csrf: string }> {
  const agent = request.agent(app);
  await agent.get('/api/v1/auth/csrf');
  const login = await agent.post('/api/v1/auth/login').set('x-csrf-token', csrfFrom(agent.jar.getCookiesSync?.('http://localhost') as never)).send({ email, password });
  const csrf = csrfFrom(login.headers['set-cookie'] as string[] | undefined);
  return { agent, csrf };
}

export async function signIn(app: Express, email: string, password: string) {
  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/v1/auth/csrf');
  const csrf = csrfRes.body.data.token as string;
  const login = await agent.post('/api/v1/auth/login').set('x-csrf-token', csrf).send({ email, password });
  return { agent, csrf: csrfFrom(login.headers['set-cookie'] as string[]), login };
}

export async function makeStaff(role: 'super_admin' | 'operations_manager' | 'support_agent' | 'content_editor', email: string) {
  await User.create({
    email,
    name: role,
    role,
    status: 'active',
    passwordHash: await hashPassword('Password12345'),
  });
  return { email, password: 'Password12345' };
}
