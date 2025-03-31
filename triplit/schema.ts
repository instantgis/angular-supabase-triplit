import { Schema as S, type Entity } from '@triplit/client';

export const schema = S.Collections({
  todos: {
    schema: S.Schema({
      id: S.Id(),
      text: S.String(),
      completed: S.Boolean({ default: false }),
      created_at: S.Date({ default: S.Default.now() }),
    }),
  },
  projets: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String({ unique: true, nullable: false }),
      content: S.String({ nullable: true }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      language: S.String({ nullable: false }),
      transport: S.String({ enum: ['walking', 'biking', 'driving', 'boating', 'flying'] }),
      status: S.String({ enum: ['draft', 'published'] }),
      duration: S.Number({ nullable: true, default: 0.0 }),
      owner_id: S.String({ nullable: false }),
    }),
    relationships: {
      pois: S.RelationMany('pois', {
        where: [['project_id', '=', '$id']],
      }),
      thumbnail: S.RelationOne('thumbnails', {
        where: [['project_id', '=', '$id']],
      }),
    },
    rules: {
      read: 'auth.id = owner_id',
      write: 'auth.id = owner_id',
    }
  },
  pois: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: false }),
      label: S.String({ unique: true, nullable: true }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      latitude: S.Number({ nullable: false }),
      longitude: S.Number({ nullable: false }),
      radius: S.Number({ nullable: false, default: 5.0 }),
      content: S.String({ nullable: true }),
      order: S.Number({ nullable: false, default: 0 }),
    }),
    relationships: {
      project: S.RelationOne('projets', {
        where: [['id', '=', '$project_id']],
      }),
      medias: S.RelationMany('medias', {
        where: [['poi_id', '=', '$id']],
      }),
    },
    rules: {
      read: 'auth.id = owner_id',
      write: 'auth.id = owner_id',
    }
  },
  medias: {
    schema: S.Schema({
      id: S.Id(),
      poi_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: false }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      type: S.String({ enum: ['image', 'audio', 'video'] }),
      url: S.String({ nullable: false }),
      order: S.Number({ nullable: false, default: 0 }),
    }),
    rules: {
      read: 'auth.id = owner_id',
      write: 'auth.id = owner_id',
    }
  },
  thumbnails: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: false }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      type: S.String({ enum: ['image', 'audio', 'video'] }),
      url: S.String({ nullable: false }),
    }),
    rules: {
      read: 'auth.id = owner_id',
      write: 'auth.id = owner_id',
    }
  },
  extents: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: false }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      min_latitude: S.Number({ nullable: false }),
      max_latitude: S.Number({ nullable: false }),
      min_longitude: S.Number({ nullable: false }),
      max_longitude: S.Number({ nullable: false }),
    }),
    relationships: {
      project: S.RelationOne('projets', {
        where: [['id', '=', '$project_id']],
      }),
    },
    rules: {
      read: 'auth.id = owner_id',
      write: 'auth.id = owner_id',
    }
  }
});

export type Todo = Entity<typeof schema, 'todos'>;





