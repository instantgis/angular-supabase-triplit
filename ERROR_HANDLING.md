# Error Handling Guide

## Known Issues

### Query Callback Multiple Invocations
The Triplit query callback is currently triggered 3 times for each query. This is expected behavior and not an error. Causes:
- Initial query execution
- Local data sync
- Remote data sync

**Workaround:** Use `distinctUntilChanged()` or similar RxJS operators when processing query results:
```typescript
this.queryResults = this.triplitService.getProjectsQueryForUser(userId).pipe(
  distinctUntilChanged((prev, curr) => 
    JSON.stringify(prev) === JSON.stringify(curr)
  )
);
```

## Common Errors

### Authentication Errors
- `AUTH_INVALID_TOKEN`: Supabase token is invalid/expired
- `AUTH_NOT_AUTHENTICATED`: User not logged in

### Sync Errors
- `SYNC_CONFLICT`: Data conflict during sync
- `SYNC_NETWORK`: Network connectivity issues
- `SYNC_PERMISSION`: User lacks permission

## Error Recovery

### Local Mode
All operations continue working in local mode when:
- Network is unavailable
- Authentication fails
- Server is unreachable

### Sync Recovery
1. Auto-retry on network restore
2. Manual sync via "Sync to Cloud" button
3. Conflict resolution favors server version
