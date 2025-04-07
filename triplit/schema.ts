import { Roles, Schema as S, or } from '@triplit/client';

export const roles: Roles = { 
  user: {
    match: {
     sub: '$userId',
     role: 'authenticated',
     email: '$userEmail',
    },
  }
}

export const schema = S.Collections({
  projets: {
    schema: S.Schema({
      id: S.Id(),
      owner_id: S.String({ nullable: true }),
      shared_with: S.Set(S.String(), { default: S.Default.Set.empty() }), 
      name: S.String({ unique: true, nullable: false }),
      content: S.String({ nullable: true }),
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      language: S.String({ nullable: false }),
      transport: S.String({ enum: ['walking', 'biking', 'driving', 'boating', 'flying'] }),
      status: S.String({ enum: ['draft', 'published'] }),
      duration: S.Number({ nullable: true, default: 0.0 }),
    }),
    relationships: {
      pois: S.RelationMany('pois', {
        where: [['project_id', '=', '$id']],
      }),
      thumbnail: S.RelationOne('thumbnails', {
        where: [['project_id', '=', '$id']],
      }),
    },
    permissions: {
      user: {
        read: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        insert: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        update: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        delete: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        }
      }
    }
  },
  pois: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: true }),
      shared_with: S.Set(S.String(), { default: S.Default.Set.empty() }), 
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
    permissions: {
      user: {
        read: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        insert: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        update: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        delete: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        }
      }
    }
  },
  medias: {
    schema: S.Schema({
      id: S.Id(),
      poi_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: true }),
      shared_with: S.Set(S.String(), { default: S.Default.Set.empty() }), 
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      type: S.String({ enum: ['image', 'audio', 'video'] }),
      url: S.String({ nullable: false }),
      order: S.Number({ nullable: false, default: 0 }),
    }),
    permissions: {
      user: {
        read: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        insert: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        update: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        delete: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        }
      }
    }
  },
  thumbnails: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: true }),
      shared_with: S.Set(S.String(), { default: S.Default.Set.empty() }), 
      created_at: S.Date({ default: S.Default.now() }),
      edited_at: S.Date(),
      type: S.String({ enum: ['image', 'audio', 'video'] }),
      url: S.String({ nullable: false }),
    }),
    permissions: {
      user: {
        read: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        insert: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        update: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        delete: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        }
      }
    }
  },
  extents: {
    schema: S.Schema({
      id: S.Id(),
      project_id: S.String({ nullable: false }),
      owner_id: S.String({ nullable: true }),
      shared_with: S.Set(S.String(), { default: S.Default.Set.empty() }), 
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
    permissions: {
      user: {
        read: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        insert: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        update: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        },
        delete: {
          filter: [
            or([
              ['owner_id', '=', '$role.userId'],
              ['shared_with', 'includes', '$role.userEmail']
            ])
          ]
        }
      }
    }
  }
});









